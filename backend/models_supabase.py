"""
SQLAlchemy Models for Supabase/PostgreSQL
Mirrors the MongoDB collections structure
"""

from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, JSON,
    ForeignKey, Index, UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database_supabase import Base
import uuid


def generate_uuid():
    return str(uuid.uuid4())


# ============ USERS ============
class User(Base):
    __tablename__ = 'users'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=True)  # Nullable for social login
    role = Column(String(50), default='user', index=True)
    loyalty_points = Column(Integer, default=0)
    badges = Column(JSON, default=list)
    friends = Column(JSON, default=list)
    language = Column(String(10), default='fr')
    
    # Social login fields
    firebase_uid = Column(String(255), unique=True, nullable=True)
    apple_id = Column(String(255), unique=True, nullable=True)
    google_id = Column(String(255), unique=True, nullable=True)
    auth_provider = Column(String(50), nullable=True)
    
    # Push notifications
    push_token = Column(String(500), nullable=True)
    push_token_updated_at = Column(DateTime(timezone=True), nullable=True)
    
    # Referral system
    referral_code = Column(String(20), unique=True, nullable=True)
    referred_by = Column(String(36), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    tickets = relationship('Ticket', back_populates='user', cascade='all, delete-orphan')
    orders = relationship('Order', back_populates='user', cascade='all, delete-orphan')
    vip_bookings = relationship('VIPBooking', back_populates='user', cascade='all, delete-orphan')
    song_requests = relationship('SongRequest', back_populates='user', cascade='all, delete-orphan')


# ============ EVENTS ============
class Event(Base):
    __tablename__ = 'events'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    event_date = Column(DateTime(timezone=True), nullable=False, index=True)
    venue_name = Column(String(255), default='Mirano Continental')
    venue_address = Column(String(500), default='Chaussée de Louvain 38, 1210 Brussels')
    
    lineup = Column(JSON, default=list)
    ticket_categories = Column(JSON, default=list)
    selected_djs = Column(JSON, default=list)
    
    xceed_ticket_url = Column(String(500), nullable=True)
    banner_image = Column(String(500), nullable=True)
    
    gallery_visible = Column(Boolean, default=False)
    aftermovie_visible = Column(Boolean, default=False)
    
    status = Column(String(50), default='upcoming', index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    tickets = relationship('Ticket', back_populates='event', cascade='all, delete-orphan')
    vip_bookings = relationship('VIPBooking', back_populates='event', cascade='all, delete-orphan')
    photos = relationship('Photo', back_populates='event', cascade='all, delete-orphan')


# ============ TICKETS ============
class Ticket(Base):
    __tablename__ = 'tickets'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_id = Column(String(36), ForeignKey('events.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    ticket_category = Column(String(100), nullable=False)
    price = Column(Float, nullable=False)
    ticket_code = Column(String(50), unique=True, nullable=False)
    qr_data = Column(String(500), nullable=False)
    
    status = Column(String(50), default='active', index=True)
    payment_id = Column(String(255), nullable=True)
    
    purchase_date = Column(DateTime(timezone=True), server_default=func.now())
    validated_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    event = relationship('Event', back_populates='tickets')
    user = relationship('User', back_populates='tickets')


# ============ PRODUCTS ============
class Product(Base):
    __tablename__ = 'products'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=False, index=True)
    price = Column(Float, nullable=False)
    sizes_available = Column(JSON, default=list)
    images = Column(JSON, default=list)
    stock_quantity = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ============ ORDERS ============
class Order(Base):
    __tablename__ = 'orders'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    items = Column(JSON, nullable=False)
    total_price = Column(Float, nullable=False)
    delivery_method = Column(String(100), nullable=False)
    delivery_address = Column(Text, nullable=True)
    
    status = Column(String(50), default='confirmed', index=True)
    stripe_payment_intent_id = Column(String(255), nullable=True)
    
    customer_name = Column(String(255), nullable=True)
    customer_email = Column(String(255), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    confirmed_at = Column(DateTime(timezone=True), nullable=True)
    shipped_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship('User', back_populates='orders')


# ============ VIP BOOKINGS ============
class VIPBooking(Base):
    __tablename__ = 'vip_bookings'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    event_id = Column(String(36), ForeignKey('events.id', ondelete='CASCADE'), nullable=False, index=True)
    
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=False)
    guests = Column(Integer, default=1)
    message = Column(Text, nullable=True)
    
    status = Column(String(50), default='pending', index=True)
    admin_notes = Column(Text, nullable=True)
    
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    confirmed_at = Column(DateTime(timezone=True), nullable=True)
    rejected_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship('User', back_populates='vip_bookings')
    event = relationship('Event', back_populates='vip_bookings')


# ============ SONG REQUESTS ============
class SongRequest(Base):
    __tablename__ = 'song_requests'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    event_id = Column(String(100), nullable=True, index=True)
    
    user_name = Column(String(255), nullable=True)
    song_title = Column(String(255), nullable=False)
    artist_name = Column(String(255), nullable=False)
    song_title_normalized = Column(String(255), nullable=True, index=True)
    artist_name_normalized = Column(String(255), nullable=True, index=True)
    
    votes = Column(Integer, default=1)
    voters = Column(JSON, default=list)
    requesters = Column(JSON, default=list)
    times_requested = Column(Integer, default=1)
    
    status = Column(String(50), default='pending', index=True)
    rejection_reason = Column(Text, nullable=True)
    rejection_label = Column(String(255), nullable=True)
    
    requested_at = Column(DateTime(timezone=True), server_default=func.now())
    played_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship('User', back_populates='song_requests')


# ============ FREE ENTRY VOUCHERS ============
class FreeEntryVoucher(Base):
    __tablename__ = 'free_entry_vouchers'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), nullable=False, index=True)
    user_name = Column(String(255), nullable=True)
    user_email = Column(String(255), nullable=True)
    
    used = Column(Boolean, default=False)
    used_at = Column(DateTime(timezone=True), nullable=True)
    validated_by = Column(String(36), nullable=True)
    event_id = Column(String(36), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)


# ============ APP SETTINGS ============
class AppSettings(Base):
    __tablename__ = 'app_settings'
    
    id = Column(String(50), primary_key=True, default='global')
    type = Column(String(100), nullable=True)  # For different setting types
    
    requests_enabled = Column(Boolean, default=False)
    current_event_id = Column(String(36), nullable=True)
    loyalty_qr_version = Column(Integer, default=1)
    
    # Welcome content (multilingual)
    welcome_content = Column(JSON, nullable=True)
    
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    updated_by = Column(String(255), nullable=True)


# ============ DJS ============
class DJ(Base):
    __tablename__ = 'djs'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    bio = Column(Text, nullable=True)
    photo_url = Column(String(500), nullable=True)
    instagram_url = Column(String(500), nullable=True)
    soundcloud_url = Column(String(500), nullable=True)
    spotify_url = Column(String(500), nullable=True)
    is_resident = Column(Boolean, default=False)
    order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ============ PHOTOS ============
class Photo(Base):
    __tablename__ = 'photos'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_id = Column(String(36), ForeignKey('events.id', ondelete='CASCADE'), nullable=False, index=True)
    
    url = Column(String(500), nullable=False)
    thumbnail_url = Column(String(500), nullable=True)
    public_id = Column(String(255), nullable=True)  # Cloudinary public_id
    
    tags = Column(JSON, default=list)  # User IDs tagged in photo
    likes = Column(Integer, default=0)
    
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    uploaded_by = Column(String(36), nullable=True)
    
    # Relationships
    event = relationship('Event', back_populates='photos')


# ============ AFTERMOVIES ============
class Aftermovie(Base):
    __tablename__ = 'aftermovies'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_id = Column(String(36), nullable=True)
    
    title = Column(String(255), nullable=False)
    youtube_url = Column(String(500), nullable=False)
    thumbnail_url = Column(String(500), nullable=True)
    
    event_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ============ LOYALTY CHECKINS ============
class LoyaltyCheckin(Base):
    __tablename__ = 'loyalty_checkins'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), nullable=False, index=True)
    event_id = Column(String(36), nullable=False, index=True)
    qr_version = Column(Integer, nullable=True)
    
    points_earned = Column(Integer, default=5)
    checked_in_at = Column(DateTime(timezone=True), server_default=func.now())
    checked_in_by = Column(String(36), nullable=True)
    
    __table_args__ = (
        UniqueConstraint('user_id', 'event_id', 'qr_version', name='unique_checkin_per_event'),
    )


