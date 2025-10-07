"""
Document Intelligence API Endpoints

REST API for AI-powered document analysis and data extraction.
Supports Swiss tax documents like Lohnausweis, AHV statements, etc.
"""

import logging
import os
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from db.session import get_db
from services.ai_document_intelligence_service import (
    AIDocumentIntelligenceService, DocumentIntelligenceError,
    UnsupportedDocumentError)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/documents", tags=["Document Intelligence"])


# ============================================================================
# Request/Response Models
# ============================================================================

class DocumentAnalysisResponse(BaseModel):
    """Document analysis result"""
    document_type: str
    document_type_name: str
    extracted_data: dict
    confidence: float
    timestamp: str
    ai_provider: str


class DocumentMappingResponse(BaseModel):
    """Mapped tax profile fields"""
    tax_profile_fields: dict
    document_type: str
    confidence: float


class BulkAnalysisResponse(BaseModel):
    """Bulk document analysis result"""
    total_documents: int
    successful: int
    failed: int
    by_type: dict
    documents: List[dict]


class SupportedDocumentsResponse(BaseModel):
    """List of supported document types"""
    supported_types: dict


# ============================================================================
# Document Intelligence Endpoints
# ============================================================================

@router.get("/supported-types", response_model=SupportedDocumentsResponse)
def get_supported_document_types():
    """
    Get list of supported document types.

    Returns information about all document types that can be analyzed.
    """
    service = AIDocumentIntelligenceService(
        ai_provider='anthropic',
        api_key='dummy'  # Just for getting metadata
    )

    return SupportedDocumentsResponse(
        supported_types=service.DOCUMENT_TYPES
    )


@router.post("/analyze", response_model=DocumentAnalysisResponse)
async def analyze_document(
    file: UploadFile = File(...),
    document_type: Optional[str] = Form(None),
    ai_provider: str = Form('anthropic'),
    db: Session = Depends(get_db)
):
    """
    Analyze a tax document and extract structured data.

    Upload a document image (JPG, PNG, WEBP, PDF) and get extracted data.

    Parameters:
    - file: Document image file
    - document_type: Optional document type hint (will auto-detect if not provided)
    - ai_provider: 'anthropic' (default) or 'openai'

    Returns:
    - Extracted structured data from the document
    """
    try:
        # Get API key from environment
        if ai_provider == 'anthropic':
            api_key = os.getenv('ANTHROPIC_API_KEY')
        else:
            api_key = os.getenv('OPENAI_API_KEY')

        if not api_key:
            raise HTTPException(
                status_code=500,
                detail=f"AI provider API key not configured. Set {ai_provider.upper()}_API_KEY environment variable."
            )

        # Read uploaded file
        image_bytes = await file.read()

        # Validate file size (max 10MB)
        if len(image_bytes) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail="File too large. Maximum size is 10MB."
            )

        # Initialize service
        service = AIDocumentIntelligenceService(
            ai_provider=ai_provider,
            api_key=api_key
        )

        # Analyze document
        result = service.analyze_document(
            image_bytes=image_bytes,
            document_type=document_type
        )

        logger.info(
            f"Analyzed document: {result['document_type']} "
            f"(confidence: {result['confidence']:.2f})"
        )

        return DocumentAnalysisResponse(**result)

    except UnsupportedDocumentError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except DocumentIntelligenceError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Document analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {e}")


