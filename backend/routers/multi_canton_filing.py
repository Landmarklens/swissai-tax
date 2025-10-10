"""
API endpoints for multi-canton tax filing management
"""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from db.session import get_db
from models.tax_filing_session import TaxFilingSession
from services.filing_orchestration_service import FilingOrchestrationService
from core.security import get_current_user

router = APIRouter(prefix="/api/multi-canton", tags=["multi-canton-filing"])


# Request/Response Models
class CreatePrimaryFilingRequest(BaseModel):
    tax_year: int
    canton: str
    language: str = 'en'
    name: str = None


class CreateSecondaryFilingsRequest(BaseModel):
    primary_filing_id: str
    property_cantons: List[str]


class FilingResponse(BaseModel):
    id: str
    user_id: UUID
    tax_year: int
    canton: str
    name: str
    is_primary: bool
    parent_filing_id: Optional[str] = None
    status: str
    completion_percentage: int
    language: str

    class Config:
        from_attributes = True


@router.post("/filings/primary", response_model=FilingResponse)
def create_primary_filing(
    request: CreatePrimaryFilingRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new primary tax filing for the current user.

    This creates the main tax filing session for the user's primary residence canton.
    """
    filing_service = FilingOrchestrationService(db=db)

    # Check if primary filing already exists for this user and year
    existing = filing_service.get_primary_filing(
        user_id=current_user.id,
        tax_year=request.tax_year
    )

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Primary filing already exists for tax year {request.tax_year}"
        )

    filing = filing_service.create_primary_filing(
        user_id=current_user.id,
        tax_year=request.tax_year,
        canton=request.canton,
        language=request.language,
        name=request.name
    )

    return filing


@router.post("/filings/secondary", response_model=List[FilingResponse])
def create_secondary_filings(
    request: CreateSecondaryFilingsRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Auto-create secondary tax filings for properties in other cantons.

    This is typically called automatically when user answers Q06a in the interview,
    but can also be called manually to add more cantons later.
    """
    filing_service = FilingOrchestrationService(db=db)

    # Verify primary filing belongs to current user
    primary = filing_service.get_filing(request.primary_filing_id)
    if not primary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Primary filing not found"
        )

    if primary.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this filing"
        )

    # Create secondary filings
    secondaries = filing_service.auto_create_secondary_filings(
        primary_filing_id=request.primary_filing_id,
        property_cantons=request.property_cantons
    )

    return secondaries


@router.get("/filings/{tax_year}", response_model=List[FilingResponse])
def get_all_filings(
    tax_year: int,
    include_archived: bool = False,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all tax filings (primary + secondary) for the current user and tax year.

    Returns list ordered by is_primary DESC, so primary filing is first.
    """
    filing_service = FilingOrchestrationService(db=db)

    filings = filing_service.get_all_user_filings(
        user_id=current_user.id,
        tax_year=tax_year,
        include_archived=include_archived
    )

    return filings


@router.get("/filings/{tax_year}/primary", response_model=FilingResponse)
def get_primary_filing(
    tax_year: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the primary tax filing for the current user and tax year.
    """
    filing_service = FilingOrchestrationService(db=db)

    filing = filing_service.get_primary_filing(
        user_id=current_user.id,
        tax_year=tax_year
    )

    if not filing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No primary filing found for tax year {tax_year}"
        )

    return filing


@router.get("/filings/{filing_id}/secondaries", response_model=List[FilingResponse])
def get_secondary_filings(
    filing_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all secondary filings linked to a primary filing.
    """
    filing_service = FilingOrchestrationService(db=db)

    # Verify primary filing belongs to current user
    primary = filing_service.get_filing(filing_id)
    if not primary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Filing not found"
        )

    if primary.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this filing"
        )

    secondaries = filing_service.get_secondary_filings(filing_id)

    return secondaries


@router.delete("/filings/{filing_id}")
def delete_secondary_filing(
    filing_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Soft delete a secondary filing.

    Cannot delete primary filing through this endpoint.
    """
    filing_service = FilingOrchestrationService(db=db)

    # Verify filing belongs to current user
    filing = filing_service.get_filing(filing_id)
    if not filing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Filing not found"
        )

    if filing.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this filing"
        )

    if filing.is_primary:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete primary filing. Delete all secondary filings first."
        )

    success = filing_service.delete_secondary_filing(filing_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to delete filing"
        )

    return {"message": "Filing deleted successfully"}


@router.post("/filings/{primary_filing_id}/sync-personal-data")
def sync_personal_data(
    primary_filing_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Sync personal data from primary filing to all secondary filings.

    This is called automatically when personal data changes in primary filing,
    but can also be triggered manually.
    """
    filing_service = FilingOrchestrationService(db=db)

    # Verify primary filing belongs to current user
    primary = filing_service.get_filing(primary_filing_id)
    if not primary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Primary filing not found"
        )

    if primary.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this filing"
        )

    updated_count = filing_service.sync_personal_data_to_secondaries(primary_filing_id)

    return {
        "message": f"Personal data synced to {updated_count} secondary filings",
        "updated_count": updated_count
    }
