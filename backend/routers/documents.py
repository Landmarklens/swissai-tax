"""
Documents API Router
Handles tax document upload and processing endpoints
"""

import asyncio
import json
import logging
import os
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from db.session import get_db
from services.document_service import DocumentService
from services.ai_document_intelligence_service import AIDocumentIntelligenceService
from core.security import get_current_user
from database.connection import execute_query

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize document service
doc_service = DocumentService()

# Supported file extensions for AI processing
SUPPORTED_EXTENSIONS = ('.pdf', '.jpg', '.jpeg', '.png', '.webp')
MAX_PROCESSING_SIZE_MB = 10


async def process_document_background(document_id: str, s3_key: str, file_name: str, user_id: str):
    """
    Background task to process document with AI Intelligence.

    This runs asynchronously without blocking the HTTP response.
    """
    try:
        # Validate file type
        if not file_name.lower().endswith(SUPPORTED_EXTENSIONS):
            logger.warning(f"Skipping auto-processing for unsupported file type: {file_name}")
            execute_query(
                "UPDATE swisstax.documents SET ocr_status = 'skipped' WHERE id = %s",
                (document_id,),
                fetch=False
            )
            return

        # Get AI API key
        api_key = os.getenv('ANTHROPIC_API_KEY')
        if not api_key:
            logger.warning("ANTHROPIC_API_KEY not set, marking document as pending")
            execute_query(
                "UPDATE swisstax.documents SET ocr_status = 'pending' WHERE id = %s",
                (document_id,),
                fetch=False
            )
            return

        # Get S3 configuration
        from services.document_service import S3_BUCKET, s3_client

        # Update status to processing
        execute_query(
            "UPDATE swisstax.documents SET ocr_status = 'processing' WHERE id = %s",
            (document_id,),
            fetch=False
        )

        # Download document from S3 with timeout
        logger.info(f"Downloading document {document_id} from S3: {s3_key}")

        try:
            async with asyncio.timeout(10):  # 10 second download timeout
                loop = asyncio.get_event_loop()
                s3_response = await loop.run_in_executor(
                    None,
                    lambda: s3_client.get_object(Bucket=S3_BUCKET, Key=s3_key)
                )
                image_bytes = s3_response['Body'].read()
        except asyncio.TimeoutError:
            raise Exception("S3 download timeout after 10 seconds")

        # Check file size
        file_size_mb = len(image_bytes) / (1024 * 1024)
        if file_size_mb > MAX_PROCESSING_SIZE_MB:
            raise Exception(f"File too large for processing: {file_size_mb:.2f}MB (max {MAX_PROCESSING_SIZE_MB}MB)")

        # Handle PDF files - convert first page to image
        if file_name.lower().endswith('.pdf'):
            try:
                import pdf2image
                import io
                from PIL import Image

                logger.info(f"Converting PDF to image for document {document_id}")
                images = pdf2image.convert_from_bytes(image_bytes, first_page=1, last_page=1)

                if not images:
                    raise Exception("PDF conversion failed - no pages extracted")

                # Convert PIL Image to bytes
                img_byte_arr = io.BytesIO()
                images[0].save(img_byte_arr, format='PNG')
                image_bytes = img_byte_arr.getvalue()

            except ImportError:
                raise Exception("pdf2image library not installed. Run: pip install pdf2image")
            except Exception as e:
                raise Exception(f"PDF conversion failed: {str(e)}")

        # Initialize AI service
        ai_service = AIDocumentIntelligenceService(
            ai_provider='anthropic',
            api_key=api_key
        )

        # Analyze document with timeout
        logger.info(f"Starting AI analysis for document {document_id}")

        try:
            async with asyncio.timeout(30):  # 30 second AI processing timeout
                loop = asyncio.get_event_loop()
                analysis_result = await loop.run_in_executor(
                    None,
                    lambda: ai_service.analyze_document(
                        image_bytes=image_bytes,
                        document_type=None  # Auto-detect
                    )
                )
        except asyncio.TimeoutError:
            raise Exception("AI processing timeout after 30 seconds")

        # Update database with results
        update_query = """
            UPDATE swisstax.documents
            SET ocr_status = 'completed',
                ocr_result = %s,
                processed_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """
        execute_query(update_query, (
            json.dumps(analysis_result),
            document_id
        ), fetch=False)

        logger.info(
            f"Document {document_id} processed successfully: "
            f"{analysis_result['document_type']} (confidence: {analysis_result['confidence']:.2f})"
        )

    except Exception as processing_error:
        logger.error(f"Background processing failed for document {document_id}: {processing_error}", exc_info=True)

        # Update status to failed with error message
        update_query = """
            UPDATE swisstax.documents
            SET ocr_status = 'failed',
                ocr_result = %s
            WHERE id = %s
        """
        error_data = {
            'error': str(processing_error),
            'timestamp': asyncio.get_event_loop().time()
        }
        execute_query(update_query, (
            json.dumps(error_data),
            document_id
        ), fetch=False)


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
    current_user = Depends(get_current_user),
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
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Save document metadata after successful S3 upload (NO automatic processing)

    - Records document details in database
    - Sets status to 'pending' (awaiting manual trigger)
    - Returns document ID immediately
    - Use POST /{document_id}/process to trigger AI processing
    """
    try:
        user_id = str(current_user.id)

        # Save metadata with user_id and initial status
        insert_query = """
            INSERT INTO swisstax.documents (
                session_id, user_id, document_type_id, file_name, file_size,
                mime_type, s3_key, s3_bucket, ocr_status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'pending')
            RETURNING id::text, session_id, document_type_id, file_name, s3_key, ocr_status as status
        """

        from services.document_service import S3_BUCKET

        file_extension = request.file_name.split('.')[-1] if '.' in request.file_name else ''
        mime_types = {
            'pdf': 'application/pdf',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'webp': 'image/webp'
        }
        mime_type = mime_types.get(file_extension.lower(), 'application/octet-stream')

        result = execute_query(insert_query, (
            request.session_id,
            user_id,
            request.document_type_id,
            request.file_name,
            request.file_size,
            mime_type,
            request.s3_key,
            S3_BUCKET
        ), fetch=True)[0]

        document_id = result['id']

        logger.info(f"Document {document_id} saved for user {user_id}, awaiting manual processing trigger")

        # Return immediately with pending status
        result['processing_status'] = 'pending'
        result['message'] = 'Document uploaded successfully. Use /process endpoint to start AI processing.'

        return result

    except Exception as e:
        logger.error(f"Error saving document metadata: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save document: {str(e)}"
        )


@router.post("/{document_id}/process", response_model=dict)
async def trigger_document_processing(
    document_id: str,
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Manually trigger AI processing for a document

    - Starts background AI intelligence processing
    - Document must be in 'pending' status
    - Returns immediately with status 'processing'
    - Poll /{document_id}/status for results
    """
    try:
        user_id = str(current_user.id)

        # Get document details
        query = """
            SELECT
                id::text,
                s3_key,
                file_name,
                ocr_status,
                user_id
            FROM swisstax.documents
            WHERE id = %s::uuid
        """
        documents = execute_query(query, (document_id,), fetch=True)

        if not documents or len(documents) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document {document_id} not found"
            )

        doc = documents[0]

        # Verify ownership
        if doc['user_id'] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to process this document"
            )

        # Check if already processing or completed
        if doc['ocr_status'] in ['processing', 'completed']:
            return {
                'document_id': document_id,
                'status': doc['ocr_status'],
                'message': f"Document is already {doc['ocr_status']}"
            }

        # Schedule background processing
        background_tasks.add_task(
            process_document_background,
            document_id=document_id,
            s3_key=doc['s3_key'],
            file_name=doc['file_name'],
            user_id=user_id
        )

        logger.info(f"Manual processing triggered for document {document_id} by user {user_id}")

        return {
            'document_id': document_id,
            'status': 'processing',
            'message': 'AI processing started. Poll /status endpoint for results.'
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error triggering document processing: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to trigger processing: {str(e)}"
        )


