import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Import the shared Base from db.base
from db.base import Base

# Import settings from config to get database credentials
# SECURITY: Database credentials are loaded from AWS Parameter Store in config.py
# Fallback to DATABASE_URL environment variable for local development
try:
    from config import settings

    # Try to build DATABASE_URL from Parameter Store settings
    if all([settings.POSTGRES_USER, settings.POSTGRES_PASSWORD, settings.POSTGRES_HOST]):
        DATABASE_URL = f"postgresql://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
    else:
        # Fallback to DATABASE_URL environment variable
        DATABASE_URL = os.getenv("DATABASE_URL")
        if not DATABASE_URL:
            raise ValueError(
                "Missing required database credentials. Either:\n"
                "  1. Configure Parameter Store with /swissai/db/* parameters, OR\n"
                "  2. Set DATABASE_URL environment variable"
            )
except ImportError:
    # Config import failed, use DATABASE_URL from environment
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        raise ValueError(
            "DATABASE_URL environment variable is required when config module is not available"
        )

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
