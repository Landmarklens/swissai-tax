"""
Audit Log Model
Tracks user activity and security events
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from db.base import Base


class AuditLog(Base):
    """
    Audit log for tracking user activities and security events
    """
    __tablename__ = "audit_logs"
    __table_args__ = (
        Index('idx_audit_user_created', 'user_id', 'created_at'),
        {'schema': 'swisstax'}
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("swisstax.users.id", ondelete="CASCADE"), nullable=False)
    session_id = Column(String(255), nullable=True, index=True)
    event_type = Column(String(50), nullable=False, index=True)
    event_category = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    device_info = Column(JSONB, nullable=True)
    event_metadata = Column(JSONB, nullable=True)
    status = Column(String(20), nullable=False, default="success")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)

    # Relationship to User (commented out - relationships temporarily disabled in User model)
    # user = relationship("User", back_populates="audit_logs")

    def __repr__(self):
        return f"<AuditLog(id={self.id}, user_id={self.user_id}, event={self.event_type}, status={self.status})>"
