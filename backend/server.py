"""
INVASION LATINA - Backend API Server (SUPABASE VERSION)
Complete FastAPI backend using PostgreSQL via Supabase

This is the Supabase/PostgreSQL version of the backend.
The MongoDB version remains in server.py for now.
When ready to switch, rename this file to server.py

⚠️  IMPORTANT: This uses MOCK Firebase and Stripe services
"""

import os
import secrets
from fastapi import FastAPI, HTTPException, Depends, Query, Body, File, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy import select, update, delete, func, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
import logging
import json
import uuid

# 1.4 - Rate Limiting pour protéger contre les attaques brute force
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Import Supabase modules
from database_supabase import get_db, init_db, close_db, AsyncSessionLocal
from models_supabase import (
    User, Event, Ticket, Product, Order, VIPBooking, SongRequest,
    FreeEntryVoucher, AppSettings, DJ, Photo, Aftermovie,
    LoyaltyCheckin, LoyaltyReward, LoyaltyTransaction,
    NotificationPreference, ConsentLog, EventQRCode, EventQRScan,
    Referral, NotificationSent
)

# Import existing modules
from config import settings, is_using_mock_keys
from models import UserCreate, UserLogin, UserBase
from pydantic import BaseModel, Field
from auth import (
    hash_password, verify_password, create_access_token,
    get_current_user_supabase, get_current_admin_supabase
)
from firebase_service import firebase_service
from stripe_service import stripe_service
from utils import generate_ticket_code, generate_qr_data

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# ============ RESPONSE MODELS ============

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    loyalty_points: int = 0
    badges: List[str] = []
    friends: List[str] = []
    language: str = "en"
    access_token: Optional[str] = None

class EventResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    event_date: datetime
    venue_name: str
    venue_address: str
    lineup: List[Dict[str, str]] = []
    ticket_categories: List[Dict[str, Any]] = []
    xceed_ticket_url: Optional[str] = None
    banner_image: Optional[str] = None
    gallery_visible: bool = False
    aftermovie_visible: bool = False
    status: str

class TicketResponse(BaseModel):
    id: str
    event_id: str
    user_id: str
    ticket_category: str
    price: float
    ticket_code: str
    qr_data: str
    status: str
    purchase_date: datetime

class FirebaseTokenData(BaseModel):
    firebase_token: str

class TicketPurchase(BaseModel):
    event_id: str
    ticket_category: str
    quantity: int = 1
    payment_method_id: str

class EventCreate(BaseModel):
    name: str
    description: str
    event_date: datetime
    venue_name: str = "Mirano Continental"
    venue_address: str = "Chaussée de Louvain 38, 1210 Brussels"
    lineup: List[Dict[str, str]] = []
    ticket_categories: List[Dict[str, Any]] = []

class SocialAuthData(BaseModel):
    provider: str
    id_token: str
    user_id: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None

class DJSelectionUpdate(BaseModel):
    selected_djs: List[str]

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============ LIFECYCLE MANAGEMENT ============

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown"""
    logger.info("🚀 Starting Invasion Latina API (SUPABASE)...")
    await init_db()
    
    if is_using_mock_keys():
        logger.warning("=" * 60)
        logger.warning("⚠️  USING MOCK API KEYS - NOT FOR PRODUCTION!")
        logger.warning("=" * 60)
    
    # Create master admin account
    await create_master_admin()
    
    # Create sample event
    await create_sample_event()
    
    # Create sample products
    await create_sample_products()
    
    # Initialize app settings
    await init_app_settings()
    
    # Create default DJs
    await create_default_djs()
    
    yield
    
    logger.info("👋 Shutting down Invasion Latina API...")
    await close_db()

# ============ FASTAPI APP INITIALIZATION ============

app = FastAPI(
    title="Invasion Latina API (Supabase)",
    description="Backend API for Invasion Latina Mobile App - PostgreSQL Version",
    version="2.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ HELPER FUNCTIONS ============

async def create_master_admin():
    """Create master admin account for testing"""
    async with AsyncSessionLocal() as db:
        admin_email = "admin@invasionlatina.be"
        result = await db.execute(select(User).where(User.email == admin_email))
        existing = result.scalar_one_or_none()
        
        if not existing:
            admin_user = User(
                email=admin_email,
                name="Master Admin",
                hashed_password=hash_password("admin123"),
                role="admin",
                loyalty_points=0,
                badges=["admin"],
                friends=[],
                language="fr"
            )
            db.add(admin_user)
            await db.commit()
            logger.info(f"✅ Created master admin: {admin_email} / admin123")

async def create_sample_event():
    """Create a sample upcoming event"""
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(func.count()).select_from(Event))
        event_count = result.scalar()
        
        if event_count == 0:
            from datetime import date
            today = date.today()
            days_until_saturday = (5 - today.weekday()) % 7
            if days_until_saturday == 0:
                days_until_saturday = 7
            next_saturday = today + timedelta(days=days_until_saturday)
            event_datetime = datetime.combine(next_saturday, datetime.min.time()).replace(hour=23, minute=0, tzinfo=timezone.utc)
            
            sample_event = Event(
                name="Invasion Latina - New Year Edition",
                description="The biggest Latino-Reggaeton party in Belgium is back! 🔥",
                event_date=event_datetime,
                venue_name="Mirano Continental",
                venue_address="Chaussée de Louvain 38, 1210 Brussels",
                lineup=[
                    {"name": "DJ Fuego", "role": "Resident DJ"},
                    {"name": "MC Latino", "role": "Host"}
                ],
                ticket_categories=[
                    {
                        "category": "standard",
                        "name": "Standard Entry",
                        "price": 25.0,
                        "total_seats": 500,
                        "available_seats": 500,
                        "benefits": ["General admission", "Main floor access"]
                    },
                    {
                        "category": "vip",
                        "name": "VIP Entry",
                        "price": 50.0,
                        "total_seats": 100,
                        "available_seats": 100,
                        "benefits": ["Priority entry", "VIP area", "1 free drink"]
                    },
                    {
                        "category": "platinum",
                        "name": "Platinum Entry",
                        "price": 100.0,
                        "total_seats": 50,
                        "available_seats": 50,
                        "benefits": ["All VIP benefits", "Reserved table", "2 free drinks"]
                    }
                ],
                status="upcoming"
            )
            
            db.add(sample_event)
            await db.commit()
            logger.info(f"✅ Created sample event on {event_datetime}")

async def create_sample_products():
    """Create sample merchandise products"""
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(func.count()).select_from(Product))
        product_count = result.scalar()
        
        if product_count == 0:
            products = [
                Product(
                    name="Invasion Latina Hoodie",
                    description="Premium quality hoodie with official logo",
                    category="apparel",
                    price=45.0,
                    sizes_available=["S", "M", "L", "XL", "XXL"],
                    images=[],
                    stock_quantity=100
                ),
                Product(
                    name="Invasion Latina T-Shirt",
                    description="Classic fit t-shirt with event branding",
                    category="apparel",
                    price=25.0,
                    sizes_available=["S", "M", "L", "XL"],
                    images=[],
                    stock_quantity=200
                ),
                Product(
                    name="Invasion Latina Cap",
                    description="Snapback cap with embroidered logo",
                    category="accessories",
                    price=20.0,
                    sizes_available=["One Size"],
                    images=[],
                    stock_quantity=150
                )
            ]
            
            for product in products:
                db.add(product)
            await db.commit()
            logger.info(f"✅ Created {len(products)} sample products")

async def init_app_settings():
    """Initialize app settings if not exists"""
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(AppSettings).where(AppSettings.id == "global"))
        existing = result.scalar_one_or_none()
        
        if not existing:
            default_settings = AppSettings(
                id="global",
                requests_enabled=False,
                current_event_id=None,
                loyalty_qr_version=1,
                updated_by="system"
            )
            db.add(default_settings)
            await db.commit()
            logger.info("✅ Created default app settings")

async def create_default_djs():
    """Create default DJs for Invasion Latina"""
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(func.count()).select_from(DJ))
        dj_count = result.scalar()
        
        if dj_count == 0:
            default_djs = [
                DJ(name="DJ GIZMO", bio="Resident DJ - Reggaeton & Latin Urban", is_resident=True, order=1),
                DJ(name="DJ DNK", bio="Resident DJ - Latin House & Dembow", is_resident=True, order=2),
                DJ(name="DJ CRUZ", bio="Resident DJ - Bachata & Salsa", is_resident=True, order=3),
                DJ(name="DJ DANIEL MURILLO", bio="Guest DJ - Urban Latin", is_resident=False, order=4),
                DJ(name="DJ SUNCEE", bio="Guest DJ - Reggaeton Classics", is_resident=False, order=5),
                DJ(name="DJ SAMO", bio="Guest DJ - Latin Trap", is_resident=False, order=6),
                DJ(name="DJ MABOY", bio="Guest DJ - Latin Pop", is_resident=False, order=7),
                DJ(name="MC VELASQUEZ", bio="Official MC - Hype Master", is_resident=True, order=8),
            ]
            
            for dj in default_djs:
                db.add(dj)
            await db.commit()
            logger.info(f"✅ Created {len(default_djs)} default DJs")

# ============ ROOT & HEALTH ENDPOINTS ============

@app.get("/")
async def root():
    """API root"""
    return {
        "app": "Invasion Latina API",
        "version": "2.0.0",
        "database": "Supabase PostgreSQL",
        "status": "running",
        "venue": "Mirano Continental, Brussels",
        "warning": "Using mock keys" if is_using_mock_keys() else None
    }

@app.get("/api/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """Health check"""
    try:
        await db.execute(select(1))
        return {"status": "healthy", "database": "connected", "type": "PostgreSQL"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database error: {str(e)}")

# ============ AUTHENTICATION ENDPOINTS ============

class AdminSetupRequest(BaseModel):
    secret_key: str

@app.post("/api/admin/setup")
async def setup_admin_account(data: AdminSetupRequest, db: AsyncSession = Depends(get_db)):
    """Create or reset admin account (secured by secret key)"""
    # Secret key for admin setup - must match the one in .env or use a default for setup
    SETUP_SECRET = os.environ.get("ADMIN_SETUP_SECRET", "invasion-latina-2009-setup")
    
    if data.secret_key != SETUP_SECRET:
        raise HTTPException(status_code=403, detail="Invalid setup key")
    
    admin_email = "info@invasionlatina.be"
    admin_password = "Invasion2009-"
    
    # Check if admin exists
    result = await db.execute(select(User).where(User.email == admin_email))
    existing_admin = result.scalar_one_or_none()
    
    if existing_admin:
        # Update password and ensure admin role
        existing_admin.hashed_password = hash_password(admin_password)
        existing_admin.role = "admin"
        await db.commit()
        return {"success": True, "message": "Admin account updated", "email": admin_email}
    else:
        # Create new admin
        new_admin = User(
            email=admin_email,
            name="Admin Invasion",
            hashed_password=hash_password(admin_password),
            role="admin",
            loyalty_points=0,
            badges=[],
            friends=[],
            language="fr"
        )
        db.add(new_admin)
        await db.commit()
        return {"success": True, "message": "Admin account created", "email": admin_email}

@app.post("/api/auth/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new user"""
    # Check if user already exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    new_user = User(
        email=user_data.email,
        name=user_data.name,
        hashed_password=hash_password(user_data.password),
        role="user",
        loyalty_points=0,
        badges=[],
        friends=[],
        language=user_data.language
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    # Create notification preferences with all ON by default
    notification_prefs = NotificationPreference(
        user_id=new_user.id,
        events=True,
        promotions=True,
        song_requests=True,
        friends=True
    )
    db.add(notification_prefs)
    await db.commit()
    logger.info(f"✅ Created notification preferences for new user: {new_user.email}")
    
    # Create access token
    access_token = create_access_token(data={"sub": new_user.id})
    
    return UserResponse(
        id=new_user.id,
        email=new_user.email,
        name=new_user.name,
        role="user",
        loyalty_points=0,
        badges=[],
        friends=[],
        language=new_user.language,
        access_token=access_token
    )

