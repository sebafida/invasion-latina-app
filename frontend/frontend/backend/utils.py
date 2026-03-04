from typing import Optional
import math
from datetime import datetime, time
from config import settings
import logging

logger = logging.getLogger(__name__)

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate distance between two coordinates using Haversine formula
    Returns distance in meters
    """
    # Earth radius in meters
    R = 6371000
    
    # Convert to radians
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    # Haversine formula
    a = math.sin(delta_lat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c
    
    return distance

def is_within_geofence(user_lat: float, user_lon: float) -> bool:
    """
    Check if user is within venue geofence
    Venue: Mirano Continental, Brussels
    Coordinates: 50.8486, 4.3722
    Radius: 100 meters
    """
    distance = calculate_distance(
        user_lat, user_lon,
        settings.venue_latitude, settings.venue_longitude
    )
    
    is_within = distance <= settings.venue_radius_meters
    
    logger.info(f"Geofence check: {distance:.2f}m from venue (allowed: {settings.venue_radius_meters}m) - {'ALLOWED' if is_within else 'DENIED'}")
    
    return is_within

def is_event_hours_active(check_time: Optional[datetime] = None) -> bool:
    """
    Check if current time is within event hours
    Event hours: 23:00 (11 PM) to 06:00 (6 AM)
    
    Note: Since events span midnight, we check if time is either:
    - After start hour (23:00) OR
    - Before end hour (06:00)
    """
    if check_time is None:
        check_time = datetime.utcnow()
    
    current_hour = check_time.hour
    start_hour = settings.event_start_hour  # 23
    end_hour = settings.event_end_hour      # 6
    
    # If event spans midnight (e.g., 23:00 to 06:00)
    if start_hour > end_hour:
        is_active = current_hour >= start_hour or current_hour < end_hour
    else:
        # Normal case (e.g., 10:00 to 18:00)
        is_active = start_hour <= current_hour < end_hour
    
    logger.info(f"Event hours check: Current hour {current_hour} - {'ACTIVE' if is_active else 'INACTIVE'}")
    
    return is_active

def can_access_dj_features(user_lat: float, user_lon: float, check_time: Optional[datetime] = None) -> dict:
    """
    Comprehensive check for DJ request feature access
    Returns: {"allowed": bool, "reason": str}
    """
    # Check geofence
    if not is_within_geofence(user_lat, user_lon):
        return {
            "allowed": False,
            "reason": "You must be at the venue to request songs"
        }
    
    # Check event hours
    if not is_event_hours_active(check_time):
        return {
            "allowed": False,
            "reason": "Song requests are only available during event hours (11 PM - 6 AM)"
        }
    
    return {
        "allowed": True,
        "reason": "Access granted"
    }

def generate_ticket_code() -> str:
    """Generate unique ticket code"""
    import uuid
    return f"IL{uuid.uuid4().hex[:8].upper()}"

def generate_qr_data(ticket_id: str, event_id: str, category: str, customer_name: str) -> str:
    """Generate QR code data as JSON string"""
    import json
    
    qr_data = {
        "ticketId": ticket_id,
        "eventId": event_id,
        "category": category,
        "customer": customer_name,
        "issuedAt": datetime.utcnow().isoformat(),
        "app": "InvasionLatina"
    }
    
    return json.dumps(qr_data)