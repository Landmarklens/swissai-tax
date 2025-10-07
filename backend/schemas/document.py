"""
Document schemas for PDF upload and processing
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class UserDocumentMetadata(BaseModel):
    """Document metadata response"""
    id: UUID
    user_id: UUID
    filename: str
    file_size: Optional[int] = None
    upload_status: str  # pending, processing, completed, failed
    created_at: datetime

    class Config:
        from_attributes = True


class UserDocumentContent(BaseModel):
    """Document extracted content"""
    full_text: str