@app.post("/api/auth/login", response_model=UserResponse)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    """Login user"""
    result = await db.execute(select(User).where(User.email == credentials.email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user.id})
    
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        loyalty_points=user.loyalty_points or 0,
        badges=user.badges or [],
        friends=user.friends or [],
        language=user.language or "en",
        access_token=access_token
    )

@app.post("/api/auth/firebase-login", response_model=UserResponse)
async def firebase_login(token_data: FirebaseTokenData, db: AsyncSession = Depends(get_db)):
    """Login with Firebase token"""
    try:
        user_info = await firebase_service.verify_token(token_data.firebase_token)
        
        result = await db.execute(select(User).where(User.email == user_info["email"]))
        user = result.scalar_one_or_none()
        
        if not user:
            user = User(
                email=user_info["email"],
                name=user_info.get("name", "Firebase User"),
                firebase_uid=user_info["uid"],
                role="user",
                loyalty_points=0,
                badges=[],
                friends=[],
                language="en"
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        
        access_token = create_access_token(data={"sub": user.id})
        
        return UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            role=user.role,
            loyalty_points=user.loyalty_points or 0,
            badges=user.badges or [],
            friends=user.friends or [],
            language=user.language or "en",
            access_token=access_token
        )
        
    except Exception as e:
        logger.error(f"Firebase login error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid Firebase token")

@app.post("/api/auth/social", response_model=UserResponse)
async def social_login(auth_data: SocialAuthData, db: AsyncSession = Depends(get_db)):
    """Login/Register with Apple or Google"""
    try:
        email = auth_data.email
        name = auth_data.name  # Don't use fallback here, check later
        provider_id = auth_data.user_id or (auth_data.id_token[:50] if auth_data.id_token else None)
        
        # For Apple Sign In, email might be null on subsequent logins
        if not email and auth_data.provider == 'apple' and provider_id:
            result = await db.execute(select(User).where(User.apple_id == provider_id))
            existing_user = result.scalar_one_or_none()
            if existing_user:
                email = existing_user.email
                # Keep existing name if we don't have a new one
                if not name or name.lower() == 'user':
                    name = existing_user.name
        
        if not email:
            raise HTTPException(status_code=400, detail="Email is required. Please use email login or try Sign in with Apple again.")
        
        # Check if user already exists
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        
        if not user and auth_data.provider == 'apple' and provider_id:
            result = await db.execute(select(User).where(User.apple_id == provider_id))
            user = result.scalar_one_or_none()
        
        if not user:
            # Create new user from social login
            # If no name provided, try to extract from email
            if not name or name.lower() == 'user':
                if email and '@' in email and not 'privaterelay' in email:
                    # Extract name from email (e.g., john.doe@gmail.com -> John Doe)
                    email_name = email.split('@')[0]
                    name = ' '.join([part.capitalize() for part in email_name.replace('.', ' ').replace('_', ' ').split()])
                else:
                    name = "Nuevo Miembro"  # "New Member" in Spanish for the Latino app
            
            user = User(
                email=email,
                name=name,
                auth_provider=auth_data.provider,
                role="user",
                loyalty_points=0,
                badges=[],
                friends=[],
                language="fr"
            )
            if auth_data.provider == 'apple':
                user.apple_id = provider_id
            elif auth_data.provider == 'google':
                user.google_id = provider_id
            
            db.add(user)
            await db.commit()
            await db.refresh(user)
            
            # Create notification preferences with all ON by default
            notification_prefs = NotificationPreference(
                user_id=user.id,
                events=True,
                promotions=True,
                song_requests=True,
                friends=True
            )
            db.add(notification_prefs)
            await db.commit()
            
            logger.info(f"✅ Created new user via {auth_data.provider}: {email}")
        else:
            # Update provider ID if not set
            if auth_data.provider == 'apple' and not user.apple_id:
                user.apple_id = provider_id
                await db.commit()
            elif auth_data.provider == 'google' and not user.google_id:
                user.google_id = provider_id
                await db.commit()
            
            # Update name if we received a better one from Apple (first login)
            if name and name.lower() != 'user' and (not user.name or user.name.lower() == 'user' or user.name == 'Nuevo Miembro'):
                user.name = name
                await db.commit()
                logger.info(f"✅ Updated user name to: {name}")
            
            # Use stored name if no new name provided
            if not name or name.lower() == 'user':
                name = user.name
            
            logger.info(f"✅ Existing user logged in via {auth_data.provider}: {email}")
        
        access_token = create_access_token(data={"sub": user.id})
        
        return UserResponse(
            id=user.id,
            email=user.email,
            name=user.name or name,
            role=user.role or "user",
            loyalty_points=user.loyalty_points or 0,
            badges=user.badges or [],
            friends=user.friends or [],
            language=user.language or "fr",
            access_token=access_token
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Social login error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Social login failed: {str(e)}")

@app.get("/api/auth/me", response_model=UserResponse)
async def get_current_user_info(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_supabase)
):
    """Get current user information"""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        role=current_user.role,
        loyalty_points=current_user.loyalty_points or 0,
        badges=current_user.badges or [],
        friends=current_user.friends or [],
        language=current_user.language or "en"
    )

@app.put("/api/users/push-token")
async def update_push_token(
    token_data: Dict[str, str] = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_supabase)
):
    """Update user's push notification token"""
    push_token = token_data.get("push_token")
    if not push_token:
        raise HTTPException(status_code=400, detail="Push token is required")
    
    current_user.push_token = push_token
    current_user.push_token_updated_at = datetime.now(timezone.utc)
    await db.commit()
    
    return {"message": "Push token updated successfully"}

# ============ EVENT ENDPOINTS ============

@app.get("/api/events", response_model=List[EventResponse])
async def get_events(
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """Get all events, optionally filtered by status"""
    query = select(Event).order_by(Event.event_date)
    if status:
        query = query.where(Event.status == status)
    
    result = await db.execute(query)
    events = result.scalars().all()
    
    return [
        EventResponse(
            id=event.id,
            name=event.name,
            description=event.description,
            event_date=event.event_date,
            venue_name=event.venue_name,
            venue_address=event.venue_address,
            lineup=event.lineup or [],
            ticket_categories=event.ticket_categories or [],
            xceed_ticket_url=event.xceed_ticket_url,
            banner_image=event.banner_image,
            gallery_visible=event.gallery_visible,
            aftermovie_visible=event.aftermovie_visible,
            status=event.status
        )
        for event in events
    ]

@app.get("/api/events/next")
async def get_next_event(db: AsyncSession = Depends(get_db)):
    """Get the next upcoming event"""
    result = await db.execute(
        select(Event)
        .where(Event.event_date >= datetime.now(timezone.utc))
        .where(Event.status == "published")
        .order_by(Event.event_date)
        .limit(1)
    )
    next_event = result.scalar_one_or_none()
    
    if not next_event:
        result = await db.execute(select(Event).order_by(Event.event_date.desc()).limit(1))
        next_event = result.scalar_one_or_none()
    
    if not next_event:
        return {
            "event": {
                "id": "mock-event-001",
                "name": "Invasion Latina - Summer Edition",
                "description": "The biggest reggaeton party in Belgium!",
                "event_date": datetime(2025, 7, 15, 22, 0, 0).isoformat(),
                "venue_name": "Spirito Brussels",
                "venue_address": "Rue de Stassart 18, 1050 Bruxelles",
                "lineup": [
                    {"name": "DJ Reggaeton King", "role": "Main Stage"},
                    {"name": "MC Latino", "role": "Host"}
                ],
                "ticket_categories": [
                    {"name": "Standard", "price": 20.0, "available": True},
                    {"name": "VIP", "price": 40.0, "available": True}
                ],
                "xceed_ticket_url": "https://xceed.me/invasion-latina",
                "status": "published"
            }
        }
    
    return {
        "event": {
            "id": next_event.id,
            "name": next_event.name,
            "description": next_event.description,
            "event_date": next_event.event_date.isoformat() if next_event.event_date else None,
            "venue_name": next_event.venue_name,
            "venue_address": next_event.venue_address,
            "lineup": next_event.lineup or [],
            "ticket_categories": next_event.ticket_categories or [],
            "xceed_ticket_url": next_event.xceed_ticket_url,
            "selected_djs": next_event.selected_djs or [],
            "status": next_event.status
        }
    }

@app.get("/api/events/{event_id}", response_model=EventResponse)
async def get_event(event_id: str, db: AsyncSession = Depends(get_db)):
    """Get specific event by ID"""
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    return EventResponse(
        id=event.id,
        name=event.name,
        description=event.description,
        event_date=event.event_date,
        venue_name=event.venue_name,
        venue_address=event.venue_address,
        lineup=event.lineup or [],
        ticket_categories=event.ticket_categories or [],
        xceed_ticket_url=event.xceed_ticket_url,
        banner_image=event.banner_image,
        gallery_visible=event.gallery_visible,
        aftermovie_visible=event.aftermovie_visible,
        status=event.status
    )

@app.post("/api/events", response_model=EventResponse)
async def create_event(
    event_data: EventCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_supabase)
):
    """Create new event (admin only)"""
    new_event = Event(
        name=event_data.name,
        description=event_data.description,
        event_date=event_data.event_date,
        venue_name=event_data.venue_name,
        venue_address=event_data.venue_address,
        lineup=event_data.lineup,
        ticket_categories=event_data.ticket_categories,
        status="upcoming"
    )
    
    db.add(new_event)
    await db.commit()
    await db.refresh(new_event)
    
    return EventResponse(
        id=new_event.id,
        name=new_event.name,
        description=new_event.description,
        event_date=new_event.event_date,
        venue_name=new_event.venue_name,
        venue_address=new_event.venue_address,
        lineup=new_event.lineup or [],
        ticket_categories=new_event.ticket_categories or [],
        status="upcoming"
    )

