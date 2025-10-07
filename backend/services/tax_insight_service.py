"""
Tax Insight Generation Service
Generates personalized tax insights and recommendations based on user answers
"""
import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from models.tax_answer import TaxAnswer
from models.tax_filing_session import TaxFilingSession
from models.tax_insight import InsightPriority, InsightType, TaxInsight

logger = logging.getLogger(__name__)


class TaxInsightService:
    """Service for generating and managing tax insights"""

    # Question IDs mapped to insight rules
    PILLAR_3A_QUESTION = "Q08"  # Has Pillar 3a?
    PILLAR_3A_AMOUNT = "Q08a"  # Amount contributed
    MULTIPLE_EMPLOYERS_QUESTION = "Q04"  # Number of employers
    CHILDREN_QUESTION = "Q03"  # Has children?
    CHILDREN_COUNT = "Q03a"  # Number of children
    DONATIONS_QUESTION = "Q11"  # Made donations?
    DONATIONS_AMOUNT = "Q11a"  # Donation amount
    PROPERTY_QUESTION = "Q09"  # Owns property? (From _generate_profile line 384)
    MEDICAL_QUESTION = "Q13"  # High medical expenses?
    MEDICAL_AMOUNT = "Q13a"  # Medical expense amount
    CIVIL_STATUS_QUESTION = "Q02"  # Civil status

    # Swiss tax constants
    MAX_PILLAR_3A_EMPLOYED = 7056  # CHF (2024 rate)
    MAX_PILLAR_3A_SELF_EMPLOYED = 35280  # CHF (2024 rate)
    PILLAR_3A_TAX_RATE = 0.25  # Approximate tax savings rate
    CHILD_TAX_CREDIT = 6700  # CHF per child (federal)
    MULTIPLE_EMPLOYER_DEDUCTION = 2600  # CHF standard deduction
    PROPERTY_MAINTENANCE_RATE = 0.20  # 20% of rental value deductible
    MEDICAL_THRESHOLD = 0.05  # 5% of net income threshold

    @staticmethod
    def generate_all_insights(
        db: Session,
        filing_session_id: str,
        force_regenerate: bool = False
    ) -> List[TaxInsight]:
        """
        Generate all applicable insights for a filing session

        Args:
            db: Database session
            filing_session_id: Filing session ID
            force_regenerate: If True, delete existing and regenerate all

        Returns:
            List of generated TaxInsight objects
        """
        # Get filing session
        filing = db.query(TaxFilingSession).filter(
            TaxFilingSession.id == filing_session_id
        ).first()

        if not filing:
            raise ValueError("Filing session not found")

        # If force regenerate, delete existing insights
        if force_regenerate:
            db.query(TaxInsight).filter(
                TaxInsight.filing_session_id == filing_session_id
            ).delete()
            db.commit()

        # Get all answers for this filing
        answers = db.query(TaxAnswer).filter(
            TaxAnswer.filing_session_id == filing_session_id
        ).all()

        # Create answer lookup dictionary
        answer_dict = {answer.question_id: answer for answer in answers}

        # Generate insights based on rules
        insights = []

        # Rule 1: Pillar 3a Opportunity
        pillar_3a_insight = TaxInsightService._check_pillar_3a_opportunity(
            answer_dict, filing_session_id
        )
        if pillar_3a_insight:
            insights.append(pillar_3a_insight)

        # Rule 2: Multiple Employers Deduction
        multi_employer_insight = TaxInsightService._check_multiple_employers(
            answer_dict, filing_session_id
        )
        if multi_employer_insight:
            insights.append(multi_employer_insight)

        # Rule 3: Child Tax Credits
        child_credit_insight = TaxInsightService._check_child_tax_credits(
            answer_dict, filing_session_id
        )
        if child_credit_insight:
            insights.append(child_credit_insight)

        # Rule 4: Charitable Donations
        donation_insight = TaxInsightService._check_charitable_donations(
            answer_dict, filing_session_id
        )
        if donation_insight:
            insights.append(donation_insight)

        # Rule 5: Property Owner Deductions
        property_insight = TaxInsightService._check_property_deductions(
            answer_dict, filing_session_id
        )
        if property_insight:
            insights.append(property_insight)

        # Rule 6: Medical Expenses
        medical_insight = TaxInsightService._check_medical_expenses(
            answer_dict, filing_session_id
        )
        if medical_insight:
            insights.append(medical_insight)

        # Save all insights to database
        for insight in insights:
            db.add(insight)

        db.commit()

        logger.info(f"Generated {len(insights)} insights for filing {filing_session_id}")
        return insights

    @staticmethod
    def _get_answer_value(answer_dict: Dict[str, TaxAnswer], question_id: str) -> Optional[Any]:
        """Safely get decrypted answer value"""
        if question_id not in answer_dict:
            return None

        answer = answer_dict[question_id]
        value = answer.answer_value  # Auto-decrypted by EncryptedText

        # Try to parse as JSON if it looks like JSON
        if isinstance(value, str) and (value.startswith('{') or value.startswith('[')):
            try:
                return json.loads(value)
            except:
                pass

        return value

    @staticmethod
    def _check_pillar_3a_opportunity(
        answer_dict: Dict[str, TaxAnswer],
        filing_session_id: str
    ) -> Optional[TaxInsight]:
        """
        Check if user can benefit from Pillar 3a contributions

        Triggers if:
        - User answered NO to Q08 (doesn't have Pillar 3a)
        - OR contributed less than maximum
        """
        has_pillar_3a = TaxInsightService._get_answer_value(answer_dict, TaxInsightService.PILLAR_3A_QUESTION)
        pillar_3a_amount = TaxInsightService._get_answer_value(answer_dict, TaxInsightService.PILLAR_3A_AMOUNT)

        # Convert to proper types
        has_pillar_3a = has_pillar_3a in ['yes', 'true', True, 1] if has_pillar_3a else False

        if pillar_3a_amount:
            try:
                pillar_3a_amount = int(pillar_3a_amount)
            except:
                pillar_3a_amount = 0
        else:
            pillar_3a_amount = 0

        # Check if there's opportunity
        max_contribution = TaxInsightService.MAX_PILLAR_3A_EMPLOYED
        remaining = max_contribution - pillar_3a_amount

        if not has_pillar_3a or remaining > 1000:
            # Calculate potential savings
            potential_contribution = remaining if has_pillar_3a else max_contribution
            estimated_savings = int(potential_contribution * TaxInsightService.PILLAR_3A_TAX_RATE)

            insight = TaxInsight(
                filing_session_id=filing_session_id,
                insight_type=InsightType.DEDUCTION_OPPORTUNITY,
                priority=InsightPriority.HIGH,
                title="Maximize Pillar 3a Contributions",
                description=f"You can contribute up to CHF {max_contribution:,} per year to Pillar 3a. "
                           f"{'You have not yet started contributing.' if not has_pillar_3a else f'You currently contribute CHF {pillar_3a_amount:,}. Consider increasing your contribution by CHF {remaining:,}.'} "
                           f"Pillar 3a contributions are fully tax-deductible and could save you approximately CHF {estimated_savings:,} in taxes.",
                estimated_savings_chf=estimated_savings,
                related_questions=json.dumps([TaxInsightService.PILLAR_3A_QUESTION, TaxInsightService.PILLAR_3A_AMOUNT]),
                action_items=json.dumps([
                    "Open a Pillar 3a account at your bank or insurance company",
                    f"Set up automatic monthly transfers of CHF {int(potential_contribution/12):,}",
                    "Make contributions before December 31 to claim deductions this year"
                ])
            )

            logger.info(f"Generated Pillar 3a insight: {estimated_savings} CHF savings")
            return insight

        return None

    @staticmethod
    def _check_multiple_employers(
        answer_dict: Dict[str, TaxAnswer],
        filing_session_id: str
    ) -> Optional[TaxInsight]:
        """
        Check if user has multiple employers and can claim deductions

        Triggers if: Number of employers > 1
        """
        num_employers = TaxInsightService._get_answer_value(answer_dict, TaxInsightService.MULTIPLE_EMPLOYERS_QUESTION)

        if not num_employers:
            return None

        try:
            num_employers = int(num_employers)
        except:
            return None

        if num_employers > 1:
            estimated_savings = int(TaxInsightService.MULTIPLE_EMPLOYER_DEDUCTION * 0.20)  # ~20% tax rate

            insight = TaxInsight(
                filing_session_id=filing_session_id,
                insight_type=InsightType.TAX_SAVING_TIP,
                priority=InsightPriority.MEDIUM,
                title="Multiple Employer Deductions Available",
                description=f"You indicated having {num_employers} employers. When working for multiple employers, "
                           f"you may be eligible for additional deductions including professional expenses, "
                           f"commuting costs between workplaces, and potentially overpaid social security contributions. "
                           f"This could save you approximately CHF {estimated_savings:,}.",
                estimated_savings_chf=estimated_savings,
                related_questions=json.dumps([TaxInsightService.MULTIPLE_EMPLOYERS_QUESTION]),
                action_items=json.dumps([
                    "Gather salary certificates from all employers",
                    "Calculate total professional expenses across all jobs",
                    "Check for AHV/AVS overpayments (refund possible)",
                    "Consider consulting a tax advisor for optimization"
                ])
            )

            logger.info(f"Generated multiple employers insight: {num_employers} employers")
            return insight

        return None

    @staticmethod
    def _check_child_tax_credits(
        answer_dict: Dict[str, TaxAnswer],
        filing_session_id: str
    ) -> Optional[TaxInsight]:
        """
        Check if user has children and is claiming all available credits

        Triggers if: User has children
        """
        has_children = TaxInsightService._get_answer_value(answer_dict, TaxInsightService.CHILDREN_QUESTION)
        num_children = TaxInsightService._get_answer_value(answer_dict, TaxInsightService.CHILDREN_COUNT)

        has_children = has_children in ['yes', 'true', True, 1] if has_children else False

        if not has_children:
            return None

        try:
            num_children = int(num_children) if num_children else 1
        except:
            num_children = 1

        total_credit = num_children * TaxInsightService.CHILD_TAX_CREDIT
        estimated_savings = int(total_credit * 0.25)  # 25% effective rate

        insight = TaxInsight(
            filing_session_id=filing_session_id,
            insight_type=InsightType.DEDUCTION_OPPORTUNITY,
            priority=InsightPriority.HIGH,
            title="Maximize Child Tax Credits and Deductions",
            description=f"With {num_children} {'child' if num_children == 1 else 'children'}, you are eligible for significant tax benefits. "
                       f"Federal child deductions total CHF {total_credit:,}, plus childcare expenses are fully deductible. "
                       f"Make sure you're claiming all available credits - potential savings of CHF {estimated_savings:,} or more.",
            estimated_savings_chf=estimated_savings,
            related_questions=json.dumps([TaxInsightService.CHILDREN_QUESTION, TaxInsightService.CHILDREN_COUNT]),
            action_items=json.dumps([
                "Ensure all children are registered in your tax profile",
                "Collect receipts for childcare, daycare, and after-school programs",
                "Claim education-related expenses (tutoring, music lessons, etc.)",
                "Consider healthcare premiums paid for children",
                "Review cantonal child allowances and credits"
            ])
        )

        logger.info(f"Generated child tax credit insight: {num_children} children")
        return insight

    @staticmethod
    def _check_charitable_donations(
        answer_dict: Dict[str, TaxAnswer],
        filing_session_id: str
    ) -> Optional[TaxInsight]:
        """
        Check if user made charitable donations and is maximizing deductions

        Triggers if: User made donations
        """
        has_donations = TaxInsightService._get_answer_value(answer_dict, TaxInsightService.DONATIONS_QUESTION)
        donation_amount = TaxInsightService._get_answer_value(answer_dict, TaxInsightService.DONATIONS_AMOUNT)

        has_donations = has_donations in ['yes', 'true', True, 1] if has_donations else False

        if not has_donations:
            return None

        try:
            donation_amount = int(donation_amount) if donation_amount else 0
        except:
            donation_amount = 0

        if donation_amount == 0:
            # User said yes but didn't specify amount
            insight = TaxInsight(
                filing_session_id=filing_session_id,
                insight_type=InsightType.MISSING_DOCUMENT,
                priority=InsightPriority.MEDIUM,
                title="Document Your Charitable Donations",
                description="You indicated making charitable donations, but haven't specified the amount. "
                           "Donations to recognized charities are tax-deductible and can reduce your tax burden. "
                           "Make sure to collect official donation receipts.",
                estimated_savings_chf=None,
                related_questions=json.dumps([TaxInsightService.DONATIONS_QUESTION, TaxInsightService.DONATIONS_AMOUNT]),
                action_items=json.dumps([
                    "Gather all donation receipts from 2024",
                    "Verify charities are tax-recognized (check tax authority list)",
                    "Enter total donation amount in the tax form",
                    "Keep receipts for at least 10 years"
                ])
            )
        else:
            # User has donations - provide optimization tips
            estimated_savings = int(donation_amount * 0.25)  # 25% tax rate

            insight = TaxInsight(
                filing_session_id=filing_session_id,
                insight_type=InsightType.TAX_SAVING_TIP,
                priority=InsightPriority.LOW,
                title="Charitable Donation Deductions",
                description=f"Great! Your charitable donations of CHF {donation_amount:,} are tax-deductible. "
                           f"This should save you approximately CHF {estimated_savings:,} in taxes. "
                           f"Consider setting up regular donations to maximize future tax benefits.",
                estimated_savings_chf=estimated_savings,
                related_questions=json.dumps([TaxInsightService.DONATIONS_QUESTION, TaxInsightService.DONATIONS_AMOUNT]),
                action_items=json.dumps([
                    "Ensure you have official receipts for all donations",
                    "Consider setting up automatic monthly donations for next year",
                    "Research additional tax-recognized charities aligned with your values"
                ])
            )

        logger.info(f"Generated donation insight: {donation_amount} CHF")
        return insight

    @staticmethod
    def _check_property_deductions(
        answer_dict: Dict[str, TaxAnswer],
        filing_session_id: str
    ) -> Optional[TaxInsight]:
        """
        Check if user owns property and is claiming all deductions

        Triggers if: User owns property
        """
        owns_property = TaxInsightService._get_answer_value(answer_dict, TaxInsightService.PROPERTY_QUESTION)

        owns_property = owns_property in ['yes', 'true', True, 1] if owns_property else False

        if not owns_property:
            return None

        # Property owners have significant deduction opportunities
        estimated_savings = 3000  # Conservative estimate

        insight = TaxInsight(
            filing_session_id=filing_session_id,
            insight_type=InsightType.DEDUCTION_OPPORTUNITY,
            priority=InsightPriority.HIGH,
            title="Property Owner Tax Deductions",
            description="As a property owner, you're eligible for substantial tax deductions including mortgage interest, "
                       "property maintenance costs (up to 20% of rental value), renovation expenses, and property management fees. "
                       f"These deductions could save you CHF {estimated_savings:,} or more annually.",
            estimated_savings_chf=estimated_savings,
            related_questions=json.dumps([TaxInsightService.PROPERTY_QUESTION]),
            action_items=json.dumps([
                "Collect all mortgage interest statements from your bank",
                "Gather receipts for maintenance and repairs (heating, plumbing, painting, etc.)",
                "Document renovation expenses (energy efficiency upgrades are especially beneficial)",
                "Include property insurance premiums",
                "Claim property management fees if applicable",
                "Consider energy-efficient upgrades for additional tax incentives"
            ])
        )

        logger.info("Generated property deduction insight")
        return insight

    @staticmethod
    def _check_medical_expenses(
        answer_dict: Dict[str, TaxAnswer],
        filing_session_id: str
    ) -> Optional[TaxInsight]:
        """
        Check if user has high medical expenses that exceed deductible threshold

        Triggers if: User has high medical expenses
        """
        has_medical = TaxInsightService._get_answer_value(answer_dict, TaxInsightService.MEDICAL_QUESTION)
        medical_amount = TaxInsightService._get_answer_value(answer_dict, TaxInsightService.MEDICAL_AMOUNT)

        has_medical = has_medical in ['yes', 'true', True, 1] if has_medical else False

        if not has_medical:
            return None

        try:
            medical_amount = int(medical_amount) if medical_amount else 0
        except:
            medical_amount = 0

        # Medical expenses are only deductible above 5% of net income threshold
        # We'll assume a threshold and provide guidance

        if medical_amount > 0:
            estimated_savings = int(medical_amount * 0.25)  # 25% tax rate

            insight = TaxInsight(
                filing_session_id=filing_session_id,
                insight_type=InsightType.DEDUCTION_OPPORTUNITY,
                priority=InsightPriority.MEDIUM,
                title="Medical Expense Deductions",
                description=f"You reported CHF {medical_amount:,} in medical expenses. Medical costs exceeding 5% of your net income "
                           f"are tax-deductible. This includes health insurance premiums, dental work, prescriptions, and therapies "
                           f"not covered by insurance. Potential tax savings: CHF {estimated_savings:,}.",
                estimated_savings_chf=estimated_savings,
                related_questions=json.dumps([TaxInsightService.MEDICAL_QUESTION, TaxInsightService.MEDICAL_AMOUNT]),
                action_items=json.dumps([
                    "Gather all health insurance premium statements",
                    "Collect receipts for out-of-pocket medical expenses (dentist, optician, etc.)",
                    "Include prescription medication costs",
                    "Document alternative medicine treatments if prescribed by a doctor",
                    "Keep records of medical travel expenses if significant"
                ])
            )

            logger.info(f"Generated medical expense insight: {medical_amount} CHF")
            return insight

        return None

    @staticmethod
    def get_filing_insights(
        db: Session,
        filing_session_id: str,
        user_id: str
    ) -> List[Dict]:
        """
        Get all insights for a filing session

        Args:
            db: Database session
            filing_session_id: Filing session ID
            user_id: User ID (for security verification)

        Returns:
            List of insight dictionaries
        """
        # Verify filing belongs to user
        filing = db.query(TaxFilingSession).filter(
            TaxFilingSession.id == filing_session_id,
            TaxFilingSession.user_id == user_id
        ).first()

        if not filing:
            raise ValueError("Filing not found or access denied")

        # Get insights
        insights = db.query(TaxInsight).filter(
            TaxInsight.filing_session_id == filing_session_id
        ).order_by(
            TaxInsight.priority.desc(),
            TaxInsight.created_at.desc()
        ).all()

        return [insight.to_dict() for insight in insights]

    @staticmethod
    def acknowledge_insight(
        db: Session,
        insight_id: str,
        user_id: str
    ) -> TaxInsight:
        """
        Mark an insight as acknowledged by user

        Args:
            db: Database session
            insight_id: Insight ID
            user_id: User ID (for security)

        Returns:
            Updated TaxInsight object
        """
        # Get insight with filing session for security check
        insight = db.query(TaxInsight).join(TaxFilingSession).filter(
            TaxInsight.id == insight_id,
            TaxFilingSession.user_id == user_id
        ).first()

        if not insight:
            raise ValueError("Insight not found or access denied")

        insight.is_acknowledged = 1
        insight.acknowledged_at = datetime.utcnow()

        db.commit()
        db.refresh(insight)

        logger.info(f"User {user_id} acknowledged insight {insight_id}")
        return insight

    @staticmethod
    def mark_insight_applied(
        db: Session,
        insight_id: str,
        user_id: str
    ) -> TaxInsight:
        """
        Mark an insight as applied (user took action)

        Args:
            db: Database session
            insight_id: Insight ID
            user_id: User ID (for security)

        Returns:
            Updated TaxInsight object
        """
        # Get insight with filing session for security check
        insight = db.query(TaxInsight).join(TaxFilingSession).filter(
            TaxInsight.id == insight_id,
            TaxFilingSession.user_id == user_id
        ).first()

        if not insight:
            raise ValueError("Insight not found or access denied")

        insight.is_applied = 1

        db.commit()
        db.refresh(insight)

        logger.info(f"User {user_id} marked insight {insight_id} as applied")
        return insight
