"""API endpoints for AI document extraction"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, status
from sqlalchemy.orm import Session, joinedload, selectinload
from pydantic import BaseModel, Field
import uuid
from datetime import datetime

from ..database.database import get_db
from ..services.ai_extraction_service import AIExtractionService, ExtractionStatus
from ..services.pdf_generation_service import PDFGenerationService
from ..models.swisstax.ai_extraction import (
    ExtractionSession,
    DocumentExtraction,
    TaxProfile,
    ConflictResolution,
    MinimalQuestionnaireResponse
)
from ..models import Document
from ..auth import get_current_user
from ..schemas.user import User
from fastapi.responses import StreamingResponse
import logging
import io

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/ai", tags=["AI Extraction"])


# Pydantic schemas
class ExtractionRequest(BaseModel):
    """Request to extract data from documents"""
    document_ids: List[str] = Field(..., description="List of document IDs to process")
    user_context: Dict[str, Any] = Field(default_factory=dict, description="User context and answers")
    extraction_mode: str = Field(default="auto", description="Extraction mode: auto, manual, hybrid")


class ExtractionResponse(BaseModel):
    """Response from extraction"""
    session_id: str
    status: str
    confidence_score: Optional[float]
    extracted_data: Dict[str, Any]
    conflicts: List[Dict[str, Any]]
    missing_fields: List[str]
    processing_time_ms: Optional[int]


class ConflictResolutionRequest(BaseModel):
    """Request to resolve conflicts"""
    session_id: str
    resolutions: List[Dict[str, Any]]


class ValidationRequest(BaseModel):
    """Request to validate extracted data"""
    session_id: str
    validated_data: Dict[str, Any]


class MinimalQuestionAnswer(BaseModel):
    """Answer to a minimal questionnaire question"""
    question_key: str
    answer_value: str
    is_skip: bool = False


class BulkDocumentUploadRequest(BaseModel):
    """Request for bulk document upload"""
    files: List[UploadFile] = Field(..., description="List of files to upload")
    document_category: Optional[str] = Field(None, description="Category for all documents")


@router.post("/extract", response_model=ExtractionResponse)
async def extract_from_documents(
    request: ExtractionRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Extract tax-relevant data from uploaded documents using AI
    """
    try:
        # Initialize extraction service
        service = AIExtractionService(db)

        # Check documents exist and belong to user
        documents = db.query(Document).filter(
            Document.id.in_(request.document_ids),
            Document.user_id == current_user.id
        ).all()

        if len(documents) != len(request.document_ids):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Some documents not found or not authorized"
            )

        # Start extraction (could be async with background task for large docs)
        result = await service.extract_from_documents(
            user_id=current_user.id,
            document_ids=request.document_ids,
            user_context=request.user_context
        )

        return ExtractionResponse(
            session_id=result.metadata.get('session_id'),
            status=ExtractionStatus.COMPLETED,
            confidence_score=result.confidence_score,
            extracted_data=result.extracted_data,
            conflicts=result.conflicts,
            missing_fields=result.missing_fields,
            processing_time_ms=result.metadata.get('processing_time_ms')
        )

    except Exception as e:
        logger.error(f"Extraction failed for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process documents. Please try again or contact support."
        )


