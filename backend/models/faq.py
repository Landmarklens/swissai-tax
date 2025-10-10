"""FAQ Model - Stores frequently asked questions and categories"""

import enum
from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, DateTime
from sqlalchemy import Enum as SQLEnum
from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from models.swisstax.base import Base


class UserType(str, enum.Enum):
    """User types for FAQs - simplified for tax filing"""
    ALL = "all"  # FAQ applies to all users (default)


class FAQCategory(Base):
    """
    FAQ Categories for organizing questions
    """
    __tablename__ = "faq_categories"
    __table_args__ = {'schema': 'swisstax'}

    # Core Identification
    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))

    # Category Details
    name = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)

    # User Type (kept for future extensibility, but currently all FAQs are for everyone)
    user_type = Column(
        SQLEnum(UserType),
        default=UserType.ALL,
        nullable=False,
        index=True
    )

    # Display Order
    sort_order = Column(Integer, default=0, nullable=False)

    # Status
    is_active = Column(Integer, default=1, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    questions = relationship("FAQ", back_populates="category", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<FAQCategory(id='{self.id}', name='{self.name}')>"

    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'description': self.description,
            'user_type': self.user_type.value if isinstance(self.user_type, UserType) else self.user_type,
            'sort_order': self.sort_order,
            'is_active': bool(self.is_active),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class FAQ(Base):
    """
    Frequently Asked Questions

    Stores FAQ content with categories and popularity tracking.
    """
    __tablename__ = "faqs"
    __table_args__ = {'schema': 'swisstax'}

    # Core Identification
    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    category_id = Column(String(36), ForeignKey('swisstax.faq_categories.id'), nullable=False, index=True)

    # Question and Answer
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)

    # User Type (kept for future extensibility, but currently all FAQs are for everyone)
    user_type = Column(
        SQLEnum(UserType),
        default=UserType.ALL,
        nullable=False,
        index=True
    )

    # Additional Content (optional structured data)
    bullet_points = Column(Text, nullable=True)  # JSON array
    detailed_points = Column(Text, nullable=True)  # JSON array of {title, description}
    conclusion = Column(Text, nullable=True)

    # Related FAQs
    related_faq_ids = Column(Text, nullable=True)  # JSON array of FAQ IDs

    # Popularity Tracking
    view_count = Column(Integer, default=0, nullable=False)
    helpful_count = Column(Integer, default=0, nullable=False)

    # Display Order
    sort_order = Column(Integer, default=0, nullable=False)

    # Status
    is_active = Column(Integer, default=1, nullable=False)

    # SEO
    meta_keywords = Column(Text, nullable=True)  # For search optimization

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    category = relationship("FAQCategory", back_populates="questions")

    def __repr__(self):
        return f"<FAQ(id='{self.id}', question='{self.question[:50]}...')>"

    def to_dict(self, include_category=False):
        """Convert model to dictionary"""
        import json

        result = {
            'id': self.id,
            'category_id': self.category_id,
            'question': self.question,
            'answer': self.answer,
            'user_type': self.user_type.value if isinstance(self.user_type, UserType) else self.user_type,
            'sort_order': self.sort_order,
            'is_active': bool(self.is_active),
            'view_count': self.view_count,
            'helpful_count': self.helpful_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

        # Parse JSON fields
        if self.bullet_points:
            try:
                result['bulletPoints'] = json.loads(self.bullet_points)
            except:
                result['bulletPoints'] = []
        else:
            result['bulletPoints'] = []

        if self.detailed_points:
            try:
                result['detailedPoints'] = json.loads(self.detailed_points)
            except:
                result['detailedPoints'] = []
        else:
            result['detailedPoints'] = []

        if self.conclusion:
            result['conclusion'] = self.conclusion

        if self.related_faq_ids:
            try:
                result['related_faq_ids'] = json.loads(self.related_faq_ids)
            except:
                result['related_faq_ids'] = []
        else:
            result['related_faq_ids'] = []

        if self.meta_keywords:
            result['meta_keywords'] = self.meta_keywords

        # Include category if requested
        if include_category and self.category:
            result['category'] = self.category.name

        return result

    def increment_view_count(self):
        """Increment the view count for this FAQ"""
        self.view_count += 1

    def increment_helpful_count(self):
        """Increment the helpful count for this FAQ"""
        self.helpful_count += 1
