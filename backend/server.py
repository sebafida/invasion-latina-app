"""
INVASION LATINA - Backend API Server
Complete FastAPI backend for the mobile app

⚠️  IMPORTANT: This uses MOCK Firebase and Stripe services
Replace with your production API keys in the .env file
"""

from fastapi import FastAPI, HTTPException, Depends, Query, Body, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from bson import ObjectId
import logging
import json
import uuid

# Import our modules
from config import settings, is_using_mock_keys
from database import connect_to_mongo, close_mongo_connection, get_database
from models import *
from auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, get_current_admin, verify_firebase_token
)
from firebase_service import firebase_service
from stripe_service import stripe_service
from utils import (
    is_within_geofence, is_event_hours_active, can_access_dj_features,
    generate_ticket_code, generate_qr_data
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============ LIFECYCLE MANAGEMENT ============

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown"""
    # Startup
    logger.info("🚀 Starting Invasion Latina API...")
    await connect_to_mongo()
    
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
    
    yield
    
    # Shutdown
    logger.info("👋 Shutting down Invasion Latina API...")
    await close_mongo_connection()

# ============ FASTAPI APP INITIALIZATION ============

app = FastAPI(
    title="Invasion Latina API",
    description="Backend API for Invasion Latina Mobile App - The biggest Latino-Reggaeton party in Belgium",
    version="1.0.0",
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
    db = get_database()
    
    admin_email = "admin@invasionlatina.be"
    existing = await db.users.find_one({"email": admin_email})
    
    if not existing:
        admin_user = {
            "email": admin_email,
            "name": "Master Admin",
            "hashed_password": hash_password("admin123"),
            "role": "admin",
            "loyalty_points": 0,
            "badges": ["admin"],
            "friends": [],
            "language": "fr",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        await db.users.insert_one(admin_user)
        logger.info(f"✅ Created master admin: {admin_email} / admin123")

async def create_sample_event():
    """Create a sample upcoming event"""
    db = get_database()
    
    event_count = await db.events.count_documents({})
    
    if event_count == 0:
        from datetime import date
        today = date.today()
        days_until_saturday = (5 - today.weekday()) % 7
        if days_until_saturday == 0:
            days_until_saturday = 7
        next_saturday = today + timedelta(days=days_until_saturday)
        event_datetime = datetime.combine(next_saturday, datetime.min.time()).replace(hour=23, minute=0)
        
        sample_event = {
            "name": "Invasion Latina - New Year Edition",
            "description": "The biggest Latino-Reggaeton party in Belgium is back! 🔥",
            "event_date": event_datetime,
            "venue_name": "Mirano Continental",
            "venue_address": "Chaussée de Louvain 38, 1210 Brussels",
            "lineup": [
                {"name": "DJ Fuego", "role": "Resident DJ"},
                {"name": "MC Latino", "role": "Host"}
            ],
            "ticket_categories": [
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
            "status": "upcoming",
            "created_at": datetime.utcnow()
        }
        
        await db.events.insert_one(sample_event)
        logger.info(f"✅ Created sample event on {event_datetime}")

async def create_sample_products():
    """Create sample merchandise products"""
    db = get_database()
    
    product_count = await db.products.count_documents({})
    
    if product_count == 0:
        products = [
            {
                "name": "Invasion Latina Hoodie",
                "description": "Premium quality hoodie with official logo",
                "category": "apparel",
                "price": 45.0,
                "sizes_available": ["S", "M", "L", "XL", "XXL"],
                "images": [],  # Placeholder - will use base64 in production
                "stock_quantity": 100,
                "created_at": datetime.utcnow()
            },
            {
                "name": "Invasion Latina T-Shirt",
                "description": "Classic fit t-shirt with event branding",
                "category": "apparel",
                "price": 25.0,
                "sizes_available": ["S", "M", "L", "XL"],
                "images": [],
                "stock_quantity": 200,
                "created_at": datetime.utcnow()
            },
            {
                "name": "Invasion Latina Cap",
                "description": "Snapback cap with embroidered logo",
                "category": "accessories",
                "price": 20.0,
                "sizes_available": ["One Size"],
                "images": [],
                "stock_quantity": 150,
                "created_at": datetime.utcnow()
            }
        ]
        
        await db.products.insert_many(products)
        logger.info(f"✅ Created {len(products)} sample products")

# ============ ROOT & HEALTH ENDPOINTS ============

@app.get("/")
async def root():
    """API root"""
    return {
        "app": "Invasion Latina API",
        "version": "1.0.0",
        "status": "running",
        "venue": "Mirano Continental, Brussels",
        "warning": "Using mock keys" if is_using_mock_keys() else None
    }

@app.get("/api/health")
async def health_check():
    """Health check"""
    db = get_database()
    try:
        await db.command("ping")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database error: {str(e)}")

# Note: Remaining endpoints will be added in the following sections
# This file continues with authentication, events, tickets, DJ requests, etc.
