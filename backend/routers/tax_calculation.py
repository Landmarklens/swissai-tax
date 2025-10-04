"""
Tax Calculation API Router
Handles Swiss tax calculation endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel, Field
import logging

from db.session import get_db
from services.tax_calculation_service import TaxCalculationService
from utils.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize tax calculation service
tax_service = TaxCalculationService()


# Pydantic models
class CalculateRequest(BaseModel):
    session_id: str


class TaxCalculationResponse(BaseModel):
    calculation_id: str
    tax_year: int
    canton: str
    municipality: str
    income: dict
    deductions: dict
    taxable_income: float
    federal_tax: float
    cantonal_tax: float
    municipal_tax: float
    church_tax: float
    total_tax: float
    effective_rate: float
    monthly_tax: float


@router.post("/calculate", response_model=TaxCalculationResponse)
async def calculate_taxes(
    request: CalculateRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Calculate Swiss taxes for a completed interview session

    - Calculates federal, cantonal, municipal, and church taxes
    - Returns comprehensive tax breakdown
    """
    try:
        result = tax_service.calculate_taxes(request.session_id)

        return TaxCalculationResponse(**result)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error calculating taxes: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate taxes: {str(e)}"
        )


@router.get("/{session_id}", response_model=dict)
async def get_calculation(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get tax calculation results for a session

    - Returns existing calculation if available
    - Otherwise returns 404
    """
    try:
        result = tax_service.get_tax_summary(session_id)

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No calculation found for session {session_id}"
            )

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting calculation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get calculation: {str(e)}"
        )


@router.get("/{session_id}/breakdown", response_model=dict)
async def get_tax_breakdown(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed tax calculation breakdown

    - Returns itemized breakdown of all taxes and deductions
    """
    try:
        result = tax_service.get_tax_summary(session_id)

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No calculation found for session {session_id}"
            )

        # Format breakdown for display
        breakdown = {
            "income_breakdown": result.get("income", {}),
            "deductions_breakdown": result.get("deductions", {}),
            "tax_breakdown": {
                "federal": {
                    "amount": result.get("federal_tax", 0),
                    "rate": "Federal progressive rate"
                },
                "cantonal": {
                    "amount": result.get("cantonal_tax", 0),
                    "canton": result.get("canton", "ZH")
                },
                "municipal": {
                    "amount": result.get("municipal_tax", 0),
                    "municipality": result.get("municipality", "Zurich")
                },
                "church": {
                    "amount": result.get("church_tax", 0),
                    "optional": True
                }
            },
            "totals": {
                "gross_income": result.get("income", {}).get("total_income", 0),
                "total_deductions": result.get("deductions", {}).get("total_deductions", 0),
                "taxable_income": result.get("taxable_income", 0),
                "total_tax": result.get("total_tax", 0),
                "effective_rate": result.get("effective_rate", 0),
                "monthly_tax": result.get("monthly_tax", 0)
            }
        }

        return breakdown

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting tax breakdown: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get tax breakdown: {str(e)}"
        )
