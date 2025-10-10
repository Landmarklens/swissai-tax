"""
Incident Model for Status Page
"""
from sqlalchemy import Column, String, Text, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
import enum

from db.base import Base


class IncidentStatus(str, enum.Enum):
    """Status of an incident"""
    INVESTIGATING = "investigating"
    IDENTIFIED = "identified"
    MONITORING = "monitoring"
    RESOLVED = "resolved"


class IncidentSeverity(str, enum.Enum):
    """Severity level of an incident"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Incident(Base):
    """Incident tracking for status page"""
    __tablename__ = "incidents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    status = Column(SQLEnum(IncidentStatus), default=IncidentStatus.INVESTIGATING, nullable=False, index=True)
    severity = Column(SQLEnum(IncidentSeverity), default=IncidentSeverity.MEDIUM, nullable=False, index=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    # Affected services (JSON array of service IDs)
    affected_services = Column(Text, nullable=True)

    # Post-mortem link
    post_mortem_url = Column(String(512), nullable=True)

    def __repr__(self):
        return f"<Incident {self.title} ({self.status})>"
