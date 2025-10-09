"""Tax calculation service for Swiss federal, cantonal, and municipal taxes"""

from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional

from database.connection import execute_insert, execute_one, execute_query


class TaxCalculationService:
    """Service for calculating Swiss taxes"""

    def __init__(self):
        self.tax_year = 2024  # Default tax year

    def calculate_taxes(self, session_id: str) -> Dict[str, Any]:
        """Calculate all taxes based on session data"""
        # Get session answers
        answers = self._get_session_answers(session_id)

        # Get user's canton and municipality
        canton = answers.get('canton', 'ZH')
        municipality = answers.get('municipality', 'Zurich')

        # Calculate income components
        income_data = self._calculate_income(answers)

        # Calculate deductions
        deductions_data = self._calculate_deductions(answers)

        # Calculate taxable income
        taxable_income = Decimal(str(max(0, income_data['total_income'] - deductions_data['total_deductions'])))

        # Calculate federal tax
        federal_tax = self._calculate_federal_tax(taxable_income, answers)

        # Calculate cantonal tax
        cantonal_tax = self._calculate_cantonal_tax(taxable_income, canton, answers)

        # Calculate municipal tax
        municipal_tax = self._calculate_municipal_tax(cantonal_tax, canton, municipality)

        # Calculate church tax (optional)
        church_tax = self._calculate_church_tax(cantonal_tax, canton, answers)

        # Total tax
        total_tax = federal_tax + cantonal_tax + municipal_tax + church_tax

        # Save calculation to database
        calculation_id = self._save_calculation(
            session_id, income_data, deductions_data, taxable_income,
            federal_tax, cantonal_tax, municipal_tax, church_tax, total_tax
        )

        return {
            'calculation_id': str(calculation_id),
            'tax_year': self.tax_year,
            'canton': canton,
            'municipality': municipality,
            'income': income_data,
            'deductions': deductions_data,
            'taxable_income': float(taxable_income),
            'federal_tax': float(federal_tax),
            'cantonal_tax': float(cantonal_tax),
            'municipal_tax': float(municipal_tax),
            'church_tax': float(church_tax),
            'total_tax': float(total_tax),
            'effective_rate': float((total_tax / Decimal(str(max(income_data['total_income'], 1)))) * 100),
            'monthly_tax': float(total_tax / Decimal('12'))
        }

    def _get_session_answers(self, session_id: str) -> Dict[str, Any]:
        """Get all answers for a session"""
        query = """
            SELECT question_id, answer_value
            FROM swisstax.interview_answers
            WHERE session_id = %s
        """
        results = execute_query(query, (session_id,))

        # Include some defaults for testing
        answers = {row['question_id']: row['answer_value'] for row in results}

        # Add default values if not present
        if 'income_employment' not in answers:
            answers['income_employment'] = 100000  # Default income for testing

        return answers

    def _calculate_income(self, answers: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate total income from various sources"""
        income = {
            'employment': 0,
            'self_employment': 0,
            'capital': 0,
            'rental': 0,
            'other': 0,
            'total_income': 0
        }

        # Employment income - based on number of employers (Q04)
        try:
            num_employers = int(answers.get('Q04', 0))
        except (ValueError, TypeError):
            num_employers = 0
        if num_employers > 0:
            income['employment'] = Decimal(str(answers.get('income_employment', 0)))
            # Check for self-employment (if marked as self-employed in Q04 loop)
            if answers.get('self_employed', False):
                income['self_employment'] = Decimal(str(answers.get('income_self_employment', 0)))

        # Capital income (Q05)
        if answers.get('Q05') == True:
            income['capital'] = Decimal(str(answers.get('income_capital', 0)))

        # Rental income (Q06)
        if answers.get('Q06') == True:
            property_types = answers.get('Q06a', [])
            if 'rental_property' in property_types:
                income['rental'] = Decimal(str(answers.get('income_rental', 0)))

        # Calculate total
        income['total_income'] = sum([
            income['employment'],
            income['self_employment'],
            income['capital'],
            income['rental'],
            income['other']
        ])

        # Convert to float for JSON serialization
        return {k: float(v) for k, v in income.items()}

    def _calculate_deductions(self, answers: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate total deductions"""
        deductions = {
            'professional_expenses': 0,
            'pillar_3a': 0,
            'pillar_2_buyins': 0,
            'insurance_premiums': 0,
            'medical_expenses': 0,
            'training_expenses': 0,
            'child_deduction': 0,
            'alimony': 0,
            'standard_deduction': 0,
            'total_deductions': 0
        }

        # Standard professional expense deduction (3% of income, max 4000)
        employment_income = Decimal(str(answers.get('income_employment', 0)))
        deductions['professional_expenses'] = min(employment_income * Decimal('0.03'), 4000)

        # Pillar 3a contributions (Q07)
        if answers.get('Q07') == True:
            # Max 7056 CHF for employees with pension fund (2024)
            deductions['pillar_3a'] = min(Decimal(str(answers.get('pillar_3a_amount', 0))), 7056)

        # Insurance premiums (standard deduction)
        marital_status = answers.get('Q01', 'single')
        if marital_status == 'married':
            deductions['insurance_premiums'] = 3500
        else:
            deductions['insurance_premiums'] = 1750

        # Child deductions (Q03)
        if answers.get('Q03') == True:
            try:
                num_children = int(answers.get('Q03a', 0))
            except (ValueError, TypeError):
                num_children = 0
            # 6600 CHF per child for federal tax
            deductions['child_deduction'] = num_children * 6600

        # Training expenses (Q08)
        if answers.get('Q08') == True:
            deductions['training_expenses'] = min(Decimal(str(answers.get('training_expenses', 0))), 12000)

        # Medical expenses (Q09) - only if exceeds 5% of income
        if answers.get('Q09') == True:
            medical = Decimal(str(answers.get('medical_expenses', 0)))
            threshold = employment_income * Decimal('0.05')
            if medical > threshold:
                deductions['medical_expenses'] = medical - threshold

        # Alimony payments (Q10)
        if answers.get('Q10') == True:
            deductions['alimony'] = Decimal(str(answers.get('alimony_amount', 0)))

        # Standard deduction
        deductions['standard_deduction'] = 3000

        # Calculate total
        deductions['total_deductions'] = sum([
            deductions['professional_expenses'],
            deductions['pillar_3a'],
            deductions['pillar_2_buyins'],
            deductions['insurance_premiums'],
            deductions['medical_expenses'],
            deductions['training_expenses'],
            deductions['child_deduction'],
            deductions['alimony'],
            deductions['standard_deduction']
        ])

        # Convert to float for JSON serialization
        return {k: float(v) for k, v in deductions.items()}

    def _calculate_federal_tax(self, taxable_income: Decimal, answers: Dict[str, Any]) -> Decimal:
        """Calculate Swiss federal tax"""
        marital_status = answers.get('Q01', 'single')

        if marital_status == 'married':
            # Married tax rates for 2024
            if taxable_income <= 30800:
                tax = 0
            elif taxable_income <= 50900:
                tax = (taxable_income - 30800) * Decimal('0.01')
            elif taxable_income <= 58400:
                tax = 201 + (taxable_income - 50900) * Decimal('0.02')
            elif taxable_income <= 75300:
                tax = 351 + (taxable_income - 58400) * Decimal('0.03')
            elif taxable_income <= 90300:
                tax = 858 + (taxable_income - 75300) * Decimal('0.04')
            elif taxable_income <= 103400:
                tax = 1458 + (taxable_income - 90300) * Decimal('0.05')
            elif taxable_income <= 114700:
                tax = 2113 + (taxable_income - 103400) * Decimal('0.06')
            elif taxable_income <= 124200:
                tax = 2791 + (taxable_income - 114700) * Decimal('0.07')
            elif taxable_income <= 131700:
                tax = 3456 + (taxable_income - 124200) * Decimal('0.08')
            elif taxable_income <= 137300:
                tax = 4056 + (taxable_income - 131700) * Decimal('0.09')
            elif taxable_income <= 141200:
                tax = 4560 + (taxable_income - 137300) * Decimal('0.10')
            elif taxable_income <= 143100:
                tax = 4950 + (taxable_income - 141200) * Decimal('0.11')
            elif taxable_income <= 145000:
                tax = 5159 + (taxable_income - 143100) * Decimal('0.12')
            elif taxable_income <= 895900:
                tax = 5387 + (taxable_income - 145000) * Decimal('0.13')
            else:
                tax = 103004 + (taxable_income - 895900) * Decimal('0.115')
        else:
            # Single tax rates for 2024
            if taxable_income <= 17800:
                tax = 0
            elif taxable_income <= 31600:
                tax = (taxable_income - 17800) * Decimal('0.01')
            elif taxable_income <= 41400:
                tax = 138 + (taxable_income - 31600) * Decimal('0.02')
            elif taxable_income <= 55200:
                tax = 334 + (taxable_income - 41400) * Decimal('0.03')
            elif taxable_income <= 72500:
                tax = 748 + (taxable_income - 55200) * Decimal('0.04')
            elif taxable_income <= 78100:
                tax = 1440 + (taxable_income - 72500) * Decimal('0.05')
            elif taxable_income <= 103600:
                tax = 1720 + (taxable_income - 78100) * Decimal('0.06')
            elif taxable_income <= 134600:
                tax = 3250 + (taxable_income - 103600) * Decimal('0.07')
            elif taxable_income <= 176000:
                tax = 5420 + (taxable_income - 134600) * Decimal('0.08')
            elif taxable_income <= 755200:
                tax = 8732 + (taxable_income - 176000) * Decimal('0.11')
            else:
                tax = 72444 + (taxable_income - 755200) * Decimal('0.13')

        return tax

    def _calculate_cantonal_tax(self, taxable_income: Decimal, canton: str,
                                answers: Dict[str, Any]) -> Decimal:
        """Calculate cantonal tax (simplified - using ZH rates as example)"""
        marital_status = answers.get('Q01', 'single')

        # Simplified Zurich canton tax calculation
        # These are example rates - actual calculation is more complex
        if canton == 'ZH':
            if marital_status == 'married':
                if taxable_income <= 13500:
                    tax = 0
                elif taxable_income <= 25000:
                    tax = (taxable_income - 13500) * Decimal('0.02')
                elif taxable_income <= 40000:
                    tax = 230 + (taxable_income - 25000) * Decimal('0.03')
                elif taxable_income <= 60000:
                    tax = 680 + (taxable_income - 40000) * Decimal('0.04')
                elif taxable_income <= 80000:
                    tax = 1480 + (taxable_income - 60000) * Decimal('0.05')
                elif taxable_income <= 100000:
                    tax = 2480 + (taxable_income - 80000) * Decimal('0.06')
                elif taxable_income <= 150000:
                    tax = 3680 + (taxable_income - 100000) * Decimal('0.07')
                elif taxable_income <= 250000:
                    tax = 7180 + (taxable_income - 150000) * Decimal('0.08')
                else:
                    tax = 15180 + (taxable_income - 250000) * Decimal('0.10')
            else:
                # Single rates
                if taxable_income <= 7000:
                    tax = 0
                elif taxable_income <= 15000:
                    tax = (taxable_income - 7000) * Decimal('0.02')
                elif taxable_income <= 25000:
                    tax = 160 + (taxable_income - 15000) * Decimal('0.03')
                elif taxable_income <= 40000:
                    tax = 460 + (taxable_income - 25000) * Decimal('0.04')
                elif taxable_income <= 60000:
                    tax = 1060 + (taxable_income - 40000) * Decimal('0.05')
                elif taxable_income <= 80000:
                    tax = 2060 + (taxable_income - 60000) * Decimal('0.06')
                elif taxable_income <= 100000:
                    tax = 3260 + (taxable_income - 80000) * Decimal('0.07')
                elif taxable_income <= 150000:
                    tax = 4660 + (taxable_income - 100000) * Decimal('0.08')
                elif taxable_income <= 250000:
                    tax = 8660 + (taxable_income - 150000) * Decimal('0.09')
                else:
                    tax = 17660 + (taxable_income - 250000) * Decimal('0.11')
        else:
            # Default calculation for other cantons (simplified)
            tax = taxable_income * Decimal('0.08')

        return tax

    def _calculate_municipal_tax(self, cantonal_tax: Decimal, canton: str,
                                 municipality: str) -> Decimal:
        """Calculate municipal tax as percentage of cantonal tax"""
        # Municipal tax multiplier (simplified - actual rates vary)
        multipliers = {
            'Zurich': Decimal('1.19'),
            'Geneva': Decimal('0.45'),
            'Basel': Decimal('0.82'),
            'Bern': Decimal('1.54'),
            'Lucerne': Decimal('1.75'),
            'Zug': Decimal('0.60'),
        }

        multiplier = multipliers.get(municipality, Decimal('1.0'))
        return cantonal_tax * multiplier

    def _calculate_church_tax(self, cantonal_tax: Decimal, canton: str,
                              answers: Dict[str, Any]) -> Decimal:
        """Calculate church tax (optional)"""
        # Check if person pays church tax
        pays_church_tax = answers.get('pays_church_tax', False)

        if not pays_church_tax:
            return Decimal('0')

        # Church tax as percentage of cantonal tax (simplified)
        church_tax_rates = {
            'ZH': Decimal('0.10'),
            'BE': Decimal('0.12'),
            'LU': Decimal('0.15'),
            'BS': Decimal('0.08'),
            'GE': Decimal('0.00'),  # Geneva has voluntary church tax
        }

        rate = church_tax_rates.get(canton, Decimal('0.10'))
        return cantonal_tax * rate

    def _save_calculation(self, session_id: str, income_data: Dict, deductions_data: Dict,
                         taxable_income: Decimal, federal_tax: Decimal, cantonal_tax: Decimal,
                         municipal_tax: Decimal, church_tax: Decimal, total_tax: Decimal) -> str:
        """Save calculation to database"""
        query = """
            INSERT INTO swisstax.tax_calculations (
                session_id, calculation_type, gross_income, deductions,
                taxable_income, federal_tax, cantonal_tax, municipal_tax,
                church_tax, total_tax, calculation_details
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """

        calculation_details = {
            'income_breakdown': income_data,
            'deductions_breakdown': deductions_data,
            'tax_year': self.tax_year
        }

        import json
        result = execute_insert(query, (
            session_id, 'final',
            income_data['total_income'], deductions_data['total_deductions'],
            taxable_income, federal_tax, cantonal_tax, municipal_tax,
            church_tax, total_tax, json.dumps(calculation_details)
        ))

        return result['id']

    def get_tax_summary(self, session_id: str) -> Dict[str, Any]:
        """Get tax calculation summary for a session"""
        query = """
            SELECT
                id, calculation_type, gross_income, deductions,
                taxable_income, federal_tax, cantonal_tax, municipal_tax,
                church_tax, total_tax, calculation_details, created_at
            FROM swisstax.tax_calculations
            WHERE session_id = %s
            ORDER BY created_at DESC
            LIMIT 1
        """

        result = execute_one(query, (session_id,))

        if result:
            return {
                'calculation_id': str(result['id']),
                'type': result['calculation_type'],
                'gross_income': float(result['gross_income']),
                'deductions': float(result['deductions']),
                'taxable_income': float(result['taxable_income']),
                'federal_tax': float(result['federal_tax']),
                'cantonal_tax': float(result['cantonal_tax']),
                'municipal_tax': float(result['municipal_tax']),
                'church_tax': float(result['church_tax']),
                'total_tax': float(result['total_tax']),
                'details': result['calculation_details'],
                'calculated_at': result['created_at'].isoformat()
            }

        return None