@router.post("/analyze-and-map", response_model=DocumentMappingResponse)
async def analyze_and_map_document(
    file: UploadFile = File(...),
    document_type: Optional[str] = Form(None),
    ai_provider: str = Form('anthropic'),
    db: Session = Depends(get_db)
):
    """
    Analyze document and map extracted data to tax profile fields.

    This endpoint not only extracts data but also maps it to the correct
    fields in the user's tax profile, ready to be saved.

    Parameters:
    - file: Document image file
    - document_type: Optional document type hint
    - ai_provider: 'anthropic' or 'openai'

    Returns:
    - Mapped data ready to update tax profile
    """
    try:
        # Get API key
        if ai_provider == 'anthropic':
            api_key = os.getenv('ANTHROPIC_API_KEY')
        else:
            api_key = os.getenv('OPENAI_API_KEY')

        if not api_key:
            raise HTTPException(
                status_code=500,
                detail=f"AI provider API key not configured"
            )

        # Read file
        image_bytes = await file.read()

        if len(image_bytes) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large (max 10MB)")

        # Initialize service
        service = AIDocumentIntelligenceService(
            ai_provider=ai_provider,
            api_key=api_key
        )

        # Analyze document
        result = service.analyze_document(
            image_bytes=image_bytes,
            document_type=document_type
        )

        # Map to tax profile fields
        mapped_fields = service.map_to_tax_profile(
            result['extracted_data'],
            result['document_type']
        )

        logger.info(
            f"Mapped {len(mapped_fields)} fields from {result['document_type']}"
        )

        return DocumentMappingResponse(
            tax_profile_fields=mapped_fields,
            document_type=result['document_type'],
            confidence=result['confidence']
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Document analysis and mapping failed: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {e}")


@router.post("/analyze-multiple", response_model=BulkAnalysisResponse)
async def analyze_multiple_documents(
    files: List[UploadFile] = File(...),
    ai_provider: str = Form('anthropic'),
    db: Session = Depends(get_db)
):
    """
    Analyze multiple documents in bulk.

    Upload multiple document images and get extracted data for all.
    Useful for processing an entire folder of tax documents at once.

    Parameters:
    - files: List of document image files
    - ai_provider: 'anthropic' or 'openai'

    Returns:
    - Aggregated analysis results for all documents
    """
    try:
        # Get API key
        if ai_provider == 'anthropic':
            api_key = os.getenv('ANTHROPIC_API_KEY')
        else:
            api_key = os.getenv('OPENAI_API_KEY')

        if not api_key:
            raise HTTPException(
                status_code=500,
                detail=f"AI provider API key not configured"
            )

        # Limit number of files
        if len(files) > 20:
            raise HTTPException(
                status_code=400,
                detail="Too many files. Maximum is 20 documents per request."
            )

        # Initialize service
        service = AIDocumentIntelligenceService(
            ai_provider=ai_provider,
            api_key=api_key
        )

        # Read all files
        documents = []
        for file in files:
            image_bytes = await file.read()

            if len(image_bytes) > 10 * 1024 * 1024:
                logger.warning(f"Skipping {file.filename}: too large")
                continue

            documents.append({
                'image_bytes': image_bytes,
                'filename': file.filename
            })

        # Analyze all documents
        results = service.analyze_multiple_documents(documents)

        logger.info(
            f"Analyzed {len(documents)} documents: "
            f"{results['successful']} successful, {results['failed']} failed"
        )

        return BulkAnalysisResponse(**results)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Bulk document analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Bulk analysis failed: {e}")


@router.post("/update-profile/{filing_id}")
async def update_profile_from_document(
    filing_id: str,
    file: UploadFile = File(...),
    document_type: Optional[str] = Form(None),
    ai_provider: str = Form('anthropic'),
    db: Session = Depends(get_db)
):
    """
    Analyze document and automatically update tax filing profile.

    This endpoint analyzes the document, extracts data, maps it to tax fields,
    and updates the filing profile in one operation.

    Parameters:
    - filing_id: Tax filing session ID to update
    - file: Document image file
    - document_type: Optional document type hint
    - ai_provider: 'anthropic' or 'openai'

    Returns:
    - Updated fields and status
    """
    try:
        # Get API key
        if ai_provider == 'anthropic':
            api_key = os.getenv('ANTHROPIC_API_KEY')
        else:
            api_key = os.getenv('OPENAI_API_KEY')

        if not api_key:
            raise HTTPException(
                status_code=500,
                detail=f"AI provider API key not configured"
            )

        # Read file
        image_bytes = await file.read()

        if len(image_bytes) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large (max 10MB)")

        # Initialize services
        from services.filing_orchestration_service import \
            FilingOrchestrationService

        doc_service = AIDocumentIntelligenceService(
            ai_provider=ai_provider,
            api_key=api_key
        )
        filing_service = FilingOrchestrationService(db=db)

        # Get filing
        filing = filing_service.get_filing(filing_id)
        if not filing:
            raise HTTPException(status_code=404, detail=f"Filing {filing_id} not found")

        # Analyze document
        result = doc_service.analyze_document(
            image_bytes=image_bytes,
            document_type=document_type
        )

        # Map to tax fields
        mapped_fields = doc_service.map_to_tax_profile(
            result['extracted_data'],
            result['document_type']
        )

        if not mapped_fields:
            return {
                'success': True,
                'document_type': result['document_type'],
                'confidence': result['confidence'],
                'updated_fields': {},
                'message': 'Document analyzed but no fields could be mapped to tax profile'
            }

        # Update filing profile
        current_profile = filing.profile or {}
        current_profile.update(mapped_fields)

        filing.profile = current_profile
        filing.updated_at = datetime.utcnow()
        db.commit()

        logger.info(
            f"Updated filing {filing_id} with {len(mapped_fields)} fields "
            f"from {result['document_type']}"
        )

        return {
            'success': True,
            'document_type': result['document_type'],
            'confidence': result['confidence'],
            'updated_fields': mapped_fields,
            'message': f"Successfully updated {len(mapped_fields)} fields"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Profile update from document failed: {e}")
        raise HTTPException(status_code=500, detail=f"Update failed: {e}")


@router.get("/test-connection")
def test_ai_connection(
    ai_provider: str = 'anthropic'
):
    """
    Test AI provider API connection.

    Useful for verifying API keys are configured correctly.

    Parameters:
    - ai_provider: 'anthropic' or 'openai'

    Returns:
    - Connection status
    """
    try:
        if ai_provider == 'anthropic':
            api_key = os.getenv('ANTHROPIC_API_KEY')
        else:
            api_key = os.getenv('OPENAI_API_KEY')

        if not api_key:
            return {
                'connected': False,
                'provider': ai_provider,
                'error': 'API key not configured'
            }

        # Try to initialize service
        service = AIDocumentIntelligenceService(
            ai_provider=ai_provider,
            api_key=api_key
        )

        return {
            'connected': True,
            'provider': ai_provider,
            'message': 'API connection successful'
        }

    except Exception as e:
        return {
            'connected': False,
            'provider': ai_provider,
            'error': str(e)
        }
