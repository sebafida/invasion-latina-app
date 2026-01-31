from pydantic import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
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
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()

# Helper function to check if we're using mock keys
def is_using_mock_keys() -> bool:
    """Check if the app is using mock/placeholder API keys"""
    return (
        "MOCK" in settings.stripe_secret_key or
        "mock" in settings.firebase_project_id
    )

if is_using_mock_keys():
    print("⚠️  WARNING: Using MOCK API keys. Replace with production keys in .env file!")