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
from models import (
    UserCreate, UserLogin, UserBase, Event, Ticket, Booking, 
    SongRequest, Product, Order, VIPBooking, Media
)
from pydantic import BaseModel
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
    access_token = create_access_token(data={"sub": str(result.inserted_id)})
    
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
    
    access_token = create_access_token(data={"sub": str(user["_id"])})
    
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
        access_token = create_access_token(data={"sub": str(user["_id"])})
        
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
            xceed_ticket_url=event.get("xceed_ticket_url"),
            banner_image=event.get("banner_image"),
            gallery_visible=event.get("gallery_visible", False),
            aftermovie_visible=event.get("aftermovie_visible", False),
            status=event["status"]
        ))
    
    return events

@app.get("/api/events/next")
async def get_next_event():
    """Get the next upcoming event"""
    db = get_database()
    from datetime import datetime
    
    # Find the next event that hasn't happened yet
    next_event = await db.events.find_one(
        {
            "event_date": {"$gte": datetime.now()},
            "status": "published"
        },
        sort=[("event_date", 1)]
    )
    
    if not next_event:
        # If no upcoming event, return the most recent one
        next_event = await db.events.find_one(
            sort=[("event_date", -1)]
        )
    
    if not next_event:
        # If still no event found, return a mock event
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
                    {"name": "MC Latino", "role": "Host"},
                    {"name": "DJ Perreo", "role": "VIP Lounge"}
                ],
                "ticket_categories": [
                    {"name": "Standard", "price": 20.0, "available": True},
                    {"name": "VIP", "price": 40.0, "available": True}
                ],
                "xceed_ticket_url": "https://xceed.me/invasion-latina",  # Example XCEED link
                "status": "published"
            }
        }
    
    return {
        "event": {
            "id": str(next_event["_id"]),
            "name": next_event["name"],
            "description": next_event["description"],
            "event_date": next_event["event_date"].isoformat() if isinstance(next_event["event_date"], datetime) else next_event["event_date"],
            "venue_name": next_event["venue_name"],
            "venue_address": next_event["venue_address"],
            "lineup": next_event.get("lineup", []),
            "ticket_categories": next_event.get("ticket_categories", []),
            "xceed_ticket_url": next_event.get("xceed_ticket_url"),
            "status": next_event["status"]
        }
    }

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

# ============ DJ REQUEST ENDPOINTS ============

