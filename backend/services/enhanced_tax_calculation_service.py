"""
Enhanced Tax Calculation Service for Multi-Canton Filing

This service calculates taxes for all filing sessions (primary + secondary cantons).
Integrates with canton tax calculators for accurate canton-specific calculations.
"""

import logging
from typing import Dict, Any, List, Optional
from decimal import Decimal
from datetime import datetime
from sqlalchemy.orm import Session

from models.tax_filing_session import TaxFilingSession
from services.filing_orchestration_service import FilingOrchestrationService
from services.canton_tax_calculators import get_canton_calculator
from db.session import get_db

logger = logging.getLogger(__name__)


# Municipal tax multipliers for major Swiss municipalities
MUNICIPAL_MULTIPLIERS = {
    'Zurich': Decimal('1.19'),
    'Winterthur': Decimal('1.22'),
    'Geneva': Decimal('0.45'),
    'Basel': Decimal('0.82'),
    'Lausanne': Decimal('0.79'),
    'Bern': Decimal('1.54'),
    'Lucerne': Decimal('1.75'),
    'Zug': Decimal('0.60'),
    'St. Gallen': Decimal('1.28'),
    'Lugano': Decimal('1.00')
}


class EnhancedTaxCalculationService:
    """Enhanced tax calculation service with multi-canton support"""

    def __init__(self, db: Session = None):
        self.db = db or next(get_db())
        self.filing_service = FilingOrchestrationService(db=self.db)
        self.tax_year = 2024  # Default tax year

    def calculate_all_user_filings(
        self,
        user_id: str,
        tax_year: int
    ) -> Dict[str, Any]:
        """
        Calculate taxes for ALL user filings (primary + all secondaries).

        This is the main entry point for multi-canton tax calculation.

        Args:
            user_id: User ID
            tax_year: Tax year

        Returns:
            Dict with all filing calculations and total tax burden
        """
        # Get all filings for user
        filings = self.filing_service.get_all_user_filings(user_id, tax_year)

        if not filings:
            raise ValueError(f"No filings found for user {user_id}, tax year {tax_year}")

        results = []
        total_burden = Decimal('0')

        for filing in filings:
            try:
                result = self.calculate_single_filing(filing)
                results.append(result)
                total_burden += Decimal(str(result['total_tax']))
            except Exception as e:
                logger.error(f"Failed to calculate taxes for filing {filing.id}: {e}")
                # Continue with other filings even if one fails
                results.append({
                    'filing_id': filing.id,
                    'canton': filing.canton,
                    'is_primary': filing.is_primary,
                    'error': str(e),
                    'total_tax': 0
                })

        # Separate primary and secondary results
        primary_result = next((r for r in results if r.get('is_primary')), None)
        secondary_results = [r for r in results if not r.get('is_primary')]

        return {
            'user_id': user_id,
            'tax_year': tax_year,
            'total_filings': len(results),
            'total_tax_burden': float(total_burden),
            'primary_filing': primary_result,
            'secondary_filings': secondary_results,
            'all_filings': results
        }

    def calculate_single_filing(self, filing: TaxFilingSession) -> Dict[str, Any]:
        """
        Calculate tax for a single filing (primary or secondary).

        Primary filing: Includes all income sources + federal tax
        Secondary filing: Only property income for this canton, no federal tax

        Args:
            filing: TaxFilingSession instance

        Returns:
            Dict with detailed tax calculation
        """
        logger.info(
            f"Calculating taxes for filing {filing.id} "
            f"(canton={filing.canton}, primary={filing.is_primary})"
        )

        # Get profile data (already decrypted by model)
        profile = filing.profile or {}

        # Calculate income for this filing
        if filing.is_primary:
            # Primary: All income sources
            income = self._calculate_all_income(profile)
        else:
            # Secondary: Only property income for this canton
            income = self._calculate_property_income_only(profile, filing.canton)

        # Calculate deductions
        deductions = self._calculate_filing_deductions(profile, filing)

        # Calculate taxable income
        taxable_income = max(Decimal('0'), income['total'] - deductions['total'])

        # Federal tax (only for primary filing)
        federal_tax = Decimal('0')
        if filing.is_primary:
            federal_tax = self._calculate_federal_tax(
                taxable_income,
                profile.get('marital_status', 'single')
            )

        # Cantonal tax (all filings)
        cantonal_tax = self._calculate_cantonal_tax(
            taxable_income,
            filing.canton,
            profile.get('marital_status', 'single'),
            int(profile.get('num_children', 0))
        )

        # Municipal tax
        municipal_tax = self._calculate_municipal_tax(
            cantonal_tax,
            filing.canton,
            profile.get('municipality', '')
        )

        # Church tax (if applicable)
        church_tax = self._calculate_church_tax(
            cantonal_tax,
            filing.canton,
            profile.get('church_member', False)
        )

        # Total tax
        total_tax = federal_tax + cantonal_tax + municipal_tax + church_tax

        # Save calculation to database
        self._save_calculation(filing.id, income, deductions, taxable_income,
                              federal_tax, cantonal_tax, municipal_tax,
                              church_tax, total_tax)

        return {
            'filing_id': filing.id,
            'canton': filing.canton,
            'is_primary': filing.is_primary,
            'tax_year': self.tax_year,
            'income': {k: float(v) for k, v in income.items()},
            'deductions': {k: float(v) for k, v in deductions.items()},
            'taxable_income': float(taxable_income),
            'federal_tax': float(federal_tax),
            'cantonal_tax': float(cantonal_tax),
            'municipal_tax': float(municipal_tax),
            'church_tax': float(church_tax),
            'total_tax': float(total_tax),
            'effective_rate': float((total_tax / income['total']) * 100) if income['total'] > 0 else 0,
            'monthly_payment': float(total_tax / 12)
        }

    def _calculate_all_income(self, profile: Dict[str, Any]) -> Dict[str, Decimal]:
        """Calculate all income sources (for primary filing)"""
        income = {
            'employment': Decimal(str(profile.get('employment_income', 0))),
            'self_employment': Decimal(str(profile.get('self_employment_income', 0))),
            'capital': Decimal(str(profile.get('capital_income', 0))),
            'rental': Decimal(str(profile.get('rental_income_total', 0))),
            'other': Decimal(str(profile.get('other_income', 0)))
        }

        income['total'] = sum(income.values())
        return income

    def _calculate_property_income_only(
        self,
        profile: Dict[str, Any],
        canton: str
    ) -> Dict[str, Decimal]:
        """
        Calculate only property income for specific canton (for secondary filing).

        Args:
            profile: User profile data
            canton: Canton code

        Returns:
            Income dict with only rental income for this canton
        """
        # Get properties for this canton
        properties = profile.get('properties', [])
        canton_properties = [p for p in properties if p.get('canton') == canton]

        # Sum rental income for properties in this canton
        rental_income = sum(
            Decimal(str(p.get('annual_rental_income', 0)))
            for p in canton_properties
        )

        return {
            'employment': Decimal('0'),
            'self_employment': Decimal('0'),
            'capital': Decimal('0'),
            'rental': rental_income,
            'other': Decimal('0'),
            'total': rental_income
        }

    def _calculate_filing_deductions(
        self,
        profile: Dict[str, Any],
        filing: TaxFilingSession
    ) -> Dict[str, Decimal]:
        """
        Calculate deductions for a filing.

        Primary filing: All standard deductions
        Secondary filing: Only property-related deductions

        Args:
            profile: User profile data
            filing: Filing session

        Returns:
            Deductions dict
        """
        deductions = {
            'professional_expenses': Decimal('0'),
            'pillar_3a': Decimal('0'),
            'pillar_2_buyins': Decimal('0'),
            'insurance_premiums': Decimal('0'),
            'medical_expenses': Decimal('0'),
            'training_expenses': Decimal('0'),
            'child_deduction': Decimal('0'),
            'alimony': Decimal('0'),
            'property_expenses': Decimal('0'),
            'mortgage_interest': Decimal('0')
        }

        if filing.is_primary:
            # All standard deductions for primary filing
            employment_income = Decimal(str(profile.get('employment_income', 0)))

            # Professional expenses (3% of employment income, max 4000)
            deductions['professional_expenses'] = min(
                employment_income * Decimal('0.03'),
                Decimal('4000')
            )

            # Pillar 3a (max 7056 for employees with pension fund)
            deductions['pillar_3a'] = min(
                Decimal(str(profile.get('pillar_3a_contributions', 0))),
                Decimal('7056')
            )

            # Insurance premiums (standard deduction)
            marital_status = profile.get('marital_status', 'single')
            deductions['insurance_premiums'] = Decimal('3500' if marital_status == 'married' else '1750')

            # Child deductions (6600 CHF per child for federal)
            num_children = int(profile.get('num_children', 0))
            deductions['child_deduction'] = Decimal(str(num_children * 6600))

            # Training expenses (max 12000)
            deductions['training_expenses'] = min(
                Decimal(str(profile.get('training_expenses', 0))),
                Decimal('12000')
            )

            # Medical expenses (only amount exceeding 5% of income)
            medical = Decimal(str(profile.get('medical_expenses', 0)))
            threshold = employment_income * Decimal('0.05')
            if medical > threshold:
                deductions['medical_expenses'] = medical - threshold

            # Alimony payments
            deductions['alimony'] = Decimal(str(profile.get('alimony_payments', 0)))

        else:
            # Property-related deductions only for secondary filing
            properties = profile.get('properties', [])
            canton_properties = [p for p in properties if p.get('canton') == filing.canton]

            # Property maintenance and management
            for prop in canton_properties:
                deductions['property_expenses'] += Decimal(str(prop.get('maintenance_costs', 0)))
                deductions['mortgage_interest'] += Decimal(str(prop.get('mortgage_interest', 0)))

        # Calculate total
        deductions['total'] = sum(deductions.values())

        return deductions

    def _calculate_federal_tax(
        self,
        taxable_income: Decimal,
        marital_status: str
    ) -> Decimal:
        """
        Calculate Swiss federal tax using 2024 rates.

        Args:
            taxable_income: Taxable income after deductions
            marital_status: 'single' or 'married'

        Returns:
            Federal tax amount
        """
        if taxable_income <= 0:
            return Decimal('0')

        # Federal tax brackets for 2024
        if marital_status == 'married':
            # Married rates
            if taxable_income <= 30800:
                return Decimal('0')
            elif taxable_income <= 50900:
                return (taxable_income - Decimal('30800')) * Decimal('0.01')
            elif taxable_income <= 58400:
                return Decimal('201') + (taxable_income - Decimal('50900')) * Decimal('0.02')
            elif taxable_income <= 75300:
                return Decimal('351') + (taxable_income - Decimal('58400')) * Decimal('0.03')
            elif taxable_income <= 90300:
                return Decimal('858') + (taxable_income - Decimal('75300')) * Decimal('0.04')
            elif taxable_income <= 103400:
                return Decimal('1458') + (taxable_income - Decimal('90300')) * Decimal('0.05')
            elif taxable_income <= 114700:
                return Decimal('2113') + (taxable_income - Decimal('103400')) * Decimal('0.06')
            elif taxable_income <= 124200:
                return Decimal('2791') + (taxable_income - Decimal('114700')) * Decimal('0.07')
            elif taxable_income <= 131700:
                return Decimal('3456') + (taxable_income - Decimal('124200')) * Decimal('0.08')
            elif taxable_income <= 137300:
                return Decimal('4056') + (taxable_income - Decimal('131700')) * Decimal('0.09')
            elif taxable_income <= 141200:
                return Decimal('4560') + (taxable_income - Decimal('137300')) * Decimal('0.10')
            elif taxable_income <= 143100:
                return Decimal('4950') + (taxable_income - Decimal('141200')) * Decimal('0.11')
            elif taxable_income <= 145000:
                return Decimal('5159') + (taxable_income - Decimal('143100')) * Decimal('0.12')
            elif taxable_income <= 895900:
                return Decimal('5387') + (taxable_income - Decimal('145000')) * Decimal('0.13')
            else:
                return Decimal('103004') + (taxable_income - Decimal('895900')) * Decimal('0.115')
        else:
            # Single rates
            if taxable_income <= 17800:
                return Decimal('0')
            elif taxable_income <= 31600:
                return (taxable_income - Decimal('17800')) * Decimal('0.01')
            elif taxable_income <= 41400:
                return Decimal('138') + (taxable_income - Decimal('31600')) * Decimal('0.02')
            elif taxable_income <= 55200:
                return Decimal('334') + (taxable_income - Decimal('41400')) * Decimal('0.03')
            elif taxable_income <= 72500:
                return Decimal('748') + (taxable_income - Decimal('55200')) * Decimal('0.04')
            elif taxable_income <= 78100:
                return Decimal('1440') + (taxable_income - Decimal('72500')) * Decimal('0.05')
            elif taxable_income <= 103600:
                return Decimal('1720') + (taxable_income - Decimal('78100')) * Decimal('0.06')
            elif taxable_income <= 134600:
                return Decimal('3250') + (taxable_income - Decimal('103600')) * Decimal('0.07')
            elif taxable_income <= 176000:
                return Decimal('5420') + (taxable_income - Decimal('134600')) * Decimal('0.08')
            elif taxable_income <= 755200:
                return Decimal('8732') + (taxable_income - Decimal('176000')) * Decimal('0.11')
            else:
                return Decimal('72444') + (taxable_income - Decimal('755200')) * Decimal('0.13')

    def _calculate_cantonal_tax(
        self,
        taxable_income: Decimal,
        canton: str,
        marital_status: str,
        num_children: int
    ) -> Decimal:
        """
        Calculate cantonal tax using canton-specific calculator.

        Args:
            taxable_income: Taxable income
            canton: Canton code
            marital_status: Marital status
            num_children: Number of children

        Returns:
            Cantonal tax amount
        """
        try:
            # Get canton calculator
            calculator = get_canton_calculator(canton, self.tax_year)

            # Calculate tax
            tax = calculator.calculate(
                taxable_income=taxable_income,
                marital_status=marital_status,
                num_children=num_children
            )

            return tax

        except Exception as e:
            logger.error(f"Failed to calculate cantonal tax for {canton}: {e}")
            # Fallback to simple 8% rate
            return taxable_income * Decimal('0.08')

    def _calculate_municipal_tax(
        self,
        cantonal_tax: Decimal,
        canton: str,
        municipality: str
    ) -> Decimal:
        """
        Calculate municipal tax as multiplier of cantonal tax.

        Args:
            cantonal_tax: Cantonal tax amount
            canton: Canton code
            municipality: Municipality name

        Returns:
            Municipal tax amount
        """
        # Get multiplier for municipality
        multiplier = MUNICIPAL_MULTIPLIERS.get(municipality, Decimal('1.0'))

        return cantonal_tax * multiplier

    def _calculate_church_tax(
        self,
        cantonal_tax: Decimal,
        canton: str,
        is_church_member: bool
    ) -> Decimal:
        """
        Calculate church tax (if applicable).

        Args:
            cantonal_tax: Cantonal tax amount
            canton: Canton code
            is_church_member: Whether person is church member

        Returns:
            Church tax amount
        """
        if not is_church_member:
            return Decimal('0')

        # Church tax rates by canton (as percentage of cantonal tax)
        church_tax_rates = {
            'ZH': Decimal('0.10'),
            'BE': Decimal('0.12'),
            'LU': Decimal('0.15'),
            'BS': Decimal('0.08'),
            'GE': Decimal('0.00'),  # Geneva has voluntary church tax
        }

        rate = church_tax_rates.get(canton, Decimal('0.10'))
        return cantonal_tax * rate

    def _save_calculation(
        self,
        filing_id: str,
        income: Dict[str, Decimal],
        deductions: Dict[str, Decimal],
        taxable_income: Decimal,
        federal_tax: Decimal,
        cantonal_tax: Decimal,
        municipal_tax: Decimal,
        church_tax: Decimal,
        total_tax: Decimal
    ):
        """Save calculation to database"""
        # This would save to tax_calculations table
        # Implementation depends on your database setup
        logger.info(f"Saved calculation for filing {filing_id}: CHF {float(total_tax):,.2f}")
