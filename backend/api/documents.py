"""Document API endpoints"""

import os
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from pydantic import BaseModel

from services.document_service import DocumentService

router = APIRouter()
document_service = DocumentService()

class UploadRequest(BaseModel):
    session_id: str
    document_type: str
    file_name: str

class ProcessDocumentRequest(BaseModel):
    document_id: str

class DocumentResponse(BaseModel):
    document_id: str
    file_name: str
    document_type: str
    status: str
    upload_url: Optional[str] = None
    download_url: Optional[str] = None

@router.post("/upload")
async def get_upload_url(request: UploadRequest) -> Dict[str, Any]:
    """Generate a presigned URL for document upload"""
    try:
        # Map document type to document_type_id
        document_type_mapping = {
            'lohnausweis': 1,
            'unemployment_statement': 2,
            'insurance_benefits': 3,
            'pension_certificate': 4,
            'pillar_3a_certificate': 5,
            'property_tax_statement': 6,
            'mortgage_statement': 7,
            'securities_statement': 8,
            'donation_receipts': 9,
            'medical_receipts': 10,
            'alimony_receipts': 11,
            'rental_contract': 12,
            'other': 13
        }

        document_type_id = document_type_mapping.get(request.document_type, 13)

        # Generate presigned URL
        presigned_data = document_service.generate_presigned_url(
            session_id=request.session_id,
            document_type=request.document_type,
            file_name=request.file_name
        )

        # Save metadata to database
        metadata = document_service.save_document_metadata(
            session_id=request.session_id,
            document_type_id=document_type_id,
            file_name=request.file_name,
            s3_key=presigned_data['s3_key']
        )

        return {
            **presigned_data,
            'document_id': metadata.get('id'),
            'message': 'Upload URL generated successfully'
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
async def list_documents(session_id: str = Query(...)) -> List[Dict[str, Any]]:
    """List all documents for a session"""
    try:
        documents = document_service.list_session_documents(session_id)

        # Add download URLs for processed documents
        for doc in documents:
            if doc['status'] in ['uploaded', 'processed']:
                doc['download_url'] = document_service.get_document_url(doc['id'])

        return documents
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/download")
async def get_download_url(document_id: str = Query(...)) -> Dict[str, Any]:
    """Get a presigned URL for downloading a document"""
    try:
        url = document_service.get_document_url(document_id)
        if not url:
            raise HTTPException(status_code=404, detail="Document not found")

        return {
            'download_url': url,
            'expires_in': 3600
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/")
async def delete_document(document_id: str = Query(...)) -> Dict[str, Any]:
    """Delete a document"""
    try:
        success = document_service.delete_document(document_id)
        if not success:
            raise HTTPException(status_code=404, detail="Document not found")

        return {'message': 'Document deleted successfully'}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process")
async def process_document(request: ProcessDocumentRequest) -> Dict[str, Any]:
    """Start OCR processing for a document"""
    try:
        result = document_service.process_document_with_textract(request.document_id)

        if 'error' in result:
            raise HTTPException(status_code=400, detail=result['error'])

        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
async def check_processing_status(document_id: str = Query(...)) -> Dict[str, Any]:
    """Check the OCR processing status of a document"""
    try:
        result = document_service.check_textract_job(document_id)

        if 'error' in result:
            raise HTTPException(status_code=400, detail=result['error'])

        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload-direct")
async def upload_document_directly(
    session_id: str = Query(...),
    document_type: str = Query(...),
    file: UploadFile = File(...)
) -> Dict[str, Any]:
    """Direct file upload endpoint (alternative to presigned URLs)"""
    try:
        # Validate file size
        if file.size > 10 * 1024 * 1024:  # 10MB
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB")

        # Validate file type
        allowed_types = ['application/pdf', 'image/jpeg', 'image/png']
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Invalid file type. Only PDF and images are allowed")

        # Read file content
        content = await file.read()

        # Upload to S3 directly
        import boto3
        from config import settings
        # Use explicit regional endpoint to avoid signature mismatch
        endpoint_url = f'https://s3.{settings.AWS_S3_REGION}.amazonaws.com'
        s3_client = boto3.client('s3', region_name=settings.AWS_S3_REGION, endpoint_url=endpoint_url)

        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'pdf'
        s3_key = f"documents/{session_id}/{document_type}/{file.filename}"

        s3_client.put_object(
            Bucket=settings.AWS_S3_BUCKET_NAME,
            Key=s3_key,
            Body=content,
            ContentType=file.content_type,
            ServerSideEncryption='AES256'
        )

        # Save metadata
        document_type_id = 1  # Default, should be mapped properly
        metadata = document_service.save_document_metadata(
            session_id=session_id,
            document_type_id=document_type_id,
            file_name=file.filename,
            s3_key=s3_key,
            file_size=file.size
        )

        # Start OCR processing automatically
        processing_result = document_service.process_document_with_textract(metadata['id'])

        return {
            'document_id': metadata['id'],
            'file_name': file.filename,
            'status': 'uploaded',
            'processing_status': processing_result.get('status', 'pending'),
            'message': 'Document uploaded and processing started'
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))