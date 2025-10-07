"""
Reset Token model for password reset functionality
"""

from datetime import datetime, timedelta

from sqlalchemy import Column, DateTime, String
from sqlalchemy.orm import Session

from models.swisstax.base import Base


class ResetToken(Base):
    """
    Password reset token model
    """
    __tablename__ = "reset_tokens"
    __table_args__ = {'schema': 'swisstax'}

    token = Column(String(255), primary_key=True)
    email = Column(String(255), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)

    @classmethod
    async def create_reset_token(cls, db: Session, email: str, token: str):
        """Create a new reset token"""
        # Delete any existing tokens for this email
        db.query(cls).filter(cls.email == email).delete()

        # Create new token with 1 hour expiration
        reset_token = cls(
            token=token,
            email=email,
            expires_at=datetime.utcnow() + timedelta(hours=1)
        )
        db.add(reset_token)
        db.commit()
        db.refresh(reset_token)
        return reset_token

    @classmethod
    async def get_by_token(cls, db: Session, token: str):
        """Get reset token by token string"""
        reset_token = db.query(cls).filter(
            cls.token == token,
            cls.expires_at > datetime.utcnow()
        ).first()
        return reset_token

    @classmethod
    async def delete_token(cls, db: Session, token: str):
        """Delete a reset token"""
        db.query(cls).filter(cls.token == token).delete()
        db.commit()
