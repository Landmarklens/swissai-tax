"""
Documents API Router
Handles tax document upload and processing endpoints
"""

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from db.session import get_db
from services.document_service import DocumentService
from utils.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize document service
doc_service = DocumentService()


# Pydantic models
class GetPresignedUrlRequest(BaseModel):
    session_id: str
    document_type: str
    file_name: str
    expires_in: int = Field(default=3600, ge=300, le=7200)


class SaveDocumentRequest(BaseModel):
    session_id: str
    document_type_id: int
    file_name: str
    s3_key: str
    file_size: Optional[int] = None


class ProcessDocumentRequest(BaseModel):
    document_id: str


@router.post("/presigned-url", response_model=dict)
async def get_upload_url(
    request: GetPresignedUrlRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a presigned URL for uploading documents to S3

    - Returns URL and fields for direct S3 upload
    - URL expires after specified time (default 1 hour)
    """
    try:
        result = doc_service.generate_presigned_url(
            session_id=request.session_id,
            document_type=request.document_type,
            file_name=request.file_name,
            expires_in=request.expires_in
        )

        return result

    except Exception as e:
        logger.error(f"Error generating presigned URL: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate upload URL: {str(e)}"
        )


@router.post("/metadata", response_model=dict)
async def save_document(
    request: SaveDocumentRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Save document metadata after successful S3 upload

    - Records document details in database
    - Returns document ID and status
    """
    try:
        result = doc_service.save_document_metadata(
            session_id=request.session_id,
            document_type_id=request.document_type_id,
            file_name=request.file_name,
            s3_key=request.s3_key,
            file_size=request.file_size
        )

        return result

    except Exception as e:
        logger.error(f"Error saving document metadata: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save document: {str(e)}"
        )


@router.get("/{session_id}", response_model=List[dict])
async def list_documents(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get list of all documents for a session

    - Returns document details and status
    - Includes OCR extraction status
    """
    try:
        documents = doc_service.list_session_documents(session_id)
        return documents

    except Exception as e:
        logger.error(f"Error listing documents: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list documents: {str(e)}"
        )


@router.get("/{document_id}/url", response_model=dict)
async def get_document_url(
    document_id: str,
    expires_in: int = 3600,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get presigned download URL for a document

    - Returns temporary download URL
    - URL expires after specified time
    """
    try:
        url = doc_service.get_document_url(document_id, expires_in)

        if not url:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document {document_id} not found"
            )

        return {
            "url": url,
            "expires_in": expires_in
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting document URL: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get document URL: {str(e)}"
        )


@router.post("/{document_id}/extract", response_model=dict)
async def extract_document_data(
    document_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Extract data from document using AWS Textract

    - Processes document with OCR
    - Returns extracted text and structured data
    """
    try:
        result = doc_service.process_document_with_textract(document_id)
        return result

    except Exception as e:
        logger.error(f"Error extracting document data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to extract document data: {str(e)}"
        )


@router.get("/{document_id}/extraction-status", response_model=dict)
async def check_extraction_status(
    document_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Check OCR extraction status for a document

    - Returns extraction progress and results if complete
    """
    try:
        result = doc_service.check_textract_job(document_id)
        return result

    except Exception as e:
        logger.error(f"Error checking extraction status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to check extraction status: {str(e)}"
        )


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a document

    - Removes document from S3 and database
    """
    try:
        success = doc_service.delete_document(document_id)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document {document_id} not found"
            )

        return None

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete document: {str(e)}"
        )
