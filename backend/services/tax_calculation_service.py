"""Tax calculation service for Swiss federal, cantonal, and municipal taxes"""

from datetime import datetime
from decimal import Decimal, InvalidOperation
import decimal
from typing import Any, Dict, List, Optional

from database.connection import execute_insert, execute_one, execute_query
from services.social_security_calculators import SocialSecurityCalculator
from services.wealth_tax_service import WealthTaxService
from services.church_tax_service import ChurchTaxService
from services.canton_tax_calculators import get_canton_calculator


class TaxCalculationService:
    """Service for calculating Swiss taxes"""

    def __init__(self):
        self.tax_year = 2024  # Default tax year
        self.social_security_calculator = SocialSecurityCalculator(tax_year=self.tax_year)
        self.wealth_tax_service = WealthTaxService(tax_year=self.tax_year)
        self.church_tax_service = ChurchTaxService(tax_year=self.tax_year)

    def calculate_taxes(self, session_id: str) -> Dict[str, Any]:
        """Calculate all taxes based on session data"""
        # Get session answers
        answers = self._get_session_answers(session_id)

        # Get user's canton and municipality
        canton = answers.get('canton', 'ZH')
        municipality = answers.get('municipality', 'Zurich')

        # Calculate income components
        income_data = self._calculate_income(answers)

        # Calculate social security contributions (BEFORE deductions)
        social_security_data = self._calculate_social_security(answers, income_data)

        # Calculate deductions (including social security deductions)
        deductions_data = self._calculate_deductions(answers, social_security_data)

        # Calculate taxable income
        taxable_income = Decimal(str(max(0, income_data['total_income'] - deductions_data['total_deductions'])))

        # Calculate federal tax
        federal_tax = self._calculate_federal_tax(taxable_income, answers)

        # Calculate cantonal tax
        cantonal_tax = self._calculate_cantonal_tax(taxable_income, canton, answers)

        # Calculate municipal tax
        municipal_tax = self._calculate_municipal_tax(cantonal_tax, canton, municipality)

        # Calculate church tax (optional) - returns full breakdown
        church_tax_data = self._calculate_church_tax(cantonal_tax, canton, answers)
        church_tax = Decimal(str(church_tax_data.get('church_tax', 0)))

        # Calculate wealth tax (if applicable)
        wealth_tax_data = self._calculate_wealth_tax(answers, canton, municipality)
        wealth_tax = Decimal(str(wealth_tax_data.get('total_wealth_tax', 0)))

        # Total tax (including church tax and wealth tax)
        total_tax = federal_tax + cantonal_tax + municipal_tax + church_tax + wealth_tax

        # Save calculation to database
        calculation_id = self._save_calculation(
            session_id, income_data, deductions_data, taxable_income,
            federal_tax, cantonal_tax, municipal_tax, church_tax, wealth_tax, total_tax
        )

        return {
            'calculation_id': str(calculation_id),
            'tax_year': self.tax_year,
            'canton': canton,
            'municipality': municipality,
            'income': income_data,
            'social_security': social_security_data,
            'deductions': deductions_data,
            'taxable_income': float(taxable_income),
            'federal_tax': float(federal_tax),
            'cantonal_tax': float(cantonal_tax),
            'municipal_tax': float(municipal_tax),
            'church_tax': church_tax_data,  # Full church tax breakdown
            'wealth_tax': wealth_tax_data,  # Full wealth tax breakdown
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
            'employment': Decimal('0'),
            'self_employment': Decimal('0'),
            'capital': Decimal('0'),
            'rental': Decimal('0'),
            'pension': Decimal('0'),
            'foreign': Decimal('0'),
            'other': Decimal('0'),
            'total_income': Decimal('0')
        }

        # Employment income - based on number of employers (Q04)
        try:
            num_employers = int(answers.get('Q04', 0))
        except (ValueError, TypeError):
            num_employers = 0

        if num_employers > 0:
            # Check if self-employed or employed (Q04a)
            employment_type = answers.get('Q04a', 'employed')

            # Get employment income from answers or use default for testing
            employment_income = Decimal(str(answers.get('income_employment', 0)))

            if employment_type in ['self_employed', 'both']:
                # Self-employment income
                self_employment_income = Decimal(str(answers.get('income_self_employment', 0)))
                income['self_employment'] = self_employment_income

            if employment_type in ['employed', 'both']:
                # Regular employment income
                income['employment'] = employment_income

        # Dividend/Interest income (Q10a)
        # Note: Q10a now uses document upload instead of numeric input
        # The actual amount will be extracted from uploaded documents
        # For now, we set capital income to 0 when Q10a is 'yes'
        if answers.get('Q10a') == 'yes':
            # TODO: Extract capital income from uploaded documents
            income['capital'] = Decimal('0')

        # Rental income (Q09c)
        if answers.get('Q09c') == 'yes':
            try:
                rental_income = Decimal(str(answers.get('Q09c_amount', 0)))
                income['rental'] = rental_income
            except (ValueError, TypeError, decimal.InvalidOperation):
                income['rental'] = Decimal('0')

        # Pension/annuity income (Q14)
        if answers.get('Q14') == 'yes':
            try:
                pension_income = Decimal(str(answers.get('pension_income', 0)))
                income['pension'] = pension_income
            except (ValueError, TypeError, decimal.InvalidOperation):
                income['pension'] = Decimal('0')

        # Foreign income (Q15)
        if answers.get('Q15') == 'yes':
            try:
                foreign_income = Decimal(str(answers.get('foreign_income', 0)))
                income['foreign'] = foreign_income
            except (ValueError, TypeError, decimal.InvalidOperation):
                income['foreign'] = Decimal('0')

        # Calculate total
        income['total_income'] = sum([
            income['employment'],
            income['self_employment'],
            income['capital'],
            income['rental'],
            income['pension'],
            income['foreign'],
            income['other']
        ])

        # Convert to float for JSON serialization
        return {k: float(v) for k, v in income.items()}

    def _calculate_social_security(self, answers: Dict[str, Any], income_data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate social security contributions"""
        # Determine employment type
        employment_type = answers.get('Q04a', 'employed')

        # Get necessary data for calculation
        gross_salary = Decimal(str(income_data.get('employment', 0)))
        net_self_employment = Decimal(str(income_data.get('self_employment', 0)))
        age = int(answers.get('age', 35))  # Default age if not provided
        work_percentage = Decimal(str(answers.get('work_percentage', 100)))

        social_security_result = {}

        if employment_type in ['employed', 'both'] and gross_salary > 0:
            # Calculate for employed persons
            result = self.social_security_calculator.calculate_employed(
                gross_salary=gross_salary,
                age=age,
                work_percentage=work_percentage
            )
            social_security_result['employed'] = result

        if employment_type in ['self_employed', 'both'] and net_self_employment > 0:
            # Calculate for self-employed persons
            result = self.social_security_calculator.calculate_self_employed(
                net_income=net_self_employment,
                age=age
            )
            social_security_result['self_employed'] = result

        # If no contributions calculated, return empty result
        if not social_security_result:
            social_security_result['employed'] = {
                'total_employee_contributions': 0,
                'total_employer_contributions': 0,
                'tax_deductible_employee': 0
            }

        # Extract key values for easy access
        if 'employed' in social_security_result:
            emp = social_security_result['employed']
            social_security_result['summary'] = {
                'total_employee_contributions': float(emp.get('total_employee_contributions', 0)),
                'total_employer_contributions': float(emp.get('total_employer_contributions', 0)),
                'tax_deductible': float(emp.get('tax_deductible_employee', 0)),
                'employment_type': 'employed'
            }
        elif 'self_employed' in social_security_result:
            self_emp = social_security_result['self_employed']
            social_security_result['summary'] = {
                'total_contributions': float(self_emp.get('total_contributions', 0)),
                'tax_deductible': float(self_emp.get('tax_deductible', 0)),
                'employment_type': 'self_employed'
            }

        return social_security_result

    def _calculate_deductions(self, answers: Dict[str, Any], social_security_data: Dict[str, Any] = None) -> Dict[str, Any]:
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

        # BVG/Pillar 2 employee contributions (tax deductible from social security)
        if social_security_data and 'summary' in social_security_data:
            tax_deductible_ss = social_security_data['summary'].get('tax_deductible', 0)
            deductions['pillar_2_buyins'] = float(tax_deductible_ss)

        # Pillar 3a contributions (Q07)
        if answers.get('Q07') == True:
            # Max 7056 CHF for employees with pension fund (2024)
            deductions['pillar_3a'] = min(Decimal(str(answers.get('pillar_3a_amount', 0))), 7056)

        # Health insurance premiums (Q13b_basic + Q13b_supplementary_amount)
        if answers.get('Q13b') == 'yes':
            try:
                basic_premium = Decimal(str(answers.get('Q13b_basic', 0)))
                deductions['insurance_premiums'] = float(basic_premium)

                # Add supplementary insurance if exists
                if answers.get('Q13b_supplementary') == 'yes':
                    supplementary = Decimal(str(answers.get('Q13b_supplementary_amount', 0)))
                    deductions['insurance_premiums'] += float(supplementary)
            except (ValueError, TypeError, decimal.InvalidOperation):
                # Fallback to standard deduction
                marital_status = answers.get('Q01', 'single')
                if marital_status == 'married':
                    deductions['insurance_premiums'] = 3500
                else:
                    deductions['insurance_premiums'] = 1750
        else:
            # Standard insurance deduction if not provided
            marital_status = answers.get('Q01', 'single')
            if marital_status == 'married':
                deductions['insurance_premiums'] = 3500
            else:
                deductions['insurance_premiums'] = 1750

        # Child deductions (Q03) - 6600 CHF per child for federal tax
        if answers.get('Q03') == 'yes':
            try:
                num_children = int(answers.get('Q03a', 0))
                deductions['child_deduction'] = num_children * 6600
            except (ValueError, TypeError):
                pass

        # Pillar 3a contributions (Q08) - Max 7056 CHF for employees (2024)
        if answers.get('Q08') == 'yes':
            try:
                pillar_3a = Decimal(str(answers.get('pillar_3a_amount', 7056)))
                deductions['pillar_3a'] = min(pillar_3a, Decimal('7056'))
            except (ValueError, TypeError):
                deductions['pillar_3a'] = Decimal('7056')

        # Medical expenses (Q13) - only if exceeds 5% of income
        if answers.get('Q13') == 'yes':
            try:
                medical = Decimal(str(answers.get('medical_expenses', 0)))
                threshold = employment_income * Decimal('0.05')
                if medical > threshold:
                    deductions['medical_expenses'] = medical - threshold
            except (ValueError, TypeError):
                pass

        # Alimony payments (Q12)
        if answers.get('Q12') == 'yes':
            try:
                alimony = Decimal(str(answers.get('alimony_amount', 0)))
                deductions['alimony'] = alimony
            except (ValueError, TypeError):
                pass

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
        """Calculate cantonal tax using canton-specific calculator"""
        try:
            # Get canton-specific calculator
            calculator = get_canton_calculator(canton, self.tax_year)

            # Extract parameters needed for calculation
            marital_status = answers.get('Q01', 'single')
            num_children = int(answers.get('Q03a', 0)) if answers.get('Q03') == 'yes' else 0

            # Calculate canton tax
            canton_tax = calculator.calculate(
                taxable_income=taxable_income,
                marital_status=marital_status,
                num_children=num_children
            )

            return Decimal(str(canton_tax))

        except Exception as e:
            # Fallback to simple calculation if calculator fails
            print(f"Warning: Canton calculator failed for {canton}, using fallback: {str(e)}")
            return taxable_income * Decimal('0.08')  # 8% fallback rate

    def _calculate_municipal_tax(self, cantonal_tax: Decimal, canton: str,
                                 municipality: str) -> Decimal:
        """Calculate municipal tax as percentage of cantonal tax"""
        try:
            # Query database for municipality tax multiplier
            query = """
                SELECT tax_multiplier
                FROM swisstax.municipalities
                WHERE canton = %s AND name = %s AND tax_year = %s
                LIMIT 1
            """
            result = execute_one(query, (canton, municipality, self.tax_year))

            if result and 'tax_multiplier' in result:
                multiplier = Decimal(str(result['tax_multiplier']))
                return cantonal_tax * multiplier
            else:
                # Fallback: try case-insensitive search
                query_fuzzy = """
                    SELECT tax_multiplier
                    FROM swisstax.municipalities
                    WHERE canton = %s AND LOWER(name) = LOWER(%s) AND tax_year = %s
                    LIMIT 1
                """
                result = execute_one(query_fuzzy, (canton, municipality, self.tax_year))

                if result and 'tax_multiplier' in result:
                    multiplier = Decimal(str(result['tax_multiplier']))
                    return cantonal_tax * multiplier
                else:
                    # No multiplier found - use default 1.0 (100%)
                    print(f"Warning: No tax multiplier found for {municipality}, {canton}. Using 1.0")
                    return cantonal_tax * Decimal('1.0')

        except Exception as e:
            # Fallback to 1.0 multiplier if query fails
            print(f"Warning: Municipal tax query failed for {municipality}, {canton}: {str(e)}")
            return cantonal_tax * Decimal('1.0')

    def _calculate_church_tax(self, cantonal_tax: Decimal, canton: str,
                              answers: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate church tax (optional) using ChurchTaxService"""
        # Check if person pays church tax
        pays_church_tax = answers.get('pays_church_tax', False)

        if not pays_church_tax:
            return {
                'applies': False,
                'reason': 'user_not_member',
                'church_tax': 0.0,
                'canton': canton,
                'denomination': 'none'
            }

        # Get denomination from answers (default to 'none' if not specified)
        denomination = answers.get('religious_denomination', 'none')

        if denomination == 'none':
            return {
                'applies': False,
                'reason': 'no_denomination_specified',
                'church_tax': 0.0,
                'canton': canton,
                'denomination': 'none'
            }

        # Get municipality info for more accurate rates
        municipality_id = answers.get('municipality_id')
        municipality_name = answers.get('municipality')

        # Calculate church tax using the service
        result = self.church_tax_service.calculate_church_tax(
            canton_code=canton,
            cantonal_tax=cantonal_tax,
            denomination=denomination,
            municipality_id=municipality_id,
            municipality_name=municipality_name
        )

        return result

    def _calculate_wealth_tax(self, answers: Dict[str, Any], canton: str,
                             municipality: str) -> Dict[str, Any]:
        """Calculate wealth tax (Vermögenssteuer) for canton and municipality"""
        # Check if user has wealth that might be taxable
        has_wealth = answers.get('has_wealth', 'no') == 'yes'
        if not has_wealth:
            return {
                'total_wealth_tax': 0,
                'canton_wealth_tax': 0,
                'municipal_wealth_tax': 0,
                'net_wealth': 0,
                'taxable_wealth': 0,
                'applicable': False
            }

        # Get net wealth from answers
        try:
            net_wealth = Decimal(str(answers.get('net_wealth', 0)))
        except (ValueError, TypeError, InvalidOperation):
            net_wealth = Decimal('0')

        if net_wealth <= 0:
            return {
                'total_wealth_tax': 0,
                'canton_wealth_tax': 0,
                'municipal_wealth_tax': 0,
                'net_wealth': 0,
                'taxable_wealth': 0,
                'applicable': False
            }

        # Get marital status
        marital_status = answers.get('marital_status', 'single')

        # Calculate wealth tax using the wealth tax service
        try:
            result = self.wealth_tax_service.calculate_wealth_tax(
                canton_code=canton,
                net_wealth=net_wealth,
                marital_status=marital_status,
                municipality_name=municipality
            )
            result['applicable'] = True
            return result
        except Exception as e:
            # If calculation fails, return zero wealth tax
            return {
                'total_wealth_tax': 0,
                'canton_wealth_tax': 0,
                'municipal_wealth_tax': 0,
                'net_wealth': float(net_wealth),
                'taxable_wealth': 0,
                'applicable': False,
                'error': str(e)
            }

    def _save_calculation(self, session_id: str, income_data: Dict, deductions_data: Dict,
                         taxable_income: Decimal, federal_tax: Decimal, cantonal_tax: Decimal,
                         municipal_tax: Decimal, church_tax: Decimal, wealth_tax: Decimal,
                         total_tax: Decimal) -> str:
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
            'wealth_tax': float(wealth_tax),
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