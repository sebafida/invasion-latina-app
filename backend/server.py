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
    """Request a song (requires geofence and event hours)"""
    db = get_database()
    
    # Check if user is within venue geofence
    user_lat = song_data.get("latitude")
    user_lng = song_data.get("longitude")
    
    if not user_lat or not user_lng:
        raise HTTPException(status_code=400, detail="Location required for song requests")
    
    if not is_within_geofence(float(user_lat), float(user_lng)):
        raise HTTPException(status_code=403, detail="You must be at the venue to request songs")
    
    # Check if it's during event hours
    if not is_event_hours_active():
        raise HTTPException(status_code=403, detail="Song requests only available during event hours")
    
    # Get current event
    current_event = await db.events.find_one({"status": "live"})
    if not current_event:
        raise HTTPException(status_code=404, detail="No active event found")
    
    # Check for duplicate requests - if exists, increment times_requested and add vote
    existing = await db.song_requests.find_one({
        "event_id": str(current_event["_id"]),
        "song_title": song_data["song_title"],
        "artist_name": song_data["artist_name"],
        "status": "pending"
    })
    
    user_id = str(current_user["_id"])
    
    if existing:
        # Song already requested - check if user already requested it
        if user_id in existing.get("requesters", []):
            raise HTTPException(status_code=400, detail="Vous avez déjà demandé cette chanson")
        
        # Increment times_requested and add user as requester and voter
        await db.song_requests.update_one(
            {"_id": existing["_id"]},
            {
                "$inc": {"times_requested": 1, "votes": 1},
                "$push": {"requesters": user_id, "voters": user_id}
            }
        )
        
        return {
            "message": "Demande ajoutée! La chanson a maintenant " + str(existing.get("times_requested", 1) + 1) + " demandes",
            "request_id": str(existing["_id"]),
            "song": f"{song_data['song_title']} by {song_data['artist_name']}"
        }
    
    # Create new song request
    request_dict = {
        "user_id": str(current_user["_id"]),
        "user_name": current_user["name"],
        "event_id": str(current_event["_id"]),
        "song_title": song_data["song_title"],
        "artist_name": song_data["artist_name"],
        "requested_at": datetime.utcnow(),
        "votes": 1,  # User's own vote
        "voters": [user_id],
        "requesters": [user_id],  # Track who requested
        "times_requested": 1,  # Initial request count
        "status": "pending"
    }
    
    result = await db.song_requests.insert_one(request_dict)
    
    return {
        "message": "Song requested successfully",
        "request_id": str(result.inserted_id),
        "song": f"{song_data['song_title']} by {song_data['artist_name']}"
    }

@app.get("/api/dj/requests")
async def get_song_requests(current_user: dict = Depends(get_current_user)):
    """Get current song requests"""
    db = get_database()
    
    # Get current event
    current_event = await db.events.find_one({"status": "live"})
    if not current_event:
        return []
    
    requests = []
    async for request in db.song_requests.find(
        {"event_id": str(current_event["_id"]), "status": "pending"}
    ).sort("votes", -1).limit(50):
        user_id = str(current_user["_id"])
        requests.append({
            "id": str(request["_id"]),
            "song_title": request["song_title"],
            "artist_name": request["artist_name"],
            "user_name": request["user_name"],
            "votes": request["votes"],
            "times_requested": request.get("times_requested", 1),
            "requested_at": request["requested_at"],
            "can_vote": user_id not in request.get("voters", []),
            "can_request": user_id not in request.get("requesters", [])
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
        
        update_dict = {"status": status}
        if status == "played":
            update_dict["played_at"] = datetime.utcnow()
        elif status == "rejected" and rejection_reason:
            update_dict["rejection_reason"] = rejection_reason
        
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
    
    # Calculate progress to next reward
    points = user.get("loyalty_points", 0)
    points_to_reward = 50
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
    """Claim a free entry reward (50 points)"""
    db = get_database()
    
    user = await db.users.find_one({"_id": ObjectId(current_user["_id"])})
    points = user.get("loyalty_points", 0)
    
    if points < 50:
        raise HTTPException(status_code=400, detail=f"Not enough points. You have {points}, need 50.")
    
    # Generate unique reward code
    import random
    import string
    code = 'IL-' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    
    # Create reward
    reward = {
        "user_id": str(current_user["_id"]),
        "reward_type": "free_entry",
        "points_required": 50,
        "points_spent": 50,
        "status": "pending",
        "code": code,
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(days=90)  # 90 days to use
    }
    
    result = await db.loyalty_rewards.insert_one(reward)
    
    # Deduct points
    await db.users.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$inc": {"loyalty_points": -50}}
    )
    
    # Log transaction
    await db.loyalty_transactions.insert_one({
        "user_id": str(current_user["_id"]),
        "transaction_type": "spent",
        "points": -50,
        "description": "Claimed free entry reward",
        "related_reward_id": str(result.inserted_id),
        "created_at": datetime.utcnow()
    })
    
    return {
        "message": "Reward claimed successfully!",
        "code": code,
        "points_remaining": points - 50
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

