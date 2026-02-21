"""
Supabase/PostgreSQL Database Configuration
Uses SQLAlchemy async with Transaction Pooler connection
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
import logging

logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv(Path(__file__).parent / '.env')

# Get DATABASE_URL from environment
DATABASE_URL = os.environ.get('DATABASE_URL')

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required for Supabase connection")

# Convert to async URL (postgresql:// -> postgresql+asyncpg://)
ASYNC_DATABASE_URL = DATABASE_URL.replace('postgresql://', 'postgresql+asyncpg://')

# Create async engine with proper pooler configuration
engine = create_async_engine(
    ASYNC_DATABASE_URL,
    pool_size=10,
    max_overflow=5,
    pool_timeout=30,
    pool_recycle=1800,
    pool_pre_ping=False,
    echo=False,
    connect_args={
        "statement_cache_size": 0,  # CRITICAL: Required for transaction pooler
        "command_timeout": 30,
    }
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

# Base class for models
Base = declarative_base()


async def get_db():
    """Dependency to get database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    """Initialize database connection"""
    try:
        async with engine.begin() as conn:
            # Test connection using text()
            await conn.execute(text("SELECT 1"))
        logger.info("✅ Connected to Supabase PostgreSQL")
    except Exception as e:
        logger.error(f"❌ Failed to connect to Supabase: {e}")
        raise


async def close_db():
    """Close database connection"""
    await engine.dispose()
    logger.info("Supabase connection closed")
