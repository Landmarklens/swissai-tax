"""
Review Data Service
Transforms interview answers into structured data for the review page
"""

import json
import logging
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from models.tax_answer import TaxAnswer
from models.tax_filing_session import TaxFilingSession

logger = logging.getLogger(__name__)


class ReviewDataService:
    """Service to prepare interview data for review display"""

    def __init__(self, db: Session):
        self.db = db

    def get_review_data(self, filing_session_id: str) -> Dict[str, Any]:
        """
        Get all interview answers organized for review page display

        Args:
            filing_session_id: The filing session ID

        Returns:
            Dictionary with organized review data
        """
        # Get filing session
        filing_session = self.db.query(TaxFilingSession).filter(
            TaxFilingSession.id == filing_session_id,
            TaxFilingSession.deleted_at.is_(None)
        ).first()

        if not filing_session:
            raise ValueError(f"Filing session {filing_session_id} not found")

        # Get all answers
        answers = self._get_all_answers(filing_session_id)

        # Build structured review data
        review_data = {
            "filing_session_id": filing_session_id,
            "tax_year": filing_session.tax_year,
            "canton": filing_session.canton,
            "status": filing_session.status.value if filing_session.status else "unknown",
            "personal": self._build_personal_info(answers, filing_session),
            "employment": self._build_employment_info(answers),
            "property": self._build_property_info(answers),
            "investments": self._build_investments_info(answers),
            "deductions": self._build_deductions_info(answers),
            "other_income": self._build_other_income_info(answers),
            "raw_answers": answers  # Include for debugging/editing
        }

        return review_data

    def _get_all_answers(self, filing_session_id: str) -> Dict[str, Any]:
        """Get all answers for a filing session as a dictionary"""
        answers_query = self.db.query(TaxAnswer).filter(
            TaxAnswer.filing_session_id == filing_session_id
        ).all()

        answers_dict = {}
        for answer in answers_query:
            # Decrypt answer_value (happens automatically via EncryptedText)
            answer_value = answer.answer_value

            # Try to parse JSON if it looks like JSON
            try:
                if answer_value and (answer_value.startswith('[') or answer_value.startswith('{')):
                    answers_dict[answer.question_id] = json.loads(answer_value)
                else:
                    answers_dict[answer.question_id] = answer_value
            except (json.JSONDecodeError, AttributeError):
                answers_dict[answer.question_id] = answer_value

        return answers_dict

    def _build_personal_info(self, answers: Dict, filing_session: TaxFilingSession) -> Dict[str, Any]:
        """Build personal information section"""
        # Get postal_code from filing.profile (set at filing creation)
        postal_code = filing_session.profile.get('postal_code', '') if filing_session.profile else ''

        personal = {
            "full_name": answers.get("Q00_name", ""),
            "ahv_number": answers.get("Q00", ""),
            "marital_status": answers.get("Q01", ""),
            "postal_code": postal_code,
            "canton": filing_session.canton,
            "municipality": filing_session.municipality,
        }

        # Spouse information (if married)
        if answers.get("Q01") == "married":
            personal["spouse"] = {
                "name": answers.get("Q01a_name", ""),
                "ahv_number": answers.get("Q01a", ""),
                "is_employed": answers.get("Q01d", False)
            }

        # Multi-canton information
        if answers.get("Q02a") in [True, "yes", "true"]:
            personal["other_cantons"] = answers.get("Q02b", [])

        # Children information
        if answers.get("Q03") in [True, "yes", "true"]:
            personal["children"] = {
                "count": answers.get("Q03a", "0"),
                "details": answers.get("Q03b", []),
                "has_childcare_costs": answers.get("Q03c", False)
            }

        return personal

    def _build_employment_info(self, answers: Dict) -> Dict[str, Any]:
        """Build employment information section"""
        employment = {
            "num_employers": answers.get("Q04", "0"),
            "employment_type": answers.get("Q04a", ""),
        }

        # Employer details (if employed)
        if answers.get("Q04a") in ["employed", "both"]:
            employment["employer_details"] = answers.get("Q04a_employer", [])
            employment["has_employment_certificate"] = answers.get("Q04b", False)
            employment["employment_termination"] = answers.get("Q04c", "")
            employment["had_unemployment"] = answers.get("Q04d", False)

        # Self-employment info
        if answers.get("Q04a") in ["self_employed", "both"]:
            employment["self_employment"] = {
                "business_name": answers.get("Q04_business_name", ""),
                "has_financial_statements": answers.get("Q04_financial_statements", False)
            }

        return employment

    def _build_property_info(self, answers: Dict) -> Dict[str, Any]:
        """Build property/real estate information section"""
        property_info = {
            "owns_property": answers.get("Q09", False),
        }

        if answers.get("Q09") in [True, "yes", "true"]:
            property_info["property_type"] = answers.get("Q09a", "")
            property_info["uses_property"] = answers.get("Q09b", "")

            # Rental income
            if answers.get("Q09c") in [True, "yes", "true"]:
                property_info["has_rental_income"] = True
                property_info["rental_amount"] = answers.get("Q09c_amount", 0)

        return property_info

    def _build_investments_info(self, answers: Dict) -> Dict[str, Any]:
        """Build investments and securities information section"""
        investments = {
            "has_securities_account": answers.get("Q10", False),
        }

        if answers.get("Q10") in [True, "yes", "true"]:
            investments["has_dividend_interest"] = answers.get("Q10a", False)
            investments["has_crypto"] = answers.get("Q10b", False)

        return investments

    def _build_deductions_info(self, answers: Dict) -> Dict[str, Any]:
        """Build deductions information section"""
        deductions = {
            "commute_distance": answers.get("Q05", ""),
            "has_meal_expenses": answers.get("Q06", False),
            "has_pillar3a": answers.get("Q07", False),
            "has_pillar2_buyback": answers.get("Q08", False),
        }

        # Health insurance (Q13b)
        if answers.get("Q13b") == "yes":
            deductions["health_insurance"] = {
                "basic_premium": answers.get("Q13b_basic", 0),
                "has_supplementary": answers.get("Q13b_supplementary", False),
                "supplementary_amount": answers.get("Q13b_supplementary_amount", 0)
            }

        # Alimony (Q12)
        if answers.get("Q12") in [True, "yes", "true"]:
            deductions["pays_alimony"] = True
            deductions["alimony_amount"] = answers.get("Q12_amount", 0)

        # Donations (Q11)
        if answers.get("Q11") in [True, "yes", "true"]:
            deductions["has_donations"] = True

        # Medical expenses (Q13)
        if answers.get("Q13") in [True, "yes", "true"]:
            deductions["has_medical_expenses"] = True

        return deductions

    def _build_other_income_info(self, answers: Dict) -> Dict[str, Any]:
        """Build other income sources section"""
        other_income = {
            "has_pension": answers.get("Q14", False),
            "has_foreign_income": answers.get("Q15", False),
            "has_lottery_winnings": answers.get("Q16", False),
            "has_inheritance": answers.get("Q17", False),
        }

        # Inheritance details
        if answers.get("Q17") in [True, "yes", "true"]:
            other_income["inheritance"] = {
                "has_real_estate": answers.get("Q17a", False),
                "has_securities": answers.get("Q17b", False),
                "inheritance_amount": answers.get("Q17c", 0)
            }

        return other_income
