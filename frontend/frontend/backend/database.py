from motor.motor_asyncio import AsyncIOMotorClient
from config import settings
import logging

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None
    db = None

database = Database()

async def connect_to_mongo():
    """Connect to MongoDB"""
    try:
        database.client = AsyncIOMotorClient(settings.mongo_url)
        database.db = database.client[settings.mongo_db]
        
        # Test connection
        await database.client.admin.command('ping')
        logger.info(f"✅ Connected to MongoDB: {settings.mongo_db}")
        
        # Create indexes
        await create_indexes()
        
    except Exception as e:
        logger.error(f"❌ Failed to connect to MongoDB: {e}")
        raise

async def close_mongo_connection():
    """Close MongoDB connection"""
    if database.client:
        database.client.close()
        logger.info("MongoDB connection closed")

async def create_indexes():
    """Create database indexes for performance"""
    try:
        # Users collection indexes
        await database.db.users.create_index("email", unique=True)
        await database.db.users.create_index("firebase_uid", unique=True, sparse=True)
        
        # Events collection indexes
        await database.db.events.create_index("event_date")
        await database.db.events.create_index("status")
        
        # Tickets collection indexes
        await database.db.tickets.create_index("ticket_code", unique=True)
        await database.db.tickets.create_index("booking_id")
        await database.db.tickets.create_index("user_id")
        await database.db.tickets.create_index("event_id")
        
        # Bookings collection indexes
        await database.db.bookings.create_index("user_id")
        await database.db.bookings.create_index("stripe_payment_intent_id", unique=True, sparse=True)
        
        # Orders collection indexes
        await database.db.orders.create_index("user_id")
        await database.db.orders.create_index("status")
        
        # VIP Bookings indexes
        await database.db.vip_bookings.create_index("user_id")
        await database.db.vip_bookings.create_index("event_id")
        await database.db.vip_bookings.create_index("status")
        
        logger.info("✅ Database indexes created")
        
    except Exception as e:
        logger.warning(f"⚠️  Index creation warning: {e}")

def get_database():
    """Get database instance"""
    return database.db