from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

# ============ ENUMS ============

class UserRole(str, Enum):
    USER = "user"
    DJ = "dj"
    ADMIN = "admin"

class TicketCategory(str, Enum):
    STANDARD = "standard"
    VIP = "vip"
    PLATINUM = "platinum"

class TicketStatus(str, Enum):
    ISSUED = "issued"
    SCANNED = "scanned"
    VERIFIED = "verified"
    USED = "used"
    CANCELLED = "cancelled"

class BookingStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"

class RequestStatus(str, Enum):
    PENDING = "pending"
    PLAYED = "played"
    REJECTED = "rejected"

class RejectionReason(str, Enum):
    NOT_REGGAETON = "not_reggaeton"
    KILLS_VIBE = "kills_vibe"
    ALREADY_PLAYED = "already_played"
    EXPLICIT_CONTENT = "explicit_content"
    TECHNICAL_ISSUES = "technical_issues"

class DeliveryMethod(str, Enum):
    HOME = "home"
    PICKUP = "pickup"

class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class VIPZone(str, Enum):
    MAIN_FLOOR = "main_floor"
    VIP_AREA = "vip_area"
    TERRACE = "terrace"

class VIPPackage(str, Enum):
    BRONZE = "bronze"
    SILVER = "silver"
    GOLD = "gold"

# ============ USER MODELS ============

class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None
    profile_picture: Optional[str] = None  # base64
    language: str = "fr"  # fr, es, nl
    role: UserRole = UserRole.USER

class UserCreate(UserBase):
    password: str
    firebase_uid: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserInDB(UserBase):
    id: str = Field(alias="_id")
    firebase_uid: Optional[str] = None
    hashed_password: Optional[str] = None
    loyalty_points: int = 0
    badges: List[str] = []
    friends: List[str] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True

# ============ EVENT MODELS ============

class Event(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    name: str
    description: str
    event_date: datetime
    venue_name: str = "Mirano Continental"
    venue_address: str = "Chaussée de Louvain 38, 1210 Brussels"
    lineup: List[Dict[str, str]] = []  # [{"name": "DJ Name", "photo": "base64"}]
    banner_image: Optional[str] = None  # base64
    ticket_categories: List[Dict[str, Any]] = []
    xceed_ticket_url: Optional[str] = None  # URL to XCEED ticketing page
    status: str = "upcoming"  # upcoming, live, past
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True

# ============ TICKET MODELS ============

class TicketCategoryInfo(BaseModel):
    category: TicketCategory
    name: str
    price: float
    quantity: int
    benefits: List[str]

class Ticket(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    booking_id: str
    ticket_code: str  # Unique identifier
    qr_code: str  # JSON string for QR
    event_id: str
    category: TicketCategory
    category_name: str
    ticket_number: int
    status: TicketStatus = TicketStatus.ISSUED
    customer_name: str
    customer_email: EmailStr
    transferred_to: Optional[str] = None
    issued_at: datetime = Field(default_factory=datetime.utcnow)
    scanned_at: Optional[datetime] = None
    used_at: Optional[datetime] = None
    scan_history: List[Dict[str, Any]] = []
    
    class Config:
        populate_by_name = True

class Booking(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    event_id: str
    ticket_categories: List[Dict[str, Any]]
    total_price: float
    status: BookingStatus = BookingStatus.PENDING
    stripe_payment_intent_id: Optional[str] = None
    stripe_charge_id: Optional[str] = None
    payment_method: Optional[str] = None
    ticket_ids: List[str] = []
    customer_name: str
    customer_email: EmailStr
    booked_at: datetime = Field(default_factory=datetime.utcnow)
    confirmed_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True

# ============ DJ REQUEST MODELS ============

class SongRequest(BaseModel):
    user_id: str
    user_name: str
    event_id: str
    song_title: str
    artist_name: str
    requested_at: datetime = Field(default_factory=datetime.utcnow)
    votes: int = 0
    voters: List[str] = []
    status: RequestStatus = RequestStatus.PENDING
    rejection_reason: Optional[RejectionReason] = None
    played_at: Optional[datetime] = None

class VoteRequest(BaseModel):
    request_id: str
    user_id: str

# ============ MERCHANDISE MODELS ============

class Product(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    name: str
    description: str
    category: str  # apparel, accessories
    price: float
    sizes_available: List[str] = []
    images: List[str] = []  # base64
    stock_quantity: int
    vendor_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True

class OrderItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    size: Optional[str] = None
    price: float
    subtotal: float

class Order(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    items: List[OrderItem]
    total_price: float
    delivery_method: DeliveryMethod
    delivery_address: Optional[Dict[str, str]] = None
    status: OrderStatus = OrderStatus.PENDING
    stripe_payment_intent_id: Optional[str] = None
    customer_name: str
    customer_email: EmailStr
    created_at: datetime = Field(default_factory=datetime.utcnow)
    confirmed_at: Optional[datetime] = None
    shipped_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True

# ============ VIP BOOKING MODELS ============

class VIPBooking(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    event_id: str
    zone: VIPZone
    package: VIPPackage
    guest_count: int
    bottle_preferences: Optional[str] = None
    special_requests: Optional[str] = None
    total_price: float
    status: BookingStatus = BookingStatus.PENDING
    stripe_payment_intent_id: Optional[str] = None
    customer_name: str
    customer_email: EmailStr
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
    confirmed_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True

# ============ MEDIA MODELS ============

class Media(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    event_id: str
    media_type: str  # photo, video
    url_or_base64: str
    thumbnail: Optional[str] = None
    upload_date: datetime = Field(default_factory=datetime.utcnow)
    tagged_users: List[str] = []
    view_count: int = 0
    like_count: int = 0
    
    class Config:
        populate_by_name = True

# ============ NOTIFICATION MODELS ============

class NotificationPreferences(BaseModel):
    event_announcements: bool = True
    reminders: bool = True
    song_notifications: bool = True
    booking_confirmations: bool = True
    friend_activity: bool = True
    quiet_hours_enabled: bool = False
    quiet_hours_start: int = 23  # 11 PM
    quiet_hours_end: int = 9     # 9 AM