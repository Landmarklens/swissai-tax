"""
Database Base Configuration

This module provides the shared Base class for all SQLAlchemy models.
It ensures all models use the same declarative base and can properly
establish relationships.
"""

from sqlalchemy.ext.declarative import declarative_base

# Create the declarative base that all models will inherit from
Base = declarative_base()
