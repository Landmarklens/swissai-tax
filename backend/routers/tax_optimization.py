"""
Tax Optimization API Endpoints

REST API for AI-powered tax optimization recommendations.
"""

import logging
import os
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from db.session import get_db
from services.ai_tax_optimization_service import (AITaxOptimizationService,
                                                  TaxOptimizationError)
from services.enhanced_tax_calculation_service import \
    EnhancedTaxCalculationService
from services.filing_orchestration_service import FilingOrchestrationService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/tax-optimization", tags=["Tax Optimization"])


# ============================================================================
# Request/Response Models
# ============================================================================

class OptimizationRecommendation(BaseModel):
    """Single optimization recommendation"""
    category: str
    title: str
    description: str
    action_steps: List[str]
    estimated_savings: float
    savings_confidence: float
    annual_benefit: float
    implementation_difficulty: str
    time_horizon: str
    priority: str
    legal_references: Optional[List[str]] = None
    risks_considerations: Optional[List[str]] = None


class OptimizationResponse(BaseModel):
    """Tax optimization recommendations response"""
    filing_id: str
    canton: str
    tax_year: int
    current_tax: float
    recommendations: List[dict]
    total_potential_savings: float
    timestamp: str
    ai_provider: str


class CantonComparisonResponse(BaseModel):
    """Canton tax comparison response"""
    current_canton: str
    current_total_tax: float
    comparisons: List[dict]
    best_canton: Optional[str] = None
    max_savings: float


class OptimizationCategoriesResponse(BaseModel):
    """Available optimization categories"""
    categories: dict


# ============================================================================
# Tax Optimization Endpoints
# ============================================================================

@router.get("/categories", response_model=OptimizationCategoriesResponse)
def get_optimization_categories():
    """
    Get list of optimization categories.

    Returns all available tax optimization strategy categories.
    """
    service = AITaxOptimizationService(
        ai_provider='anthropic',
        api_key='dummy'  # Just for metadata
    )

    return OptimizationCategoriesResponse(
        categories=service.OPTIMIZATION_CATEGORIES
    )


