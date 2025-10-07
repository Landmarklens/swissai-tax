"""
Tax Insights Router
Handles AI-generated tax insights and recommendations
"""
import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from db.session import get_db
from services.tax_insight_service import TaxInsightService
from utils.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


# ==================== Request/Response Models ====================

class GenerateInsightsRequest(BaseModel):
    """Request model for generating insights"""
    force_regenerate: bool = False


class InsightResponse(BaseModel):
    """Response model for a single insight"""
    id: str
    filing_session_id: str
    insight_type: str
    priority: str
    title: str
    description: str
    estimated_savings_chf: int = None
    action_items: List[str] = []
    related_questions: List[str] = []
    is_acknowledged: bool
    is_applied: bool
    created_at: str
    acknowledged_at: str = None


class AcknowledgeInsightRequest(BaseModel):
    """Request model for acknowledging an insight"""
    pass  # No body needed, insight_id is in path


# ==================== Endpoints ====================

@router.post("/generate/{filing_id}", response_model=List[dict], status_code=status.HTTP_201_CREATED)
async def generate_insights(
    filing_id: str,
    request: GenerateInsightsRequest = GenerateInsightsRequest(),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate AI insights for a filing session

    - Analyzes user's answers to identify tax-saving opportunities
    - Returns list of personalized recommendations
    - Can force regeneration to update insights after changes
    """
    try:
        insights = TaxInsightService.generate_all_insights(
            db=db,
            filing_session_id=filing_id,
            force_regenerate=request.force_regenerate
        )

        logger.info(f"Generated {len(insights)} insights for filing {filing_id}")
        return [insight.to_dict() for insight in insights]

    except ValueError as e:
        logger.warning(f"Insight generation validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error generating insights: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate insights: {str(e)}"
        )


@router.get("/filing/{filing_id}", response_model=List[dict])
async def get_filing_insights(
    filing_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all insights for a specific filing

    - Returns insights sorted by priority (high to low)
    - Includes estimated savings and action items
    - Used to display insights on Profile page
    """
    try:
        insights = TaxInsightService.get_filing_insights(
            db=db,
            filing_session_id=filing_id,
            user_id=current_user["id"]
        )

        return insights

    except ValueError as e:
        logger.warning(f"Filing not found: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error getting insights: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get insights: {str(e)}"
        )


@router.post("/{insight_id}/acknowledge", response_model=dict)
async def acknowledge_insight(
    insight_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark an insight as acknowledged (user has seen it)

    - Updates is_acknowledged flag
    - Sets acknowledged_at timestamp
    - Used for tracking which insights user has reviewed
    """
    try:
        insight = TaxInsightService.acknowledge_insight(
            db=db,
            insight_id=insight_id,
            user_id=current_user["id"]
        )

        logger.info(f"User {current_user['id']} acknowledged insight {insight_id}")
        return insight.to_dict()

    except ValueError as e:
        logger.warning(f"Insight not found: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error acknowledging insight: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to acknowledge insight: {str(e)}"
        )


@router.post("/{insight_id}/apply", response_model=dict)
async def mark_insight_applied(
    insight_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark an insight as applied (user took action)

    - Updates is_applied flag
    - Used for tracking effectiveness of insights
    - Helps prioritize future recommendations
    """
    try:
        insight = TaxInsightService.mark_insight_applied(
            db=db,
            insight_id=insight_id,
            user_id=current_user["id"]
        )

        logger.info(f"User {current_user['id']} marked insight {insight_id} as applied")
        return insight.to_dict()

    except ValueError as e:
        logger.warning(f"Insight not found: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error marking insight as applied: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to mark insight as applied: {str(e)}"
        )


@router.get("/statistics/{filing_id}", response_model=dict)
async def get_insights_statistics(
    filing_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get statistics about insights for a filing

    Returns:
    - Total number of insights
    - Count by priority (high/medium/low)
    - Count by type
    - Total estimated savings
    - Acknowledged/applied counts
    """
    try:
        insights = TaxInsightService.get_filing_insights(
            db=db,
            filing_session_id=filing_id,
            user_id=current_user["id"]
        )

        # Calculate statistics
        stats = {
            'total_insights': len(insights),
            'by_priority': {'high': 0, 'medium': 0, 'low': 0},
            'by_type': {},
            'total_estimated_savings': 0,
            'acknowledged_count': 0,
            'applied_count': 0
        }

        for insight in insights:
            # By priority
            priority = insight.get('priority', 'medium')
            stats['by_priority'][priority] = stats['by_priority'].get(priority, 0) + 1

            # By type
            insight_type = insight.get('insight_type', 'other')
            stats['by_type'][insight_type] = stats['by_type'].get(insight_type, 0) + 1

            # Total savings
            if insight.get('estimated_savings_chf'):
                stats['total_estimated_savings'] += insight['estimated_savings_chf']

            # Acknowledged/applied
            if insight.get('is_acknowledged'):
                stats['acknowledged_count'] += 1
            if insight.get('is_applied'):
                stats['applied_count'] += 1

        return stats

    except ValueError as e:
        logger.warning(f"Filing not found: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error getting insight statistics: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get insight statistics: {str(e)}"
        )
