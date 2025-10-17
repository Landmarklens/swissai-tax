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
from models.tax_insight import InsightPriority, InsightType, TaxInsight, InsightCategory, InsightSubcategory
from models.interview_session import InterviewSession
from models.pending_document import PendingDocument, DocumentStatus

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
            except (json.JSONDecodeError, ValueError) as e:
                logger.warning(f"Failed to parse JSON for question {question_id}: {e}")
                pass

        return value

    @staticmethod
    def _is_truthy(value) -> bool:
        """
        Convert various truthy values to boolean.
        Handles common answer formats from the interview.

        Accepts:
        - String: 'yes', 'true', 'True' (Python's str(True))
        - Boolean: True
        - Integer: 1
        - String number: '1'
        """
        if value is None:
            return False
        return value in ['yes', 'true', 'True', True, 1, '1']

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
            except (ValueError, TypeError) as e:
                logger.warning(f"Failed to parse Pillar 3a amount: {e}")
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
        except (ValueError, TypeError) as e:
            logger.warning(f"Failed to parse number of employers: {e}")
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
        except (ValueError, TypeError) as e:
            logger.warning(f"Failed to parse number of children in child tax credits: {e}")
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
        except (ValueError, TypeError) as e:
            logger.warning(f"Failed to parse donation amount: {e}")
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
        except (ValueError, TypeError) as e:
            logger.warning(f"Failed to parse medical amount: {e}")
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

        # Get insights with explicit priority ordering
        from sqlalchemy import case

        # Create explicit priority order: HIGH=3, MEDIUM=2, LOW=1
        priority_order = case(
            (TaxInsight.priority == InsightPriority.HIGH, 3),
            (TaxInsight.priority == InsightPriority.MEDIUM, 2),
            (TaxInsight.priority == InsightPriority.LOW, 1),
            else_=0
        )

        insights = db.query(TaxInsight).filter(
            TaxInsight.filing_session_id == filing_session_id
        ).order_by(
            priority_order.desc(),
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

    @staticmethod
    def complete_pending_document_insight(
        db: Session,
        pending_document_id: str,
        filing_session_id: str,
        user_id: str
    ) -> bool:
        """
        Mark pending document insight as completed when document is uploaded

        Args:
            db: Database session
            pending_document_id: ID of the pending document
            filing_session_id: Filing session ID
            user_id: User ID (for security)

        Returns:
            True if insight was updated
        """
        # Verify user owns the filing session
        filing = db.query(TaxFilingSession).filter(
            TaxFilingSession.id == filing_session_id,
            TaxFilingSession.user_id == user_id
        ).first()

        if not filing:
            raise ValueError("Filing not found or access denied")

        # Find the insight related to this pending document
        # The pending_doc_id is stored in related_questions as "pending_doc:{id}"
        insights = db.query(TaxInsight).filter(
            TaxInsight.filing_session_id == filing_session_id,
            TaxInsight.insight_type == InsightType.MISSING_DOCUMENT,
            TaxInsight.category == InsightCategory.ACTION_REQUIRED
        ).all()

        for insight in insights:
            # Check if this insight is for the uploaded document
            if insight.related_questions:
                try:
                    related = json.loads(insight.related_questions)
                    if f"pending_doc:{pending_document_id}" in related:
                        # Move insight to completed
                        insight.category = InsightCategory.COMPLETED
                        insight.is_applied = 1
                        insight.priority = InsightPriority.LOW

                        # Update description to show it's completed
                        doc_type = insight.title.replace("Upload ", "")
                        insight.title = f"{doc_type} Uploaded"
                        insight.description = f"You have successfully uploaded {doc_type}."
                        insight.action_items = json.dumps([])  # Clear action items

                        db.commit()
                        logger.info(f"Completed pending document insight for document {pending_document_id}")
                        return True
                except (json.JSONDecodeError, ValueError) as e:
                    logger.warning(f"Failed to parse related_questions for insight {insight.id}: {e}")
                    continue

        logger.warning(f"No insight found for pending document {pending_document_id}")
        return False

    @staticmethod
    def generate_progressive_insights(
        db: Session,
        filing_session_id: str,
        interview_session_id: str
    ) -> List[TaxInsight]:
        """
        Generate insights progressively after each answer.
        
        This method:
        1. Checks all 6 insight rules
        2. Determines if insights should be "completed" or "action_required"
        3. Updates existing insights if they change category
        4. Creates new insights for pending documents
        
        Args:
            db: Database session
            filing_session_id: Filing session ID
            interview_session_id: Interview session ID (to get viewed questions)
        
        Returns:
            List of generated/updated TaxInsight objects
        """
        # Get filing session
        filing = db.query(TaxFilingSession).filter(
            TaxFilingSession.id == filing_session_id
        ).first()
        
        if not filing:
            raise ValueError("Filing session not found")
        
        # Get interview session to find viewed questions
        interview = db.query(InterviewSession).filter(
            InterviewSession.id == interview_session_id
        ).first()
        
        viewed_questions = set(interview.completed_questions or []) if interview else set()
        
        # Get all answers for this filing
        answers = db.query(TaxAnswer).filter(
            TaxAnswer.filing_session_id == filing_session_id
        ).all()
        
        answer_dict = {answer.question_id: answer for answer in answers}
        answered_questions = set(answer_dict.keys())

        # Instead of deleting all insights, we'll track which ones to keep/update
        # Get existing insights to avoid duplicates
        existing_insights = db.query(TaxInsight).filter(
            TaxInsight.filing_session_id == filing_session_id
        ).all()

        # Create a map of existing insights by subcategory for easy lookup
        existing_by_subcategory = {
            insight.subcategory: insight for insight in existing_insights
        }

        insights = []

        # Generate DATA INSIGHTS from answered questions (completed category)
        data_insights = TaxInsightService._generate_data_insights(
            db, answer_dict, filing_session_id
        )
        insights.extend(data_insights)

        # Generate ACTION REQUIRED insights for viewed-but-unanswered questions
        # These show tax-saving tips for questions they saw but skipped
        insights.extend(TaxInsightService._generate_pillar_3a_insights(
            answer_dict, viewed_questions, answered_questions, filing_session_id
        ))

        insights.extend(TaxInsightService._generate_multiple_employer_insights(
            answer_dict, viewed_questions, answered_questions, filing_session_id
        ))

        insights.extend(TaxInsightService._generate_children_insights(
            answer_dict, viewed_questions, answered_questions, filing_session_id
        ))

        insights.extend(TaxInsightService._generate_donation_insights(
            answer_dict, viewed_questions, answered_questions, filing_session_id
        ))

        insights.extend(TaxInsightService._generate_property_insights(
            answer_dict, viewed_questions, answered_questions, filing_session_id
        ))

        insights.extend(TaxInsightService._generate_medical_insights(
            answer_dict, viewed_questions, answered_questions, filing_session_id
        ))

        # Generate PENDING DOCUMENT insights
        insights.extend(TaxInsightService._generate_pending_document_insights(
            db, filing_session_id
        ))

        # Instead of always adding new insights, update existing ones or add new
        # Track which subcategories we've seen in new insights
        new_insights_by_subcategory = {}
        for insight in insights:
            # Use subcategory as key, but for pending documents use title too (multiple can exist)
            if insight.subcategory == InsightSubcategory.GENERAL and insight.insight_type == InsightType.MISSING_DOCUMENT:
                # For pending documents, use a combination of subcategory and title
                key = f"{insight.subcategory}_{insight.title}"
            else:
                key = insight.subcategory
            new_insights_by_subcategory[key] = insight

        # Track which existing insights to delete (ones that no longer apply)
        insights_to_delete = []

        for existing_insight in existing_insights:
            # Create same key structure
            if existing_insight.subcategory == InsightSubcategory.GENERAL and existing_insight.insight_type == InsightType.MISSING_DOCUMENT:
                key = f"{existing_insight.subcategory}_{existing_insight.title}"
            else:
                key = existing_insight.subcategory

            if key in new_insights_by_subcategory:
                # Update existing insight with new data
                new_insight = new_insights_by_subcategory[key]
                existing_insight.title = new_insight.title
                existing_insight.description = new_insight.description
                existing_insight.estimated_savings_chf = new_insight.estimated_savings_chf
                existing_insight.priority = new_insight.priority
                existing_insight.category = new_insight.category
                existing_insight.related_questions = new_insight.related_questions
                existing_insight.action_items = new_insight.action_items
                # Remove from new insights dict since we updated the existing one
                del new_insights_by_subcategory[key]
            else:
                # This insight no longer applies, mark for deletion
                insights_to_delete.append(existing_insight)

        # Delete insights that no longer apply
        for insight in insights_to_delete:
            db.delete(insight)

        # Add only the truly new insights (ones that didn't exist before)
        for new_insight in new_insights_by_subcategory.values():
            db.add(new_insight)

        db.commit()

        logger.info(f"Updated/added {len(insights)} progressive insights for filing {filing_session_id} "
                    f"({len(new_insights_by_subcategory)} new, {len(insights) - len(new_insights_by_subcategory)} updated, "
                    f"{len(insights_to_delete)} removed)")
        return insights
    
    @staticmethod
    def _generate_pillar_3a_insights(
        answer_dict, viewed_questions, answered_questions, filing_session_id
    ) -> List[TaxInsight]:
        """Generate Pillar 3a ACTION REQUIRED insights only (for skipped questions)"""
        insights = []

        q08_answered = TaxInsightService.PILLAR_3A_QUESTION in answered_questions

        # ONLY generate if Q08 viewed but not answered - action required
        if TaxInsightService.PILLAR_3A_QUESTION in viewed_questions and not q08_answered:
            insights.append(TaxInsight(
                filing_session_id=filing_session_id,
                insight_type=InsightType.DEDUCTION_OPPORTUNITY,
                priority=InsightPriority.HIGH,
                category=InsightCategory.ACTION_REQUIRED,
                subcategory=InsightSubcategory.RETIREMENT_SAVINGS,
                title="Complete Pillar 3a Question",
                description="Answer the retirement savings question to see potential tax savings. Pillar 3a contributions can save up to CHF 1,764 in taxes annually.",
                estimated_savings_chf=1764,
                related_questions=json.dumps([TaxInsightService.PILLAR_3A_QUESTION]),
                action_items=json.dumps(["Complete the Pillar 3a question in the interview"])
            ))

        return insights
    
    @staticmethod
    def _generate_multiple_employer_insights(
        answer_dict, viewed_questions, answered_questions, filing_session_id
    ) -> List[TaxInsight]:
        """Generate multiple employer ACTION REQUIRED insights only"""
        insights = []

        q04_answered = TaxInsightService.MULTIPLE_EMPLOYERS_QUESTION in answered_questions

        # ONLY generate if viewed but not answered
        if TaxInsightService.MULTIPLE_EMPLOYERS_QUESTION in viewed_questions and not q04_answered:
            insights.append(TaxInsight(
                filing_session_id=filing_session_id,
                insight_type=InsightType.TAX_SAVING_TIP,
                priority=InsightPriority.MEDIUM,
                category=InsightCategory.ACTION_REQUIRED,
                subcategory=InsightSubcategory.EMPLOYMENT,
                title="Complete Employment Question",
                description="Answer the employment question to see if you qualify for multiple employer deductions.",
                estimated_savings_chf=520,
                related_questions=json.dumps([TaxInsightService.MULTIPLE_EMPLOYERS_QUESTION]),
                action_items=json.dumps(["Complete the number of employers question"])
            ))

        return insights
    
    @staticmethod
    def _generate_children_insights(
        answer_dict, viewed_questions, answered_questions, filing_session_id
    ) -> List[TaxInsight]:
        """Generate children ACTION REQUIRED insights only"""
        insights = []

        q03_answered = TaxInsightService.CHILDREN_QUESTION in answered_questions

        # ONLY generate if viewed but not answered
        if TaxInsightService.CHILDREN_QUESTION in viewed_questions and not q03_answered:
            insights.append(TaxInsight(
                filing_session_id=filing_session_id,
                insight_type=InsightType.DEDUCTION_OPPORTUNITY,
                priority=InsightPriority.HIGH,
                category=InsightCategory.ACTION_REQUIRED,
                subcategory=InsightSubcategory.KIDS,
                title="Complete Children Question",
                description="Answer the children question to unlock child tax credits worth up to CHF 1,675 per child.",
                estimated_savings_chf=1675,
                related_questions=json.dumps([TaxInsightService.CHILDREN_QUESTION]),
                action_items=json.dumps(["Complete the children question in the interview"])
            ))

        return insights
    
    @staticmethod
    def _generate_donation_insights(
        answer_dict, viewed_questions, answered_questions, filing_session_id
    ) -> List[TaxInsight]:
        """Generate donation ACTION REQUIRED insights only"""
        insights = []

        q11_answered = TaxInsightService.DONATIONS_QUESTION in answered_questions

        # ONLY generate if viewed but not answered
        if TaxInsightService.DONATIONS_QUESTION in viewed_questions and not q11_answered:
            insights.append(TaxInsight(
                filing_session_id=filing_session_id,
                insight_type=InsightType.TAX_SAVING_TIP,
                priority=InsightPriority.MEDIUM,
                category=InsightCategory.ACTION_REQUIRED,
                subcategory=InsightSubcategory.DEDUCTIONS,
                title="Complete Donation Question",
                description="Answer the charitable donations question to see potential tax deductions.",
                estimated_savings_chf=None,
                related_questions=json.dumps([TaxInsightService.DONATIONS_QUESTION]),
                action_items=json.dumps(["Complete the donations question"])
            ))

        return insights
    
    @staticmethod
    def _generate_property_insights(
        answer_dict, viewed_questions, answered_questions, filing_session_id
    ) -> List[TaxInsight]:
        """Generate property ACTION REQUIRED insights only"""
        insights = []

        q09_answered = TaxInsightService.PROPERTY_QUESTION in answered_questions

        # ONLY generate if viewed but not answered
        if TaxInsightService.PROPERTY_QUESTION in viewed_questions and not q09_answered:
            insights.append(TaxInsight(
                filing_session_id=filing_session_id,
                insight_type=InsightType.DEDUCTION_OPPORTUNITY,
                priority=InsightPriority.HIGH,
                category=InsightCategory.ACTION_REQUIRED,
                subcategory=InsightSubcategory.PROPERTY_ASSETS,
                title="Complete Property Question",
                description="Answer the property ownership question to see deductions worth CHF 3,000+ annually.",
                estimated_savings_chf=3000,
                related_questions=json.dumps([TaxInsightService.PROPERTY_QUESTION]),
                action_items=json.dumps(["Complete the property ownership question"])
            ))

        return insights
    
    @staticmethod
    def _generate_medical_insights(
        answer_dict, viewed_questions, answered_questions, filing_session_id
    ) -> List[TaxInsight]:
        """Generate medical ACTION REQUIRED insights only"""
        insights = []

        q13_answered = TaxInsightService.MEDICAL_QUESTION in answered_questions

        # ONLY generate if viewed but not answered
        if TaxInsightService.MEDICAL_QUESTION in viewed_questions and not q13_answered:
            insights.append(TaxInsight(
                filing_session_id=filing_session_id,
                insight_type=InsightType.DEDUCTION_OPPORTUNITY,
                priority=InsightPriority.MEDIUM,
                category=InsightCategory.ACTION_REQUIRED,
                subcategory=InsightSubcategory.DEDUCTIONS,
                title="Complete Medical Expenses Question",
                description="Answer the medical expenses question to see potential deductions.",
                estimated_savings_chf=None,
                related_questions=json.dumps([TaxInsightService.MEDICAL_QUESTION]),
                action_items=json.dumps(["Complete the medical expenses question"])
            ))

        return insights
    
    @staticmethod
    def _generate_pending_document_insights(
        db: Session,
        filing_session_id: str
    ) -> List[TaxInsight]:
        """Generate insights for pending documents"""
        insights = []

        # Get pending documents
        pending_docs = db.query(PendingDocument).filter(
            PendingDocument.filing_session_id == filing_session_id,
            PendingDocument.status == DocumentStatus.PENDING
        ).all()

        logger.info(f"[PENDING DOCS] Found {len(pending_docs)} pending documents for filing {filing_session_id}")

        for doc in pending_docs:
            # Safely handle document_type - add null check
            doc_type_display = (doc.document_type or 'Document').replace('_', ' ').title()
            doc_label = doc.document_label or doc.document_type or 'document'

            logger.info(f"[PENDING DOCS] Creating insight for: {doc_type_display} (label: {doc_label}, question: {doc.question_id})")

            # Store pending document ID in related_questions as metadata
            # Format: ["pending_doc:{document_id}", "question_id"]
            related_data = json.dumps([f"pending_doc:{doc.id}", doc.question_id])

            insight = TaxInsight(
                filing_session_id=filing_session_id,
                insight_type=InsightType.MISSING_DOCUMENT,
                priority=InsightPriority.HIGH,
                category=InsightCategory.ACTION_REQUIRED,
                subcategory=InsightSubcategory.GENERAL,
                title=f"Upload {doc_type_display}",
                description=f"You marked this document as 'bring later'. Upload {doc_label} to complete your filing.",
                estimated_savings_chf=None,
                related_questions=related_data,
                action_items=json.dumps([
                    {
                        "text": f"Upload {doc_label}",
                        "action_type": "upload_document",
                        "pending_document_id": str(doc.id),
                        "question_id": doc.question_id
                    }
                ])
            )
            insights.append(insight)
            logger.info(f"[PENDING DOCS] Added insight: '{insight.title}'")

        logger.info(f"[PENDING DOCS] Returning {len(insights)} pending document insights")
        return insights

    # ==================== DATA EXTRACTION METHODS ====================
    # These methods extract actual user data from answers to display as insights
    
    @staticmethod
    def _generate_data_insights(
        db: Session,
        answer_dict: Dict[str, TaxAnswer],
        filing_session_id: str
    ) -> List[TaxInsight]:
        """
        Generate insights showing actual user data from answers.
        This is the main method that calls all data extraction helpers.
        """
        insights = []

        # Extract personal information
        personal_insight = TaxInsightService._extract_personal_info(answer_dict, filing_session_id)
        if personal_insight:
            insights.append(personal_insight)

        # Extract partner information (separate from personal)
        partner_insight = TaxInsightService._extract_partner_info(answer_dict, filing_session_id)
        if partner_insight:
            insights.append(partner_insight)

        # Extract location information
        location_insight = TaxInsightService._extract_location_info(db, answer_dict, filing_session_id)
        if location_insight:
            insights.append(location_insight)

        # Extract family information
        family_insight = TaxInsightService._extract_family_info(answer_dict, filing_session_id)
        if family_insight:
            insights.append(family_insight)

        # Extract employment information
        employment_insight = TaxInsightService._extract_employment_info(answer_dict, filing_session_id)
        if employment_insight:
            insights.append(employment_insight)

        # Extract retirement & savings information
        retirement_insight = TaxInsightService._extract_retirement_info(answer_dict, filing_session_id)
        if retirement_insight:
            insights.append(retirement_insight)

        # Extract property & assets information
        property_insight = TaxInsightService._extract_property_info(answer_dict, filing_session_id)
        if property_insight:
            insights.append(property_insight)

        # Extract deductions information
        deductions_insight = TaxInsightService._extract_deductions_info(answer_dict, filing_session_id)
        if deductions_insight:
            insights.append(deductions_insight)

        return insights
    
    @staticmethod
    def _extract_personal_info(
        answer_dict: Dict[str, TaxAnswer],
        filing_session_id: str
    ) -> Optional[TaxInsight]:
        """Extract personal information: name, AHV, marital status (user only, not spouse)"""
        data_parts = []
        
        # Name
        name = TaxInsightService._get_answer_value(answer_dict, "Q00_name")
        if name:
            data_parts.append(f"👤 Name: {name}")
        
        # AHV Number
        ahv = TaxInsightService._get_answer_value(answer_dict, "Q00")
        if ahv:
            data_parts.append(f"🆔 AHV: {ahv}")
        
        # Marital Status
        marital_status = TaxInsightService._get_answer_value(answer_dict, "Q01")
        if marital_status:
            status_text = {
                'single': 'Single',
                'married': 'Married',
                'divorced': 'Divorced',
                'widowed': 'Widowed',
                'registered_partnership': 'Registered Partnership'
            }.get(marital_status, marital_status.capitalize())
            data_parts.append(f"💑 Status: {status_text}")

        if not data_parts:
            return None

        return TaxInsight(
            filing_session_id=filing_session_id,
            insight_type=InsightType.DATA_SUMMARY,
            priority=InsightPriority.LOW,
            category=InsightCategory.COMPLETED,
            subcategory=InsightSubcategory.PERSONAL,
            title="Personal Information",
            description="\n".join(data_parts),
            estimated_savings_chf=None,
            related_questions=json.dumps(["Q00_name", "Q00", "Q01"]),
            action_items=json.dumps([])
        )

    @staticmethod
    def _extract_partner_info(
        answer_dict: Dict[str, TaxAnswer],
        filing_session_id: str
    ) -> Optional[TaxInsight]:
        """Extract partner/spouse information: name, AHV, employment status"""
        # Only show partner info if user is married
        marital_status = TaxInsightService._get_answer_value(answer_dict, "Q01")
        if marital_status != 'married':
            return None

        data_parts = []

        # Spouse name
        spouse_name = TaxInsightService._get_answer_value(answer_dict, "Q01a_name")
        if spouse_name:
            data_parts.append(f"👤 Name: {spouse_name}")

        # Spouse AHV
        spouse_ahv = TaxInsightService._get_answer_value(answer_dict, "Q01a")
        if spouse_ahv:
            data_parts.append(f"🆔 AHV: {spouse_ahv}")

        # Spouse employment status
        spouse_employed = TaxInsightService._get_answer_value(answer_dict, "Q01d")
        if spouse_employed is not None:
            employed_text = "Employed" if TaxInsightService._is_truthy(spouse_employed) else "Not employed"
            data_parts.append(f"💼 Employment: {employed_text}")

        if not data_parts:
            return None

        return TaxInsight(
            filing_session_id=filing_session_id,
            insight_type=InsightType.DATA_SUMMARY,
            priority=InsightPriority.LOW,
            category=InsightCategory.COMPLETED,
            subcategory=InsightSubcategory.PARTNER,
            title="Partner Information",
            description="\n".join(data_parts),
            estimated_savings_chf=None,
            related_questions=json.dumps(["Q01a_name", "Q01a", "Q01d"]),
            action_items=json.dumps([])
        )

    @staticmethod
    def _extract_location_info(
        db: Session,
        answer_dict: Dict[str, TaxAnswer],
        filing_session_id: str
    ) -> Optional[TaxInsight]:
        """Extract location information: canton, municipality from filing session"""
        data_parts = []

        # Get primary location from filing_sessions table (NOT from Q02a which is yes/no)
        try:
            filing = db.query(TaxFilingSession).filter(
                TaxFilingSession.id == filing_session_id
            ).first()

            if filing:
                location_str = ""
                if filing.municipality:
                    location_str = filing.municipality
                if filing.canton:
                    location_str += f", {filing.canton}" if location_str else filing.canton

                if location_str:
                    data_parts.append(f"📍 Primary: {location_str}")
        except Exception as e:
            logger.error(f"Failed to extract location from filing session: {e}")

        # Secondary location (if multi-canton) - Q02b is multi_canton type
        has_multi_canton = TaxInsightService._get_answer_value(answer_dict, "Q02a")
        if TaxInsightService._is_truthy(has_multi_canton):
            secondary_cantons = TaxInsightService._get_answer_value(answer_dict, "Q02b")
            if secondary_cantons and isinstance(secondary_cantons, list):
                for canton_data in secondary_cantons:
                    # Handle both formats:
                    # 1. String format: ['ZH', 'BE'] (current frontend)
                    # 2. Object format: [{canton: 'ZH', municipality: 'Zurich'}, ...]
                    if isinstance(canton_data, dict):
                        # Object format
                        municipality = canton_data.get('municipality', '')
                        canton = canton_data.get('canton', '')
                        if municipality or canton:
                            location_str = municipality if municipality else ""
                            if canton:
                                location_str += f", {canton}" if location_str else canton
                            data_parts.append(f"📍 Secondary: {location_str}")
                    elif isinstance(canton_data, str):
                        # String format (just canton code)
                        canton = canton_data.strip()
                        if canton:
                            data_parts.append(f"📍 Secondary: {canton}")

        if not data_parts:
            return None

        return TaxInsight(
            filing_session_id=filing_session_id,
            insight_type=InsightType.DATA_SUMMARY,
            priority=InsightPriority.LOW,
            category=InsightCategory.COMPLETED,
            subcategory=InsightSubcategory.LOCATION,
            title="Location",
            description="\n".join(data_parts),
            estimated_savings_chf=None,
            related_questions=json.dumps(["Q02a", "Q02b"]),
            action_items=json.dumps([])
        )
    
    @staticmethod
    def _extract_family_info(
        answer_dict: Dict[str, TaxAnswer],
        filing_session_id: str
    ) -> Optional[TaxInsight]:
        """Extract family information: children, ages, childcare costs"""
        data_parts = []

        has_children = TaxInsightService._get_answer_value(answer_dict, "Q03")
        if not TaxInsightService._is_truthy(has_children):
            return None

        # Number of children
        num_children = TaxInsightService._get_answer_value(answer_dict, "Q03a")
        if num_children:
            try:
                num_children = int(num_children)
                child_text = "child" if num_children == 1 else "children"
                data_parts.append(f"👶 Children: {num_children} {child_text}")
            except (ValueError, TypeError) as e:
                logger.warning(f"Failed to parse number of children: {e}")
                data_parts.append("👶 Children: Yes")
        else:
            data_parts.append("👶 Children: Yes")

        # Ages - Q03b is a group array with fields: child_name, child_dob, child_in_education
        children_data = TaxInsightService._get_answer_value(answer_dict, "Q03b")
        if children_data and isinstance(children_data, list):
            try:
                from datetime import datetime
                ages = []
                for child in children_data:
                    if isinstance(child, dict) and 'child_dob' in child:
                        dob = datetime.strptime(child['child_dob'], '%Y-%m-%d')
                        age = (datetime.now() - dob).days // 365
                        ages.append(str(age))
                if ages:
                    data_parts.append(f"📅 Ages: {', '.join(ages)}")
            except (ValueError, KeyError, TypeError) as e:
                logger.warning(f"Failed to parse children ages from Q03b: {e}")

        # Childcare costs - Q03c is yes/no, NOT an amount
        # The actual amount is only available through uploaded documents
        has_childcare = TaxInsightService._get_answer_value(answer_dict, "Q03c")
        if TaxInsightService._is_truthy(has_childcare):
            data_parts.append("💰 Childcare costs: Documented")

        if not data_parts:
            return None

        return TaxInsight(
            filing_session_id=filing_session_id,
            insight_type=InsightType.DATA_SUMMARY,
            priority=InsightPriority.LOW,
            category=InsightCategory.COMPLETED,
            subcategory=InsightSubcategory.KIDS,
            title="Family",
            description="\n".join(data_parts),
            estimated_savings_chf=None,
            related_questions=json.dumps(["Q03", "Q03a", "Q03b", "Q03c"]),
            action_items=json.dumps([])
        )
    
    @staticmethod
    def _extract_employment_info(
        answer_dict: Dict[str, TaxAnswer],
        filing_session_id: str
    ) -> Optional[TaxInsight]:
        """Extract employment information: employers, company, salary"""
        data_parts = []

        num_employers = TaxInsightService._get_answer_value(answer_dict, "Q04")
        if num_employers:
            try:
                num_employers = int(num_employers)
                employer_text = "employer" if num_employers == 1 else "employers"
                data_parts.append(f"💼 Employment: {num_employers} {employer_text}")
            except (ValueError, TypeError) as e:
                logger.warning(f"Failed to parse number of employers: {e}")

        # Company name(s)
        company = TaxInsightService._get_answer_value(answer_dict, "Q04a")
        if company:
            data_parts.append(f"🏢 Company: {company}")

        # Gross salary
        salary = TaxInsightService._get_answer_value(answer_dict, "Q04b")
        if salary:
            try:
                salary_val = float(salary)
                data_parts.append(f"💰 Gross Salary: CHF {salary_val:,.0f}/year")
            except (ValueError, TypeError) as e:
                logger.warning(f"Failed to parse salary: {e}")

        # Employment percentage
        percentage = TaxInsightService._get_answer_value(answer_dict, "Q04c")
        if percentage:
            try:
                pct = float(percentage)
                data_parts.append(f"📊 Employment: {pct}%")
            except (ValueError, TypeError) as e:
                logger.warning(f"Failed to parse employment percentage: {e}")

        if not data_parts:
            return None

        return TaxInsight(
            filing_session_id=filing_session_id,
            insight_type=InsightType.DATA_SUMMARY,
            priority=InsightPriority.LOW,
            category=InsightCategory.COMPLETED,
            subcategory=InsightSubcategory.EMPLOYMENT,
            title="Employment",
            description="\n".join(data_parts),
            estimated_savings_chf=None,
            related_questions=json.dumps(["Q04", "Q04a", "Q04b", "Q04c"]),
            action_items=json.dumps([])
        )
    
    @staticmethod
    def _extract_retirement_info(
        answer_dict: Dict[str, TaxAnswer],
        filing_session_id: str
    ) -> Optional[TaxInsight]:
        """Extract retirement & savings: Pillar 3a, 2nd pillar buyback"""
        data_parts = []

        # Pillar 3a
        has_pillar_3a = TaxInsightService._get_answer_value(answer_dict, "Q08")
        if TaxInsightService._is_truthy(has_pillar_3a):
            amount = TaxInsightService._get_answer_value(answer_dict, "Q08a")
            if amount:
                try:
                    amount_val = float(amount)
                    data_parts.append(f"🏦 Pillar 3a: CHF {amount_val:,.0f} contributed")
                except (ValueError, TypeError) as e:
                    logger.warning(f"Failed to parse Pillar 3a amount: {e}")
                    data_parts.append("🏦 Pillar 3a: Yes")
            else:
                data_parts.append("🏦 Pillar 3a: Yes")

        # 2nd Pillar Buyback
        buyback = TaxInsightService._get_answer_value(answer_dict, "Q07")
        if buyback:
            try:
                buyback_val = float(buyback)
                if buyback_val > 0:
                    data_parts.append(f"💰 2nd Pillar Buyback: CHF {buyback_val:,.0f}")
            except (ValueError, TypeError) as e:
                logger.warning(f"Failed to parse 2nd pillar buyback amount: {e}")

        if not data_parts:
            return None

        return TaxInsight(
            filing_session_id=filing_session_id,
            insight_type=InsightType.DATA_SUMMARY,
            priority=InsightPriority.LOW,
            category=InsightCategory.COMPLETED,
            subcategory=InsightSubcategory.RETIREMENT_SAVINGS,
            title="Retirement & Savings",
            description="\n".join(data_parts),
            estimated_savings_chf=None,
            related_questions=json.dumps(["Q08", "Q08a", "Q07"]),
            action_items=json.dumps([])
        )
    
    @staticmethod
    def _extract_property_info(
        answer_dict: Dict[str, TaxAnswer],
        filing_session_id: str
    ) -> Optional[TaxInsight]:
        """Extract property & assets: property ownership, securities"""
        data_parts = []

        # Property ownership
        owns_property = TaxInsightService._get_answer_value(answer_dict, "Q09")
        if TaxInsightService._is_truthy(owns_property):
            data_parts.append("🏠 Property: Owner")

        # Securities/Investments
        has_securities = TaxInsightService._get_answer_value(answer_dict, "Q10")
        if TaxInsightService._is_truthy(has_securities):
            amount = TaxInsightService._get_answer_value(answer_dict, "Q10a_amount")
            if amount:
                try:
                    amount_val = float(amount)
                    data_parts.append(f"📈 Securities: CHF {amount_val:,.0f}")
                except (ValueError, TypeError) as e:
                    logger.warning(f"Failed to parse securities amount: {e}")
                    data_parts.append("📈 Securities: Yes")
            else:
                data_parts.append("📈 Securities: Yes")

        if not data_parts:
            return None

        return TaxInsight(
            filing_session_id=filing_session_id,
            insight_type=InsightType.DATA_SUMMARY,
            priority=InsightPriority.LOW,
            category=InsightCategory.COMPLETED,
            subcategory=InsightSubcategory.PROPERTY_ASSETS,
            title="Property & Assets",
            description="\n".join(data_parts),
            estimated_savings_chf=None,
            related_questions=json.dumps(["Q09", "Q10", "Q10a_amount"]),
            action_items=json.dumps([])
        )
    
    @staticmethod
    def _extract_deductions_info(
        answer_dict: Dict[str, TaxAnswer],
        filing_session_id: str
    ) -> Optional[TaxInsight]:
        """Extract deductions: donations, medical expenses"""
        data_parts = []

        # Charitable donations
        has_donations = TaxInsightService._get_answer_value(answer_dict, "Q11")
        if TaxInsightService._is_truthy(has_donations):
            amount = TaxInsightService._get_answer_value(answer_dict, "Q11a")
            if amount:
                try:
                    amount_val = float(amount)
                    data_parts.append(f"💝 Donations: CHF {amount_val:,.0f}")
                except (ValueError, TypeError) as e:
                    logger.warning(f"Failed to parse donation amount: {e}")
                    data_parts.append("💝 Donations: Yes")
            else:
                data_parts.append("💝 Donations: Yes")

        # Medical expenses
        has_medical = TaxInsightService._get_answer_value(answer_dict, "Q13")
        if TaxInsightService._is_truthy(has_medical):
            amount = TaxInsightService._get_answer_value(answer_dict, "Q13a")
            if amount:
                try:
                    amount_val = float(amount)
                    data_parts.append(f"🏥 Medical: CHF {amount_val:,.0f}")
                except (ValueError, TypeError) as e:
                    logger.warning(f"Failed to parse medical amount: {e}")
                    data_parts.append("🏥 Medical: Yes")
            else:
                data_parts.append("🏥 Medical: Yes")

        if not data_parts:
            return None

        return TaxInsight(
            filing_session_id=filing_session_id,
            insight_type=InsightType.DATA_SUMMARY,
            priority=InsightPriority.LOW,
            category=InsightCategory.COMPLETED,
            subcategory=InsightSubcategory.DEDUCTIONS,
            title="Deductions",
            description="\n".join(data_parts),
            estimated_savings_chf=None,
            related_questions=json.dumps(["Q11", "Q11a", "Q13", "Q13a"]),
            action_items=json.dumps([])
        )