@router.get("/extraction/{session_id}")
async def get_extraction_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get extraction session details and results
    """
    session = db.query(ExtractionSession)\
        .options(
            selectinload(ExtractionSession.document_extractions),
            selectinload(ExtractionSession.conflict_resolutions)
        )\
        .filter(
            ExtractionSession.id == session_id,
            ExtractionSession.user_id == current_user.id
        ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Extraction session not found"
        )

    # Get all document extractions
    extractions = db.query(DocumentExtraction).filter(
        DocumentExtraction.extraction_session_id == session_id
    ).all()

    # Get conflicts if any
    conflicts = db.query(ConflictResolution).filter(
        ConflictResolution.extraction_session_id == session_id
    ).all()

    return {
        "session": {
            "id": str(session.id),
            "status": session.status,
            "confidence_score": float(session.confidence_score) if session.confidence_score else None,
            "extracted_data": session.extracted_data,
            "conflicts": session.conflicts,
            "created_at": session.created_at.isoformat() if session.created_at else None,
            "completed_at": session.completed_at.isoformat() if session.completed_at else None,
            "processing_time_ms": session.processing_time_ms
        },
        "extractions": [
            {
                "id": str(ext.id),
                "document_id": str(ext.document_id),
                "document_type": ext.document_type,
                "extracted_fields": ext.extracted_fields,
                "confidence_scores": ext.confidence_scores
            }
            for ext in extractions
        ],
        "conflicts": [
            {
                "id": str(conf.id),
                "field_name": conf.field_name,
                "conflicting_values": conf.conflicting_values,
                "resolved_value": conf.resolved_value,
                "resolution_method": conf.resolution_method
            }
            for conf in conflicts
        ]
    }


@router.post("/reconcile")
async def reconcile_conflicts(
    request: ConflictResolutionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Resolve conflicts in extracted data
    """
    # Verify session belongs to user
    session = db.query(ExtractionSession).filter(
        ExtractionSession.id == request.session_id,
        ExtractionSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Extraction session not found"
        )

    # Process resolutions
    for resolution in request.resolutions:
        conflict = db.query(ConflictResolution).filter(
            ConflictResolution.extraction_session_id == request.session_id,
            ConflictResolution.field_name == resolution['field_name']
        ).first()

        if conflict:
            conflict.user_override = resolution['resolved_value']
            conflict.resolution_method = 'user_override'
            conflict.resolved_at = datetime.utcnow()
            conflict.resolved_by = current_user.id
            conflict.confidence_score = 1.0  # User override has full confidence

    # Update session with resolved data
    session.conflicts = []
    session.updated_at = datetime.utcnow()

    db.commit()

    return {"status": "success", "message": "Conflicts resolved"}


