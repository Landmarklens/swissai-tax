"""Wealth Tax Service for Swiss Cantonal and Municipal Wealth Tax

This service provides a unified interface for calculating wealth tax across all 26 Swiss cantons.
It handles canton-specific calculators, municipal multipliers, and integrates with the main
tax calculation system.

Official sources: Individual canton tax administration websites (.ch domains)
Tax Year: 2024
"""

from decimal import Decimal
from typing import Dict, Any, Optional
from database.connection import execute_one, execute_query
from services.wealth_tax_calculators import get_wealth_tax_calculator, WEALTH_TAX_CALCULATORS


class WealthTaxService:
    """Unified service for wealth tax calculations across all Swiss cantons"""

    def __init__(self, tax_year: int = 2024):
        """
        Initialize the wealth tax service.

        Args:
            tax_year: Tax year for calculations (default: 2024)
        """
        self.tax_year = tax_year

    def calculate_wealth_tax(
        self,
        canton_code: str,
        net_wealth: Decimal,
        marital_status: str = 'single',
        municipality_id: Optional[int] = None,
        municipality_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Calculate total wealth tax for a canton with municipal multipliers.

        Args:
            canton_code: Two-letter canton code (e.g., 'ZH', 'GE', 'VD')
            net_wealth: Net worth (assets - debts) as of December 31st
            marital_status: 'single' or 'married'
            municipality_id: Municipality ID from database (optional)
            municipality_name: Municipality name (optional, used if municipality_id not provided)

        Returns:
            Dictionary containing:
                - net_wealth: Input net wealth
                - tax_free_threshold: Canton's tax-free amount
                - taxable_wealth: Amount subject to taxation
                - canton_wealth_tax: Canton portion of tax
                - municipal_wealth_tax: Municipal portion of tax
                - total_wealth_tax: Combined canton + municipal tax
                - effective_rate: Tax as percentage of net wealth
                - canton_info: Canton-specific information
                - municipality_info: Municipality details

        Raises:
            ValueError: If canton code is invalid or calculator not available
        """
        # Validate canton code
        canton_code = canton_code.upper()
        if canton_code not in WEALTH_TAX_CALCULATORS:
            available = ', '.join(sorted(WEALTH_TAX_CALCULATORS.keys()))
            raise ValueError(
                f"Wealth tax calculator not available for canton {canton_code}. "
                f"Available cantons: {available}"
            )

        # Get canton calculator
        calculator = get_wealth_tax_calculator(canton_code, self.tax_year)

        # Get municipality multiplier if available
        municipal_multiplier = None
        municipality_info = None

        if municipality_id or municipality_name:
            municipality_data = self._get_municipality_data(
                canton_code,
                municipality_id,
                municipality_name
            )
            if municipality_data:
                # Use wealth_tax_multiplier if available, otherwise use general tax_multiplier
                municipal_multiplier = municipality_data.get('wealth_tax_multiplier') or \
                                     municipality_data.get('tax_multiplier')
                municipality_info = {
                    'id': municipality_data.get('id'),
                    'name': municipality_data.get('name'),
                    'multiplier': float(municipal_multiplier) if municipal_multiplier else None
                }

        # Calculate wealth tax
        if municipal_multiplier:
            result = calculator.calculate_with_multiplier(
                net_wealth=net_wealth,
                marital_status=marital_status,
                canton_multiplier=Decimal('1.0'),  # Base canton rate
                municipal_multiplier=municipal_multiplier
            )
        else:
            # Calculate without municipal multiplier
            result = calculator.calculate(
                net_wealth=net_wealth,
                marital_status=marital_status
            )
            # Add zero municipal tax
            result['municipal_wealth_tax'] = Decimal('0')
            result['total_cantonal_and_municipal'] = result['canton_wealth_tax']

        # Get canton info
        canton_info = calculator.get_canton_info()

        # Build comprehensive response
        return {
            'net_wealth': float(result['net_wealth']),
            'tax_free_threshold': float(result['tax_free_threshold']),
            'taxable_wealth': float(result['taxable_wealth']),
            'canton_wealth_tax': float(result.get('canton_wealth_tax', 0)),
            'municipal_wealth_tax': float(result.get('municipal_wealth_tax', 0)),
            'total_wealth_tax': float(result.get('total_cantonal_and_municipal', 0)),
            'effective_rate': float(result.get('effective_rate', 0)),
            'canton_info': {
                'code': canton_code,
                'name': canton_info.get('canton_name', canton_code),
                'rate_structure': canton_info.get('rate_structure'),
                'source': canton_info.get('source'),
                'notes': canton_info.get('notes')
            },
            'municipality_info': municipality_info,
            'tax_year': self.tax_year
        }

    def calculate_from_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Calculate wealth tax based on interview session data.

        Args:
            session_id: Session ID from interview

        Returns:
            Wealth tax calculation result or None if insufficient data
        """
        # Get session answers
        answers = self._get_session_answers(session_id)

        # Check if user has significant wealth (to determine if wealth tax applies)
        has_wealth = answers.get('has_wealth', 'no') == 'yes'
        if not has_wealth:
            return None

        # Get net wealth amount
        net_wealth = Decimal(str(answers.get('net_wealth', 0)))
        if net_wealth <= 0:
            return None

        # Get canton and municipality
        canton = answers.get('canton', 'ZH')
        municipality_name = answers.get('municipality')

        # Get marital status
        marital_status = answers.get('marital_status', 'single')

        # Calculate wealth tax
        return self.calculate_wealth_tax(
            canton_code=canton,
            net_wealth=net_wealth,
            marital_status=marital_status,
            municipality_name=municipality_name
        )

    def get_canton_info(self, canton_code: str) -> Dict[str, Any]:
        """
        Get information about a canton's wealth tax system.

        Args:
            canton_code: Two-letter canton code

        Returns:
            Canton wealth tax information including thresholds, rates, structure
        """
        canton_code = canton_code.upper()
        calculator = get_wealth_tax_calculator(canton_code, self.tax_year)
        return calculator.get_canton_info()

    def get_all_cantons_info(self) -> Dict[str, Dict[str, Any]]:
        """
        Get wealth tax information for all 26 cantons.

        Returns:
            Dictionary mapping canton codes to their wealth tax information
        """
        all_info = {}
        for canton_code in sorted(WEALTH_TAX_CALCULATORS.keys()):
            try:
                all_info[canton_code] = self.get_canton_info(canton_code)
            except Exception as e:
                all_info[canton_code] = {'error': str(e)}
        return all_info

    def compare_cantons(
        self,
        net_wealth: Decimal,
        marital_status: str = 'single',
        canton_codes: Optional[list] = None
    ) -> Dict[str, Dict[str, Any]]:
        """
        Compare wealth tax across multiple cantons.

        Args:
            net_wealth: Net worth to compare
            marital_status: 'single' or 'married'
            canton_codes: List of canton codes to compare (default: all 26)

        Returns:
            Dictionary mapping canton codes to their wealth tax calculations
        """
        if canton_codes is None:
            canton_codes = list(WEALTH_TAX_CALCULATORS.keys())

        comparison = {}
        for canton_code in canton_codes:
            try:
                result = self.calculate_wealth_tax(
                    canton_code=canton_code,
                    net_wealth=net_wealth,
                    marital_status=marital_status
                )
                comparison[canton_code] = result
            except Exception as e:
                comparison[canton_code] = {'error': str(e)}

        return comparison

    def _get_municipality_data(
        self,
        canton_code: str,
        municipality_id: Optional[int] = None,
        municipality_name: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Get municipality data including tax multipliers.

        Args:
            canton_code: Canton code
            municipality_id: Municipality ID (preferred)
            municipality_name: Municipality name (fallback)

        Returns:
            Municipality data or None if not found
        """
        if municipality_id:
            query = """
                SELECT id, name, canton, tax_multiplier, wealth_tax_multiplier
                FROM swisstax.municipalities
                WHERE id = %s AND canton = %s
            """
            result = execute_one(query, (municipality_id, canton_code))
        elif municipality_name:
            query = """
                SELECT id, name, canton, tax_multiplier, wealth_tax_multiplier
                FROM swisstax.municipalities
                WHERE LOWER(name) = LOWER(%s) AND canton = %s
            """
            result = execute_one(query, (municipality_name, canton_code))
        else:
            return None

        return result

    def _get_session_answers(self, session_id: str) -> Dict[str, Any]:
        """
        Get interview answers for a session.

        Args:
            session_id: Session ID

        Returns:
            Dictionary of question IDs to answer values
        """
        query = """
            SELECT question_id, answer_value
            FROM swisstax.interview_answers
            WHERE session_id = %s
        """
        results = execute_query(query, (session_id,))
        return {row['question_id']: row['answer_value'] for row in results}

    def is_wealth_tax_applicable(
        self,
        canton_code: str,
        net_wealth: Decimal,
        marital_status: str = 'single'
    ) -> bool:
        """
        Check if wealth tax applies based on canton thresholds.

        Args:
            canton_code: Canton code
            net_wealth: Net worth
            marital_status: 'single' or 'married'

        Returns:
            True if wealth exceeds tax-free threshold
        """
        try:
            calculator = get_wealth_tax_calculator(canton_code, self.tax_year)
            threshold = (calculator.threshold_married if marital_status == 'married'
                        else calculator.threshold_single)
            return net_wealth > threshold
        except Exception:
            return False
