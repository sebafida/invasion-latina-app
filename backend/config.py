from pydantic import BaseModel
from typing import Optional
import os

class Settings(BaseModel):
    """Application configuration settings"""
    
    # MongoDB
    mongo_url: str = "mongodb://localhost:27017"
    mongo_db: str = "invasion_latina"
    
    # Stripe Payment
    # TODO: Replace with your PRODUCTION keys from https://dashboard.stripe.com/apikeys
    stripe_secret_key: str = "sk_test_MOCK_KEY_REPLACE_WITH_REAL"
    stripe_publishable_key: str = "pk_test_MOCK_KEY_REPLACE_WITH_REAL"
    stripe_webhook_secret: str = "whsec_MOCK_WEBHOOK_SECRET"
    
    # Firebase
    # TODO: Replace with your Firebase project credentials
    firebase_project_id: str = "invasion-latina-mock"
    firebase_private_key_id: Optional[str] = None
    firebase_private_key: Optional[str] = None
    firebase_client_email: Optional[str] = None
    firebase_client_id: Optional[str] = None
    firebase_database_url: str = "https://invasion-latina-mock.firebaseio.com"
    
    # Application
    app_env: str = "development"
    secret_key: str = "invasion-latina-secret-key-change-in-production"
    allowed_origins: str = "http://localhost:3000,exp://localhost:8081"
    
    # Venue Geofencing
    venue_latitude: float = 50.8486
    venue_longitude: float = 4.3722
    venue_radius_meters: float = 100.0
    
    # Event Timing
    event_start_hour: int = 23  # 11 PM
    event_end_hour: int = 6     # 6 AM
    
    # Email (Optional)
    smtp_host: Optional[str] = None
    smtp_port: int = 587
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None

# Load settings from environment
def load_settings():
    """Load settings from environment variables"""
    return Settings(
        mongo_url=os.getenv("MONGO_URL", "mongodb://localhost:27017"),
        mongo_db=os.getenv("MONGO_DB", "invasion_latina"),
        stripe_secret_key=os.getenv("STRIPE_SECRET_KEY", "sk_test_MOCK_KEY_REPLACE_WITH_REAL"),
        stripe_publishable_key=os.getenv("STRIPE_PUBLISHABLE_KEY", "pk_test_MOCK_KEY_REPLACE_WITH_REAL"),
        stripe_webhook_secret=os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_MOCK_WEBHOOK_SECRET"),
        firebase_project_id=os.getenv("FIREBASE_PROJECT_ID", "invasion-latina-mock"),
        firebase_private_key_id=os.getenv("FIREBASE_PRIVATE_KEY_ID"),
        firebase_private_key=os.getenv("FIREBASE_PRIVATE_KEY"),
        firebase_client_email=os.getenv("FIREBASE_CLIENT_EMAIL"),
        firebase_client_id=os.getenv("FIREBASE_CLIENT_ID"),
        firebase_database_url=os.getenv("FIREBASE_DATABASE_URL", "https://invasion-latina-mock.firebaseio.com"),
        app_env=os.getenv("APP_ENV", "development"),
        secret_key=os.getenv("SECRET_KEY", "invasion-latina-secret-key-change-in-production"),
        allowed_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,exp://localhost:8081"),
        venue_latitude=float(os.getenv("VENUE_LATITUDE", "50.8486")),
        venue_longitude=float(os.getenv("VENUE_LONGITUDE", "4.3722")),
        venue_radius_meters=float(os.getenv("VENUE_RADIUS_METERS", "100.0")),
        event_start_hour=int(os.getenv("EVENT_START_HOUR", "23")),
        event_end_hour=int(os.getenv("EVENT_END_HOUR", "6")),
        smtp_host=os.getenv("SMTP_HOST"),
        smtp_port=int(os.getenv("SMTP_PORT", "587")),
        smtp_user=os.getenv("SMTP_USER"),
        smtp_password=os.getenv("SMTP_PASSWORD")
    )

settings = load_settings()

# Helper function to check if we're using mock keys
def is_using_mock_keys() -> bool:
    """Check if the app is using mock/placeholder API keys"""
    return (
        "MOCK" in settings.stripe_secret_key or
        "mock" in settings.firebase_project_id
    )

if is_using_mock_keys():
    print("⚠️  WARNING: Using MOCK API keys. Replace with production keys in .env file!")