@router.post("/validate")
async def validate_extracted_data(
    request: ValidationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Validate and confirm extracted data
    """
    # Get session
    session = db.query(ExtractionSession).filter(
        ExtractionSession.id == request.session_id,
        ExtractionSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Extraction session not found"
        )

    # Update or create tax profile
    tax_profile = db.query(TaxProfile).filter(
        TaxProfile.user_id == current_user.id
    ).first()

    if not tax_profile:
        tax_profile = TaxProfile(
            user_id=current_user.id,
            profile_type=_determine_profile_type(request.validated_data)
        )
        db.add(tax_profile)

    # Update profile with validated data
    tax_profile.validated_data = request.validated_data
    tax_profile.last_extraction_id = request.session_id
    tax_profile.completeness_score = _calculate_completeness(request.validated_data)
    tax_profile.updated_at = datetime.utcnow()

    # Mark session as validated
    session.status = ExtractionStatus.COMPLETED
    session.extracted_data = request.validated_data

    db.commit()

    return {
        "status": "success",
        "message": "Data validated and saved",
        "completeness_score": float(tax_profile.completeness_score) if tax_profile.completeness_score else None
    }


# Minimal Questionnaire Endpoints

@router.get("/questions/minimal")
async def get_minimal_questions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get minimal questionnaire questions
    """
    from ..models.swisstax.interview import Question

    questions = db.query(Question).filter(
        Question.is_minimal == True,
        Question.is_active == True
    ).order_by(Question.sort_order).all()

    # Get user's previous answers if any
    from ..models.swisstax.filing import TaxFilingSession

    latest_session = db.query(TaxFilingSession).filter(
        TaxFilingSession.user_id == current_user.id
    ).order_by(TaxFilingSession.created_at.desc()).first()

    answers = {}
    if latest_session:
        responses = db.query(MinimalQuestionnaireResponse).filter(
            MinimalQuestionnaireResponse.session_id == latest_session.id
        ).all()
        answers = {r.question_key: r.answer_value for r in responses}

    return {
        "questions": [
            {
                "id": q.id,
                "key": q.id,
                "category": q.category,
                "text": q.question_text_en,  # Or based on user language
                "type": q.question_type,
                "options": q.options,
                "required": not q.skip_option_enabled,
                "skip_enabled": q.skip_option_enabled,
                "ai_extractable": q.ai_extractable,
                "extraction_sources": q.extraction_sources,
                "current_answer": answers.get(q.id)
            }
            for q in questions
        ]
    }


@router.post("/questions/answer")
async def save_minimal_answers(
    answers: List[MinimalQuestionAnswer],
    session_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Save answers to minimal questionnaire
    """
    from ..models.swisstax.filing import TaxFilingSession

    # Get or create filing session
    if session_id:
        filing_session = db.query(TaxFilingSession).filter(
            TaxFilingSession.id == session_id,
            TaxFilingSession.user_id == current_user.id
        ).first()
    else:
        # Create new session
        filing_session = TaxFilingSession(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            tax_year=datetime.now().year - 1,
            canton='',  # Will be set from answers
            status='in_progress',
            created_at=datetime.utcnow()
        )
        db.add(filing_session)
        db.flush()

    # Save answers
    for answer in answers:
        # Check if answer exists
        existing = db.query(MinimalQuestionnaireResponse).filter(
            MinimalQuestionnaireResponse.session_id == filing_session.id,
            MinimalQuestionnaireResponse.question_key == answer.question_key
        ).first()

        if existing:
            existing.answer_value = answer.answer_value if not answer.is_skip else "skip"
            existing.updated_at = datetime.utcnow()
        else:
            response = MinimalQuestionnaireResponse(
                user_id=current_user.id,
                session_id=filing_session.id,
                question_key=answer.question_key,
                answer_value=answer.answer_value if not answer.is_skip else "skip",
                answer_type="user_input",
                is_ai_suggested=False
            )
            db.add(response)

        # Update filing session canton if this is the canton question
        if answer.question_key == 'M01':
            filing_session.canton = answer.answer_value
        elif answer.question_key == 'M02':
            filing_session.municipality = answer.answer_value

    db.commit()

    return {
        "status": "success",
        "session_id": filing_session.id,
        "message": "Answers saved successfully"
    }


@router.get("/questions/next")
async def get_next_question(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get next relevant question based on conditions and previous answers
    """
    from ..models.swisstax.interview import Question
    from ..models.swisstax.ai_extraction import QuestionCondition

    # Get all answers so far
    responses = db.query(MinimalQuestionnaireResponse).filter(
        MinimalQuestionnaireResponse.session_id == session_id
    ).all()

    answered = {r.question_key: r.answer_value for r in responses}

    # Get all minimal questions
    questions = db.query(Question).filter(
        Question.is_minimal == True,
        Question.is_active == True
    ).order_by(Question.sort_order).all()

    # Find next unanswered question that meets conditions
    for question in questions:
        if question.id in answered:
            continue

        # Check conditions
        conditions = db.query(QuestionCondition).filter(
            QuestionCondition.target_question_id == question.id,
            QuestionCondition.is_active == True
        ).all()

        show_question = True
        for condition in conditions:
            if not _evaluate_condition(condition, answered):
                show_question = False
                break

        if show_question:
            return {
                "question": {
                    "id": question.id,
                    "key": question.id,
                    "text": question.question_text_en,
                    "type": question.question_type,
                    "options": question.options,
                    "required": not question.skip_option_enabled,
                    "skip_enabled": question.skip_option_enabled
                },
                "progress": {
                    "answered": len(answered),
                    "total": len(questions),
                    "percentage": int((len(answered) / len(questions)) * 100)
                }
            }

    return {
        "question": None,
        "complete": True,
        "message": "All questions answered"
    }


# Helper functions

def _determine_profile_type(data: Dict[str, Any]) -> str:
    """Determine user profile type from extracted data"""
    if data.get('self_employment'):
        return 'self_employed'
    elif data.get('securities') and len(data.get('securities', {}).get('holdings', [])) > 10:
        return 'investor'
    elif data.get('properties'):
        return 'property_owner'
    elif data.get('foreign_income'):
        return 'expat'
    else:
        return 'simple_employee'


def _calculate_completeness(data: Dict[str, Any]) -> float:
    """Calculate data completeness score"""
    required_fields = ['personal', 'employment', 'bank_accounts']
    optional_fields = ['securities', 'properties', 'pensions', 'deductions']

    score = 0
    total = len(required_fields) + (len(optional_fields) * 0.5)

    for field in required_fields:
        if data.get(field):
            score += 1

    for field in optional_fields:
        if data.get(field):
            score += 0.5

    return min(1.0, score / total) if total > 0 else 0


def _evaluate_condition(condition: Any, answers: Dict[str, str]) -> bool:
    """Evaluate a question condition safely"""
    try:
        import ast
        import operator

        # Safe operators mapping
        ops = {
            ast.Eq: operator.eq,
            ast.NotEq: operator.ne,
            ast.Lt: operator.lt,
            ast.LtE: operator.le,
            ast.Gt: operator.gt,
            ast.GtE: operator.ge,
            ast.And: operator.and_,
            ast.Or: operator.or_,
        }

        def safe_eval(node):
            """Safely evaluate simple expressions"""
            if isinstance(node, ast.Constant):
                return node.value
            elif isinstance(node, ast.Name):
                # Replace with answer value
                return answers.get(node.id, '')
            elif isinstance(node, ast.Compare):
                left = safe_eval(node.left)
                for op, comparator in zip(node.ops, node.comparators):
                    right = safe_eval(comparator)
                    if type(op) in ops:
                        return ops[type(op)](left, right)
                return False
            elif isinstance(node, ast.BoolOp):
                if type(node.op) in ops:
                    values = [safe_eval(n) for n in node.values]
                    return ops[type(node.op)](*values)
            return False

        # Parse expression safely
        try:
            tree = ast.parse(condition.condition_expression, mode='eval')
            result = safe_eval(tree.body)

            if condition.condition_type == 'show_if':
                return bool(result)
            elif condition.condition_type == 'hide_if':
                return not bool(result)
            elif condition.condition_type == 'required_if':
                return bool(result)
        except:
            logger.warning(f"Failed to evaluate condition: {condition.condition_expression}")
            return True

        return True
    except Exception as e:
        logger.error(f"Error evaluating condition: {e}")
        return True  # Show by default if evaluation fails


@router.post("/documents/smart-upload")
async def smart_document_upload(
    files: List[UploadFile] = File(...),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload multiple documents and automatically classify them
    """
    from ..services.document_service import DocumentService
    from ..services.s3_service import S3Service

    doc_service = DocumentService(db)
    s3_service = S3Service()

    uploaded_documents = []

    for file in files:
        try:
            # Upload to S3
            s3_key = await s3_service.upload_document(
                file=file.file,
                filename=file.filename,
                user_id=str(current_user.id)
            )

            # Create document record
            document = Document(
                user_id=current_user.id,
                file_name=file.filename,
                file_type=file.content_type,
                file_size=file.size if hasattr(file, 'size') else 0,
                s3_key=s3_key,
                file_url=s3_key,  # Can be converted to signed URL later
                ai_processed=False
            )
            db.add(document)
            db.flush()

            uploaded_documents.append({
                "id": str(document.id),
                "filename": file.filename,
                "type": file.content_type,
                "status": "uploaded"
            })

        except Exception as e:
            logger.error(f"Failed to upload {file.filename}: {e}")
            uploaded_documents.append({
                "filename": file.filename,
                "status": "failed",
                "error": str(e)
            })

    db.commit()

    # Trigger background extraction if requested
    if background_tasks and uploaded_documents:
        successful_ids = [d['id'] for d in uploaded_documents if d.get('id')]
        if successful_ids:
            background_tasks.add_task(
                _background_extraction,
                user_id=str(current_user.id),
                document_ids=successful_ids,
                db=db
            )

    return {
        "status": "success",
        "documents": uploaded_documents,
        "message": f"Uploaded {len([d for d in uploaded_documents if d['status'] == 'uploaded'])} documents successfully"
    }


async def _background_extraction(user_id: str, document_ids: List[str], db: Session):
    """Background task for document extraction"""
    try:
        service = AIExtractionService(db)
        await service.extract_from_documents(
            user_id=user_id,
            document_ids=document_ids,
            user_context={}
        )
    except Exception as e:
        logger.error(f"Background extraction failed: {e}")


# PDF Generation endpoints
class PDFGenerationRequest(BaseModel):
    """Request to generate PDF"""
    canton: str = Field(..., description="Canton code (e.g., 'ZH', 'AG')")
    tax_year: int = Field(..., description="Tax year")
    format: str = Field(default="official", description="PDF format: 'official' or 'summary'")
    include_attachments: bool = Field(default=False, description="Include supporting documents")


class PDFEmailRequest(BaseModel):
    """Request to email PDF"""
    email: str = Field(..., description="Email address to send PDF to")
    canton: str = Field(..., description="Canton code")
    tax_year: int = Field(..., description="Tax year")
    subject: Optional[str] = Field(default=None, description="Email subject")
    message: Optional[str] = Field(default=None, description="Email message")


@router.post("/generate-pdf")
async def generate_tax_pdf(
    request: PDFGenerationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate tax declaration PDF in official canton format
    """
    try:
        pdf_service = PDFGenerationService(db)

        # Generate PDF
        pdf_bytes = await pdf_service.generate_tax_pdf(
            user_id=str(current_user.id),
            canton=request.canton,
            tax_year=request.tax_year,
            format=request.format
        )

        # Return as streaming response
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=tax_declaration_{request.canton}_{request.tax_year}.pdf"
            }
        )

    except Exception as e:
        logger.error(f"PDF generation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PDF: {str(e)}"
        )


@router.post("/email-pdf")
async def email_tax_pdf(
    request: PDFEmailRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate and email tax declaration PDF
    """
    try:
        # Add to background task
        background_tasks.add_task(
            _send_pdf_email,
            user_id=str(current_user.id),
            email=request.email,
            canton=request.canton,
            tax_year=request.tax_year,
            subject=request.subject,
            message=request.message,
            db=db
        )

        return {
            "status": "success",
            "message": f"PDF will be sent to {request.email} shortly"
        }

    except Exception as e:
        logger.error(f"Email PDF request failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process email request: {str(e)}"
        )


async def _send_pdf_email(
    user_id: str,
    email: str,
    canton: str,
    tax_year: int,
    subject: Optional[str],
    message: Optional[str],
    db: Session
):
    """Background task to generate and email PDF"""
    try:
        from ..services.email_service import EmailService

        # Generate PDF
        pdf_service = PDFGenerationService(db)
        pdf_bytes = await pdf_service.generate_tax_pdf(
            user_id=user_id,
            canton=canton,
            tax_year=tax_year,
            format="official"
        )

        # Send email
        email_service = EmailService()
        await email_service.send_pdf_attachment(
            to_email=email,
            subject=subject or f"Your Tax Declaration {tax_year} - Canton {canton}",
            body=message or f"Please find attached your tax declaration for {tax_year}.",
            pdf_bytes=pdf_bytes,
            pdf_filename=f"tax_declaration_{canton}_{tax_year}.pdf"
        )

        logger.info(f"PDF sent successfully to {email}")

    except Exception as e:
        logger.error(f"Failed to send PDF email: {e}")


@router.get("/pdf/validate/{canton}/{tax_year}")
async def validate_pdf_completeness(
    canton: str,
    tax_year: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Validate that all required fields for PDF generation are complete
    """
    try:
        pdf_service = PDFGenerationService(db)

        # Generate PDF first
        pdf_bytes = await pdf_service.generate_tax_pdf(
            user_id=str(current_user.id),
            canton=canton,
            tax_year=tax_year,
            format="official"
        )

        # Validate completeness
        validation_result = await pdf_service.validate_pdf_completeness(pdf_bytes)

        return validation_result

    except Exception as e:
        logger.error(f"PDF validation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to validate PDF: {str(e)}"
        )


@router.get("/summary")
async def get_tax_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get comprehensive tax filing summary for review
    """
    try:
        # Get tax profile
        tax_profile = db.query(TaxProfile).filter_by(user_id=current_user.id).first()

        if not tax_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tax profile not found. Please complete the questionnaire and upload documents first."
            )

        # Get latest extraction session
        latest_session = db.query(ExtractionSession).filter_by(
            user_id=current_user.id,
            status='completed'
        ).order_by(ExtractionSession.created_at.desc()).first()

        # Calculate summary
        data = tax_profile.validated_data or tax_profile.extracted_data or {}

        # Income calculation
        income = {
            "gross_salary": data.get("gross_salary", 0),
            "bonuses": data.get("bonuses", 0),
            "other_income": data.get("other_income", 0),
            "total_gross": sum([
                data.get("gross_salary", 0),
                data.get("bonuses", 0),
                data.get("other_income", 0)
            ])
        }

        # Deductions calculation
        deductions = {
            "professional_expenses": data.get("professional_expenses", 0),
            "insurance_premiums": data.get("insurance_premiums", 0),
            "pillar_3a": data.get("pillar_3a", 0),
            "donations": data.get("donations", 0),
            "childcare": data.get("childcare", 0),
            "total": sum([
                data.get("professional_expenses", 0),
                data.get("insurance_premiums", 0),
                data.get("pillar_3a", 0),
                data.get("donations", 0),
                data.get("childcare", 0)
            ])
        }

        # Completeness score
        completeness = tax_profile.completeness_score or _calculate_completeness(data)

        # AI insights
        ai_insights = None
        if completeness < 0.95:
            missing_count = len([k for k in ["gross_salary", "ahv_number", "birth_date"] if not data.get(k)])
            ai_insights = f"Your tax declaration is {int(completeness * 100)}% complete. {missing_count} required fields are missing."

        return {
            "income": income,
            "deductions": deductions,
            "completeness": int(completeness * 100),
            "profile_type": tax_profile.profile_type,
            "ai_insights": ai_insights,
            "extraction_confidence": latest_session.confidence_score if latest_session else None,
            "last_updated": tax_profile.updated_at.isoformat() if tax_profile.updated_at else None
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get summary: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate summary: {str(e)}"
        )