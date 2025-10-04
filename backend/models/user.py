from datetime import datetime
from enum import Enum as PyEnum
from typing import TYPE_CHECKING

from pgvector.sqlalchemy import Vector
from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from db.base import Base

if TYPE_CHECKING:
    from .whatif_analysis_job import WhatIfAnalysisJob


class UserType(PyEnum):
    TENANT = "tenant"
    LANDLORD = "landlord"
    ADMIN = "admin"


class UserStatus(PyEnum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class UserLanguage(PyEnum):
    DE = "de"
    EN = "en"
    FR = "fr"
    IT = "it"


class AuthProvider(PyEnum):
    LOCAL = "local"
    GOOGLE = "google"


# DEFAULT_SUBSCRIPTION_PLAN = SubscriptionPlan.FREE
DEFAULT_USER_STATUS = UserStatus.ACTIVE
DEFAULT_USER_LANGUAGE = UserLanguage.EN
DEFAULT_AUTH_PROVIDER = AuthProvider.LOCAL


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True)
    password = Column(String(255), nullable=True)
    provider = Column(
        Enum(
            AuthProvider,
            values_callable=lambda x: [e.value for e in x],
            name="user_provider_enum",
        ),
        nullable=False,
        default=DEFAULT_AUTH_PROVIDER,
    )
    provider_id = Column(String(255))
    phone = Column(String(15))

    firstname = Column(String(100))
    lastname = Column(String(100))
    country = Column(String(10))
    state = Column(String(10))
    city = Column(String(10))
    address = Column(String(255))
    zip_code = Column(String(100))
    avatar_url = Column(String(255), nullable=True)

    user_type = Column(
        Enum(
            UserType,
            values_callable=lambda x: [e.value for e in x],
            name="user_type_enum",
        ),
        nullable=False,
    )
    status = Column(
        Enum(
            UserStatus,
            values_callable=lambda x: [e.value for e in x],
            name="user_status_enum",
        ),
        default=DEFAULT_USER_STATUS,
    )
    language = Column(
        Enum(
            UserLanguage,
            values_callable=lambda x: [e.value for e in x],
            name="user_language_enum",
        ),
        default=DEFAULT_USER_LANGUAGE,
    )

    is_active = Column(Boolean, default=True, nullable=False)
    is_test_user = Column(Boolean, default=False, nullable=False)
    is_grandfathered = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    documents = relationship(
        "Document", foreign_keys="[Document.user_id]", back_populates="user"
    )
    subscriptions = relationship("Subscription", back_populates="user")
    properties = relationship("Property", foreign_keys="[Property.owner_id]", back_populates="owner")
    take_it_out = relationship("TakeItOut", back_populates="user", uselist=False)
    stripe_events = relationship("StripeEvent", back_populates="user")

    conversation_profiles = relationship("ConversationProfile", back_populates="user")
    conversations = relationship("Conversation", back_populates="user")
    user_documents = relationship("UserDocument", back_populates="user")
    property_enrichments = relationship("PropertyEnrichment", back_populates="user")
    recommendation_jobs = relationship("RecommendationJob", back_populates="user")
    import_jobs = relationship("PropertyImportJob", back_populates="user")
    whatif_jobs = relationship("WhatIfAnalysisJob", back_populates="user")


class ConversationProfile(Base):
    __tablename__ = "conversation_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String(255), nullable=True)
    profile = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now)
    summarized_description = Column(String, nullable=True)
    summarized_description_vector = Column(Vector(dim=1024), nullable=True)
    sql_filters = Column(JSON, nullable=True)
    
    # UI enhancement fields
    is_pinned = Column(Boolean, default=False, nullable=True)
    is_archived = Column(Boolean, default=False, nullable=True)
    message_count = Column(Integer, default=0, nullable=True)
    last_activity = Column(DateTime, nullable=True)
    tags = Column(JSON, nullable=True)  # Array of strings
    completion_percentage = Column(Integer, default=0, nullable=True)
    
    user = relationship("User", back_populates="conversation_profiles")
    conversations = relationship("Conversation", back_populates="conversation_profile")
    recommendations = relationship(
        "Recommendation",
        back_populates="conversation_profile",
        cascade="all, delete-orphan",
    )
    property_enrichments = relationship("PropertyEnrichment", back_populates="conversation_profile")
    recommendation_jobs = relationship("RecommendationJob", back_populates="profile")

    vector = Column(Vector(dim=1024), nullable=True)