@router.get("/recommendations/{filing_id}", response_model=OptimizationResponse)
def get_optimization_recommendations(
    filing_id: str,
    focus_areas: Optional[List[str]] = Query(None),
    ai_provider: str = Query('anthropic', description="AI provider: 'anthropic' or 'openai'"),
    db: Session = Depends(get_db)
):
    """
    Get personalized tax optimization recommendations for a filing.

    Parameters:
    - filing_id: Tax filing session ID
    - focus_areas: Optional list of optimization categories to focus on
    - ai_provider: 'anthropic' (default) or 'openai'

    Returns:
    - Personalized tax optimization strategies with estimated savings
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

        # Get filing and calculation
        filing_service = FilingOrchestrationService(db=db)
        tax_service = EnhancedTaxCalculationService(db=db)

        filing = filing_service.get_filing(filing_id)
        if not filing:
            raise HTTPException(status_code=404, detail=f"Filing {filing_id} not found")

        calculation = tax_service.calculate_single_filing(filing)

        # Get optimization recommendations
        optimization_service = AITaxOptimizationService(
            ai_provider=ai_provider,
            api_key=api_key
        )

        result = optimization_service.get_optimization_recommendations(
            filing.to_dict(),
            calculation,
            focus_areas
        )

        logger.info(
            f"Generated {len(result['recommendations'])} recommendations for {filing_id} "
            f"(potential savings: CHF {result['total_potential_savings']:,.2f})"
        )

        return OptimizationResponse(**result)

    except HTTPException:
        raise
    except TaxOptimizationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Optimization failed for {filing_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Optimization failed: {e}")


@router.get("/compare-cantons/{filing_id}", response_model=CantonComparisonResponse)
def compare_canton_taxes(
    filing_id: str,
    comparison_cantons: Optional[List[str]] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Compare tax burden across different Swiss cantons.

    Useful for users considering relocation or property purchase in different cantons.

    Parameters:
    - filing_id: Tax filing session ID
    - comparison_cantons: Optional list of canton codes to compare

    Returns:
    - Tax comparison across cantons with potential savings from relocation
    """
    try:
        # Get filing and calculation
        filing_service = FilingOrchestrationService(db=db)
        tax_service = EnhancedTaxCalculationService(db=db)

        filing = filing_service.get_filing(filing_id)
        if not filing:
            raise HTTPException(status_code=404, detail=f"Filing {filing_id} not found")

        calculation = tax_service.calculate_single_filing(filing)

        # Get canton comparison
        optimization_service = AITaxOptimizationService(
            ai_provider='anthropic',
            api_key=os.getenv('ANTHROPIC_API_KEY') or 'dummy'
        )

        result = optimization_service.compare_cantons(
            filing.to_dict(),
            calculation,
            comparison_cantons
        )

        return CantonComparisonResponse(**result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Canton comparison failed for {filing_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Comparison failed: {e}")


@router.get("/quick-wins/{filing_id}")
def get_quick_wins(
    filing_id: str,
    ai_provider: str = Query('anthropic'),
    db: Session = Depends(get_db)
):
    """
    Get quick, easy-to-implement tax optimization strategies.

    Returns only recommendations with:
    - High priority
    - Easy implementation
    - Immediate time horizon

    Parameters:
    - filing_id: Tax filing session ID
    - ai_provider: 'anthropic' or 'openai'

    Returns:
    - Top 3-5 quick-win recommendations
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

        # Get filing and calculation
        filing_service = FilingOrchestrationService(db=db)
        tax_service = EnhancedTaxCalculationService(db=db)

        filing = filing_service.get_filing(filing_id)
        if not filing:
            raise HTTPException(status_code=404, detail=f"Filing {filing_id} not found")

        calculation = tax_service.calculate_single_filing(filing)

        # Get optimization recommendations
        optimization_service = AITaxOptimizationService(
            ai_provider=ai_provider,
            api_key=api_key
        )

        result = optimization_service.get_optimization_recommendations(
            filing.to_dict(),
            calculation
        )

        # Filter for quick wins
        quick_wins = [
            rec for rec in result['recommendations']
            if rec.get('implementation_difficulty') == 'easy'
            and rec.get('priority') in ['high', 'medium']
        ]

        # Take top 5
        quick_wins = quick_wins[:5]

        total_quick_win_savings = sum(
            r.get('estimated_savings', 0)
            for r in quick_wins
        )

        return {
            'filing_id': filing_id,
            'canton': result['canton'],
            'current_tax': result['current_tax'],
            'quick_wins': quick_wins,
            'total_quick_win_savings': total_quick_win_savings,
            'implementation_time': 'Less than 1 hour'
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Quick wins failed for {filing_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Quick wins failed: {e}")


@router.get("/pillar-3a-optimizer/{filing_id}")
def optimize_pillar_3a(
    filing_id: str,
    db: Session = Depends(get_db)
):
    """
    Get Pillar 3a contribution optimization recommendation.

    Calculates optimal Pillar 3a contributions based on:
    - Income level
    - Current contributions
    - Marginal tax rate
    - Maximum legal limits

    Parameters:
    - filing_id: Tax filing session ID

    Returns:
    - Detailed Pillar 3a optimization strategy
    """
    try:
        # Get filing and calculation
        filing_service = FilingOrchestrationService(db=db)
        tax_service = EnhancedTaxCalculationService(db=db)

        filing = filing_service.get_filing(filing_id)
        if not filing:
            raise HTTPException(status_code=404, detail=f"Filing {filing_id} not found")

        calculation = tax_service.calculate_single_filing(filing)
        profile = filing.profile or {}

        # Calculate optimization
        current_3a = calculation.get('deductions', {}).get('pillar_3a', 0)
        max_3a = 7056  # 2024 limit for employees with pension fund

        # If self-employed
        if calculation.get('income', {}).get('self_employment', 0) > 0:
            max_3a = 35280  # 2024 limit for self-employed without pension fund

        potential_increase = max(0, max_3a - current_3a)

        # Estimate tax savings (marginal rate)
        marginal_rate = calculation.get('effective_rate', 0) * 0.01
        if marginal_rate < 0.20:
            marginal_rate = 0.25  # Typical marginal rate
        elif marginal_rate > 0.45:
            marginal_rate = 0.45  # Cap at 45%

        estimated_savings = potential_increase * marginal_rate

        return {
            'filing_id': filing_id,
            'canton': filing.canton,
            'current_contribution': float(current_3a),
            'maximum_contribution': float(max_3a),
            'recommended_increase': float(potential_increase),
            'estimated_annual_tax_savings': float(estimated_savings),
            'estimated_5_year_savings': float(estimated_savings * 5),
            'marginal_tax_rate': float(marginal_rate),
            'recommendation': (
                f"Increase your Pillar 3a contributions by CHF {potential_increase:,.0f} "
                f"to save approximately CHF {estimated_savings:,.0f} in taxes annually."
                if potential_increase > 0
                else "You are already maximizing your Pillar 3a contributions."
            ),
            'action_steps': [
                f"Set up automatic monthly transfer of CHF {(potential_increase / 12):,.2f}",
                "Choose between bank 3a or insurance 3a",
                "Compare 3a providers for best returns",
                "Contribute before December 31st for current tax year"
            ] if potential_increase > 0 else []
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Pillar 3a optimization failed for {filing_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Optimization failed: {e}")


@router.get("/test-connection")
def test_ai_connection(
    ai_provider: str = Query('anthropic')
):
    """
    Test AI provider API connection.

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
        service = AITaxOptimizationService(
            ai_provider=ai_provider,
            api_key=api_key
        )

        return {
            'connected': True,
            'provider': ai_provider,
            'message': 'AI connection successful',
            'categories': list(service.OPTIMIZATION_CATEGORIES.keys())
        }

    except Exception as e:
        return {
            'connected': False,
            'provider': ai_provider,
            'error': str(e)
        }