@app.post("/api/dj/request-song")
async def request_song(
    song_data: Dict[str, str] = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """Request a song"""
    db = get_database()
    
    # Validate required fields
    if not song_data.get("song_title") or not song_data.get("artist_name"):
        raise HTTPException(status_code=400, detail="Song title and artist name are required")
    
    # Get current or upcoming event (for testing, we don't require a "live" event)
    current_event = await db.events.find_one(
        {"status": {"$in": ["live", "upcoming"]}},
        sort=[("date", -1)]
    )
    
    # If no event found, create a default event context
    event_id = str(current_event["_id"]) if current_event else "default_event"
    
    # Normalize song title and artist for comparison (case-insensitive)
    song_title_normalized = song_data["song_title"].strip().lower()
    artist_name_normalized = song_data["artist_name"].strip().lower()
    
    # Check for duplicate requests in the same event
    user_id = str(current_user["_id"])
    
    # Find existing request with same song (case-insensitive) in pending status for this event
    existing = await db.song_requests.find_one({
        "song_title_normalized": song_title_normalized,
        "artist_name_normalized": artist_name_normalized,
        "event_id": event_id,
        "status": "pending"
    })
    
    if existing:
        # Song already requested - check if user already requested it
        if user_id in existing.get("requesters", []):
            raise HTTPException(status_code=400, detail="Vous avez déjà demandé cette chanson")
        
        # Increment times_requested and add user as requester and voter
        new_count = existing.get("times_requested", 1) + 1
        await db.song_requests.update_one(
            {"_id": existing["_id"]},
            {
                "$inc": {"times_requested": 1, "votes": 1},
                "$push": {"requesters": user_id, "voters": user_id}
            }
        )
        
        return {
            "message": f"Demande ajoutée! '{existing['song_title']}' a maintenant {new_count} demandes! 🔥",
            "request_id": str(existing["_id"]),
            "song": f"{existing['song_title']} by {existing['artist_name']}",
            "times_requested": new_count
        }
    
    # Create new song request
    request_dict = {
        "user_id": str(current_user["_id"]),
        "user_name": song_data.get("user_name", current_user.get("name", "Anonyme")),
        "event_id": event_id,
        "song_title": song_data["song_title"].strip(),
        "artist_name": song_data["artist_name"].strip(),
        "song_title_normalized": song_title_normalized,
        "artist_name_normalized": artist_name_normalized,
        "requested_at": datetime.utcnow(),
        "votes": 1,
        "voters": [user_id],
        "requesters": [user_id],
        "times_requested": 1,
        "status": "pending"
    }
    
    result = await db.song_requests.insert_one(request_dict)
    
    return {
        "message": "Demande envoyée!",
        "request_id": str(result.inserted_id),
        "song": f"{song_data['song_title']} by {song_data['artist_name']}",
        "times_requested": 1
    }

@app.get("/api/dj/requests")
async def get_song_requests(
    status: Optional[str] = Query(None),
    event_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get song requests with optional filters"""
    db = get_database()
    
    # Build query
    query = {}
    if status:
        query["status"] = status
    if event_id:
        query["event_id"] = event_id
    
    requests = []
    async for request in db.song_requests.find(query).sort("requested_at", -1).limit(100):
        user_id = str(current_user["_id"])
        requests.append({
            "id": str(request["_id"]),
            "song_title": request["song_title"],
            "artist_name": request["artist_name"],
            "user_name": request["user_name"],
            "votes": request["votes"],
            "times_requested": request.get("times_requested", 1),
            "requested_at": request["requested_at"],
            "status": request["status"],
            "rejection_reason": request.get("rejection_reason"),
            "rejection_label": request.get("rejection_label"),
            "event_id": request.get("event_id"),
            "can_vote": user_id not in request.get("voters", []),
            "can_request": user_id not in request.get("requesters", [])
        })
    
    return requests


@app.get("/api/dj/admin/all-requests")
async def get_all_song_requests_admin(
    current_user: dict = Depends(get_current_admin)
):
    """Get all song requests with stats grouped by event (Admin only)"""
    db = get_database()
    
    # Get all events
    events = []
    async for event in db.events.find().sort("date", -1):
        event_id = str(event["_id"])
        
        # Count requests for this event
        pending_count = await db.song_requests.count_documents({"event_id": event_id, "status": "pending"})
        played_count = await db.song_requests.count_documents({"event_id": event_id, "status": "played"})
        rejected_count = await db.song_requests.count_documents({"event_id": event_id, "status": "rejected"})
        
        events.append({
            "id": event_id,
            "name": event.get("name", "Événement"),
            "date": event.get("date"),
            "pending": pending_count,
            "played": played_count,
            "rejected": rejected_count,
            "total": pending_count + played_count + rejected_count
        })
    
    # Also count requests without event (default_event)
    default_pending = await db.song_requests.count_documents({"event_id": "default_event", "status": "pending"})
    default_played = await db.song_requests.count_documents({"event_id": "default_event", "status": "played"})
    default_rejected = await db.song_requests.count_documents({"event_id": "default_event", "status": "rejected"})
    
    if default_pending + default_played + default_rejected > 0:
        events.insert(0, {
            "id": "default_event",
            "name": "Événement actuel",
            "date": None,
            "pending": default_pending,
            "played": default_played,
            "rejected": default_rejected,
            "total": default_pending + default_played + default_rejected
        })
    
    return events


@app.get("/api/dj/my-requests")
async def get_my_song_requests(current_user: dict = Depends(get_current_user)):
    """Get current user's song requests with their status"""
    db = get_database()
    user_id = str(current_user["_id"])
    
    requests = []
    async for request in db.song_requests.find(
        {"requesters": user_id}
    ).sort("requested_at", -1).limit(20):
        requests.append({
            "id": str(request["_id"]),
            "song_title": request["song_title"],
            "artist_name": request["artist_name"],
            "status": request["status"],
            "rejection_reason": request.get("rejection_label", request.get("rejection_reason")),
            "requested_at": request["requested_at"],
            "votes": request["votes"],
        })
    
    return requests


@app.post("/api/dj/vote/{request_id}")
async def vote_for_song(
    request_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Vote for a song request"""
    db = get_database()
    
    try:
        request = await db.song_requests.find_one({"_id": ObjectId(request_id)})
        if not request:
            raise HTTPException(status_code=404, detail="Song request not found")
        
        if request["status"] != "pending":
            raise HTTPException(status_code=400, detail="Cannot vote on this request")
        
        user_id = str(current_user["_id"])
        if user_id in request.get("voters", []):
            raise HTTPException(status_code=400, detail="You have already voted for this song")
        
        # Add vote
        await db.song_requests.update_one(
            {"_id": ObjectId(request_id)},
            {
                "$inc": {"votes": 1},
                "$push": {"voters": user_id}
            }
        )
        
        return {"message": "Vote added successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid request ID")

@app.post("/api/dj/admin/update-request/{request_id}")
async def update_song_request(
    request_id: str,
    update_data: Dict[str, str] = Body(...),
    current_user: dict = Depends(get_current_admin)
):
    """Update song request status (DJ/Admin only)"""
    db = get_database()
    
    try:
        status = update_data.get("status")
        rejection_reason = update_data.get("rejection_reason")
        rejection_label = update_data.get("rejection_label")
        
        update_dict = {"status": status}
        if status == "played":
            update_dict["played_at"] = datetime.utcnow()
        elif status == "rejected":
            if rejection_reason:
                update_dict["rejection_reason"] = rejection_reason
            if rejection_label:
                update_dict["rejection_label"] = rejection_label
        
        result = await db.song_requests.update_one(
            {"_id": ObjectId(request_id)},
            {"$set": update_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Song request not found")
        
        return {"message": f"Request {status} successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid request ID")

# ============ MERCHANDISE ENDPOINTS ============

@app.get("/api/products")
async def get_products(category: Optional[str] = Query(None)):
    """Get all products, optionally filtered by category"""
    db = get_database()
    
    query = {}
    if category:
        query["category"] = category
    
    products = []
    async for product in db.products.find(query):
        products.append({
            "id": str(product["_id"]),
            "name": product["name"],
            "description": product["description"],
            "category": product["category"],
            "price": product["price"],
            "sizes_available": product.get("sizes_available", []),
            "images": product.get("images", []),
            "stock_quantity": product["stock_quantity"]
        })
    
    return products

@app.post("/api/orders")
async def create_order(
    order_data: Dict[str, Any] = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """Create merchandise order"""
    db = get_database()
    
    # Validate products and calculate total
    total_price = 0
    order_items = []
    
    for item in order_data["items"]:
        product = await db.products.find_one({"_id": ObjectId(item["product_id"])})
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item['product_id']} not found")
        
        if product["stock_quantity"] < item["quantity"]:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product['name']}")
        
        subtotal = product["price"] * item["quantity"]
        total_price += subtotal
        
        order_items.append({
            "product_id": item["product_id"],
            "product_name": product["name"],
            "quantity": item["quantity"],
            "size": item.get("size"),
            "price": product["price"],
            "subtotal": subtotal
        })
    
    # Process payment (MOCKED)
    try:
        payment_result = await stripe_service.process_payment(
            amount=int(total_price * 100),
            currency="eur",
            payment_method_id=order_data["payment_method_id"],
            customer_email=current_user["email"]
        )
        
        if not payment_result["success"]:
            raise HTTPException(status_code=400, detail="Payment failed")
        
    except Exception as e:
        logger.error(f"Payment processing error: {str(e)}")
        raise HTTPException(status_code=400, detail="Payment processing failed")
    
    # Create order
    order_dict = {
        "user_id": str(current_user["_id"]),
        "items": order_items,
        "total_price": total_price,
        "delivery_method": order_data["delivery_method"],
        "delivery_address": order_data.get("delivery_address"),
        "status": "confirmed",
        "stripe_payment_intent_id": payment_result.get("payment_id", "mock_payment_123"),
        "customer_name": current_user["name"],
        "customer_email": current_user["email"],
        "created_at": datetime.utcnow(),
        "confirmed_at": datetime.utcnow()
    }
    
    result = await db.orders.insert_one(order_dict)
    
    # Update stock quantities
    for item in order_data["items"]:
        await db.products.update_one(
            {"_id": ObjectId(item["product_id"])},
            {"$inc": {"stock_quantity": -item["quantity"]}}
        )
    
    return {
        "order_id": str(result.inserted_id),
        "total_price": total_price,
        "status": "confirmed",
        "message": "Order placed successfully"
    }

@app.get("/api/orders/my-orders")
async def get_my_orders(current_user: dict = Depends(get_current_user)):
    """Get current user's orders"""
    db = get_database()
    
    orders = []
    async for order in db.orders.find({"user_id": str(current_user["_id"])}).sort("created_at", -1):
        orders.append({
            "id": str(order["_id"]),
            "items": order["items"],
            "total_price": order["total_price"],
            "delivery_method": order["delivery_method"],
            "status": order["status"],
            "created_at": order["created_at"],
            "confirmed_at": order.get("confirmed_at"),
            "shipped_at": order.get("shipped_at"),
            "delivered_at": order.get("delivered_at")
        })
    
    return orders

# ============ SOCIAL FEATURES ============

@app.post("/api/social/add-friend")
async def add_friend(
    friend_data: Dict[str, str] = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """Add a friend by email"""
    db = get_database()
    
    friend_email = friend_data.get("email")
    if not friend_email:
        raise HTTPException(status_code=400, detail="Friend email required")
    
    if friend_email == current_user["email"]:
        raise HTTPException(status_code=400, detail="Cannot add yourself as friend")
    
    # Find friend user
    friend_user = await db.users.find_one({"email": friend_email})
    if not friend_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    friend_id = str(friend_user["_id"])
    current_user_id = str(current_user["_id"])
    
    # Check if already friends
    if friend_id in current_user.get("friends", []):
        raise HTTPException(status_code=400, detail="Already friends with this user")
    
    # Add to both users' friend lists
    await db.users.update_one(
        {"_id": ObjectId(current_user_id)},
        {"$push": {"friends": friend_id}}
    )
    
    await db.users.update_one(
        {"_id": ObjectId(friend_id)},
        {"$push": {"friends": current_user_id}}
    )
    
    return {
        "message": f"Added {friend_user['name']} as friend",
        "friend_name": friend_user["name"]
    }

@app.get("/api/social/friends")
async def get_friends(current_user: dict = Depends(get_current_user)):
    """Get user's friends list"""
    db = get_database()
    
    friend_ids = current_user.get("friends", [])
    if not friend_ids:
        return []
    
    friends = []
    async for friend in db.users.find({"_id": {"$in": [ObjectId(fid) for fid in friend_ids]}}):
        friends.append({
            "id": str(friend["_id"]),
            "name": friend["name"],
            "email": friend["email"],
            "loyalty_points": friend.get("loyalty_points", 0),
            "badges": friend.get("badges", [])
        })
    
    return friends

@app.get("/api/social/leaderboard")
async def get_leaderboard():
    """Get loyalty points leaderboard"""
    db = get_database()
    
    leaderboard = []
    async for user in db.users.find({}).sort("loyalty_points", -1).limit(50):
        leaderboard.append({
            "name": user["name"],
            "loyalty_points": user.get("loyalty_points", 0),
            "badges": user.get("badges", [])
        })
    
    return leaderboard

# ============ ADMIN ENDPOINTS ============

@app.get("/api/admin/dashboard")
async def admin_dashboard(current_user: dict = Depends(get_current_admin)):
    """Get admin dashboard data"""
    db = get_database()
    
    # Get statistics
    total_users = await db.users.count_documents({})
    total_tickets = await db.tickets.count_documents({})
    total_orders = await db.orders.count_documents({})
    pending_requests = await db.song_requests.count_documents({"status": "pending"})
    
    # Get recent activity
    recent_users = []
    async for user in db.users.find({}).sort("created_at", -1).limit(10):
        recent_users.append({
            "name": user["name"],
            "email": user["email"],
            "created_at": user["created_at"]
        })
    
    return {
        "stats": {
            "total_users": total_users,
            "total_tickets": total_tickets,
            "total_orders": total_orders,
            "pending_requests": pending_requests
        },
        "recent_users": recent_users
    }

# Note: Additional endpoints for media upload, notifications, etc. can be added as needed


# ============ LOYALTY PROGRAM ENDPOINTS ============

@app.get("/api/loyalty/my-points")
async def get_my_loyalty_points(current_user: dict = Depends(get_current_user)):
    """Get current user's loyalty points and stats"""
    db = get_database()
    
    user = await db.users.find_one({"_id": ObjectId(current_user["_id"])})
    
    # Get check-in history
    check_ins = []
    async for check_in in db.loyalty_checkins.find(
        {"user_id": str(current_user["_id"])}
    ).sort("checked_in_at", -1).limit(10):
        event = await db.events.find_one({"_id": ObjectId(check_in["event_id"])})
        check_ins.append({
            "event_name": event["name"] if event else "Unknown Event",
            "points": check_in["points_earned"],
            "date": check_in["checked_in_at"]
        })
    
    # Calculate progress to next reward (25 Invasion Coins for a free guest)
    points = user.get("loyalty_points", 0)
    points_to_reward = 25
    progress_percentage = min((points / points_to_reward) * 100, 100)
    rewards_earned = points // points_to_reward
    
    return {
        "points": points,
        "check_ins_count": await db.loyalty_checkins.count_documents({"user_id": str(current_user["_id"])}),
        "progress_to_next_reward": progress_percentage,
        "points_needed": max(0, points_to_reward - (points % points_to_reward)),
        "rewards_earned": rewards_earned,
        "recent_check_ins": check_ins
    }

@app.get("/api/loyalty/rewards")
async def get_my_rewards(current_user: dict = Depends(get_current_user)):
    """Get user's available and redeemed rewards"""
    db = get_database()
    
    rewards = []
    async for reward in db.loyalty_rewards.find(
        {"user_id": str(current_user["_id"])}
    ).sort("created_at", -1):
        rewards.append({
            "id": str(reward["_id"]),
            "reward_type": reward["reward_type"],
            "points_spent": reward["points_spent"],
            "code": reward["code"],
            "status": reward["status"],
            "created_at": reward["created_at"],
            "redeemed_at": reward.get("redeemed_at"),
            "expires_at": reward.get("expires_at")
        })
    
    return rewards

@app.post("/api/loyalty/claim-reward")
async def claim_reward(current_user: dict = Depends(get_current_user)):
    """Claim a free entry reward (25 Invasion Coins)"""
    db = get_database()
    
    user = await db.users.find_one({"_id": ObjectId(current_user["_id"])})
    points = user.get("loyalty_points", 0)
    
    if points < 25:
        raise HTTPException(status_code=400, detail=f"Not enough Invasion Coins. You have {points}, need 25.")
    
    # Generate unique reward code
    import random
    import string
    code = 'IL-' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    
    # Create reward
    reward = {
        "user_id": str(current_user["_id"]),
        "reward_type": "free_entry",
        "points_required": 25,
        "points_spent": 25,
        "status": "pending",
        "code": code,
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(days=90)  # 90 days to use
    }
    
    result = await db.loyalty_rewards.insert_one(reward)
    
    # Deduct points
    await db.users.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$inc": {"loyalty_points": -25}}
    )
    
    # Log transaction
    await db.loyalty_transactions.insert_one({
        "user_id": str(current_user["_id"]),
        "transaction_type": "spent",
        "points": -25,
        "description": "Claimed free entry reward",
        "related_reward_id": str(result.inserted_id),
        "created_at": datetime.utcnow()
    })
    
    return {
        "message": "Reward claimed successfully!",
        "code": code,
        "points_remaining": points - 25
    }

@app.get("/api/loyalty/user-qr/{user_id}")
async def get_user_qr_code(user_id: str):
    """Get QR code data for a user (for check-in)"""
    import json
    
    qr_data = {
        "type": "loyalty_checkin",
        "user_id": user_id,
        "timestamp": datetime.utcnow().isoformat(),
        "app": "InvasionLatina"
    }
    
    return {"qr_code_data": json.dumps(qr_data)}

@app.post("/api/loyalty/admin/check-in")
async def admin_check_in_user(
    qr_code_data: str,
    event_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Admin/Staff: Check in a user and award points"""
    import json
    
    # Verify admin
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    db = get_database()
    
    # Parse QR code
    try:
        qr_info = json.loads(qr_code_data)
        user_id = qr_info["user_id"]
    except:
        raise HTTPException(status_code=400, detail="Invalid QR code")
    
    # Check if already checked in for this event
    existing = await db.loyalty_checkins.find_one({
        "user_id": user_id,
        "event_id": event_id
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="User already checked in for this event")
    
    # Create check-in
    check_in = {
        "user_id": user_id,
        "event_id": event_id,
        "points_earned": 5,
        "checked_in_at": datetime.utcnow(),
        "checked_in_by": str(current_user["_id"]),
        "qr_code_scanned": qr_code_data
    }
    
    await db.loyalty_checkins.insert_one(check_in)
    
    # Award points
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$inc": {"loyalty_points": 5}}
    )
    
    # Log transaction
    await db.loyalty_transactions.insert_one({
        "user_id": user_id,
        "transaction_type": "earned",
        "points": 5,
        "description": f"Check-in at event",
        "related_event_id": event_id,
        "created_at": datetime.utcnow()
    })
    
    # Get updated points
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    
    return {
        "message": "Check-in successful! +5 points",
        "points_earned": 5,
        "total_points": user.get("loyalty_points", 5),
        "user_name": user["name"]
    }



# ============ VIP BOOKING ENDPOINTS ============

# WhatsApp notification config
WHATSAPP_ADMIN_NUMBER = "+32478814497"

async def send_whatsapp_notification(message: str):
    """Send WhatsApp notification to admin"""
    import urllib.parse
    import httpx
    
    try:
        # Using CallMeBot API (free WhatsApp notifications)
        # First time: send "I allow callmebot to send me messages" to +34 644 71 81 99
        encoded_message = urllib.parse.quote(message)
        url = f"https://api.callmebot.com/whatsapp.php?phone={WHATSAPP_ADMIN_NUMBER}&text={encoded_message}&apikey=YOUR_API_KEY"
        
        # For now, we'll log the message - you need to activate CallMeBot first
        print(f"📱 WhatsApp notification would be sent to {WHATSAPP_ADMIN_NUMBER}:")
        print(f"   {message}")
        
        # Uncomment this when you have the API key:
        # async with httpx.AsyncClient() as client:
        #     await client.get(url, timeout=10)
        
    except Exception as e:
        print(f"WhatsApp notification error: {e}")

@app.post("/api/vip/book")
async def create_vip_booking(
    booking_data: Dict[str, Any] = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """Create a VIP table booking request"""
    db = get_database()
    
    event_id = booking_data.get("event_id")
    zone = booking_data.get("zone")
    package = booking_data.get("package")
    guest_count = booking_data.get("guest_count", 6)
    bottle_preferences = booking_data.get("bottle_preferences", "")
    special_requests = booking_data.get("special_requests", "")
    total_price = booking_data.get("total_price", 0)
    customer_name = booking_data.get("customer_name", "")
    customer_email = booking_data.get("customer_email", "")
    customer_phone = booking_data.get("customer_phone", "")
    
    if not event_id or not zone or not package:
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    # Verify event exists
    event = await db.events.find_one({"_id": ObjectId(event_id)})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Create booking
    booking = {
        "user_id": str(current_user["_id"]),
        "event_id": event_id,
        "zone": zone,
        "package": package,
        "guest_count": guest_count,
        "bottle_preferences": bottle_preferences,
        "special_requests": special_requests,
        "total_price": total_price,
        "status": "pending",
        "customer_name": customer_name,
        "customer_email": customer_email,
        "customer_phone": customer_phone,
        "submitted_at": datetime.utcnow()
    }
    
    result = await db.vip_bookings.insert_one(booking)
    
    # Send WhatsApp notification to admin
    notification_message = f"""🍾 NOUVELLE RÉSERVATION TABLE!

📍 Salle: {zone}
📦 Table: {package}
👥 Personnes: {guest_count}
💰 Prix: {total_price}€

👤 Client: {customer_name}
📧 Email: {customer_email}
📱 Tél: {customer_phone}

🎉 Événement: {event['name']}
📅 Date: {event['event_date'].strftime('%d/%m/%Y') if hasattr(event['event_date'], 'strftime') else event['event_date']}

💬 Demandes spéciales: {special_requests or 'Aucune'}"""
    
    await send_whatsapp_notification(notification_message)
    
    return {
        "message": "VIP booking request submitted successfully",
        "booking_id": str(result.inserted_id),
        "status": "pending"
    }

@app.get("/api/vip/my-bookings")
async def get_my_vip_bookings(current_user: dict = Depends(get_current_user)):
    """Get current user's VIP bookings"""
    db = get_database()
    
    bookings = []
    async for booking in db.vip_bookings.find(
        {"user_id": str(current_user["_id"])}
    ).sort("submitted_at", -1):
        event = await db.events.find_one({"_id": ObjectId(booking["event_id"])})
        bookings.append({
            "id": str(booking["_id"]),
            "event_name": event["name"] if event else "Unknown Event",
            "event_date": event["event_date"] if event else None,
            "zone": booking["zone"],
            "package": booking["package"],
            "guest_count": booking["guest_count"],
            "total_price": booking["total_price"],
            "status": booking["status"],
            "submitted_at": booking["submitted_at"]
        })
    
    return bookings


@app.get("/api/admin/vip-bookings")
async def admin_get_all_bookings(current_user: dict = Depends(get_current_admin)):
    """Admin: Get all VIP bookings"""
    db = get_database()
    
    bookings = []
    async for booking in db.vip_bookings.find().sort("submitted_at", -1):
        event = await db.events.find_one({"_id": ObjectId(booking["event_id"])})
        bookings.append({
            "id": str(booking["_id"]),
            "customer_name": booking.get("customer_name", ""),
            "customer_email": booking.get("customer_email", ""),
            "customer_phone": booking.get("customer_phone", ""),
            "event_name": event["name"] if event else "Unknown Event",
            "event_date": event["event_date"].isoformat() if event and hasattr(event.get("event_date"), 'isoformat') else str(event.get("event_date")) if event else None,
            "zone": booking["zone"],
            "package": booking["package"],
            "guest_count": booking["guest_count"],
            "total_price": booking["total_price"],
            "special_requests": booking.get("special_requests", ""),
            "status": booking["status"],
            "submitted_at": booking["submitted_at"].isoformat() if hasattr(booking["submitted_at"], 'isoformat') else str(booking["submitted_at"])
        })
    
    return bookings


@app.delete("/api/vip/bookings/{booking_id}")
async def cancel_vip_booking(
    booking_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Cancel a user's own VIP booking"""
    db = get_database()
    
    try:
        # Find the booking and verify it belongs to this user
        booking = await db.vip_bookings.find_one({"_id": ObjectId(booking_id)})
        
        if not booking:
            raise HTTPException(status_code=404, detail="Réservation non trouvée")
        
        # Verify ownership - check by email
        if booking.get("customer_email") != current_user.get("email"):
            raise HTTPException(status_code=403, detail="Vous ne pouvez annuler que vos propres réservations")
        
        # Check if already cancelled
        if booking.get("status") == "cancelled":
            raise HTTPException(status_code=400, detail="Cette réservation est déjà annulée")
        
        # Update status to cancelled
        result = await db.vip_bookings.update_one(
            {"_id": ObjectId(booking_id)},
            {"$set": {
                "status": "cancelled",
                "cancelled_at": datetime.utcnow()
            }}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=500, detail="Erreur lors de l'annulation")
        
        return {"message": "Réservation annulée avec succès"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling booking: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@app.put("/api/admin/vip-bookings/{booking_id}")
async def admin_update_booking(
    booking_id: str,
    update_data: Dict[str, Any] = Body(...),
    current_user: dict = Depends(get_current_admin)
):
    """Admin: Update a VIP booking status"""
    db = get_database()
    
    try:
        result = await db.vip_bookings.update_one(
            {"_id": ObjectId(booking_id)},
            {"$set": {
                "status": update_data.get("status", "pending"),
                "updated_at": datetime.utcnow()
            }}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Réservation non trouvée")
        
        return {"message": "Réservation mise à jour avec succès"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))



# ============ MEDIA GALLERY ENDPOINTS ============

@app.get("/api/media/galleries")
async def get_galleries():
    """Get all photo galleries (grouped by event) - only visible ones"""
    db = get_database()
    
    galleries = []
    
    # Get events that have gallery_visible = true
    async for event in db.events.find({"gallery_visible": True}).sort("event_date", -1):
        photo_count = await db.photos.count_documents({"event_id": str(event["_id"])})
        
        # Get cover image (first photo or event banner)
        cover_photo = await db.photos.find_one({"event_id": str(event["_id"])})
        cover_image = cover_photo["url"] if cover_photo else event.get("banner_image")
        
        galleries.append({
            "id": str(event["_id"]),
            "name": event["name"],
            "event_date": event["event_date"].isoformat() if hasattr(event["event_date"], 'isoformat') else event["event_date"],
            "photo_count": photo_count,
            "cover_image": cover_image
        })
    
    return galleries

@app.get("/api/media/gallery/{event_id}")
async def get_gallery(event_id: str):
    """Get photos for a specific event"""
    db = get_database()
    
    try:
        event = await db.events.find_one({"_id": ObjectId(event_id)})
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        photos = []
        async for photo in db.photos.find({"event_id": event_id}).sort("uploaded_at", -1):
            photos.append({
                "id": str(photo["_id"]),
                "url": photo["url"],
                "thumbnail_url": photo.get("thumbnail_url", photo["url"]),
                "tags": photo.get("tags", []),
                "uploaded_at": photo["uploaded_at"]
            })
        
        return {
            "event_name": event["name"],
            "event_date": event["event_date"],
            "photos": photos
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid event ID")

@app.post("/api/media/photos/{photo_id}/tag")
async def tag_photo(
    photo_id: str,
    tag_data: Dict[str, str] = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """Tag yourself in a photo"""
    db = get_database()
    
    user_id = tag_data.get("user_id") or str(current_user["_id"])
    
    try:
        photo = await db.photos.find_one({"_id": ObjectId(photo_id)})
        if not photo:
            raise HTTPException(status_code=404, detail="Photo not found")
        
        # Check if already tagged
        if user_id in photo.get("tags", []):
            raise HTTPException(status_code=400, detail="Déjà tagué sur cette photo")
        
        # Add tag
        await db.photos.update_one(
            {"_id": ObjectId(photo_id)},
            {"$push": {"tags": user_id}}
        )
        
        return {"message": "Tag ajouté avec succès!"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid photo ID")

@app.get("/api/media/my-tagged-photos")
async def get_my_tagged_photos(current_user: dict = Depends(get_current_user)):
    """Get all photos where user is tagged"""
    db = get_database()
    
    user_id = str(current_user["_id"])
    photos = []
    
    async for photo in db.photos.find({"tags": user_id}).sort("uploaded_at", -1):
        event = await db.events.find_one({"_id": ObjectId(photo["event_id"])})
        photos.append({
            "id": str(photo["_id"]),
            "url": photo["url"],
            "thumbnail_url": photo.get("thumbnail_url", photo["url"]),
            "event_name": event["name"] if event else "Unknown Event",
            "event_date": event["event_date"] if event else None,
            "uploaded_at": photo["uploaded_at"]
        })
    
    return photos


# ============ AFTERMOVIES ENDPOINTS ============

@app.get("/api/media/aftermovies")
async def get_aftermovies():
    """Get all aftermovies"""
    db = get_database()
    
    videos = []
    async for video in db.aftermovies.find().sort("event_date", -1):
        videos.append({
            "id": str(video["_id"]),
            "title": video["title"],
            "event_date": video["event_date"].isoformat() if hasattr(video["event_date"], 'isoformat') else video["event_date"],
            "thumbnail_url": video["thumbnail_url"],
            "video_url": video["video_url"],
            "duration": video.get("duration", "0:00"),
            "views": video.get("views", 0)
        })
    
    return videos


# ============ LOYALTY SCANNER ENDPOINT (FOR ADMIN APP) ============

@app.post("/api/loyalty/admin/scan-checkin")
async def admin_scan_checkin(
    scan_data: Dict[str, str] = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """Admin/Staff: Scan QR code to check-in user and award points"""
    import json
    
    # Verify admin/staff role
    if current_user.get("role") not in ["admin", "staff"]:
        raise HTTPException(status_code=403, detail="Accès staff/admin requis")
    
    db = get_database()
    
    qr_code_data = scan_data.get("qr_code_data")
    event_id = scan_data.get("event_id")
    
    if not qr_code_data:
        raise HTTPException(status_code=400, detail="QR code manquant")
    
    # Parse QR code
    try:
        qr_info = json.loads(qr_code_data)
        if qr_info.get("type") != "loyalty_checkin":
            raise HTTPException(status_code=400, detail="QR code invalide")
        user_id = qr_info["user_id"]
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Format QR code invalide")
    except KeyError:
        raise HTTPException(status_code=400, detail="QR code incomplet")
    
    # Get current/latest event if not specified
    if event_id == "current" or not event_id:
        current_event = await db.events.find_one(
            {"status": {"$in": ["live", "published", "upcoming"]}},
            sort=[("event_date", -1)]
        )
        if not current_event:
            raise HTTPException(status_code=404, detail="Aucun événement actif")
        event_id = str(current_event["_id"])
    
    # Check if user exists
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    except:
        raise HTTPException(status_code=400, detail="ID utilisateur invalide")
    
    # Check if already checked in for this event
    existing = await db.loyalty_checkins.find_one({
        "user_id": user_id,
        "event_id": event_id
    })
    
    if existing:
        return {
            "success": False,
            "message": f"{user['name']} est déjà enregistré pour cet événement",
            "user_name": user["name"],
            "already_checked_in": True
        }
    
    # Create check-in
    points_earned = 5
    check_in = {
        "user_id": user_id,
        "event_id": event_id,
        "points_earned": points_earned,
        "checked_in_at": datetime.utcnow(),
        "checked_in_by": str(current_user["_id"]),
        "qr_code_scanned": qr_code_data
    }
    
    await db.loyalty_checkins.insert_one(check_in)
    
    # Award points
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$inc": {"loyalty_points": points_earned}}
    )
    
    # Log transaction
    await db.loyalty_transactions.insert_one({
        "user_id": user_id,
        "transaction_type": "earned",
        "points": points_earned,
        "description": "Check-in événement",
        "related_event_id": event_id,
        "created_at": datetime.utcnow()
    })
    
    # Get updated points
    updated_user = await db.users.find_one({"_id": ObjectId(user_id)})
    
    return {
        "success": True,
        "message": f"Check-in réussi! +{points_earned} points pour {user['name']}",
        "user_name": user["name"],
        "points_earned": points_earned,
        "total_points": updated_user.get("loyalty_points", points_earned)
    }


# ============ DJS MANAGEMENT ENDPOINTS ============

# Default DJs data
DEFAULT_DJS = [
    {
        "id": "1",
        "name": "DJ GIZMO",
        "type": "dj",
        "instagram_url": "https://www.instagram.com/gizmodj/",
        "photo_url": None,
        "is_resident": True,
        "order": 1
    },
    {
        "id": "2",
        "name": "DJ DNK",
        "type": "dj",
        "instagram_url": "https://www.instagram.com/deejaydnk/",
        "photo_url": None,
        "is_resident": True,
        "order": 2
    },
    {
        "id": "3",
        "name": "DJ CRUZ",
        "type": "dj",
        "instagram_url": "https://www.instagram.com/djaycruz/",
        "photo_url": None,
        "is_resident": True,
        "order": 3
    },
    {
        "id": "4",
        "name": "DJ DANIEL MURILLO",
        "type": "dj",
        "instagram_url": "https://www.instagram.com/danielmurillodj/",
        "photo_url": None,
        "is_resident": True,
        "order": 4
    },
    {
        "id": "5",
        "name": "DJ SUNCEE",
        "type": "dj",
        "instagram_url": "https://www.instagram.com/deejaysuncee/",
        "photo_url": None,
        "is_resident": True,
        "order": 5
    },
    {
        "id": "6",
        "name": "DJ SAMO",
        "type": "dj",
        "instagram_url": "https://www.instagram.com/djsamobe/",
        "photo_url": None,
        "is_resident": True,
        "order": 6
    },
    {
        "id": "7",
        "name": "DJ MABOY",
        "type": "dj",
        "instagram_url": "https://www.instagram.com/dj.maboy/",
        "photo_url": None,
        "is_resident": True,
        "order": 7
    },
    {
        "id": "8",
        "name": "MC VELASQUEZ",
        "type": "mc",
        "instagram_url": "https://www.instagram.com/santiagovelaskz/",
        "photo_url": None,
        "is_resident": True,
        "order": 8
    }
]

@app.get("/api/djs")
async def get_all_djs():
    """Get all DJs and MCs"""
    db = get_database()
    
    djs_list = []
    async for dj in db.djs.find().sort("order", 1):
        djs_list.append({
            "id": str(dj["_id"]),
            "name": dj["name"],
            "type": dj.get("type", "dj"),
            "instagram_url": dj.get("instagram_url"),
            "photo_url": dj.get("photo_url"),
            "is_resident": dj.get("is_resident", True),
            "order": dj.get("order", 0)
        })
    
    # Return default DJs if none in database
    if not djs_list:
        return DEFAULT_DJS
    
    return djs_list

@app.get("/api/djs/event/{event_id}")
async def get_event_djs(event_id: str):
    """Get DJs assigned to a specific event"""
    db = get_database()
    
    try:
        event = await db.events.find_one({"_id": ObjectId(event_id)})
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        dj_ids = event.get("dj_ids", [])
        
        if not dj_ids:
            # Return all resident DJs if no specific DJs assigned
            return DEFAULT_DJS
        
        djs_list = []
        for dj_id in dj_ids:
            dj = await db.djs.find_one({"_id": ObjectId(dj_id)})
            if dj:
                djs_list.append({
                    "id": str(dj["_id"]),
                    "name": dj["name"],
                    "type": dj.get("type", "dj"),
                    "instagram_url": dj.get("instagram_url"),
                    "photo_url": dj.get("photo_url"),
                    "is_resident": dj.get("is_resident", True)
                })
        
        return djs_list
        
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid event ID")

@app.post("/api/admin/djs")
async def create_dj(
    dj_data: Dict[str, Any] = Body(...),
    current_user: dict = Depends(get_current_admin)
):
    """Admin: Create a new DJ"""
    db = get_database()
    
    new_dj = {
        "name": dj_data["name"],
        "type": dj_data.get("type", "dj"),
        "instagram_url": dj_data.get("instagram_url"),
        "photo_url": dj_data.get("photo_url"),
        "is_resident": dj_data.get("is_resident", True),
        "order": dj_data.get("order", 0),
        "created_at": datetime.utcnow()
    }
    
    result = await db.djs.insert_one(new_dj)
    
    return {
        "id": str(result.inserted_id),
        "message": "DJ créé avec succès"
    }

@app.put("/api/admin/djs/{dj_id}")
async def update_dj(
    dj_id: str,
    dj_data: Dict[str, Any] = Body(...),
    current_user: dict = Depends(get_current_admin)
):
    """Admin: Update a DJ"""
    db = get_database()
    
    try:
        update_fields = {}
        for field in ["name", "type", "instagram_url", "photo_url", "is_resident", "order"]:
            if field in dj_data:
                update_fields[field] = dj_data[field]
        
        update_fields["updated_at"] = datetime.utcnow()
        
        result = await db.djs.update_one(
            {"_id": ObjectId(dj_id)},
            {"$set": update_fields}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="DJ not found")
        
        return {"message": "DJ mis à jour avec succès"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/admin/events/{event_id}/assign-djs")
async def assign_djs_to_event(
    event_id: str,
    data: Dict[str, List[str]] = Body(...),
    current_user: dict = Depends(get_current_admin)
):
    """Admin: Assign DJs to an event"""
    db = get_database()
    
    dj_ids = data.get("dj_ids", [])
    
    try:
        result = await db.events.update_one(
            {"_id": ObjectId(event_id)},
            {"$set": {"dj_ids": dj_ids, "updated_at": datetime.utcnow()}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Event not found")
        
        return {"message": f"{len(dj_ids)} DJs assignés à l'événement"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/admin/djs/init")
async def initialize_default_djs(
    current_user: dict = Depends(get_current_admin)
):
    """Admin: Initialize default DJs in database"""
    db = get_database()
    
    # Check if DJs already exist
    count = await db.djs.count_documents({})
    if count > 0:
        return {"message": f"{count} DJs already exist", "initialized": False}
    
    # Insert default DJs
    for dj in DEFAULT_DJS:
        dj_doc = {
            "name": dj["name"],
            "type": dj["type"],
            "instagram_url": dj["instagram_url"],
            "photo_url": dj["photo_url"],
            "is_resident": dj["is_resident"],
            "order": dj["order"],
            "created_at": datetime.utcnow()
        }
        await db.djs.insert_one(dj_doc)
    
    return {"message": f"{len(DEFAULT_DJS)} DJs initialized", "initialized": True}



# ============ WELCOME PAGE CONTENT ENDPOINTS ============

# Default welcome content
DEFAULT_WELCOME_CONTENT = {
    "flyer_url": None,  # Will use local image
    "video_url": None,  # Will use default
    "tagline": "The Biggest Latino-Reggaeton Party in Belgium",
    "venue_name": "Mirano Continental, Brussels"
}

@app.get("/api/welcome-content")
async def get_welcome_content():
    """Get welcome page content (flyer, video, tagline)"""
    db = get_database()
    
    content = await db.app_settings.find_one({"type": "welcome_content"})
    
    if not content:
        return DEFAULT_WELCOME_CONTENT
    
    return {
        "flyer_url": content.get("flyer_url"),
        "video_url": content.get("video_url"),
        "tagline": content.get("tagline", DEFAULT_WELCOME_CONTENT["tagline"]),
        "venue_name": content.get("venue_name", DEFAULT_WELCOME_CONTENT["venue_name"])
    }

@app.put("/api/admin/welcome-content")
async def update_welcome_content(
    content_data: Dict[str, Any] = Body(...),
    current_user: dict = Depends(get_current_admin)
):
    """Admin: Update welcome page content (flyer, video, tagline)"""
    db = get_database()
    
    update_fields = {
        "type": "welcome_content",
        "updated_at": datetime.utcnow(),
        "updated_by": str(current_user["_id"])
    }
    
    # Update only provided fields
    for field in ["flyer_url", "video_url", "tagline", "venue_name"]:
        if field in content_data:
            update_fields[field] = content_data[field]
    
    await db.app_settings.update_one(
        {"type": "welcome_content"},
        {"$set": update_fields},
        upsert=True
    )
    
    return {"message": "Contenu de la page d'accueil mis à jour avec succès"}

@app.post("/api/admin/welcome-content/upload-flyer")
async def upload_welcome_flyer(
    flyer_url: str = Body(..., embed=True),
    current_user: dict = Depends(get_current_admin)
):
    """Admin: Update the welcome page flyer URL"""
    db = get_database()
    
    await db.app_settings.update_one(
        {"type": "welcome_content"},
        {
            "$set": {
                "flyer_url": flyer_url,
                "updated_at": datetime.utcnow(),
                "updated_by": str(current_user["_id"])
            }
        },
        upsert=True
    )
    
    return {"message": "Flyer mis à jour avec succès", "flyer_url": flyer_url}

@app.post("/api/admin/welcome-content/upload-video")
async def upload_welcome_video(
    video_url: str = Body(..., embed=True),
    current_user: dict = Depends(get_current_admin)
):
    """Admin: Update the welcome page aftermovie video URL"""
    db = get_database()
    
    await db.app_settings.update_one(
        {"type": "welcome_content"},
        {
            "$set": {
                "video_url": video_url,
                "updated_at": datetime.utcnow(),
                "updated_by": str(current_user["_id"])
            }
        },
        upsert=True
    )
    
    return {"message": "Vidéo mise à jour avec succès", "video_url": video_url}



# ============ ADMIN MEDIA ENDPOINTS ============

@app.post("/api/admin/media/photos")
async def admin_add_photo(
    photo_data: Dict[str, str] = Body(...),
    current_user: dict = Depends(get_current_admin)
):
    """Admin: Add a photo to a gallery"""
    db = get_database()
    
    url = photo_data.get("url")
    event_id = photo_data.get("event_id")
    
    if not url:
        raise HTTPException(status_code=400, detail="URL de la photo requise")
    
    photo = {
        "url": url,
        "thumbnail_url": photo_data.get("thumbnail_url", url),
        "event_id": event_id,
        "tags": [],
        "uploaded_at": datetime.utcnow(),
        "uploaded_by": str(current_user["_id"])
    }
    
    result = await db.photos.insert_one(photo)
    
    return {
        "id": str(result.inserted_id),
        "message": "Photo ajoutée avec succès"
    }

@app.delete("/api/admin/media/photos/{photo_id}")
async def admin_delete_photo(
    photo_id: str,
    current_user: dict = Depends(get_current_admin)
):
    """Admin: Delete a photo"""
    db = get_database()
    
    try:
        result = await db.photos.delete_one({"_id": ObjectId(photo_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Photo non trouvée")
        
        return {"message": "Photo supprimée avec succès"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/admin/media/aftermovies")
async def admin_add_aftermovie(
    video_data: Dict[str, Any] = Body(...),
    current_user: dict = Depends(get_current_admin)
):
    """Admin: Add an aftermovie"""
    db = get_database()
    
    title = video_data.get("title")
    video_url = video_data.get("video_url")
    
    if not title or not video_url:
        raise HTTPException(status_code=400, detail="Titre et URL vidéo requis")
    
    aftermovie = {
        "title": title,
        "video_url": video_url,
        "thumbnail_url": video_data.get("thumbnail_url", "https://via.placeholder.com/400x225"),
        "event_date": video_data.get("event_date", datetime.utcnow()),
        "duration": video_data.get("duration", "0:00"),
        "views": 0,
        "created_at": datetime.utcnow(),
        "created_by": str(current_user["_id"])
    }
    
    result = await db.aftermovies.insert_one(aftermovie)
    
    return {
        "id": str(result.inserted_id),
        "message": "Aftermovie ajouté avec succès"
    }

@app.delete("/api/admin/media/aftermovies/{video_id}")
async def admin_delete_aftermovie(
    video_id: str,
    current_user: dict = Depends(get_current_admin)
):
    """Admin: Delete an aftermovie"""
    db = get_database()
    
    try:
        result = await db.aftermovies.delete_one({"_id": ObjectId(video_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Aftermovie non trouvé")
        
        return {"message": "Aftermovie supprimé avec succès"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/api/admin/events/{event_id}/flyer")
async def admin_update_event_flyer(
    event_id: str,
    flyer_data: Dict[str, str] = Body(...),
    current_user: dict = Depends(get_current_admin)
):
    """Admin: Update event flyer/banner image"""
    db = get_database()
    
    banner_image = flyer_data.get("banner_image")
    
    if not banner_image:
        raise HTTPException(status_code=400, detail="URL du flyer requise")
    
    try:
        result = await db.events.update_one(
            {"_id": ObjectId(event_id)},
            {
                "$set": {
                    "banner_image": banner_image,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Événement non trouvé")
        
        return {"message": "Flyer mis à jour avec succès"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/admin/events")
async def admin_create_event(
    event_data: Dict[str, Any] = Body(...),
    current_user: dict = Depends(get_current_admin)
):
    """Admin: Create a new event"""
    db = get_database()
    
    name = event_data.get("name")
    event_date = event_data.get("event_date")
    
    if not name or not event_date:
        raise HTTPException(status_code=400, detail="Nom et date de l'événement requis")
    
    event = {
        "name": name,
        "description": event_data.get("description", ""),
        "event_date": datetime.fromisoformat(event_date.replace('Z', '+00:00')) if isinstance(event_date, str) else event_date,
        "venue_name": event_data.get("venue_name", "Mirano Continental"),
        "venue_address": event_data.get("venue_address", "Chaussée de Louvain 38, 1210 Brussels"),
        "banner_image": event_data.get("banner_image", ""),
        "xceed_ticket_url": event_data.get("xceed_ticket_url", ""),
        "ticket_categories": event_data.get("ticket_categories", [
            {"name": "Standard", "price": 15.0, "available": True}
        ]),
        "lineup": [],
        "status": "published",
        "gallery_visible": False,  # Hidden by default - show after event
        "aftermovie_visible": False,  # Hidden by default - show when video ready
        "created_at": datetime.utcnow(),
        "created_by": str(current_user["_id"])
    }
    
    result = await db.events.insert_one(event)
    
    return {
        "id": str(result.inserted_id),
        "message": "Événement créé avec succès"
    }


@app.put("/api/admin/events/{event_id}")
async def admin_update_event(
    event_id: str,
    event_data: Dict[str, Any] = Body(...),
    current_user: dict = Depends(get_current_admin)
):
    """Admin: Update an event"""
    db = get_database()
    
    update_fields = {}
    
    if "name" in event_data:
        update_fields["name"] = event_data["name"]
    if "description" in event_data:
        update_fields["description"] = event_data["description"]
    if "event_date" in event_data:
        event_date = event_data["event_date"]
        update_fields["event_date"] = datetime.fromisoformat(event_date.replace('Z', '+00:00')) if isinstance(event_date, str) else event_date
    if "venue_name" in event_data:
        update_fields["venue_name"] = event_data["venue_name"]
    if "venue_address" in event_data:
        update_fields["venue_address"] = event_data["venue_address"]
    if "banner_image" in event_data:
        update_fields["banner_image"] = event_data["banner_image"]
    if "xceed_ticket_url" in event_data:
        update_fields["xceed_ticket_url"] = event_data["xceed_ticket_url"]
    if "ticket_categories" in event_data:
        update_fields["ticket_categories"] = event_data["ticket_categories"]
    if "gallery_visible" in event_data:
        update_fields["gallery_visible"] = event_data["gallery_visible"]
    if "aftermovie_visible" in event_data:
        update_fields["aftermovie_visible"] = event_data["aftermovie_visible"]
    
    update_fields["updated_at"] = datetime.utcnow()
    
    try:
        result = await db.events.update_one(
            {"_id": ObjectId(event_id)},
            {"$set": update_fields}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Événement non trouvé ou aucune modification")
        
        return {"message": "Événement mis à jour avec succès"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.put("/api/admin/events/{event_id}/visibility")
async def admin_toggle_event_visibility(
    event_id: str,
    visibility_data: Dict[str, bool] = Body(...),
    current_user: dict = Depends(get_current_admin)
):
    """Admin: Toggle gallery/aftermovie visibility for an event"""
    db = get_database()
    
    update_fields = {}
    
    if "gallery_visible" in visibility_data:
        update_fields["gallery_visible"] = visibility_data["gallery_visible"]
    if "aftermovie_visible" in visibility_data:
        update_fields["aftermovie_visible"] = visibility_data["aftermovie_visible"]
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="Aucun champ de visibilité fourni")
    
    update_fields["updated_at"] = datetime.utcnow()
    
    try:
        result = await db.events.update_one(
            {"_id": ObjectId(event_id)},
            {"$set": update_fields}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Événement non trouvé")
        
        return {"message": "Visibilité mise à jour avec succès"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