@router.get("/{session_id}", response_model=List[dict])
async def list_documents(
    session_id: str,
    current_user = Depends(get_current_user),
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
    current_user = Depends(get_current_user),
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


@router.get("/{document_id}/status", response_model=dict)
async def get_document_processing_status(
    document_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get AI processing status for a document

    - Returns processing status and extracted data if available
    - Statuses: pending, processing, completed, failed, skipped
    """
    try:
        query = """
            SELECT
                id::text,
                file_name,
                ocr_status as status,
                ocr_result,
                processed_at,
                created_at
            FROM swisstax.documents
            WHERE id = %s::uuid
        """
        document = execute_query(query, (document_id,), fetch=True)

        if not document or len(document) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document {document_id} not found"
            )

        doc = document[0]
        response = {
            'document_id': doc['id'],
            'file_name': doc['file_name'],
            'status': doc['status'],
            'created_at': doc['created_at'].isoformat() if doc['created_at'] else None,
            'processed_at': doc['processed_at'].isoformat() if doc['processed_at'] else None
        }

        # Parse OCR result if available
        if doc['ocr_result']:
            try:
                ocr_data = json.loads(doc['ocr_result']) if isinstance(doc['ocr_result'], str) else doc['ocr_result']

                if doc['status'] == 'completed':
                    response['document_type'] = ocr_data.get('document_type')
                    response['document_type_name'] = ocr_data.get('document_type_name')
                    response['extracted_data'] = ocr_data.get('extracted_data', {})
                    response['confidence'] = ocr_data.get('confidence', 0.0)
                    response['ai_provider'] = ocr_data.get('ai_provider', 'anthropic')
                elif doc['status'] == 'failed':
                    response['error'] = ocr_data.get('error', 'Unknown error')

            except json.JSONDecodeError:
                logger.warning(f"Failed to parse ocr_result for document {document_id}")

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting document status: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get document status: {str(e)}"
        )


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: str,
    current_user = Depends(get_current_user),
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


# ============================================================================
# USER DOCUMENT MANAGEMENT ENDPOINTS
# ============================================================================

@router.get("/user/storage", response_model=dict)
async def get_user_storage(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user's storage usage information

    - Returns total storage used and limit
    - Includes document count
    """
    try:
        # Convert UUID to string for database query
        user_id_str = str(current_user.id)
        storage_info = doc_service.get_user_storage_info(user_id_str)
        return storage_info

    except Exception as e:
        logger.error(f"Error getting user storage for user {current_user.id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get storage info: {str(e)}"
        )


@router.get("/user/all", response_model=List[dict])
async def list_all_user_documents(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get list of all documents for the current user

    - Returns documents grouped by year
    - Includes all sessions
    """
    try:
        # Convert UUID to string for database query
        user_id_str = str(current_user.id)
        documents = doc_service.list_all_user_documents(user_id_str)
        return documents

    except Exception as e:
        logger.error(f"Error listing user documents for user {current_user.id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list documents: {str(e)}"
        )


@router.post("/user/download-all", response_model=dict)
async def download_all_documents(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Download all user documents as a ZIP archive

    - Creates a ZIP file with all documents
    - Returns presigned download URL
    """
    try:
        # Convert UUID to string for database query
        user_id_str = str(current_user.id)
        result = doc_service.create_documents_zip(user_id_str)
        return result

    except Exception as e:
        logger.error(f"Error creating document archive for user {current_user.id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create document archive: {str(e)}"
        )


@router.delete("/user/old", response_model=dict)
async def delete_old_documents(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete documents older than 7 years

    - Follows Swiss retention requirements
    - Returns count of deleted documents
    """
    try:
        # Convert UUID to string for database query
        user_id_str = str(current_user.id)
        result = doc_service.delete_old_documents(user_id_str, years=7)
        return result

    except Exception as e:
        logger.error(f"Error deleting old documents for user {current_user.id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete old documents: {str(e)}"
        )
