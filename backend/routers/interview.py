"""
Interview API Router
Handles tax interview questionnaire endpoints
"""

import json
import logging
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from db.session import get_db
from models.tax_answer import TaxAnswer
from models.tax_filing_session import FilingStatus, TaxFilingSession
from services.interview_service import InterviewService
from services.tax_insight_service import TaxInsightService
from core.security import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize interview service
interview_service = InterviewService()


# Pydantic models for request/response
class StartInterviewRequest(BaseModel):
    filing_session_id: Optional[str] = Field(None, description="ID of the TaxFilingSession to associate answers with (auto-created if not provided)")
    tax_year: int = Field(..., ge=2020, le=2030)
    language: str = Field(default="en", pattern="^(en|de|fr|it)$")
    canton: str = Field(default="ZH", description="Canton code (ZH, GE, BE, etc.)")


class SubmitAnswerRequest(BaseModel):
    filing_session_id: str = Field(..., description="ID of the TaxFilingSession")
    question_id: str
    answer: Any


class InterviewSessionResponse(BaseModel):
    session_id: str
    filing_session_id: str
    current_question: dict
    progress: int
    status: str = "in_progress"


class AnswerResponse(BaseModel):
    valid: bool = True
    error: Optional[str] = None
    current_question: Optional[dict] = None
    complete: bool = False
    profile: Optional[dict] = None
    document_requirements: Optional[list] = None
    progress: int = 0


class SaveSessionRequest(BaseModel):
    answers: dict = Field(default_factory=dict)
    progress: int = Field(default=0)


class SaveSessionResponse(BaseModel):
    success: bool
    message: str
    saved_at: str


# ==================== Helper Functions ====================

def save_answer_to_db(
    db: Session,
    filing_session_id: str,
    question_id: str,
    answer_value: Any,
    question_text: str = None,
    question_type: str = None
):
    """Save or update answer in database"""
    # Check if answer already exists
    existing_answer = db.query(TaxAnswer).filter(
        TaxAnswer.filing_session_id == filing_session_id,
        TaxAnswer.question_id == question_id
    ).first()

    # Determine if question is sensitive
    is_sensitive = TaxAnswer.is_question_sensitive(question_id)

    # Convert answer to string if needed
    answer_str = json.dumps(answer_value) if isinstance(answer_value, (dict, list)) else str(answer_value)

    if existing_answer:
        # Update existing answer
        existing_answer.answer_value = answer_str  # Auto-encrypted by EncryptedText
        existing_answer.question_text = question_text
        existing_answer.question_type = question_type
        existing_answer.is_sensitive = is_sensitive
        db.commit()
        logger.info(f"Updated answer for question {question_id}")
    else:
        # Create new answer
        new_answer = TaxAnswer(
            filing_session_id=filing_session_id,
            question_id=question_id,
            answer_value=answer_str,  # Auto-encrypted by EncryptedText
            question_text=question_text,
            question_type=question_type,
            is_sensitive=is_sensitive
        )
        db.add(new_answer)
        db.commit()
        logger.info(f"Saved new answer for question {question_id}")


def generate_insights_for_filing(db: Session, filing_session_id: str):
    """Generate AI insights after interview completion"""
    try:
        insights = TaxInsightService.generate_all_insights(
            db=db,
            filing_session_id=filing_session_id,
            force_regenerate=True  # Always regenerate on completion
        )
        logger.info(f"Generated {len(insights)} insights for filing {filing_session_id}")
        return insights
    except Exception as e:
        logger.error(f"Error generating insights: {e}", exc_info=True)
        # Don't fail the interview completion if insights fail
        return []


# ==================== Endpoints ====================