@app.put("/api/admin/events/{event_id}/djs")
async def update_event_djs(
    event_id: str,
    dj_data: DJSelectionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_supabase)
):
    """Update selected DJs for an event (admin only)"""
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    event.selected_djs = dj_data.selected_djs
    await db.commit()
    
    logger.info(f"✅ Updated DJs for event {event_id}: {dj_data.selected_djs}")
    return {"message": "DJs selection updated successfully", "selected_djs": dj_data.selected_djs}

# ============ SONG REQUEST ENDPOINTS ============

@app.post("/api/dj/request-song")
async def request_song(
    song_data: Dict[str, str] = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_supabase)
):
    """Request a song"""
    # Check if user is admin/DJ - they bypass all restrictions
    is_admin = current_user.role in ["admin", "dj"]
    
    # Check if song requests are enabled (admins bypass this)
    result = await db.execute(select(AppSettings).where(AppSettings.id == "global"))
    settings = result.scalar_one_or_none()
    
    if not is_admin and (not settings or not settings.requests_enabled):
        raise HTTPException(
            status_code=403, 
            detail="Les demandes de chansons sont désactivées pour le moment. Revenez pendant l'événement!"
        )
    
    # Geolocation check (admins bypass this)
    if not is_admin:
        MIRANO_LAT = 50.8389
        MIRANO_LNG = 4.3660
        MAX_DISTANCE_METERS = 40
        
        user_lat = song_data.get("latitude")
        user_lng = song_data.get("longitude")
        
        if user_lat and user_lng:
            try:
                import math
                user_lat = float(user_lat)
                user_lng = float(user_lng)
                
                R = 6371000
                lat1, lat2 = math.radians(MIRANO_LAT), math.radians(user_lat)
                dlat = math.radians(user_lat - MIRANO_LAT)
                dlng = math.radians(user_lng - MIRANO_LNG)
                
                a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng/2)**2
                c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
                distance = R * c
                
                if distance > MAX_DISTANCE_METERS:
                    raise HTTPException(
                        status_code=403,
                        detail=f"Vous devez être au Mirano Continental pour demander une chanson (vous êtes à {int(distance)}m)"
                    )
            except (ValueError, TypeError):
                pass
        else:
            raise HTTPException(status_code=403, detail="Activez votre localisation pour demander une chanson")
        
        # Check time (admins bypass this)
        current_hour = datetime.now().hour
        if not (current_hour >= 23 or current_hour < 5):
            raise HTTPException(
                status_code=403,
                detail="Les demandes de chansons sont disponibles uniquement entre 23h et 5h"
            )
    
    # Validate required fields
    if not song_data.get("song_title") or not song_data.get("artist_name"):
        raise HTTPException(status_code=400, detail="Song title and artist name are required")
    
    # Get current event
    result = await db.execute(
        select(Event)
        .where(Event.status.in_(["live", "upcoming"]))
        .order_by(Event.event_date.desc())
        .limit(1)
    )
    current_event = result.scalar_one_or_none()
    event_id = current_event.id if current_event else "default_event"
    
    # Normalize for comparison
    song_title_normalized = song_data["song_title"].strip().lower()
    artist_name_normalized = song_data["artist_name"].strip().lower()
    user_id = current_user.id
    
    # Check for existing request
    result = await db.execute(
        select(SongRequest)
        .where(SongRequest.song_title_normalized == song_title_normalized)
        .where(SongRequest.artist_name_normalized == artist_name_normalized)
        .where(SongRequest.event_id == event_id)
        .where(SongRequest.status == "pending")
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        if user_id in (existing.requesters or []):
            raise HTTPException(status_code=400, detail="Vous avez déjà demandé cette chanson")
        
        existing.times_requested = (existing.times_requested or 1) + 1
        existing.votes = (existing.votes or 1) + 1
        existing.requesters = (existing.requesters or []) + [user_id]
        existing.voters = (existing.voters or []) + [user_id]
        await db.commit()
        
        return {
            "message": f"Demande ajoutée! '{existing.song_title}' a maintenant {existing.times_requested} demandes! 🔥",
            "request_id": existing.id,
            "song": f"{existing.song_title} by {existing.artist_name}",
            "times_requested": existing.times_requested
        }
    
    # Create new song request
    new_request = SongRequest(
        user_id=user_id,
        user_name=song_data.get("user_name", current_user.name or "Anonyme"),
        event_id=event_id,
        song_title=song_data["song_title"].strip(),
        artist_name=song_data["artist_name"].strip(),
        song_title_normalized=song_title_normalized,
        artist_name_normalized=artist_name_normalized,
        votes=1,
        voters=[user_id],
        requesters=[user_id],
        times_requested=1,
        status="pending"
    )
    
    db.add(new_request)
    await db.commit()
    await db.refresh(new_request)
    
    return {
        "message": "Demande envoyée!",
        "request_id": new_request.id,
        "song": f"{song_data['song_title']} by {song_data['artist_name']}",
        "times_requested": 1
    }

@app.get("/api/dj/requests")
async def get_song_requests(
    status: Optional[str] = Query(None),
    event_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_supabase)
):
    """Get song requests with optional filters"""
    query = select(SongRequest).order_by(SongRequest.requested_at.desc()).limit(100)
    
    if status:
        query = query.where(SongRequest.status == status)
    if event_id:
        query = query.where(SongRequest.event_id == event_id)
    
    result = await db.execute(query)
    requests = result.scalars().all()
    
    user_id = current_user.id
    return [
        {
            "id": req.id,
            "song_title": req.song_title,
            "artist_name": req.artist_name,
            "user_name": req.user_name,
            "votes": req.votes,
            "times_requested": req.times_requested or 1,
            "requested_at": req.requested_at,
            "status": req.status,
            "rejection_reason": req.rejection_reason,
            "rejection_label": req.rejection_label,
            "event_id": req.event_id,
            "can_vote": user_id not in (req.voters or []),
            "can_request": user_id not in (req.requesters or [])
        }
        for req in requests
    ]

@app.delete("/api/dj/requests/clear-all")
async def clear_all_song_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_supabase)
):
    """Delete all song requests (Admin only)"""
    result = await db.execute(delete(SongRequest))
    await db.commit()
    logger.info(f"✅ Cleared all song requests")
    return {"message": "Toutes les demandes ont été supprimées"}

@app.post("/api/dj/vote/{request_id}")
async def vote_for_song(
    request_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_supabase)
):
    """Vote for a song request"""
    result = await db.execute(select(SongRequest).where(SongRequest.id == request_id))
    request = result.scalar_one_or_none()
    
    if not request:
        raise HTTPException(status_code=404, detail="Song request not found")
    
    if request.status != "pending":
        raise HTTPException(status_code=400, detail="Cannot vote on this request")
    
    user_id = current_user.id
    if user_id in (request.voters or []):
        raise HTTPException(status_code=400, detail="You have already voted for this song")
    
    request.votes = (request.votes or 0) + 1
    request.voters = (request.voters or []) + [user_id]
    await db.commit()
    
    return {"message": "Vote added successfully"}

@app.post("/api/dj/admin/update-request/{request_id}")
async def update_song_request(
    request_id: str,
    update_data: Dict[str, str] = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_supabase)
):
    """Update song request status (DJ/Admin only)"""
    result = await db.execute(select(SongRequest).where(SongRequest.id == request_id))
    request = result.scalar_one_or_none()
    
    if not request:
        raise HTTPException(status_code=404, detail="Song request not found")
    
    status = update_data.get("status")
    request.status = status
    
    if status == "played":
        request.played_at = datetime.now(timezone.utc)
    elif status == "rejected":
        request.rejection_reason = update_data.get("rejection_reason")
        request.rejection_label = update_data.get("rejection_label")
    
    await db.commit()
    return {"message": f"Request {status} successfully"}

# ============ APP SETTINGS ENDPOINTS ============

@app.get("/api/admin/settings")
async def get_app_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_supabase)
):
    """Get current app settings"""
    result = await db.execute(select(AppSettings).where(AppSettings.id == "global"))
    settings = result.scalar_one_or_none()
    
    if not settings:
        return {
            "requests_enabled": False,
            "current_event_id": None,
            "loyalty_qr_version": 1
        }
    
    return {
        "requests_enabled": settings.requests_enabled,
        "current_event_id": settings.current_event_id,
        "loyalty_qr_version": settings.loyalty_qr_version,
        "updated_at": settings.updated_at,
        "updated_by": settings.updated_by
    }

@app.post("/api/admin/settings/toggle-requests")
async def toggle_song_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_supabase)
):
    """Toggle song requests ON/OFF"""
    result = await db.execute(select(AppSettings).where(AppSettings.id == "global"))
    settings = result.scalar_one_or_none()
    
    current_status = settings.requests_enabled if settings else False
    new_status = not current_status
    
    if settings:
        settings.requests_enabled = new_status
        settings.updated_by = current_user.email
    else:
        settings = AppSettings(
            id="global",
            requests_enabled=new_status,
            updated_by=current_user.email
        )
        db.add(settings)
    
    await db.commit()
    
    return {
        "success": True,
        "requests_enabled": new_status,
        "message": f"Les demandes de chansons sont maintenant {'ACTIVÉES' if new_status else 'DÉSACTIVÉES'}"
    }

@app.get("/api/settings/requests-status")
async def get_requests_status(db: AsyncSession = Depends(get_db)):
    """Public endpoint to check if song requests are enabled"""
    result = await db.execute(select(AppSettings).where(AppSettings.id == "global"))
    settings = result.scalar_one_or_none()
    
    return {
        "requests_enabled": settings.requests_enabled if settings else False
    }

# ============ ADMIN USER LIST ============

