"""
Models Package

Imports all SQLAlchemy models to ensure they're registered with the Base
and relationships can be resolved properly.
"""

from db.base import Base

from .document import Document
from .interview_session import InterviewSession
from .reset_token import ResetToken
# Import all models to register them with SQLAlchemy
from .swisstax.user import User
from .tax_answer import TaxAnswer
from .tax_calculation import CalculationType, TaxCalculation
from .tax_filing_session import FilingStatus, TaxFilingSession
from .tax_insight import InsightType, TaxInsight
from .user_counter import UserCounter

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