@router.post("/start", response_model=InterviewSessionResponse, status_code=status.HTTP_201_CREATED)
async def start_interview(
    request: StartInterviewRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Start a new tax interview session

    - Creates a new interview session for the user
    - Auto-creates a filing session if not provided
    - Returns the first question
    """
    try:
        # Create or get filing session
        filing_session_id = request.filing_session_id

        if not filing_session_id:
            # Auto-create a new filing session
            from services.tax_filing_service import TaxFilingService

            filing_session = TaxFilingService.create_filing(
                db=db,
                user_id=current_user.id,
                tax_year=request.tax_year,
                canton=request.canton,
                language=request.language,
                is_primary=True
            )
            filing_session_id = filing_session.id
            logger.info(f"Auto-created filing session {filing_session_id} for user {current_user.id}")
        else:
            # Verify filing session exists and belongs to user
            filing_session = db.query(TaxFilingSession).filter(
                TaxFilingSession.id == filing_session_id,
                TaxFilingSession.user_id == current_user.id
            ).first()

            if not filing_session:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Filing session not found or access denied"
                )

        result = interview_service.create_session(
            user_id=current_user.id,
            tax_year=request.tax_year,
            language=request.language
        )

        # Update filing session with interview session ID
        filing_session = db.query(TaxFilingSession).filter(
            TaxFilingSession.id == filing_session_id
        ).first()
        if filing_session:
            filing_session.status = FilingStatus.IN_PROGRESS
            filing_session.current_question_id = result["current_question"]["id"]
            db.commit()

        return InterviewSessionResponse(
            session_id=result["session_id"],
            filing_session_id=filing_session_id,
            current_question=result["current_question"],
            progress=result["progress"],
            status="in_progress"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting interview: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start interview: {str(e)}"
        )


@router.post("/{session_id}/answer", response_model=AnswerResponse)
async def submit_answer(
    session_id: str,
    request: SubmitAnswerRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit an answer to the current question

    - Validates the answer
    - Saves answer to database (encrypted if sensitive)
    - Returns the next question or completion status
    - Generates AI insights when interview is complete
    """
    try:
        # Verify filing session belongs to user
        filing_session = db.query(TaxFilingSession).filter(
            TaxFilingSession.id == request.filing_session_id,
            TaxFilingSession.user_id == current_user.id
        ).first()

        if not filing_session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Filing session not found or access denied"
            )

        # Submit answer to interview service (in-memory validation and flow control)
        result = interview_service.submit_answer(
            session_id=session_id,
            question_id=request.question_id,
            answer=request.answer
        )

        # Check if validation failed
        if result.get("error"):
            return AnswerResponse(
                valid=False,
                error=result["error"],
                progress=0
            )

        # Save answer to database (encrypted automatically if sensitive)
        save_answer_to_db(
            db=db,
            filing_session_id=request.filing_session_id,
            question_id=request.question_id,
            answer_value=request.answer
        )

        # Update filing session progress
        filing_session.completion_percentage = result.get("progress", 0)
        filing_session.current_question_id = result.get("current_question", {}).get("id") if result.get("current_question") else None
        db.commit()

        # Check if interview is complete
        if result.get("complete"):
            # Update filing status
            filing_session.status = FilingStatus.COMPLETED
            filing_session.completion_percentage = 100
            filing_session.profile = result.get("profile", {})
            db.commit()

            # Generate AI insights asynchronously (don't block response)
            try:
                insights = generate_insights_for_filing(db, request.filing_session_id)
                logger.info(f"Generated {len(insights)} insights for completed filing {request.filing_session_id}")
            except Exception as e:
                logger.error(f"Failed to generate insights, but continuing: {e}")

            return AnswerResponse(
                valid=True,
                complete=True,
                profile=result.get("profile"),
                document_requirements=result.get("document_requirements"),
                progress=100
            )

        # Return next question
        return AnswerResponse(
            valid=True,
            current_question=result.get("current_question"),
            progress=result.get("progress", 0)
        )

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error submitting answer: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit answer: {str(e)}"
        )


@router.get("/{session_id}", response_model=dict)
async def get_session(
    session_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the current state of an interview session

    - Returns session details, current question, and progress
    """
    try:
        session_state = interview_service.get_session(session_id)

        if not session_state:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session {session_id} not found"
            )

        return session_state

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get session: {str(e)}"
        )


@router.get("/{session_id}/questions", response_model=dict)
async def get_current_question(
    session_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the current question for a session

    - Returns the current question details
    """
    try:
        session = interview_service.get_session(session_id)

        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session {session_id} not found"
            )

        current_question_id = session.get("current_question_id")
        if not current_question_id:
            return {"message": "Interview completed", "current_question": None}

        # Get the question details from the loader
        from models.question import QuestionLoader
        question_loader = QuestionLoader()
        question = question_loader.get_question(current_question_id)

        if question:
            return interview_service._format_question(question, session.get("language", "en"))
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Current question not found"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting current question: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get current question: {str(e)}"
        )


@router.post("/{session_id}/save", response_model=SaveSessionResponse)
async def save_session(
    session_id: str,
    request: SaveSessionRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Save the current interview session progress

    - Saves answers and progress for the session
    - Can be called at any time during the interview
    """
    try:
        result = interview_service.save_session(
            session_id=session_id,
            answers=request.answers,
            progress=request.progress
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session {session_id} not found"
            )

        return SaveSessionResponse(
            success=True,
            message="Session saved successfully",
            saved_at=result["saved_at"]
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save session: {str(e)}"
        )


class CalculateTaxRequest(BaseModel):
    filing_session_id: Optional[str] = Field(None, description="ID of the TaxFilingSession to calculate taxes for")
    answers: Optional[dict] = Field(None, description="Current answers (optional)")


@router.post("/{session_id}/calculate")
async def calculate_taxes_for_session(
    session_id: str,
    request: CalculateTaxRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Calculate taxes for the current interview session

    - Uses answers from the session to calculate taxes
    - Returns calculation results
    """
    try:
        # Import enhanced tax calculation service
        from services.enhanced_tax_calculation_service import EnhancedTaxCalculationService

        tax_service = EnhancedTaxCalculationService(db=db)

        # Get filing_session_id from request body first, then fall back to session data
        filing_session_id = request.filing_session_id

        if not filing_session_id:
            # Try to get from session data as fallback
            from services.interview_service import interview_service
            session_data = interview_service.get_session(session_id)

            if not session_data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Session {session_id} not found"
                )

            filing_session_id = session_data.get("filing_session_id")

        if not filing_session_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No filing session ID provided or associated with this interview"
            )

        # Verify filing session belongs to user
        filing_session = db.query(TaxFilingSession).filter(
            TaxFilingSession.id == filing_session_id,
            TaxFilingSession.user_id == current_user.id
        ).first()

        if not filing_session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Filing session not found or access denied"
            )

        # Calculate taxes using enhanced service
        calculation = tax_service.calculate_single_filing(filing_session)

        return {
            "success": True,
            "calculation": calculation
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calculating taxes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate taxes: {str(e)}"
        )