@app.get("/api/admin/users")
async def get_admin_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_supabase)
):
    """Get list of all users (admin only)"""
    query = select(User)
    
    if search:
        query = query.where(
            or_(
                User.email.ilike(f"%{search}%"),
                User.name.ilike(f"%{search}%")
            )
        )
    
    # Count total
    count_result = await db.execute(select(func.count()).select_from(User))
    total = count_result.scalar()
    
    # Get paginated results
    offset = (page - 1) * limit
    query = query.order_by(User.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    users = result.scalars().all()
    
    return {
        "users": [
            {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role,
                "loyalty_points": user.loyalty_points or 0,
                "language": user.language,
                "auth_provider": user.auth_provider,
                "created_at": user.created_at.isoformat() if user.created_at else None
            }
            for user in users
        ],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }

# ============ EVENT QR CODE ENDPOINTS ============

class CreateEventQRCode(BaseModel):
    event_id: str
    coins_reward: int = 5

class ScanEventQRCode(BaseModel):
    qr_code: str

@app.post("/api/admin/event-qrcode")
async def create_event_qrcode(
    data: CreateEventQRCode,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_supabase)
):
    """Create a new QR code for an event (Admin only)"""
    # Verify event exists
    result = await db.execute(select(Event).where(Event.id == data.event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Deactivate other active QR codes
    await db.execute(
        update(EventQRCode)
        .where(EventQRCode.is_active == True)
        .values(is_active=False)
    )
    
    # Generate unique QR code
    qr_code = f"IL-{event.id[:8]}-{uuid.uuid4().hex[:8].upper()}"
    
    new_qr = EventQRCode(
        event_id=data.event_id,
        event_name=event.name,
        qr_code=qr_code,
        coins_reward=data.coins_reward,
        is_active=True,
        scan_count=0,
        created_by=current_user.id
    )
    
    db.add(new_qr)
    await db.commit()
    await db.refresh(new_qr)
    
    return {
        "success": True,
        "qr_code": new_qr.qr_code,
        "event_name": event.name,
        "coins_reward": new_qr.coins_reward
    }

@app.get("/api/admin/event-qrcode/active")
async def get_active_qrcode(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_supabase)
):
    """Get currently active QR code (Admin only)"""
    result = await db.execute(select(EventQRCode).where(EventQRCode.is_active == True))
    qr = result.scalar_one_or_none()
    
    if not qr:
        return {"active": False, "qr_code": None}
    
    return {
        "active": True,
        "qr_code": qr.qr_code,
        "event_id": qr.event_id,
        "event_name": qr.event_name,
        "coins_reward": qr.coins_reward,
        "scan_count": qr.scan_count,
        "created_at": qr.created_at.isoformat() if qr.created_at else None
    }

@app.post("/api/admin/event-qrcode/{qr_id}/toggle")
async def toggle_qrcode(
    qr_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_supabase)
):
    """Toggle QR code active status (Admin only)"""
    result = await db.execute(select(EventQRCode).where(EventQRCode.id == qr_id))
    qr = result.scalar_one_or_none()
    
    if not qr:
        raise HTTPException(status_code=404, detail="QR code not found")
    
    if not qr.is_active:
        # Deactivate all others first
        await db.execute(
            update(EventQRCode)
            .where(EventQRCode.is_active == True)
            .values(is_active=False)
        )
    
    qr.is_active = not qr.is_active
    await db.commit()
    
    return {"success": True, "is_active": qr.is_active}

@app.get("/api/admin/event-qrcodes")
async def get_all_qrcodes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_supabase)
):
    """Get all QR codes (Admin only)"""
    result = await db.execute(
        select(EventQRCode).order_by(EventQRCode.created_at.desc()).limit(20)
    )
    qr_codes = result.scalars().all()
    
    return [
        {
            "id": qr.id,
            "qr_code": qr.qr_code,
            "event_id": qr.event_id,
            "event_name": qr.event_name,
            "coins_reward": qr.coins_reward,
            "is_active": qr.is_active,
            "scan_count": qr.scan_count,
            "created_at": qr.created_at.isoformat() if qr.created_at else None
        }
        for qr in qr_codes
    ]

@app.post("/api/scan-event-qrcode")
async def scan_event_qrcode(
    data: ScanEventQRCode,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_supabase)
):
    """Scan event QR code to earn coins (User)"""
    result = await db.execute(
        select(EventQRCode)
        .where(EventQRCode.qr_code == data.qr_code)
        .where(EventQRCode.is_active == True)
    )
    qr = result.scalar_one_or_none()
    
    if not qr:
        raise HTTPException(status_code=404, detail="QR code invalide ou expiré")
    
    user_id = current_user.id
    
    # Check if already scanned
    result = await db.execute(
        select(EventQRScan)
        .where(EventQRScan.qr_id == qr.id)
        .where(EventQRScan.user_id == user_id)
    )
    existing_scan = result.scalar_one_or_none()
    
    if existing_scan:
        raise HTTPException(status_code=400, detail="Tu as déjà scanné ce QR code!")
    
    # Create scan record
    scan = EventQRScan(
        qr_id=qr.id,
        user_id=user_id,
        coins_earned=qr.coins_reward
    )
    db.add(scan)
    
    # Update QR scan count
    qr.scan_count = (qr.scan_count or 0) + 1
    
    # Update user loyalty points
    current_user.loyalty_points = (current_user.loyalty_points or 0) + qr.coins_reward
    
    await db.commit()
    await db.refresh(current_user)
    
    return {
        "success": True,
        "message": f"Félicitations! Tu as gagné {qr.coins_reward} Invasion Coins! 🎉",
        "coins_earned": qr.coins_reward,
        "total_coins": current_user.loyalty_points,
        "event_name": qr.event_name
    }

# ============ ADMIN DASHBOARD ============

@app.get("/api/admin/dashboard")
async def admin_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_supabase)
):
    """Get admin dashboard data"""
    total_users = (await db.execute(select(func.count()).select_from(User))).scalar()
    total_tickets = (await db.execute(select(func.count()).select_from(Ticket))).scalar()
    total_orders = (await db.execute(select(func.count()).select_from(Order))).scalar()
    pending_requests = (await db.execute(
        select(func.count()).select_from(SongRequest).where(SongRequest.status == "pending")
    )).scalar()
    
    # Recent users
    result = await db.execute(
        select(User).order_by(User.created_at.desc()).limit(10)
    )
    recent_users = [
        {"name": u.name, "email": u.email, "created_at": u.created_at}
        for u in result.scalars().all()
    ]
    
    return {
        "stats": {
            "total_users": total_users,
            "total_tickets": total_tickets,
            "total_orders": total_orders,
            "pending_requests": pending_requests
        },
        "recent_users": recent_users
    }

# ============ PRODUCTS ============

@app.get("/api/products")
async def get_products(
    category: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """Get all products, optionally filtered by category"""
    query = select(Product)
    if category:
        query = query.where(Product.category == category)
    
    result = await db.execute(query)
    products = result.scalars().all()
    
    return [
        {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "category": p.category,
            "price": p.price,
            "sizes_available": p.sizes_available or [],
            "images": p.images or [],
            "stock_quantity": p.stock_quantity
        }
        for p in products
    ]

# ============ DJS ENDPOINTS ============

@app.get("/api/djs")
async def get_djs(db: AsyncSession = Depends(get_db)):
    """Get all DJs"""
    result = await db.execute(select(DJ).order_by(DJ.order))
    djs = result.scalars().all()
    
    return [
        {
            "id": dj.id,
            "name": dj.name,
            "bio": dj.bio,
            "photo_url": dj.photo_url,
            "instagram_url": dj.instagram_url,
            "soundcloud_url": dj.soundcloud_url,
            "spotify_url": dj.spotify_url,
            "is_resident": dj.is_resident
        }
        for dj in djs
    ]

# ============ LOYALTY ENDPOINTS ============

@app.get("/api/loyalty/my-points")
async def get_my_loyalty_points(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_supabase)
):
    """Get current user's loyalty points and stats"""
    checkins_count = (await db.execute(
        select(func.count()).select_from(LoyaltyCheckin).where(LoyaltyCheckin.user_id == current_user.id)
    )).scalar()
    
    # Get recent check-ins with event info
    result = await db.execute(
        select(LoyaltyCheckin)
        .where(LoyaltyCheckin.user_id == current_user.id)
        .order_by(LoyaltyCheckin.checked_in_at.desc())
        .limit(10)
    )
    checkins = result.scalars().all()
    
    recent_check_ins = []
    for checkin in checkins:
        # Get event name
        event_result = await db.execute(select(Event).where(Event.id == checkin.event_id))
        event = event_result.scalar_one_or_none()
        
        recent_check_ins.append({
            "event_name": event.name if event else "Événement",
            "points": checkin.points_earned or 5,
            "date": checkin.checked_in_at.isoformat() if checkin.checked_in_at else None
        })
    
    return {
        "loyalty_points": current_user.loyalty_points or 0,
        "points": current_user.loyalty_points or 0,
        "check_ins_count": checkins_count,
        "progress_to_free_entry": min((current_user.loyalty_points or 0) / 25 * 100, 100),
        "recent_check_ins": recent_check_ins
    }

@app.get("/api/loyalty/free-entry/check")
async def check_free_entry_voucher(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_supabase)
):
    """Check if user has an active free entry voucher"""
    result = await db.execute(
        select(FreeEntryVoucher)
        .where(FreeEntryVoucher.user_id == current_user.id)
        .where(FreeEntryVoucher.used == False)
        .where(FreeEntryVoucher.expires_at > datetime.now(timezone.utc))
    )
    voucher = result.scalar_one_or_none()
    
    if voucher:
        return {
            "has_voucher": True,
            "voucher": {
                "id": voucher.id,
                "user_id": voucher.user_id,
                "created_at": voucher.created_at.isoformat() if voucher.created_at else None,
                "expires_at": voucher.expires_at.isoformat() if voucher.expires_at else None,
                "used": voucher.used
            }
        }
    
    return {"has_voucher": False, "voucher": None}

