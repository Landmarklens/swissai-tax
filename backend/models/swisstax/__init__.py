"""
SwissAI Tax Models
All models for the swisstax schema
"""

from .base import Base
from .user import User
from .interview import InterviewSession, InterviewAnswer, Question
from .document import Document, DocumentType, RequiredDocument
from .tax import TaxRate, StandardDeduction, TaxYear
from .filing import Filing
from .subscription import Subscription, Payment
from .settings import UserSettings

__all__ = [
    'Base',
    'User',
    'InterviewSession',
    'InterviewAnswer',
    'Question',
    'Document',
    'DocumentType',
    'RequiredDocument',
    'TaxRate',
    'StandardDeduction',
    'TaxYear',
    'Filing',
    'Subscription',
    'Payment',
    'UserSettings',
]
