"""
Tax Filing Router
Handles multiple tax filing management endpoints
Supports multi-year and multi-canton filing scenarios
"""
import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from db.session import get_db
from services.tax_filing_service import TaxFilingService
from core.security import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


# ==================== Request/Response Models ====================

class CreateFilingRequest(BaseModel):
    """Request model for creating a new filing"""
    tax_year: int = Field(..., ge=2020, le=2030, description="Tax year (2020-2030)")
    canton: str = Field(..., min_length=2, max_length=2, description="Canton code (ZH, GE, BE, etc.)")
    municipality: Optional[str] = Field(None, max_length=100, description="Municipality name")
    language: str = Field(default="en", pattern="^(en|de|fr|it)$", description="UI language")
    is_primary: bool = Field(default=True, description="True for main residence filing")
    parent_filing_id: Optional[str] = Field(None, description="Parent filing ID for multi-canton")
    name: Optional[str] = Field(None, max_length=255, description="Custom filing name")


class CopyFilingRequest(BaseModel):
    """Request model for copying a filing from previous year"""
    source_filing_id: str = Field(..., description="ID of filing to copy from")
    new_year: int = Field(..., ge=2020, le=2030, description="New tax year")


class UpdateFilingRequest(BaseModel):
    """Request model for updating a filing"""
    name: Optional[str] = Field(None, max_length=255)
    status: Optional[str] = Field(None, pattern="^(draft|in_progress|completed|submitted|archived)$")
    completion_percentage: Optional[int] = Field(None, ge=0, le=100)
    is_pinned: Optional[bool] = None
    is_archived: Optional[bool] = None
    municipality: Optional[str] = Field(None, max_length=100)


class FilingResponse(BaseModel):
    """Response model for a single filing"""
    id: str
    user_id: str
    name: str
    tax_year: int
    canton: Optional[str]
    status: str
    completion_percentage: int
    is_primary: bool
    parent_filing_id: Optional[str]
    source_filing_id: Optional[str]
    created_at: str
    updated_at: str


class FilingsListResponse(BaseModel):
    """Response model for list of filings grouped by year"""
    filings: Dict[int, List[Dict]]
    total_count: int
    statistics: Dict[str, Any]


# ==================== Endpoints ====================