@app.post("/api/loyalty/free-entry/claim")
async def claim_free_entry(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_supabase)
):
    """Claim a free entry voucher (costs 25 loyalty points)"""
    if (current_user.loyalty_points or 0) < 25:
        raise HTTPException(status_code=400, detail="Tu as besoin de 25 points de fidélité")
    
    # Check for existing active voucher
    result = await db.execute(
        select(FreeEntryVoucher)
        .where(FreeEntryVoucher.user_id == current_user.id)
        .where(FreeEntryVoucher.used == False)
        .where(FreeEntryVoucher.expires_at > datetime.now(timezone.utc))
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(status_code=400, detail="Tu as déjà une entrée gratuite active")
    
    # Deduct points
    current_user.loyalty_points = (current_user.loyalty_points or 0) - 25
    
    # Create voucher
    voucher = FreeEntryVoucher(
        user_id=current_user.id,
        user_name=current_user.name,
        user_email=current_user.email,
        expires_at=datetime.now(timezone.utc) + timedelta(days=90)
    )
    
    db.add(voucher)
    await db.commit()
    await db.refresh(voucher)
    
    return {
        "message": "Entrée gratuite obtenue!",
        "voucher": {
            "id": voucher.id,
            "user_id": voucher.user_id,
            "created_at": voucher.created_at.isoformat() if voucher.created_at else None,
            "expires_at": voucher.expires_at.isoformat() if voucher.expires_at else None,
            "used": voucher.used
        }
    }

# ============ LEADERBOARD ============

@app.get("/api/social/leaderboard")
async def get_leaderboard(db: AsyncSession = Depends(get_db)):
    """Get loyalty points leaderboard"""
    result = await db.execute(
        select(User).order_by(User.loyalty_points.desc()).limit(50)
    )
    users = result.scalars().all()
    
    return [
        {
            "name": user.name,
            "loyalty_points": user.loyalty_points or 0,
            "badges": user.badges or []
        }
        for user in users
    ]

# ============ VIP BOOKINGS ============

class VIPBookingCreate(BaseModel):
    event_id: str
    name: str
    email: str
    phone: str
    guests: int = 1
    message: Optional[str] = None

@app.post("/api/vip/booking")
async def create_vip_booking(
    booking_data: VIPBookingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_supabase)
):
    """Create a VIP table booking request"""
    # Verify event exists
    result = await db.execute(select(Event).where(Event.id == booking_data.event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    booking = VIPBooking(
        user_id=current_user.id,
        event_id=booking_data.event_id,
        name=booking_data.name,
        email=booking_data.email,
        phone=booking_data.phone,
        guests=booking_data.guests,
        message=booking_data.message,
        status="pending"
    )
    
    db.add(booking)
    await db.commit()
    await db.refresh(booking)
    
    return {
        "success": True,
        "booking_id": booking.id,
        "message": "Demande de réservation VIP envoyée!"
    }

@app.get("/api/vip/my-bookings")
async def get_my_vip_bookings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_supabase)
):
    """Get user's VIP bookings"""
    result = await db.execute(
        select(VIPBooking)
        .where(VIPBooking.user_id == current_user.id)
        .order_by(VIPBooking.submitted_at.desc())
    )
    bookings = result.scalars().all()
    
    booking_list = []
    for booking in bookings:
        event_result = await db.execute(select(Event).where(Event.id == booking.event_id))
        event = event_result.scalar_one_or_none()
        
        booking_list.append({
            "id": booking.id,
            "event_name": event.name if event else "Unknown Event",
            "event_date": event.event_date.isoformat() if event and event.event_date else None,
            "guests": booking.guests,
            "status": booking.status,
            "submitted_at": booking.submitted_at.isoformat() if booking.submitted_at else None
        })
    
    return booking_list

# ============ REFERRALS ============

@app.get("/api/referral/my-code")
async def get_my_referral_code(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_supabase)
):
    """Get or generate user's referral code"""
    if not current_user.referral_code:
        # Generate unique code
        import random
        import string
        while True:
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
            result = await db.execute(select(User).where(User.referral_code == code))
            if not result.scalar_one_or_none():
                break
        
        current_user.referral_code = code
        await db.commit()
    
    # Count referrals
    referral_count = (await db.execute(
        select(func.count()).select_from(Referral).where(Referral.referrer_id == current_user.id)
    )).scalar()
    
    return {
        "referral_code": current_user.referral_code,
        "referral_count": referral_count,
        "points_per_referral": 10
    }

class ApplyReferralCode(BaseModel):
    referral_code: str

@app.post("/api/referral/apply")
async def apply_referral_code(
    data: ApplyReferralCode,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_supabase)
):
    """Apply a referral code"""
    # Check if already referred
    result = await db.execute(
        select(Referral).where(Referral.referred_id == current_user.id)
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Tu as déjà utilisé un code de parrainage")
    
    # Find referrer
    result = await db.execute(
        select(User).where(User.referral_code == data.referral_code.upper())
    )
    referrer = result.scalar_one_or_none()
    
    if not referrer:
        raise HTTPException(status_code=404, detail="Code de parrainage invalide")
    
    if referrer.id == current_user.id:
        raise HTTPException(status_code=400, detail="Tu ne peux pas utiliser ton propre code")
    
    # Create referral
    referral = Referral(
        referrer_id=referrer.id,
        referred_id=current_user.id,
        referrer_points=10,
        referred_points=5
    )
    db.add(referral)
    
    # Award points
    referrer.loyalty_points = (referrer.loyalty_points or 0) + 10
    current_user.loyalty_points = (current_user.loyalty_points or 0) + 5
    
    await db.commit()
    await db.refresh(current_user)
    
    return {
        "success": True,
        "message": "Code de parrainage appliqué! Tu as gagné 5 Invasion Coins!",
        "points_earned": 5,
        "total_points": current_user.loyalty_points
    }

# ============ GALLERY ENDPOINTS ============

@app.get("/api/gallery/events")
async def get_gallery_events(db: AsyncSession = Depends(get_db)):
    """Get events with visible galleries"""
    result = await db.execute(
        select(Event)
        .where(Event.gallery_visible == True)
        .order_by(Event.event_date.desc())
    )
    events = result.scalars().all()
    
    gallery_events = []
    for event in events:
        photo_count = (await db.execute(
            select(func.count()).select_from(Photo).where(Photo.event_id == event.id)
        )).scalar()
        
        cover_result = await db.execute(
            select(Photo).where(Photo.event_id == event.id).limit(1)
        )
        cover_photo = cover_result.scalar_one_or_none()
        
        gallery_events.append({
            "id": event.id,
            "name": event.name,
            "event_date": event.event_date.isoformat() if event.event_date else None,
            "photo_count": photo_count,
            "cover_image": cover_photo.url if cover_photo else None
        })
    
    return gallery_events

@app.get("/api/gallery/{event_id}")
async def get_event_gallery(event_id: str, db: AsyncSession = Depends(get_db)):
    """Get photos for an event"""
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    result = await db.execute(
        select(Photo)
        .where(Photo.event_id == event_id)
        .order_by(Photo.uploaded_at.desc())
    )
    photos = result.scalars().all()
    
    return {
        "event": {
            "id": event.id,
            "name": event.name,
            "event_date": event.event_date.isoformat() if event.event_date else None
        },
        "photos": [
            {
                "id": photo.id,
                "url": photo.url,
                "thumbnail_url": photo.thumbnail_url,
                "likes": photo.likes or 0
            }
            for photo in photos
        ]
    }

# ============ AFTERMOVIES ============

@app.get("/api/aftermovies")
async def get_aftermovies(db: AsyncSession = Depends(get_db)):
    """Get all aftermovies"""
    result = await db.execute(
        select(Aftermovie).order_by(Aftermovie.event_date.desc())
    )
    videos = result.scalars().all()
    
    return [
        {
            "id": video.id,
            "title": video.title,
            "youtube_url": video.youtube_url,
            "thumbnail_url": video.thumbnail_url,
            "event_date": video.event_date.isoformat() if video.event_date else None
        }
        for video in videos
    ]


# ============ WELCOME CONTENT ============

@app.get("/api/welcome-content")
async def get_welcome_content(db: AsyncSession = Depends(get_db)):
    """Get welcome screen content"""
    # First check for custom welcome content
    result = await db.execute(
        select(AppSettings).where(AppSettings.id == "welcome")
    )
    content = result.scalar_one_or_none()
    
    if content and content.welcome_content:
        return content.welcome_content
    
    # Return default welcome content
    return {
        "flyer_url": "",
        "tagline": "The Biggest Latino-Reggaeton Party in Belgium",
        "venue_name": "Mirano Continental, Brussels",
        "en": {
            "title": "Welcome to Invasion Latina",
            "subtitle": "The biggest Latino-Reggaeton party in Belgium!"
        },
        "fr": {
            "title": "Bienvenue à Invasion Latina",
            "subtitle": "La plus grande fête Latino-Reggaeton de Belgique!"
        },
        "es": {
            "title": "Bienvenido a Invasion Latina",
            "subtitle": "¡La fiesta Latino-Reggaeton más grande de Bélgica!"
        },
        "nl": {
            "title": "Welkom bij Invasion Latina",
            "subtitle": "Het grootste Latino-Reggaeton feest in België!"
        }
    }



# ============ ADMIN CONTENT MANAGEMENT ============

class WelcomeContentUpdate(BaseModel):
    flyer_url: Optional[str] = None
    tagline: Optional[str] = None
    venue_name: Optional[str] = None

@app.put("/api/admin/welcome-content")
async def update_welcome_content(
    data: WelcomeContentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_supabase)
):
    """Update welcome screen content (Admin only)"""
    result = await db.execute(
        select(AppSettings).where(AppSettings.id == "welcome")
    )
    settings = result.scalar_one_or_none()
    
    welcome_data = {
        "flyer_url": data.flyer_url,
        "tagline": data.tagline,
        "venue_name": data.venue_name
    }
    
    if settings:
        settings.welcome_content = welcome_data
        settings.updated_by = current_user.email
    else:
        settings = AppSettings(
            id="welcome",
            type="welcome_content",
            welcome_content=welcome_data,
            updated_by=current_user.email
        )
        db.add(settings)
    
    await db.commit()
    
    return {"success": True, "message": "Welcome content updated"}

@app.get("/api/media/aftermovies")
async def get_media_aftermovies(db: AsyncSession = Depends(get_db)):
    """Get all aftermovies for media section"""
    result = await db.execute(
        select(Aftermovie).order_by(Aftermovie.event_date.desc())
    )
    videos = result.scalars().all()
    
    return [
        {
            "id": video.id,
            "title": video.title,
            "youtube_url": video.youtube_url,
            "video_url": video.youtube_url,
            "thumbnail_url": video.thumbnail_url,
            "event_date": video.event_date.isoformat() if video.event_date else None
        }
        for video in videos
    ]

class PhotoCreate(BaseModel):
    url: str
    event_id: str
    thumbnail_url: Optional[str] = None

