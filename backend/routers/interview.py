"""
Interview API Router
Handles tax interview questionnaire endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, Any
from pydantic import BaseModel, Field
import logging

from db.session import get_db
from services.interview_service import InterviewService
from utils.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize interview service
interview_service = InterviewService()


# Pydantic models for request/response
class StartInterviewRequest(BaseModel):
    tax_year: int = Field(..., ge=2020, le=2030)
    language: str = Field(default="en", regex="^(en|de|fr|it)$")


class SubmitAnswerRequest(BaseModel):
    question_id: str
    answer: Any


class InterviewSessionResponse(BaseModel):
    session_id: str
    current_question: dict
    progress: int


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


@router.post("/start", response_model=InterviewSessionResponse, status_code=status.HTTP_201_CREATED)
async def start_interview(
    request: StartInterviewRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Start a new tax interview session

    - Creates a new interview session for the user
    - Returns the first question
    """
    try:
        result = interview_service.create_session(
            user_id=current_user["id"],
            tax_year=request.tax_year,
            language=request.language
        )

        return InterviewSessionResponse(
            session_id=result["session_id"],
            current_question=result["current_question"],
            progress=result["progress"]
        )
    except Exception as e:
        logger.error(f"Error starting interview: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start interview: {str(e)}"
        )


@router.post("/{session_id}/answer", response_model=AnswerResponse)
async def submit_answer(
    session_id: str,
    request: SubmitAnswerRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit an answer to the current question

    - Validates the answer
    - Returns the next question or completion status
    """
    try:
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

        # Check if interview is complete
        if result.get("complete"):
            return AnswerResponse(
                valid=True,
                complete=True,
                profile=result.get("profile"),
                document_requirements=result.get("document_requirements"),
                progress=result.get("progress", 100)
            )

        # Return next question
        return AnswerResponse(
            valid=True,
            current_question=result.get("current_question"),
            progress=result.get("progress", 0)
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error submitting answer: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit answer: {str(e)}"
        )


@router.get("/{session_id}", response_model=dict)
async def get_session(
    session_id: str,
    current_user: dict = Depends(get_current_user),
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
    current_user: dict = Depends(get_current_user),
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
    current_user: dict = Depends(get_current_user),
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
