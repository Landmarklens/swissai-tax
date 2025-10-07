from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

# Import the shared Base from db.base
from db.base import Base

# Import settings from config to get database credentials
# SECURITY: Database credentials are loaded from AWS Parameter Store in config.py
# No hardcoded fallback to prevent using exposed credentials
try:
    from config import settings
    # Validate that all required credentials are present
    if not all([settings.POSTGRES_USER, settings.POSTGRES_PASSWORD, settings.POSTGRES_HOST]):
        raise ValueError(
            "Missing required database credentials. Ensure Parameter Store is configured with:\n"
            "  - /swissai/db/host\n"
            "  - /swissai/db/user\n"
            "  - /swissai/db/password"
        )
    DATABASE_URL = f"postgresql://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
except ImportError as e:
    # Only allow DATABASE_URL from environment (no hardcoded fallback)
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        raise ValueError(
            "DATABASE_URL not found. Please set DATABASE_URL environment variable or configure Parameter Store"
        )

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