@app.post("/api/admin/media/photos")
async def add_photo(
    data: PhotoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_supabase)
):
    """Add a photo to an event gallery (Admin only)"""
    # Verify event exists
    result = await db.execute(select(Event).where(Event.id == data.event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    photo = Photo(
        event_id=data.event_id,
        url=data.url,
        thumbnail_url=data.thumbnail_url or data.url,
        uploaded_by=current_user.id
    )
    
    db.add(photo)
    await db.commit()
    await db.refresh(photo)
    
    return {"success": True, "photo_id": photo.id}

class AftermovieCreate(BaseModel):
    title: str
    video_url: str
    thumbnail_url: Optional[str] = None
    event_date: Optional[str] = None

@app.post("/api/admin/media/aftermovies")
async def add_aftermovie(
    data: AftermovieCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_supabase)
):
    """Add an aftermovie (Admin only)"""
    aftermovie = Aftermovie(
        title=data.title,
        youtube_url=data.video_url,
        thumbnail_url=data.thumbnail_url or "https://via.placeholder.com/400x225",
        event_date=datetime.fromisoformat(data.event_date.replace('Z', '+00:00')) if data.event_date else datetime.now(timezone.utc)
    )
    
    db.add(aftermovie)
    await db.commit()
    await db.refresh(aftermovie)
    
    return {"success": True, "aftermovie_id": aftermovie.id}

# ============ ADMIN EVENT MANAGEMENT ============

class AdminEventCreate(BaseModel):
    name: str
    event_date: str
    description: Optional[str] = None
    venue_name: Optional[str] = "Mirano Continental"
    venue_address: Optional[str] = "Chaussée de Louvain 38, 1210 Brussels"
    xceed_ticket_url: Optional[str] = None
    banner_image: Optional[str] = None
    lineup: Optional[List[Dict[str, str]]] = []
    ticket_categories: Optional[List[Dict[str, Any]]] = []
    ticket_price: Optional[float] = None

@app.post("/api/admin/events")
async def admin_create_event(
    data: AdminEventCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_supabase)
):
    """Create a new event (Admin only)"""
    event_date = datetime.fromisoformat(data.event_date.replace('Z', '+00:00'))
    
    # Build ticket categories with custom price
    ticket_categories = data.ticket_categories or []
    if data.ticket_price and not ticket_categories:
        ticket_categories = [
            {
                "category": "standard",
                "name": "Entrée Standard",
                "price": data.ticket_price,
                "total_seats": 500,
                "available_seats": 500,
                "benefits": ["Accès général", "Piste de danse"]
            }
        ]
    elif data.ticket_price and ticket_categories:
        # Update the first category's price
        ticket_categories[0]["price"] = data.ticket_price
    
    event = Event(
        name=data.name,
        description=data.description,
        event_date=event_date,
        venue_name=data.venue_name or "Mirano Continental",
        venue_address=data.venue_address or "Chaussée de Louvain 38, 1210 Brussels",
        xceed_ticket_url=data.xceed_ticket_url,
        banner_image=data.banner_image,
        lineup=data.lineup or [],
        ticket_categories=ticket_categories,
        status="upcoming"
    )
    
    db.add(event)
    await db.commit()
    await db.refresh(event)
    
    return {"success": True, "event_id": event.id, "message": "Event created successfully"}

class AdminEventUpdate(BaseModel):
    name: Optional[str] = None
    event_date: Optional[str] = None
    description: Optional[str] = None
    venue_name: Optional[str] = None
    venue_address: Optional[str] = None
    xceed_ticket_url: Optional[str] = None
    banner_image: Optional[str] = None
    lineup: Optional[List[Dict[str, str]]] = None
    ticket_categories: Optional[List[Dict[str, Any]]] = None
    status: Optional[str] = None
    ticket_price: Optional[float] = None

@app.put("/api/admin/events/{event_id}")
async def admin_update_event(
    event_id: str,
    data: AdminEventUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_supabase)
):
    """Update an event (Admin only)"""
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if data.name is not None:
        event.name = data.name
    if data.event_date is not None:
        event.event_date = datetime.fromisoformat(data.event_date.replace('Z', '+00:00'))
    if data.description is not None:
        event.description = data.description
    if data.venue_name is not None:
        event.venue_name = data.venue_name
    if data.venue_address is not None:
        event.venue_address = data.venue_address
    if data.xceed_ticket_url is not None:
        event.xceed_ticket_url = data.xceed_ticket_url
    if data.banner_image is not None:
        event.banner_image = data.banner_image
    if data.lineup is not None:
        event.lineup = data.lineup
    if data.ticket_categories is not None:
        event.ticket_categories = data.ticket_categories
    if data.status is not None:
        event.status = data.status
    
    # Update ticket price in ticket_categories
    if data.ticket_price is not None:
        current_categories = event.ticket_categories or []
        if current_categories:
            current_categories[0]["price"] = data.ticket_price
            event.ticket_categories = current_categories
        else:
            event.ticket_categories = [
                {
                    "category": "standard",
                    "name": "Entrée Standard",
                    "price": data.ticket_price,
                    "total_seats": 500,
                    "available_seats": 500,
                    "benefits": ["Accès général", "Piste de danse"]
                }
            ]
    
    await db.commit()
    
    return {"success": True, "message": "Event updated successfully"}

class VisibilityUpdate(BaseModel):
    gallery_visible: Optional[bool] = None
    aftermovie_visible: Optional[bool] = None

@app.put("/api/admin/events/{event_id}/visibility")
async def update_event_visibility(
    event_id: str,
    data: VisibilityUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_supabase)
):
    """Update event visibility settings (Admin only)"""
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if data.gallery_visible is not None:
        event.gallery_visible = data.gallery_visible
    if data.aftermovie_visible is not None:
        event.aftermovie_visible = data.aftermovie_visible
    
    await db.commit()
    
    return {"success": True, "message": "Visibility updated"}

@app.delete("/api/admin/events/{event_id}")
async def admin_delete_event(
    event_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_supabase)
):
    """Delete an event (Admin only)"""
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    await db.delete(event)
    await db.commit()
    
    return {"success": True, "message": "Event deleted successfully"}

# ============ ADMIN QR CODE MANAGEMENT (NEW ENDPOINTS) ============

class CreateQRCode(BaseModel):
    event_id: str
    points_value: int = 5

@app.get("/api/admin/event-qr/active")
async def get_active_qr(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_supabase)
):
    """Get currently active QR code (Admin only)"""
    result = await db.execute(
        select(EventQRCode).where(EventQRCode.is_active == True)
    )
    qr = result.scalar_one_or_none()
    
    if not qr:
        return {"active_qr": None}
    
    return {
        "active_qr": {
            "id": qr.id,
            "qr_code": qr.qr_code,
            "event_id": qr.event_id,
            "event_name": qr.event_name,
            "points_value": qr.coins_reward,
            "scan_count": qr.scan_count or 0,
            "created_at": qr.created_at.isoformat() if qr.created_at else None,
            "is_active": qr.is_active
        }
    }

@app.get("/api/admin/event-qr/history")
async def get_qr_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_supabase)
):
    """Get QR code history (Admin only)"""
    result = await db.execute(
        select(EventQRCode).order_by(EventQRCode.created_at.desc()).limit(50)
    )
    qr_codes = result.scalars().all()
    
    return {
        "qr_codes": [
            {
                "id": qr.id,
                "qr_code": qr.qr_code,
                "event_id": qr.event_id,
                "event_name": qr.event_name,
                "points_value": qr.coins_reward,
                "scan_count": qr.scan_count or 0,
                "created_at": qr.created_at.isoformat() if qr.created_at else None,
                "is_active": qr.is_active
            }
            for qr in qr_codes
        ]
    }

@app.post("/api/admin/event-qr/create")
async def create_qr_code(
    data: CreateQRCode,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_supabase)
):
    """Create a new QR code for an event (Admin only)"""
    # Verify event exists
    result = await db.execute(select(Event).where(Event.id == data.event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Deactivate other active QR codes
    await db.execute(
        update(EventQRCode)
        .where(EventQRCode.is_active == True)
        .values(is_active=False)
    )
    
    # Generate unique QR code
    qr_code = f"IL-{event.id[:8]}-{uuid.uuid4().hex[:8].upper()}"
    
    new_qr = EventQRCode(
        event_id=data.event_id,
        event_name=event.name,
        qr_code=qr_code,
        coins_reward=data.points_value,
        is_active=True,
        scan_count=0,
        created_by=current_user.id
    )
    
    db.add(new_qr)
    await db.commit()
    await db.refresh(new_qr)
    
    return {
        "success": True,
        "message": f"QR Code créé pour {event.name}",
        "qr_code": new_qr.qr_code,
        "points_value": new_qr.coins_reward
    }

@app.put("/api/admin/event-qr/{qr_id}/toggle")
async def toggle_qr_status(
    qr_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_supabase)
):
    """Toggle QR code active status (Admin only)"""
    result = await db.execute(select(EventQRCode).where(EventQRCode.id == qr_id))
    qr = result.scalar_one_or_none()
    
    if not qr:
        raise HTTPException(status_code=404, detail="QR code not found")
    
    if not qr.is_active:
        # Deactivate all others first
        await db.execute(
            update(EventQRCode)
            .where(EventQRCode.is_active == True)
            .values(is_active=False)
        )
    
    qr.is_active = not qr.is_active
    await db.commit()
    
    status = "activé" if qr.is_active else "désactivé"
    return {"success": True, "message": f"QR Code {status}", "is_active": qr.is_active}



# ============ VIP BOOKING ADDITIONAL ENDPOINTS ============

class VIPBookCreate(BaseModel):
    event_id: str
    # Support both naming conventions
    name: Optional[str] = None
    customer_name: Optional[str] = None
    email: Optional[str] = None
    customer_email: Optional[str] = None
    phone: Optional[str] = None
    customer_phone: Optional[str] = None
    guests: Optional[int] = None
    guest_count: Optional[int] = None
    message: Optional[str] = None
    special_requests: Optional[str] = None
    # Additional fields from frontend
    zone: Optional[str] = None
    package: Optional[str] = None
    bottle_preferences: Optional[str] = None
    total_price: Optional[float] = None

@app.post("/api/vip/book")
async def book_vip_table(
    data: VIPBookCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_supabase)
):
    """Book a VIP table (alias for /vip/booking)"""
    # Verify event exists
    result = await db.execute(select(Event).where(Event.id == data.event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Get values with fallbacks for both naming conventions
    name = data.name or data.customer_name or current_user.name
    email = data.email or data.customer_email or current_user.email
    phone = data.phone or data.customer_phone or ""
    guests = data.guests or data.guest_count or 1
    
    # Build message from special requests
    message = data.special_requests or data.message or None
    
    booking = VIPBooking(
        user_id=current_user.id,
        event_id=data.event_id,
        name=name,
        email=email,
        phone=phone,
        guests=guests,
        message=message,
        zone=data.zone,
        package=data.package,
        total_price=data.total_price,
        bottle_preferences=data.bottle_preferences,
        special_requests=data.special_requests,
        status="pending"
    )
    
    db.add(booking)
    await db.commit()
    await db.refresh(booking)
    
    return {
        "success": True,
        "booking_id": booking.id,
        "message": "Demande de réservation VIP envoyée!"
    }

@app.get("/api/admin/vip-bookings")
async def get_all_vip_bookings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_supabase)
):
    """Get all VIP bookings (Admin only)"""
    result = await db.execute(
        select(VIPBooking).order_by(VIPBooking.submitted_at.desc())
    )
    bookings = result.scalars().all()
    
    booking_list = []
    for booking in bookings:
        event_result = await db.execute(select(Event).where(Event.id == booking.event_id))
        event = event_result.scalar_one_or_none()
        
        booking_list.append({
            "id": booking.id,
            "user_id": booking.user_id,
            "event_id": booking.event_id,
            "event_name": event.name if event else "Unknown Event",
            "event_date": event.event_date.isoformat() if event and event.event_date else None,
            # Customer info - use both naming conventions
            "name": booking.name,
            "customer_name": booking.name,
            "email": booking.email,
            "customer_email": booking.email,
            "phone": booking.phone,
            "customer_phone": booking.phone,
            "guests": booking.guests,
            "guest_count": booking.guests,
            # VIP details
            "zone": booking.zone or "Non spécifié",
            "package": booking.package or "Standard",
            "total_price": booking.total_price or 0,
            "bottle_preferences": booking.bottle_preferences,
            "special_requests": booking.special_requests or booking.message,
            "message": booking.message,
            # Status
            "status": booking.status,
            "submitted_at": booking.submitted_at.isoformat() if booking.submitted_at else None,
            "confirmed_at": booking.confirmed_at.isoformat() if booking.confirmed_at else None
        })
    
    return booking_list

