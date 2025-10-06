from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

# Import the shared Base from db.base
from db.base import Base

# Import settings from config to get database credentials
try:
    from config import settings
    DATABASE_URL = f"postgresql://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
except Exception as e:
    # Fallback for local development or if config fails
    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "postgresql://webscrapinguser:IXq3IC0Uw6StMkBhb4mb@webscraping-database.cluster-c9y2u088elix.us-east-1.rds.amazonaws.com:5432/swissai_tax"
    )

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
