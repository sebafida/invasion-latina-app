"""
Real server-side verification of Apple / Google sign-in tokens.

Security model: the client only forwards tokens issued by Apple/Google.
The verified identity (provider user id + email) ALWAYS comes from the
verified token, never from client-supplied fields.
"""
import asyncio
import logging
import os

import httpx
import jwt
from jwt import PyJWKClient
from fastapi import HTTPException

logger = logging.getLogger(__name__)

# --- Apple ---
APPLE_ISSUER = "https://appleid.apple.com"
APPLE_JWKS_URL = "https://appleid.apple.com/auth/keys"
# Audience of the identityToken = the app's bundle identifier
APPLE_AUDIENCE = os.environ.get("APPLE_BUNDLE_ID", "com.invasionlatina.app")

# --- Google ---
GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"
# OAuth client ids allowed to mint tokens for this app (public identifiers).
_DEFAULT_GOOGLE_CLIENT_IDS = (
    "879493210543-t0apvh7hh52mdog38jdb2hkfv5urapcs.apps.googleusercontent.com,"
    "879493210543-22aec6ek4shis767jo80hlfnf27hdbbn.apps.googleusercontent.com"
)
GOOGLE_CLIENT_IDS = {
    cid.strip()
    for cid in os.environ.get("GOOGLE_CLIENT_IDS", _DEFAULT_GOOGLE_CLIENT_IDS).split(",")
    if cid.strip()
}

# JWKS client caches Apple's public keys (refreshed automatically on rotation)
_apple_jwk_client = PyJWKClient(APPLE_JWKS_URL, cache_keys=True)


async def verify_apple_token(identity_token: str) -> dict:
    """Verify an Apple identityToken (signature, issuer, audience, expiry).

    Returns {"provider_id": <apple sub>, "email": <verified email or None>}.
    """
    def _verify() -> dict:
        signing_key = _apple_jwk_client.get_signing_key_from_jwt(identity_token)
        return jwt.decode(
            identity_token,
            signing_key.key,
            algorithms=["RS256"],
            audience=APPLE_AUDIENCE,
            issuer=APPLE_ISSUER,
        )

    try:
        # PyJWKClient does blocking HTTP on cache miss — keep it off the event loop
        claims = await asyncio.to_thread(_verify)
    except jwt.PyJWTError as e:
        logger.warning(f"Apple token verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid Apple identity token")
    except Exception as e:
        logger.error(f"Apple token verification error: {e}")
        raise HTTPException(status_code=503, detail="Apple sign-in temporarily unavailable")

    return {"provider_id": claims["sub"], "email": claims.get("email"), "name": None}


async def verify_google_token(token: str) -> dict:
    """Verify a Google token (the mobile app sends an OAuth access token;
    id_tokens are also accepted). Validates audience against our client ids.

    Returns {"provider_id": <google sub>, "email": <verified email>, "name": ...}.
    """
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.get(GOOGLE_TOKENINFO_URL, params={"access_token": token})
            if resp.status_code != 200:
                resp = await client.get(GOOGLE_TOKENINFO_URL, params={"id_token": token})
        except httpx.HTTPError as e:
            logger.error(f"Google tokeninfo unreachable: {e}")
            raise HTTPException(status_code=503, detail="Google sign-in temporarily unavailable")

        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid Google token")

        info = resp.json()

        audiences = {info.get("aud"), info.get("azp")} - {None}
        if not audiences & GOOGLE_CLIENT_IDS:
            logger.warning(f"Google token audience mismatch: {audiences}")
            raise HTTPException(status_code=401, detail="Google token was not issued for this app")

        email = info.get("email")
        if email and str(info.get("email_verified")).lower() not in ("true", "1"):
            raise HTTPException(status_code=401, detail="Google email not verified")

        sub = info.get("sub")
        name = info.get("name")

        # Access tokens: tokeninfo may omit email/name — fetch from userinfo
        if not email or not sub or not name:
            try:
                ui = await client.get(
                    GOOGLE_USERINFO_URL, headers={"Authorization": f"Bearer {token}"}
                )
                if ui.status_code == 200:
                    data = ui.json()
                    email = email or data.get("email")
                    sub = sub or data.get("sub")
                    name = name or data.get("name")
            except httpx.HTTPError:
                pass

        if not sub or not email:
            raise HTTPException(status_code=401, detail="Could not verify Google identity")

    return {"provider_id": sub, "email": email, "name": name}


async def verify_social_token(provider: str, token: str) -> dict:
    """Dispatch verification by provider. Raises 401 on any failure."""
    if provider == "apple":
        return await verify_apple_token(token)
    if provider == "google":
        return await verify_google_token(token)
    raise HTTPException(status_code=400, detail="Unsupported provider")