# ============ LOYALTY REWARDS ============
class LoyaltyReward(Base):
    __tablename__ = 'loyalty_rewards'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), nullable=False, index=True)
    
    reward_type = Column(String(100), nullable=False)
    points_spent = Column(Integer, nullable=False)
    
    status = Column(String(50), default='active')
    redeemed_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)


# ============ LOYALTY TRANSACTIONS ============
class LoyaltyTransaction(Base):
    __tablename__ = 'loyalty_transactions'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), nullable=False, index=True)
    
    transaction_type = Column(String(50), nullable=False)  # 'earn', 'spend', 'bonus'
    points = Column(Integer, nullable=False)
    description = Column(String(255), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ============ NOTIFICATION PREFERENCES ============
class NotificationPreference(Base):
    __tablename__ = 'notification_preferences'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), unique=True, nullable=False, index=True)
    
    events = Column(Boolean, default=True)
    promotions = Column(Boolean, default=True)
    song_requests = Column(Boolean, default=True)
    friends = Column(Boolean, default=True)
    
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


# ============ CONSENT LOGS ============
class ConsentLog(Base):
    __tablename__ = 'consent_logs'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), nullable=False, index=True)
    
    consent_type = Column(String(100), nullable=False)
    action = Column(String(50), nullable=False)  # 'granted', 'revoked'
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ============ EVENT QR CODES ============
class EventQRCode(Base):
    __tablename__ = 'event_qr_codes'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_id = Column(String(36), nullable=False, index=True)
    event_name = Column(String(255), nullable=True)
    
    qr_code = Column(String(255), unique=True, nullable=False)
    coins_reward = Column(Integer, default=5)
    
    is_active = Column(Boolean, default=True, index=True)
    scan_count = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(String(36), nullable=True)


# ============ EVENT QR SCANS ============
class EventQRScan(Base):
    __tablename__ = 'event_qr_scans'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    qr_id = Column(String(36), nullable=False, index=True)
    user_id = Column(String(36), nullable=False, index=True)
    
    coins_earned = Column(Integer, nullable=False)
    scanned_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        UniqueConstraint('qr_id', 'user_id', name='unique_scan_per_user'),
    )


# ============ REFERRALS ============
class Referral(Base):
    __tablename__ = 'referrals'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    referrer_id = Column(String(36), nullable=False, index=True)
    referred_id = Column(String(36), unique=True, nullable=False, index=True)
    
    referrer_points = Column(Integer, default=10)
    referred_points = Column(Integer, default=5)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ============ NOTIFICATIONS SENT ============
class NotificationSent(Base):
    __tablename__ = 'notifications_sent'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    target = Column(String(100), nullable=False)  # 'all', 'admins', specific user_id
    
    sent_by = Column(String(36), nullable=True)
    recipients_count = Column(Integer, default=0)
    
    sent_at = Column(DateTime(timezone=True), server_default=func.now())