@router.get("/filings", response_model=FilingsListResponse)
async def list_filings(
    year: Optional[int] = Query(None, ge=2020, le=2030, description="Filter by tax year"),
    canton: Optional[str] = Query(None, min_length=2, max_length=2, description="Filter by canton"),
    include_deleted: bool = Query(False, description="Include soft-deleted filings"),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all tax filings for the current user, grouped by year

    Returns filings organized by year with statistics
    """
    try:
        filings = TaxFilingService.list_user_filings(
            db=db,
            user_id=current_user.id,
            year=year,
            canton=canton,
            include_deleted=include_deleted
        )

        stats = TaxFilingService.get_filing_statistics(
            db=db,
            user_id=current_user.id
        )

        # Calculate total count
        total_count = sum(len(filings_list) for filings_list in filings.values())

        return {
            "filings": filings,
            "total_count": total_count,
            "statistics": stats
        }
    except Exception as e:
        logger.error(f"Error listing filings: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list filings: {str(e)}"
        )


@router.post("/filings", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_filing(
    request: CreateFilingRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new tax filing

    - Validates that no duplicate filing exists for same user/year/canton
    - Generates default name if not provided
    - Supports multi-canton filings via parent_filing_id
    """
    try:
        filing = TaxFilingService.create_filing(
            db=db,
            user_id=current_user.id,
            tax_year=request.tax_year,
            canton=request.canton,
            municipality=request.municipality,
            language=request.language,
            is_primary=request.is_primary,
            parent_filing_id=request.parent_filing_id,
            name=request.name
        )

        logger.info(f"User {current_user.id} created filing {filing.id}")
        return filing.to_dict()

    except ValueError as e:
        logger.warning(f"Filing creation validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error creating filing: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create filing: {str(e)}"
        )


@router.post("/filings/copy", response_model=dict, status_code=status.HTTP_201_CREATED)
async def copy_filing(
    request: CopyFilingRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Copy a filing from previous year to new year

    - Copies profile data and non-financial answers
    - Excludes year-specific financial amounts
    - Links new filing to source via source_filing_id
    """
    try:
        filing = TaxFilingService.copy_from_previous_year(
            db=db,
            source_filing_id=request.source_filing_id,
            new_year=request.new_year,
            user_id=current_user.id
        )

        logger.info(f"User {current_user.id} copied filing {request.source_filing_id} to year {request.new_year}")
        return filing.to_dict()

    except ValueError as e:
        logger.warning(f"Filing copy validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error copying filing: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to copy filing: {str(e)}"
        )


@router.get("/filings/{filing_id}", response_model=dict)
async def get_filing(
    filing_id: str,
    include_relationships: bool = Query(True, description="Include answers, insights, calculations"),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific filing by ID

    - Verifies user ownership
    - Optionally includes related data (answers, insights, calculations)
    """
    try:
        filing = TaxFilingService.get_filing(
            db=db,
            filing_id=filing_id,
            user_id=current_user.id,
            include_relationships=include_relationships
        )

        return filing.to_dict(include_relationships=include_relationships)

    except ValueError as e:
        logger.warning(f"Filing not found: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error getting filing: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get filing: {str(e)}"
        )


@router.patch("/filings/{filing_id}", response_model=dict)
async def update_filing(
    filing_id: str,
    request: UpdateFilingRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a filing's metadata

    - Updates only provided fields
    - Cannot update tax_year or canton (create new filing instead)
    """
    try:
        # Convert request to dict, excluding None values
        updates = {k: v for k, v in request.dict().items() if v is not None}

        if not updates:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )

        filing = TaxFilingService.update_filing(
            db=db,
            filing_id=filing_id,
            user_id=current_user.id,
            **updates
        )

        logger.info(f"User {current_user.id} updated filing {filing_id}")
        return filing.to_dict()

    except ValueError as e:
        logger.warning(f"Filing update validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error updating filing: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update filing: {str(e)}"
        )


@router.delete("/filings/{filing_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_filing(
    filing_id: str,
    hard_delete: bool = Query(False, description="Permanently delete (USE WITH CAUTION)"),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a filing (soft delete by default)

    - Soft delete: Sets deleted_at timestamp (can be restored)
    - Hard delete: Permanently removes from database (cannot be undone)
    - Cannot delete submitted filings
    """
    try:
        TaxFilingService.delete_filing(
            db=db,
            filing_id=filing_id,
            user_id=current_user.id,
            hard_delete=hard_delete
        )

        logger.info(f"User {current_user.id} {'hard' if hard_delete else 'soft'} deleted filing {filing_id}")
        return

    except ValueError as e:
        logger.warning(f"Filing deletion validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error deleting filing: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete filing: {str(e)}"
        )


@router.post("/filings/{filing_id}/restore", response_model=dict)
async def restore_filing(
    filing_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Restore a soft-deleted filing

    - Only works for soft-deleted filings
    - Hard-deleted filings cannot be restored
    """
    try:
        filing = TaxFilingService.restore_filing(
            db=db,
            filing_id=filing_id,
            user_id=current_user.id
        )

        logger.info(f"User {current_user.id} restored filing {filing_id}")
        return filing.to_dict()

    except ValueError as e:
        logger.warning(f"Filing restoration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error restoring filing: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to restore filing: {str(e)}"
        )


@router.get("/filings/statistics", response_model=dict)
async def get_statistics(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get statistics about user's filings

    Returns:
    - Total filings
    - Filings by year
    - Filings by status
    - Filings by canton
    - Multi-canton years count
    - Completion stats
    """
    try:
        stats = TaxFilingService.get_filing_statistics(
            db=db,
            user_id=current_user.id
        )

        return stats

    except Exception as e:
        logger.error(f"Error getting statistics: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get statistics: {str(e)}"
        )
