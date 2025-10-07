"""Filing Router - condensed version"""
import secrets
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.session import get_db
from models import InterviewSession
from models.swisstax import Filing, User
from schemas.swisstax.filing import FilingCreate, FilingResponse
from utils.auth import get_current_user

router = APIRouter()

@router.post("/submit", response_model=FilingResponse)
async def submit_filing(data: FilingCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Submit a tax filing"""
    session = db.query(InterviewSession).filter(InterviewSession.id == data.session_id).first()
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found")

    # Generate confirmation number
    confirmation_number = f"CH-{session.tax_year}-{secrets.token_hex(4).upper()}"

    filing = Filing(
        user_id=current_user.id,
        session_id=session.id,
        tax_year=session.tax_year,
        status="submitted" if data.submission_method == "efile" else "completed",
        submission_method=data.submission_method,
        submitted_at=datetime.utcnow(),
        confirmation_number=confirmation_number
    )
    db.add(filing)
    db.commit()
    db.refresh(filing)
    return filing

@router.get("/{filing_id}", response_model=FilingResponse)
async def get_filing(filing_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get filing details"""
    filing = db.query(Filing).filter(Filing.id == filing_id, Filing.user_id == current_user.id).first()
    if not filing:
        raise HTTPException(status_code=404, detail="Filing not found")
    return filing