class VIPBookingStatusUpdate(BaseModel):
    status: str

@app.put("/api/admin/vip-bookings/{booking_id}")
async def update_vip_booking_status(
    booking_id: str,
    data: VIPBookingStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_supabase)
):
    """Update VIP booking status (Admin only)"""
    result = await db.execute(select(VIPBooking).where(VIPBooking.id == booking_id))
    booking = result.scalar_one_or_none()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    booking.status = data.status
    if data.status == "confirmed":
        booking.confirmed_at = datetime.now(timezone.utc)
    elif data.status == "rejected":
        booking.rejected_at = datetime.now(timezone.utc)
    
    await db.commit()
    
    return {"success": True, "message": f"Booking status updated to {data.status}"}

@app.delete("/api/admin/vip-bookings/{booking_id}")
async def delete_vip_booking(
    booking_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_supabase)
):
    """Delete a VIP booking (Admin only)"""
    result = await db.execute(select(VIPBooking).where(VIPBooking.id == booking_id))
    booking = result.scalar_one_or_none()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    await db.delete(booking)
    await db.commit()
    
    return {"success": True, "message": "Booking deleted"}

@app.delete("/api/admin/vip-bookings/clear-all")
async def clear_all_vip_bookings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_supabase)
):
    """Delete all VIP bookings (Admin only)"""
    await db.execute(delete(VIPBooking))
    await db.commit()
    return {"success": True, "message": "All bookings cleared"}

# ============ ADMIN STATS ============

@app.get("/api/admin/stats")
async def get_admin_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_supabase)
):
    """Get admin statistics"""
    total_users = (await db.execute(select(func.count()).select_from(User))).scalar()
    total_events = (await db.execute(select(func.count()).select_from(Event))).scalar()
    total_bookings = (await db.execute(select(func.count()).select_from(VIPBooking))).scalar()
    pending_bookings = (await db.execute(
        select(func.count()).select_from(VIPBooking).where(VIPBooking.status == "pending")
    )).scalar()
    total_orders = (await db.execute(select(func.count()).select_from(Order))).scalar()
    
    return {
        "total_users": total_users,
        "total_events": total_events,
        "total_bookings": total_bookings,
        "pending_bookings": pending_bookings,
        "total_orders": total_orders
    }

# ============ NOTIFICATION PREFERENCES ============

@app.get("/api/user/notification-preferences")
async def get_notification_preferences(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_supabase)
):
    """Get user's notification preferences"""
    result = await db.execute(
        select(NotificationPreference).where(NotificationPreference.user_id == current_user.id)
    )
    prefs = result.scalar_one_or_none()
    
    if not prefs:
        return {
            "events": True,
            "promotions": True,
            "song_requests": True,
            "friends": True
        }
    
    return {
        "events": prefs.events,
        "promotions": prefs.promotions,
        "song_requests": prefs.song_requests,
        "friends": prefs.friends
    }

class NotificationPreferenceUpdate(BaseModel):
    events: Optional[bool] = None
    promotions: Optional[bool] = None
    song_requests: Optional[bool] = None
    friends: Optional[bool] = None

@app.put("/api/user/notification-preferences")
async def update_notification_preferences(
    data: NotificationPreferenceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_supabase)
):
    """Update user's notification preferences"""
    result = await db.execute(
        select(NotificationPreference).where(NotificationPreference.user_id == current_user.id)
    )
    prefs = result.scalar_one_or_none()
    
    if not prefs:
        prefs = NotificationPreference(
            user_id=current_user.id,
            events=data.events if data.events is not None else True,
            promotions=data.promotions if data.promotions is not None else True,
            song_requests=data.song_requests if data.song_requests is not None else True,
            friends=data.friends if data.friends is not None else True
        )
        db.add(prefs)
    else:
        if data.events is not None:
            prefs.events = data.events
        if data.promotions is not None:
            prefs.promotions = data.promotions
        if data.song_requests is not None:
            prefs.song_requests = data.song_requests
        if data.friends is not None:
            prefs.friends = data.friends
    
    await db.commit()
    
    return {"success": True, "message": "Preferences updated"}

# ============ USER PROFILE ============

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    language: Optional[str] = None

@app.put("/api/user/profile")
async def update_user_profile(
    data: UserProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_supabase)
):
    """Update user's profile (name, language)"""
    if data.name is not None:
        current_user.name = data.name.strip()
        logger.info(f"✅ Updated user name to: {data.name}")
    
    if data.language is not None:
        current_user.language = data.language
    
    await db.commit()
    
    return {
        "success": True, 
        "message": "Profile updated",
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "language": current_user.language
        }
    }

# ============ MEDIA GALLERIES ============

@app.get("/api/media/galleries")
async def get_media_galleries(db: AsyncSession = Depends(get_db)):
    """Get all event galleries"""
    result = await db.execute(
        select(Event)
        .where(Event.gallery_visible == True)
        .order_by(Event.event_date.desc())
    )
    events = result.scalars().all()
    
    galleries = []
    for event in events:
        photo_count = (await db.execute(
            select(func.count()).select_from(Photo).where(Photo.event_id == event.id)
        )).scalar()
        
        # Use banner_image as cover, fallback to first photo if available
        cover_image = event.banner_image
        if not cover_image:
            cover_result = await db.execute(
                select(Photo).where(Photo.event_id == event.id).limit(1)
            )
            cover_photo = cover_result.scalar_one_or_none()
            cover_image = cover_photo.url if cover_photo else None
        
        galleries.append({
            "id": event.id,
            "name": event.name,
            "event_date": event.event_date.isoformat() if event.event_date else None,
            "photo_count": photo_count,
            "cover_image": cover_image
        })
    
    return galleries

@app.get("/api/media/gallery/{event_id}")
async def get_media_gallery(event_id: str, db: AsyncSession = Depends(get_db)):
    """Get photos for an event gallery"""
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    result = await db.execute(
        select(Photo)
        .where(Photo.event_id == event_id)
        .order_by(Photo.uploaded_at.desc())
    )
    photos = result.scalars().all()
    
    return {
        "event": {
            "id": event.id,
            "name": event.name,
            "event_date": event.event_date.isoformat() if event.event_date else None
        },
        "photos": [
            {
                "id": photo.id,
                "url": photo.url,
                "thumbnail_url": photo.thumbnail_url or photo.url,
                "likes": photo.likes or 0
            }
            for photo in photos
        ]
    }

# ============ LOYALTY ADDITIONAL ENDPOINTS ============

@app.post("/api/loyalty/scan-event-qr")
async def scan_loyalty_qr(
    data: ScanEventQRCode,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_supabase)
):
    """Scan event QR code to earn coins (User) - alias"""
    result = await db.execute(
        select(EventQRCode)
        .where(EventQRCode.qr_code == data.qr_code)
        .where(EventQRCode.is_active == True)
    )
    qr = result.scalar_one_or_none()
    
    if not qr:
        raise HTTPException(status_code=404, detail="QR code invalide ou expiré")
    
    user_id = current_user.id
    
    # Check if already scanned
    result = await db.execute(
        select(EventQRScan)
        .where(EventQRScan.qr_id == qr.id)
        .where(EventQRScan.user_id == user_id)
    )
    existing_scan = result.scalar_one_or_none()
    
    if existing_scan:
        raise HTTPException(status_code=400, detail="Tu as déjà scanné ce QR code!")
    
    # Create scan record
    scan = EventQRScan(
        qr_id=qr.id,
        user_id=user_id,
        coins_earned=qr.coins_reward
    )
    db.add(scan)
    
    # Update QR scan count
    qr.scan_count = (qr.scan_count or 0) + 1
    
    # Update user loyalty points
    current_user.loyalty_points = (current_user.loyalty_points or 0) + qr.coins_reward
    
    await db.commit()
    await db.refresh(current_user)
    
    return {
        "success": True,
        "message": f"Félicitations! Tu as gagné {qr.coins_reward} Invasion Coins! 🎉",
        "coins_earned": qr.coins_reward,
        "total_coins": current_user.loyalty_points,
        "event_name": qr.event_name
    }

