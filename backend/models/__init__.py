"""
Models Package

Imports all SQLAlchemy models to ensure they're registered with the Base
and relationships can be resolved properly.
"""

from db.base import Base

# Import all models to register them with SQLAlchemy
from .swisstax.user import User
from .tax_filing_session import TaxFilingSession, FilingStatus
from .tax_answer import TaxAnswer
from .tax_insight import TaxInsight, InsightType
from .tax_calculation import TaxCalculation, CalculationType
from .user_counter import UserCounter
from .reset_token import ResetToken
from .interview_session import InterviewSession
from .document import Document

__all__ = [
    'Base',
    'User',
    'TaxFilingSession',
    'FilingStatus',
    'TaxAnswer',
    'TaxInsight',
    'InsightType',
    'TaxCalculation',
    'CalculationType',
    'UserCounter',
    'ResetToken',
    'InterviewSession',
    'Document',
]
