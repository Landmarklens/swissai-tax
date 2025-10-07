"""Tax Insight Model - Stores AI-generated tax insights and recommendations"""

import enum
from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, DateTime
from sqlalchemy import Enum as SQLEnum
from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from models.swisstax.base import Base


class InsightType(str, enum.Enum):
    """Types of tax insights"""
    DEDUCTION_OPPORTUNITY = "deduction_opportunity"
    TAX_SAVING_TIP = "tax_saving_tip"
    COMPLIANCE_WARNING = "compliance_warning"
    MISSING_DOCUMENT = "missing_document"
    OPTIMIZATION_SUGGESTION = "optimization_suggestion"
    CALCULATION_EXPLANATION = "calculation_explanation"


class InsightPriority(str, enum.Enum):
    """Priority levels for insights"""
    HIGH = "high"  # Critical - may save significant tax or avoid penalties
    MEDIUM = "medium"  # Important - good to know
    LOW = "low"  # Nice to have - minor optimization


class TaxInsight(Base):
    """
    AI-generated insights and recommendations for tax filing

    Stores personalized tax advice based on user's specific situation.
    Non-sensitive metadata, but may reference encrypted profile data.
    """
    __tablename__ = "tax_insights"
    __table_args__ = {'schema': 'swisstax'}

    # Core Identification
    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    filing_session_id = Column(String(36), ForeignKey('swisstax.tax_filing_sessions.id'), nullable=False, index=True)

    # Insight Details
    insight_type = Column(
        SQLEnum(InsightType),
        nullable=False,
        index=True
    )
    priority = Column(
        SQLEnum(InsightPriority),
        default=InsightPriority.MEDIUM,
        nullable=False,
        index=True
    )

    # Content (Non-sensitive - general advice)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)

    # Action Items (JSON array of suggested actions)
    action_items = Column(Text, nullable=True)  # JSON string

    # Potential Impact
    estimated_savings_chf = Column(Integer, nullable=True)  # Estimated tax savings in CHF

    # Related Questions/Context
    related_questions = Column(Text, nullable=True)  # JSON array of question IDs

    # Status Tracking
    is_acknowledged = Column(Integer, default=0)  # User has seen the insight
    is_applied = Column(Integer, default=0)  # User has acted on the insight

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    acknowledged_at = Column(DateTime, nullable=True)

    # Relationships - temporarily disabled
    # filing_session = relationship("TaxFilingSession", back_populates="insights")

    def __repr__(self):
        return f"<TaxInsight(id='{self.id}', type='{self.insight_type}', priority='{self.priority}')>"

    def to_dict(self):
        """Convert model to dictionary"""
        import json

        result = {
            'id': self.id,
            'filing_session_id': self.filing_session_id,
            'insight_type': self.insight_type.value if isinstance(self.insight_type, InsightType) else self.insight_type,
            'priority': self.priority.value if isinstance(self.priority, InsightPriority) else self.priority,
            'title': self.title,
            'description': self.description,
            'estimated_savings_chf': self.estimated_savings_chf,
            'is_acknowledged': bool(self.is_acknowledged),
            'is_applied': bool(self.is_applied),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'acknowledged_at': self.acknowledged_at.isoformat() if self.acknowledged_at else None
        }

        # Parse JSON fields
        if self.action_items:
            try:
                result['action_items'] = json.loads(self.action_items)
            except:
                result['action_items'] = []
        else:
            result['action_items'] = []

        if self.related_questions:
            try:
                result['related_questions'] = json.loads(self.related_questions)
            except:
                result['related_questions'] = []
        else:
            result['related_questions'] = []

        return result

    @classmethod
    def create_deduction_opportunity(cls, session_id: str, title: str, description: str,
                                   estimated_savings: int = None, questions: list = None):
        """Helper method to create a deduction opportunity insight"""
        import json

        return cls(
            filing_session_id=session_id,
            insight_type=InsightType.DEDUCTION_OPPORTUNITY,
            priority=InsightPriority.HIGH if estimated_savings and estimated_savings > 500 else InsightPriority.MEDIUM,
            title=title,
            description=description,
            estimated_savings_chf=estimated_savings,
            related_questions=json.dumps(questions) if questions else None
        )
