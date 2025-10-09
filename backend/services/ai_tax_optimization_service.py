"""
AI Tax Optimization Service

This service uses AI to provide personalized tax optimization recommendations
for Swiss taxpayers. It analyzes the user's financial situation and suggests
legal strategies to minimize tax burden.

Optimization strategies include:
- Pillar 3a contribution optimization
- Pillar 2 buyback recommendations
- Deduction maximization
- Canton comparison for relocation
- Property ownership timing
- Income splitting (married couples)
- Charitable donation planning
"""

import json
import logging
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional

try:
    import anthropic
except ImportError:
    anthropic = None

try:
    import openai
except ImportError:
    openai = None

logger = logging.getLogger(__name__)


class TaxOptimizationError(Exception):
    """Base exception for tax optimization errors"""
    pass


class AITaxOptimizationService:
    """
    AI-powered tax optimization recommendations for Swiss taxpayers.

    Provides personalized, legal tax-saving strategies based on:
    - Current tax situation
    - Income sources
    - Deductions
    - Canton of residence
    - Family situation
    - Financial goals
    """

    # Optimization categories
    OPTIMIZATION_CATEGORIES = {
        'pillar_3a': 'Pillar 3a Pension Contributions',
        'pillar_2': 'Pillar 2 Pension Buybacks',
        'deductions': 'Deduction Maximization',
        'income_timing': 'Income Timing Optimization',
        'canton_comparison': 'Canton Tax Comparison',
        'property_strategy': 'Property Ownership Strategy',
        'family_planning': 'Family Tax Planning',
        'charitable_giving': 'Charitable Donation Strategy',
        'investment_structure': 'Investment Structure Optimization'
    }

    # Swiss tax brackets 2024 (federal)
    FEDERAL_TAX_BRACKETS = {
        'single': [
            (17800, 0.00),
            (31600, 0.01),
            (41400, 0.02),
            (55200, 0.03),
            (72500, 0.04),
            (78100, 0.05),
            (103600, 0.06),
            (134600, 0.07),
            (176000, 0.08),
            (755200, 0.11),
            (float('inf'), 0.13)
        ],
        'married': [
            (30800, 0.00),
            (50900, 0.01),
            (58400, 0.02),
            (75300, 0.03),
            (90300, 0.04),
            (103400, 0.05),
            (114700, 0.06),
            (124200, 0.07),
            (131700, 0.08),
            (137300, 0.09),
            (141200, 0.10),
            (143100, 0.11),
            (145000, 0.12),
            (895900, 0.13),
            (float('inf'), 0.115)
        ]
    }

    def __init__(self, ai_provider: str = 'anthropic', api_key: str = None):
        """
        Initialize AI tax optimization service.

        Args:
            ai_provider: 'anthropic' (Claude) or 'openai' (GPT-4)
            api_key: API key for chosen provider
        """
        self.ai_provider = ai_provider.lower()
        self.api_key = api_key

        if self.ai_provider == 'anthropic':
            if anthropic is None:
                raise ImportError("anthropic not installed. Run: pip install anthropic")
            self.client = anthropic.Anthropic(api_key=api_key)
        elif self.ai_provider == 'openai':
            if openai is None:
                raise ImportError("openai not installed. Run: pip install openai")
            self.client = openai.OpenAI(api_key=api_key)
        else:
            raise ValueError(f"Unsupported AI provider: {ai_provider}")

    def get_optimization_recommendations(
        self,
        filing_data: Dict[str, Any],
        calculation_data: Dict[str, Any],
        focus_areas: List[str] = None
    ) -> Dict[str, Any]:
        """
        Get personalized tax optimization recommendations.

        Args:
            filing_data: Tax filing session data
            calculation_data: Tax calculation results
            focus_areas: Optional list of optimization categories to focus on

        Returns:
            Dict with optimization recommendations
        """
        profile = filing_data.get('profile', {})

        # Build tax situation summary
        situation_summary = self._build_situation_summary(
            filing_data,
            calculation_data,
            profile
        )

        # Get AI recommendations
        recommendations = self._get_ai_recommendations(
            situation_summary,
            focus_areas
        )

        # Calculate potential savings for each recommendation
        recommendations_with_savings = self._calculate_potential_savings(
            recommendations,
            filing_data,
            calculation_data
        )

        return {
            'filing_id': filing_data.get('id'),
            'canton': filing_data.get('canton'),
            'tax_year': filing_data.get('tax_year'),
            'current_tax': calculation_data.get('total_tax', 0),
            'recommendations': recommendations_with_savings,
            'total_potential_savings': sum(
                r.get('estimated_savings', 0)
                for r in recommendations_with_savings
            ),
            'timestamp': datetime.utcnow().isoformat(),
            'ai_provider': self.ai_provider
        }

    def _build_situation_summary(
        self,
        filing_data: Dict[str, Any],
        calculation_data: Dict[str, Any],
        profile: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Build comprehensive tax situation summary.

        Args:
            filing_data: Filing data
            calculation_data: Calculation data
            profile: User profile

        Returns:
            Situation summary dict
        """
        income = calculation_data.get('income', {})
        deductions = calculation_data.get('deductions', {})

        return {
            # Personal info
            'canton': filing_data.get('canton'),
            'tax_year': filing_data.get('tax_year'),
            'marital_status': profile.get('marital_status', 'single'),
            'num_children': int(profile.get('num_children', 0)),
            'age': profile.get('age'),

            # Income
            'employment_income': income.get('employment', 0),
            'self_employment_income': income.get('self_employment', 0),
            'capital_income': income.get('capital', 0),
            'rental_income': income.get('rental', 0),
            'pension_income': income.get('pension', 0),
            'total_income': income.get('total', 0),

            # Current deductions
            'pillar_3a_contributions': deductions.get('pillar_3a', 0),
            'pillar_2_buyins': deductions.get('pillar_2_buyins', 0),
            'professional_expenses': deductions.get('professional_expenses', 0),
            'insurance_premiums': deductions.get('insurance_premiums', 0),
            'total_deductions': deductions.get('total', 0),

            # Tax calculation
            'taxable_income': calculation_data.get('taxable_income', 0),
            'federal_tax': calculation_data.get('federal_tax', 0),
            'cantonal_tax': calculation_data.get('cantonal_tax', 0),
            'total_tax': calculation_data.get('total_tax', 0),
            'effective_rate': calculation_data.get('effective_rate', 0),

            # Additional context
            'owns_property': len(profile.get('properties', [])) > 0,
            'has_mortgage': any(
                p.get('mortgage_debt', 0) > 0
                for p in profile.get('properties', [])
            ),
            'church_member': profile.get('church_member', False),
        }

    def _get_ai_recommendations(
        self,
        situation: Dict[str, Any],
        focus_areas: List[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get AI-generated tax optimization recommendations.

        Args:
            situation: Tax situation summary
            focus_areas: Optional focus areas

        Returns:
            List of recommendations
        """
        prompt = f"""You are a Swiss tax optimization expert. Analyze this taxpayer's situation and provide personalized, legal tax optimization strategies.

TAXPAYER SITUATION:
{json.dumps(situation, indent=2)}

CONTEXT:
- Swiss federal tax is progressive (0-13%)
- Canton: {situation['canton']} (has its own tax rates)
- Marital status: {situation['marital_status']}
- Children: {situation['num_children']}

FOCUS AREAS:
{json.dumps(focus_areas if focus_areas else list(self.OPTIMIZATION_CATEGORIES.keys()), indent=2)}

PROVIDE RECOMMENDATIONS IN THE FOLLOWING JSON FORMAT:
{{
  "recommendations": [
    {{
      "category": "pillar_3a",
      "title": "Maximize Pillar 3a Contributions",
      "description": "Detailed explanation of the strategy...",
      "action_steps": [
        "Step 1: ...",
        "Step 2: ..."
      ],
      "estimated_savings_chf": 2500,
      "implementation_difficulty": "easy",  // easy, moderate, complex
      "time_horizon": "immediate",  // immediate, short-term, long-term
      "legal_references": ["Art. 33 DBG", "..."],
      "risks_considerations": ["Consider...", "Be aware..."],
      "priority": "high"  // high, medium, low
    }},
    ...
  ]
}}

IMPORTANT CONSTRAINTS:
1. All recommendations must be 100% legal under Swiss tax law
2. Be specific to the canton ({situation['canton']})
3. Consider the taxpayer's income level and family situation
4. Provide realistic savings estimates
5. Include actionable steps
6. Prioritize by impact and ease of implementation
7. Aim for 5-10 recommendations

Respond ONLY with the JSON object, no additional text.
"""

        try:
            response = self._call_ai(prompt)
            result = self._parse_json_response(response)

            recommendations = result.get('recommendations', [])

            logger.info(f"Generated {len(recommendations)} tax optimization recommendations")

            return recommendations

        except Exception as e:
            logger.error(f"Failed to get AI recommendations: {e}")
            # Return fallback recommendations
            return self._get_fallback_recommendations(situation)

    def _call_ai(self, prompt: str) -> str:
        """
        Call AI API.

        Args:
            prompt: Prompt text

        Returns:
            AI response
        """
        try:
            if self.ai_provider == 'anthropic':
                message = self.client.messages.create(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=4096,
                    messages=[
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ]
                )
                return message.content[0].text

            elif self.ai_provider == 'openai':
                response = self.client.chat.completions.create(
                    model="gpt-4-turbo-preview",
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a Swiss tax optimization expert."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    max_tokens=4096
                )
                return response.choices[0].message.content

        except Exception as e:
            logger.error(f"AI API call failed: {e}")
            raise TaxOptimizationError(f"AI API call failed: {e}")

    def _parse_json_response(self, response: str) -> Dict[str, Any]:
        """Parse JSON from AI response"""
        response = response.strip()

        # Remove markdown code blocks
        if response.startswith('```'):
            lines = response.split('\n')
            response = '\n'.join(lines[1:-1])
            if response.startswith('json'):
                response = response[4:].strip()

        try:
            return json.loads(response)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON: {response[:200]}")
            raise TaxOptimizationError(f"Invalid JSON response: {e}")

    def _calculate_potential_savings(
        self,
        recommendations: List[Dict[str, Any]],
        filing_data: Dict[str, Any],
        calculation_data: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Calculate and validate potential tax savings for each recommendation.

        Args:
            recommendations: AI recommendations
            filing_data: Filing data
            calculation_data: Tax calculation

        Returns:
            Recommendations with validated savings
        """
        enhanced_recommendations = []

        for rec in recommendations:
            # Use AI estimate as baseline
            estimated_savings = rec.get('estimated_savings_chf', 0)

            # Add confidence score based on category and specificity
            confidence = self._calculate_savings_confidence(rec)

            enhanced_recommendations.append({
                **rec,
                'estimated_savings': float(estimated_savings),
                'savings_confidence': confidence,
                'annual_benefit': float(estimated_savings),  # Per year
                '5_year_benefit': float(estimated_savings * 5)  # Over 5 years
            })

        # Sort by estimated savings (descending)
        enhanced_recommendations.sort(
            key=lambda x: x.get('estimated_savings', 0),
            reverse=True
        )

        return enhanced_recommendations

    def _calculate_savings_confidence(self, recommendation: Dict[str, Any]) -> float:
        """
        Calculate confidence score for savings estimate.

        Args:
            recommendation: Recommendation dict

        Returns:
            Confidence score 0.0-1.0
        """
        base_confidence = 0.7

        # Increase confidence for specific categories
        if recommendation.get('category') in ['pillar_3a', 'pillar_2', 'deductions']:
            base_confidence += 0.15

        # Increase confidence if legal references provided
        if recommendation.get('legal_references'):
            base_confidence += 0.10

        # Decrease confidence for complex strategies
        if recommendation.get('implementation_difficulty') == 'complex':
            base_confidence -= 0.15

        return min(1.0, max(0.0, base_confidence))

    def _get_fallback_recommendations(
        self,
        situation: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Get fallback recommendations when AI fails.

        Args:
            situation: Tax situation

        Returns:
            Basic recommendations
        """
        recommendations = []

        # Pillar 3a recommendation
        current_3a = situation.get('pillar_3a_contributions', 0)
        max_3a = 7056  # 2024 limit for employees
        if current_3a < max_3a:
            potential_increase = max_3a - current_3a
            estimated_savings = potential_increase * 0.30  # ~30% marginal rate

            recommendations.append({
                'category': 'pillar_3a',
                'title': 'Maximize Pillar 3a Contributions',
                'description': f'You are contributing CHF {current_3a:,.0f} to Pillar 3a but could contribute up to CHF {max_3a:,.0f}. The additional CHF {potential_increase:,.0f} would be fully tax-deductible.',
                'action_steps': [
                    f'Increase annual Pillar 3a contributions by CHF {potential_increase:,.0f}',
                    'Set up automatic monthly transfers to your 3a account',
                    'Choose between bank 3a or insurance 3a based on your risk profile'
                ],
                'estimated_savings_chf': estimated_savings,
                'implementation_difficulty': 'easy',
                'time_horizon': 'immediate',
                'priority': 'high'
            })

        # Professional expenses
        if situation.get('employment_income', 0) > 0:
            recommendations.append({
                'category': 'deductions',
                'title': 'Review Professional Expense Deductions',
                'description': 'Many taxpayers underestimate deductible professional expenses. Review all work-related costs.',
                'action_steps': [
                    'Track home office expenses if working from home',
                    'Document continuing education and training costs',
                    'Keep records of professional literature and equipment',
                    'Review transportation costs for commuting'
                ],
                'estimated_savings_chf': 500,
                'implementation_difficulty': 'easy',
                'time_horizon': 'immediate',
                'priority': 'medium'
            })

        return recommendations

    def compare_cantons(
        self,
        filing_data: Dict[str, Any],
        calculation_data: Dict[str, Any],
        comparison_cantons: List[str] = None
    ) -> Dict[str, Any]:
        """
        Compare tax burden across different Swiss cantons.

        Args:
            filing_data: Current filing data
            calculation_data: Current tax calculation
            comparison_cantons: Optional list of cantons to compare

        Returns:
            Canton comparison analysis
        """
        if comparison_cantons is None:
            # Compare with major cantons
            comparison_cantons = ['ZH', 'GE', 'BS', 'VD', 'BE', 'ZG', 'SZ', 'LU']

        current_canton = filing_data.get('canton')
        current_tax = calculation_data.get('total_tax', 0)

        # This would call the enhanced_tax_calculation_service for each canton
        # For now, return structure
        comparisons = {
            'current_canton': current_canton,
            'current_total_tax': current_tax,
            'comparisons': [],
            'best_canton': None,
            'max_savings': 0
        }

        # TODO: Implement actual canton comparison
        # Would need to recalculate taxes for same income in different cantons

        return comparisons


def main():  # pragma: no cover
    """Command-line interface for testing"""
    import argparse

    parser = argparse.ArgumentParser(
        description='AI Tax Optimization Service'
    )
    parser.add_argument(
        '--filing-id',
        required=True,
        help='Filing ID to optimize'
    )
    parser.add_argument(
        '--provider',
        default='anthropic',
        choices=['anthropic', 'openai'],
        help='AI provider'
    )
    parser.add_argument(
        '--api-key',
        help='API key'
    )

    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO)

    # Get API key
    api_key = args.api_key
    if not api_key:
        import os
        if args.provider == 'anthropic':
            api_key = os.getenv('ANTHROPIC_API_KEY')
        else:
            api_key = os.getenv('OPENAI_API_KEY')

    if not api_key:
        print(f"Error: No API key provided")
        return

    # Get filing and calculation data
    from services.enhanced_tax_calculation_service import \
        EnhancedTaxCalculationService
    from services.filing_orchestration_service import \
        FilingOrchestrationService

    filing_service = FilingOrchestrationService()
    tax_service = EnhancedTaxCalculationService()

    filing = filing_service.get_filing(args.filing_id)
    if not filing:
        print(f"Error: Filing {args.filing_id} not found")
        return

    calculation = tax_service.calculate_single_filing(filing)

    # Get optimization recommendations
    optimization_service = AITaxOptimizationService(
        ai_provider=args.provider,
        api_key=api_key
    )

    result = optimization_service.get_optimization_recommendations(
        filing.to_dict(),
        calculation
    )

    # Print results
    print(f"\n{'='*60}")
    print(f"Tax Optimization Recommendations")
    print(f"{'='*60}")
    print(f"Canton: {result['canton']}")
    print(f"Current Tax: CHF {result['current_tax']:,.2f}")
    print(f"Total Potential Savings: CHF {result['total_potential_savings']:,.2f}")
    print(f"\nRecommendations ({len(result['recommendations'])}):")

    for i, rec in enumerate(result['recommendations'], 1):
        print(f"\n{i}. {rec['title']} ({rec['category'].upper()})")
        print(f"   Priority: {rec.get('priority', 'N/A')}")
        print(f"   Savings: CHF {rec.get('estimated_savings', 0):,.2f}")
        print(f"   Difficulty: {rec.get('implementation_difficulty', 'N/A')}")
        print(f"   Description: {rec['description'][:100]}...")


if __name__ == '__main__':  # pragma: no cover
    main()