@app.post("/api/loyalty/claim-reward")
async def claim_loyalty_reward(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_supabase)
):
    """Claim a free entry reward (costs 25 loyalty points)"""
    if (current_user.loyalty_points or 0) < 25:
        raise HTTPException(status_code=400, detail="Tu as besoin de 25 points de fidélité")
    
    # Check for existing active voucher
    result = await db.execute(
        select(FreeEntryVoucher)
        .where(FreeEntryVoucher.user_id == current_user.id)
        .where(FreeEntryVoucher.used == False)
        .where(FreeEntryVoucher.expires_at > datetime.now(timezone.utc))
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(status_code=400, detail="Tu as déjà une entrée gratuite active")
    
    # Deduct points
    current_user.loyalty_points = (current_user.loyalty_points or 0) - 25
    
    # Create voucher
    voucher = FreeEntryVoucher(
        user_id=current_user.id,
        user_name=current_user.name,
        user_email=current_user.email,
        expires_at=datetime.now(timezone.utc) + timedelta(days=90)
    )
    
    db.add(voucher)
    await db.commit()
    await db.refresh(voucher)
    
    return {
        "success": True,
        "message": "Entrée gratuite obtenue!",
        "voucher": {
            "id": voucher.id,
            "user_id": voucher.user_id,
            "created_at": voucher.created_at.isoformat() if voucher.created_at else None,
            "expires_at": voucher.expires_at.isoformat() if voucher.expires_at else None,
            "used": voucher.used
        }
    }

class LoyaltyCheckinScan(BaseModel):
    qr_code: str = None
    user_id: str = None

@app.post("/api/loyalty/admin/scan-checkin")
async def admin_scan_checkin(
    data: LoyaltyCheckinScan,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_supabase)
):
    """Admin scan for loyalty check-in"""
    # Get current event
    result = await db.execute(
        select(Event)
        .where(Event.status.in_(["live", "upcoming"]))
        .order_by(Event.event_date.desc())
        .limit(1)
    )
    current_event = result.scalar_one_or_none()
    
    if not current_event:
        raise HTTPException(status_code=400, detail="No active event")
    
    # Get app settings for QR version
    result = await db.execute(select(AppSettings).where(AppSettings.id == "global"))
    settings = result.scalar_one_or_none()
    qr_version = settings.loyalty_qr_version if settings else 1
    
    user_id = data.user_id
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID required")
    
    # Check for existing check-in
    result = await db.execute(
        select(LoyaltyCheckin)
        .where(LoyaltyCheckin.user_id == user_id)
        .where(LoyaltyCheckin.event_id == current_event.id)
        .where(LoyaltyCheckin.qr_version == qr_version)
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(status_code=400, detail="Déjà check-in pour cet événement")
    
    # Get user
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Create check-in
    checkin = LoyaltyCheckin(
        user_id=user_id,
        event_id=current_event.id,
        qr_version=qr_version,
        points_earned=5,
        checked_in_by=current_user.id
    )
    db.add(checkin)
    
    # Add points to user
    user.loyalty_points = (user.loyalty_points or 0) + 5
    
    await db.commit()
    
    return {
        "success": True,
        "message": f"Check-in réussi! {user.name} a gagné 5 points",
        "user_name": user.name,
        "points_earned": 5,
        "total_points": user.loyalty_points
    }

# ============ DJ ADMIN ENDPOINTS ============

@app.get("/api/dj/admin/all-requests")
async def get_all_dj_requests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_supabase)
):
    """Get all song requests for admin/DJ"""
    result = await db.execute(
        select(SongRequest).order_by(SongRequest.requested_at.desc()).limit(200)
    )
    requests = result.scalars().all()
    
    return [
        {
            "id": req.id,
            "song_title": req.song_title,
            "artist_name": req.artist_name,
            "user_name": req.user_name,
            "votes": req.votes,
            "times_requested": req.times_requested or 1,
            "requested_at": req.requested_at.isoformat() if req.requested_at else None,
            "status": req.status,
            "rejection_reason": req.rejection_reason,
            "rejection_label": req.rejection_label,
            "event_id": req.event_id
        }
        for req in requests
    ]

@app.delete("/api/dj/requests/{request_id}")
async def delete_song_request(
    request_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_supabase)
):
    """Delete a specific song request (Admin only)"""
    result = await db.execute(select(SongRequest).where(SongRequest.id == request_id))
    request = result.scalar_one_or_none()
    
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    await db.delete(request)
    await db.commit()
    
    return {"success": True, "message": "Request deleted"}

# ============ ADMIN SETTINGS ADDITIONAL ============

@app.post("/api/admin/settings/start-event")
async def start_event(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_supabase)
):
    """Start an event (enable requests, etc.)"""
    result = await db.execute(select(AppSettings).where(AppSettings.id == "global"))
    settings = result.scalar_one_or_none()
    
    # Get next event
    result = await db.execute(
        select(Event)
        .where(Event.status == "upcoming")
        .order_by(Event.event_date)
        .limit(1)
    )
    next_event = result.scalar_one_or_none()
    
    if settings:
        settings.requests_enabled = True
        if next_event:
            settings.current_event_id = next_event.id
            next_event.status = "live"
        settings.updated_by = current_user.email
    else:
        settings = AppSettings(
            id="global",
            requests_enabled=True,
            current_event_id=next_event.id if next_event else None,
            updated_by=current_user.email
        )
        db.add(settings)
        if next_event:
            next_event.status = "live"
    
    await db.commit()
    
    return {
        "success": True,
        "message": "Événement démarré! Les demandes de chansons sont activées.",
        "requests_enabled": True,
        "current_event_id": settings.current_event_id
    }

@app.post("/api/admin/settings/end-event")
async def end_event(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_supabase)
):
    """End the current event"""
    result = await db.execute(select(AppSettings).where(AppSettings.id == "global"))
    settings = result.scalar_one_or_none()
    
    if settings and settings.current_event_id:
        # Mark event as past
        result = await db.execute(select(Event).where(Event.id == settings.current_event_id))
        current_event = result.scalar_one_or_none()
        if current_event:
            current_event.status = "past"
        
        settings.requests_enabled = False
        settings.current_event_id = None
        settings.loyalty_qr_version = (settings.loyalty_qr_version or 1) + 1
        settings.updated_by = current_user.email
    
    await db.commit()
    
    return {
        "success": True,
        "message": "Événement terminé. Les demandes de chansons sont désactivées.",
        "requests_enabled": False
    }

# ============ EVENT FLYER UPDATE ============

class FlyerUpdate(BaseModel):
    banner_image: str

@app.put("/api/admin/events/{event_id}/flyer")
async def update_event_flyer(
    event_id: str,
    data: FlyerUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_supabase)
):
    """Update event flyer/banner image"""
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    event.banner_image = data.banner_image
    await db.commit()
    
    return {"success": True, "message": "Flyer updated"}

# ============ FREE ENTRY VALIDATION ============

class FreeEntryValidation(BaseModel):
    voucher_id: str

@app.post("/api/admin/free-entry/validate")
async def validate_free_entry(
    data: FreeEntryValidation,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_supabase)
):
    """Validate a free entry voucher (Admin only)"""
    result = await db.execute(
        select(FreeEntryVoucher).where(FreeEntryVoucher.id == data.voucher_id)
    )
    voucher = result.scalar_one_or_none()
    
    if not voucher:
        raise HTTPException(status_code=404, detail="Voucher not found")
    
    if voucher.used:
        raise HTTPException(status_code=400, detail="Voucher already used")
    
    if voucher.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Voucher expired")
    
    voucher.used = True
    voucher.used_at = datetime.now(timezone.utc)
    voucher.validated_by = current_user.id
    
    # Get current event
    result = await db.execute(select(AppSettings).where(AppSettings.id == "global"))
    settings = result.scalar_one_or_none()
    if settings and settings.current_event_id:
        voucher.event_id = settings.current_event_id
    
    await db.commit()
    
    return {
        "success": True,
        "message": "Entrée gratuite validée!",
        "user_name": voucher.user_name,
        "user_email": voucher.user_email
    }


# ============ ADMIN PHOTO/GALLERY MANAGEMENT ============

@app.delete("/api/admin/photos/{photo_id}")
async def delete_photo(
    photo_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_supabase)
):
    """Delete a photo (Admin only)"""
    result = await db.execute(select(Photo).where(Photo.id == photo_id))
    photo = result.scalar_one_or_none()
    
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    await db.delete(photo)
    await db.commit()
    
    return {"success": True, "message": "Photo supprimée"}

@app.delete("/api/admin/gallery/{event_id}/clear")
async def clear_event_gallery(
    event_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_supabase)
):
    """Delete all photos from an event gallery (Admin only)"""
    result = await db.execute(delete(Photo).where(Photo.event_id == event_id))
    await db.commit()
    
    return {"success": True, "message": "Galerie vidée"}

@app.delete("/api/admin/aftermovies/{aftermovie_id}")
async def delete_aftermovie(
    aftermovie_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_supabase)
):
    """Delete an aftermovie (Admin only)"""
    result = await db.execute(select(Aftermovie).where(Aftermovie.id == aftermovie_id))
    aftermovie = result.scalar_one_or_none()
    
    if not aftermovie:
        raise HTTPException(status_code=404, detail="Aftermovie not found")
    
    await db.delete(aftermovie)
    await db.commit()
    
    return {"success": True, "message": "Aftermovie supprimé"}

@app.delete("/api/admin/aftermovies/clear-all")
async def clear_all_aftermovies(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_supabase)
):
    """Delete all aftermovies (Admin only)"""
    await db.execute(delete(Aftermovie))
    await db.commit()
    
    return {"success": True, "message": "Tous les aftermovies supprimés"}

# ============ ADMIN DJ MANAGEMENT ============

class DJCreate(BaseModel):
    name: str
    bio: Optional[str] = None
    photo_url: Optional[str] = None
    instagram_url: Optional[str] = None
    soundcloud_url: Optional[str] = None
    spotify_url: Optional[str] = None
    is_resident: bool = False

@app.post("/api/admin/djs")
async def create_dj(
    data: DJCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_supabase)
):
    """Create a new DJ (Admin only)"""
    # Get max order
    result = await db.execute(select(func.max(DJ.order)))
    max_order = result.scalar() or 0
    
    dj = DJ(
        name=data.name,
        bio=data.bio,
        photo_url=data.photo_url,
        instagram_url=data.instagram_url,
        soundcloud_url=data.soundcloud_url,
        spotify_url=data.spotify_url,
        is_resident=data.is_resident,
        order=max_order + 1
    )
    
    db.add(dj)
    await db.commit()
    await db.refresh(dj)
    
    return {"success": True, "dj_id": dj.id, "message": f"DJ {data.name} ajouté"}

@app.put("/api/admin/djs/{dj_id}")
async def update_dj(
    dj_id: str,
    data: DJCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_supabase)
):
    """Update a DJ (Admin only)"""
    result = await db.execute(select(DJ).where(DJ.id == dj_id))
    dj = result.scalar_one_or_none()
    
    if not dj:
        raise HTTPException(status_code=404, detail="DJ not found")
    
    dj.name = data.name
    dj.bio = data.bio
    dj.photo_url = data.photo_url
    dj.instagram_url = data.instagram_url
    dj.soundcloud_url = data.soundcloud_url
    dj.spotify_url = data.spotify_url
    dj.is_resident = data.is_resident
    
    await db.commit()
    
    return {"success": True, "message": f"DJ {data.name} mis à jour"}

@app.delete("/api/admin/djs/{dj_id}")
async def delete_dj(
    dj_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_supabase)
):
    """Delete a DJ (Admin only)"""
    result = await db.execute(select(DJ).where(DJ.id == dj_id))
    dj = result.scalar_one_or_none()
    
    if not dj:
        raise HTTPException(status_code=404, detail="DJ not found")
    
    await db.delete(dj)
    await db.commit()
    
    return {"success": True, "message": "DJ supprimé"}

# ============ MULTI-PHOTO UPLOAD ============

class MultiPhotoUpload(BaseModel):
    event_id: str
    photo_urls: List[str]

@app.post("/api/admin/media/photos/bulk")
async def bulk_upload_photos(
    data: MultiPhotoUpload,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_admin_supabase)
):
    """Upload multiple photos at once (Admin only)"""
    # Verify event exists
    result = await db.execute(select(Event).where(Event.id == data.event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    photos_added = []
    for url in data.photo_urls:
        photo = Photo(
            event_id=data.event_id,
            url=url,
            thumbnail_url=url,
            uploaded_by=current_user.id
        )
        db.add(photo)
        photos_added.append(photo)
    
    await db.commit()
    
    return {
        "success": True,
        "message": f"{len(photos_added)} photos ajoutées",
        "count": len(photos_added)
    }
