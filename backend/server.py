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
    description: str
    event_date: datetime
    venue_name: str
    venue_address: str
    lineup: List[Dict[str, str]] = []
    ticket_categories: List[Dict[str, Any]] = []
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

# ============ AUTHENTICATION ENDPOINTS ============

@app.post("/api/auth/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    """Register a new user"""
    db = get_database()
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = hash_password(user_data.password)
    user_dict = user_data.dict()
    del user_dict["password"]
    user_dict["hashed_password"] = hashed_password
    user_dict["role"] = "user"
    user_dict["loyalty_points"] = 0
    user_dict["badges"] = []
    user_dict["friends"] = []
    user_dict["created_at"] = datetime.utcnow()
    user_dict["updated_at"] = datetime.utcnow()
    
    result = await db.users.insert_one(user_dict)
    user_dict["_id"] = result.inserted_id
    
    # Create access token
    access_token = create_access_token(data={"sub": user_data.email})
    
    return UserResponse(
        id=str(result.inserted_id),
        email=user_data.email,
        name=user_data.name,
        role="user",
        loyalty_points=0,
        badges=[],
        friends=[],
        language=user_data.language,
        access_token=access_token
    )

@app.post("/api/auth/login", response_model=UserResponse)
async def login(credentials: UserLogin):
    """Login user"""
    db = get_database()
    
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": credentials.email})
    
    return UserResponse(
        id=str(user["_id"]),
        email=user["email"],
        name=user["name"],
        role=user["role"],
        loyalty_points=user.get("loyalty_points", 0),
        badges=user.get("badges", []),
        friends=user.get("friends", []),
        language=user.get("language", "en"),
        access_token=access_token
    )

@app.post("/api/auth/firebase-login", response_model=UserResponse)
async def firebase_login(token_data: FirebaseTokenData):
    """Login with Firebase token"""
    try:
        # Verify Firebase token (MOCKED in development)
        user_info = await firebase_service.verify_token(token_data.firebase_token)
        
        db = get_database()
        
        # Find or create user
        user = await db.users.find_one({"email": user_info["email"]})
        
        if not user:
            # Create new user from Firebase data
            user_dict = {
                "email": user_info["email"],
                "name": user_info.get("name", "Firebase User"),
                "firebase_uid": user_info["uid"],
                "role": "user",
                "loyalty_points": 0,
                "badges": [],
                "friends": [],
                "language": "en",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            result = await db.users.insert_one(user_dict)
            user_dict["_id"] = result.inserted_id
            user = user_dict
        
        # Create access token
        access_token = create_access_token(data={"sub": user["email"]})
        
        return UserResponse(
            id=str(user["_id"]),
            email=user["email"],
            name=user["name"],
            role=user["role"],
            loyalty_points=user.get("loyalty_points", 0),
            badges=user.get("badges", []),
            friends=user.get("friends", []),
            language=user.get("language", "en"),
            access_token=access_token
        )
        
    except Exception as e:
        logger.error(f"Firebase login error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid Firebase token")

@app.get("/api/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse(
        id=str(current_user["_id"]),
        email=current_user["email"],
        name=current_user["name"],
        role=current_user["role"],
        loyalty_points=current_user.get("loyalty_points", 0),
        badges=current_user.get("badges", []),
        friends=current_user.get("friends", []),
        language=current_user.get("language", "en")
    )

# ============ EVENT ENDPOINTS ============

@app.get("/api/events", response_model=List[EventResponse])
async def get_events(status: Optional[str] = Query(None)):
    """Get all events, optionally filtered by status"""
    db = get_database()
    
    query = {}
    if status:
        query["status"] = status
    
    events = []
    async for event in db.events.find(query).sort("event_date", 1):
        events.append(EventResponse(
            id=str(event["_id"]),
            name=event["name"],
            description=event["description"],
            event_date=event["event_date"],
            venue_name=event["venue_name"],
            venue_address=event["venue_address"],
            lineup=event.get("lineup", []),
            ticket_categories=event.get("ticket_categories", []),
            status=event["status"]
        ))
    
    return events

@app.get("/api/events/{event_id}", response_model=EventResponse)
async def get_event(event_id: str):
    """Get specific event by ID"""
    db = get_database()
    
    try:
        event = await db.events.find_one({"_id": ObjectId(event_id)})
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        return EventResponse(
            id=str(event["_id"]),
            name=event["name"],
            description=event["description"],
            event_date=event["event_date"],
            venue_name=event["venue_name"],
            venue_address=event["venue_address"],
            lineup=event.get("lineup", []),
            ticket_categories=event.get("ticket_categories", []),
            status=event["status"]
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid event ID")

@app.post("/api/events", response_model=EventResponse)
async def create_event(
    event_data: EventCreate,
    current_user: dict = Depends(get_current_admin)
):
    """Create new event (admin only)"""
    db = get_database()
    
    event_dict = event_data.dict()
    event_dict["status"] = "upcoming"
    event_dict["created_at"] = datetime.utcnow()
    
    result = await db.events.insert_one(event_dict)
    event_dict["_id"] = result.inserted_id
    
    return EventResponse(
        id=str(result.inserted_id),
        name=event_data.name,
        description=event_data.description,
        event_date=event_data.event_date,
        venue_name=event_data.venue_name,
        venue_address=event_data.venue_address,
        lineup=event_data.lineup,
        ticket_categories=event_data.ticket_categories,
        status="upcoming"
    )

# ============ TICKET ENDPOINTS ============

@app.post("/api/tickets/purchase", response_model=TicketResponse)
async def purchase_ticket(
    ticket_data: TicketPurchase,
    current_user: dict = Depends(get_current_user)
):
    """Purchase a ticket"""
    db = get_database()
    
    # Get event
    try:
        event = await db.events.find_one({"_id": ObjectId(ticket_data.event_id)})
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
    except:
        raise HTTPException(status_code=400, detail="Invalid event ID")
    
    # Find ticket category
    ticket_category = None
    for cat in event.get("ticket_categories", []):
        if cat["category"] == ticket_data.ticket_category:
            ticket_category = cat
            break
    
    if not ticket_category:
        raise HTTPException(status_code=400, detail="Invalid ticket category")
    
    # Check availability
    if ticket_category["available_seats"] < ticket_data.quantity:
        raise HTTPException(status_code=400, detail="Not enough tickets available")
    
    # Calculate total price
    total_price = ticket_category["price"] * ticket_data.quantity
    
    # Process payment with Stripe (MOCKED)
    try:
        payment_result = await stripe_service.process_payment(
            amount=int(total_price * 100),  # Convert to cents
            currency="eur",
            payment_method_id=ticket_data.payment_method_id,
            customer_email=current_user["email"]
        )
        
        if not payment_result["success"]:
            raise HTTPException(status_code=400, detail="Payment failed")
        
    except Exception as e:
        logger.error(f"Payment processing error: {str(e)}")
        raise HTTPException(status_code=400, detail="Payment processing failed")
    
    # Create tickets
    tickets = []
    for i in range(ticket_data.quantity):
        ticket_dict = {
            "event_id": ObjectId(ticket_data.event_id),
            "user_id": ObjectId(current_user["_id"]),
            "ticket_category": ticket_data.ticket_category,
            "price": ticket_category["price"],
            "ticket_code": generate_ticket_code(),
            "qr_data": generate_qr_data(),
            "status": "active",
            "purchase_date": datetime.utcnow(),
            "payment_id": payment_result.get("payment_id", "mock_payment_123")
        }
        
        result = await db.tickets.insert_one(ticket_dict)
        ticket_dict["_id"] = result.inserted_id
        
        tickets.append(TicketResponse(
            id=str(result.inserted_id),
            event_id=ticket_data.event_id,
            user_id=str(current_user["_id"]),
            ticket_category=ticket_data.ticket_category,
            price=ticket_category["price"],
            ticket_code=ticket_dict["ticket_code"],
            qr_data=ticket_dict["qr_data"],
            status="active",
            purchase_date=ticket_dict["purchase_date"]
        ))
    
    # Update available seats
    await db.events.update_one(
        {"_id": ObjectId(ticket_data.event_id), "ticket_categories.category": ticket_data.ticket_category},
        {"$inc": {"ticket_categories.$.available_seats": -ticket_data.quantity}}
    )
    
    # Award loyalty points
    points_earned = int(total_price * 0.1)  # 10% of price as points
    await db.users.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$inc": {"loyalty_points": points_earned}}
    )
    
    return tickets[0] if len(tickets) == 1 else tickets

@app.get("/api/tickets/my-tickets", response_model=List[TicketResponse])
async def get_my_tickets(current_user: dict = Depends(get_current_user)):
    """Get current user's tickets"""
    db = get_database()
    
    tickets = []
    async for ticket in db.tickets.find({"user_id": ObjectId(current_user["_id"])}):
        tickets.append(TicketResponse(
            id=str(ticket["_id"]),
            event_id=str(ticket["event_id"]),
            user_id=str(ticket["user_id"]),
            ticket_category=ticket["ticket_category"],
            price=ticket["price"],
            ticket_code=ticket["ticket_code"],
            qr_data=ticket["qr_data"],
            status=ticket["status"],
            purchase_date=ticket["purchase_date"]
        ))
    
    return tickets

@app.post("/api/tickets/{ticket_id}/validate")
async def validate_ticket(
    ticket_id: str,
    current_user: dict = Depends(get_current_admin)
):
    """Validate a ticket (admin only)"""
    db = get_database()
    
    try:
        ticket = await db.tickets.find_one({"_id": ObjectId(ticket_id)})
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        if ticket["status"] != "active":
            raise HTTPException(status_code=400, detail="Ticket already used or invalid")
        
        # Mark ticket as used
        await db.tickets.update_one(
            {"_id": ObjectId(ticket_id)},
            {"$set": {"status": "used", "validated_at": datetime.utcnow()}}
        )
        
        return {"message": "Ticket validated successfully", "ticket_code": ticket["ticket_code"]}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid ticket ID")

# Note: Additional endpoints for DJ requests, merchandise, social features, etc. will be added next
