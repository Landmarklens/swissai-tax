"""
Zug Canton Tax Calculator

Official sources:
- Tax brackets: https://zg.ch/dam/jcr:e15fc182-a10a-4883-947d-619aea90265b/Grundtarif%20ab%202001-2025-28.11.24.pdf
- Municipality rates: https://zg.ch/dam/jcr:3286163b-1522-4b63-92cf-0aecfbd6a1e9/Steuerfuesse%202024-22.1.24.pdf
- Canton rate: 82% (for 2024)
"""

from decimal import Decimal
from typing import Dict
from .base import CantonTaxCalculator


class ZugTaxCalculator(CantonTaxCalculator):
    """
    Zug Canton Tax Calculator

    Canton Zug uses:
    - Canton multiplier: 82% (0.82) for 2024
    - Municipal multipliers: Range from 50.88% (Baar) to 65% (Neuheim)
    - Progressive "Grundtarif" (basic tariff) for single taxpayers
    - "Mehrpersonentarif" (multi-person tariff) for married couples (not yet implemented)
    """

    CANTON_CODE = "ZG"
    CANTON_NAME = "Zug"
    CANTON_MULTIPLIER = Decimal('0.82')  # 82% for 2024

    def __init__(self, tax_year: int = 2024):
        super().__init__(canton_code="ZG", tax_year=tax_year)

    def _load_tax_brackets(self) -> Dict:
        """
        Load Zug's progressive tax brackets (Grundtarif 2024)

        Source: Kantonssteuer «Grundtarif» gültig Steuerperiode 2024
        Indexstand per Juni 2023: 108.7, Basis: Dezember 2005
        """
        return {
            'single': [
                # (upper_limit, rate)
                # Each bracket: income up to upper_limit is taxed at rate
                (Decimal('1100'), Decimal('0.0050')),      # 0.50% for first 1,100
                (Decimal('3300'), Decimal('0.0100')),      # 1.00% for next 2,200
                (Decimal('6100'), Decimal('0.0200')),      # 2.00% for next 2,800
                (Decimal('10000'), Decimal('0.0300')),     # 3.00% for next 3,900
                (Decimal('15100'), Decimal('0.0325')),     # 3.25% for next 5,100
                (Decimal('20800'), Decimal('0.0350')),     # 3.50% for next 5,700
                (Decimal('26500'), Decimal('0.0400')),     # 4.00% for next 5,700
                (Decimal('34400'), Decimal('0.0450')),     # 4.50% for next 7,900
                (Decimal('45700'), Decimal('0.0550')),     # 5.50% for next 11,300
                (Decimal('58800'), Decimal('0.0550')),     # 5.50% for next 13,100
                (Decimal('73600'), Decimal('0.0650')),     # 6.50% for next 14,800
                (Decimal('93400'), Decimal('0.0800')),     # 8.00% for next 19,800
                (Decimal('118300'), Decimal('0.1000')),    # 10.00% for next 24,900
                (Decimal('147700'), Decimal('0.0900')),    # 9.00% for next 29,400
                (Decimal('inf'), Decimal('0.0800')),       # 8.00% over 147,700
            ],
            # TODO: Add 'married' brackets from Mehrpersonentarif
            'married': [
                # Using same as single for now - needs separate implementation
                (Decimal('1100'), Decimal('0.0050')),
                (Decimal('3300'), Decimal('0.0100')),
                (Decimal('6100'), Decimal('0.0200')),
                (Decimal('10000'), Decimal('0.0300')),
                (Decimal('15100'), Decimal('0.0325')),
                (Decimal('20800'), Decimal('0.0350')),
                (Decimal('26500'), Decimal('0.0400')),
                (Decimal('34400'), Decimal('0.0450')),
                (Decimal('45700'), Decimal('0.0550')),
                (Decimal('58800'), Decimal('0.0550')),
                (Decimal('73600'), Decimal('0.0650')),
                (Decimal('93400'), Decimal('0.0800')),
                (Decimal('118300'), Decimal('0.1000')),
                (Decimal('147700'), Decimal('0.0900')),
                (Decimal('inf'), Decimal('0.0800')),
            ]
        }

    def _apply_progressive_rates(
        self,
        taxable_income: Decimal,
        brackets: list
    ) -> Decimal:
        """
        Apply progressive tax rates to calculate simple tax

        Args:
            taxable_income: The taxable income amount
            brackets: List of (upper_limit, rate) tuples

        Returns:
            Simple tax amount (before multipliers)
        """
        if taxable_income <= 0:
            return Decimal('0')

        tax = Decimal('0')
        previous_limit = Decimal('0')

        for upper_limit, rate in brackets:
            if taxable_income <= previous_limit:
                break

            # Calculate taxable amount in this bracket
            if taxable_income >= upper_limit:
                taxable_in_bracket = upper_limit - previous_limit
            else:
                taxable_in_bracket = taxable_income - previous_limit

            # Add tax for this bracket
            tax += taxable_in_bracket * rate

            previous_limit = upper_limit

        return tax.quantize(Decimal('0.01'))

    def _apply_family_adjustments(
        self,
        tax: Decimal,
        num_children: int
    ) -> Decimal:
        """
        Apply family deductions/adjustments

        Note: Zug provides deductions at the income level (before tax calculation)
        rather than adjusting the calculated tax. For now, we don't apply additional
        adjustments here. Children should be factored into deductions before calculation.
        """
        return tax

    def calculate(
        self,
        taxable_income: Decimal,
        marital_status: str = 'single',
        num_children: int = 0
    ) -> Dict[str, Decimal]:
        """
        Calculate Zug cantonal tax (without municipal component)

        Args:
            taxable_income: Taxable income in CHF
            marital_status: 'single' or 'married'
            num_children: Number of dependent children

        Returns:
            Dictionary with:
                - simple_tax: Base tax before multiplier
                - cantonal_tax: Final cantonal tax (simple_tax × 0.82)
                - canton_multiplier: The multiplier used (0.82)
        """
        # Get appropriate brackets
        brackets = self.tax_brackets.get(marital_status, self.tax_brackets['single'])

        # Calculate simple tax
        simple_tax = self._apply_progressive_rates(taxable_income, brackets)

        # Apply canton multiplier
        cantonal_tax = simple_tax * self.CANTON_MULTIPLIER
        cantonal_tax = self._apply_family_adjustments(cantonal_tax, num_children)

        return {
            'simple_tax': simple_tax,
            'cantonal_tax': cantonal_tax,
            'canton_multiplier': self.CANTON_MULTIPLIER
        }

    def calculate_with_multiplier(
        self,
        taxable_income: Decimal,
        marital_status: str = 'single',
        num_children: int = 0,
        canton_multiplier: Decimal = None,
        municipal_multiplier: Decimal = Decimal('0.5211')  # Zug city default
    ) -> Dict[str, Decimal]:
        """
        Calculate complete Zug tax with both canton and municipal components

        IMPORTANT: Swiss tax system applies BOTH multipliers to the SAME simple tax:
        - Cantonal tax = simple_tax × canton_multiplier
        - Municipal tax = simple_tax × municipal_multiplier  (NOT cantonal_tax!)

        This is the correct Swiss formula where both canton and municipality
        tax the same simple tax base.

        Args:
            taxable_income: Taxable income in CHF
            marital_status: 'single' or 'married'
            num_children: Number of dependent children
            canton_multiplier: Canton multiplier (default: 0.82 for Zug)
            municipal_multiplier: Municipal multiplier (default: 0.5211 for Zug city)
                Municipality rates for 2024:
                - Baar: 0.5088 (lowest)
                - Zug: 0.5211
                - Walchwil: 0.53
                - Steinhausen: 0.54
                - Risch: 0.55
                - Unterägeri: 0.56
                - Cham: 0.56
                - Oberägeri: 0.57
                - Hünenberg: 0.57
                - Menzingen: 0.61
                - Neuheim: 0.65 (highest)

        Returns:
            Dictionary with:
                - simple_tax: Base tax before multipliers
                - cantonal_tax: Canton tax component
                - municipal_tax: Municipal tax component
                - total_cantonal_and_municipal: Combined tax
                - canton_multiplier: Canton multiplier used
                - municipal_multiplier: Municipal multiplier used
        """
        if canton_multiplier is None:
            canton_multiplier = self.CANTON_MULTIPLIER

        # Get appropriate brackets
        brackets = self.tax_brackets.get(marital_status, self.tax_brackets['single'])

        # Calculate simple tax using progressive brackets
        simple_tax = self._apply_progressive_rates(taxable_income, brackets)

        # Calculate cantonal tax
        cantonal_tax = simple_tax * canton_multiplier
        cantonal_tax = self._apply_family_adjustments(cantonal_tax, num_children)

        # CORRECT: Municipal tax also multiplies the simple tax (not cantonal tax!)
        # This is the Swiss system: both canton and municipality tax the same base
        municipal_tax = simple_tax * municipal_multiplier

        # Total cantonal and municipal tax
        total_tax = cantonal_tax + municipal_tax

        return {
            'simple_tax': simple_tax,
            'cantonal_tax': cantonal_tax,
            'municipal_tax': municipal_tax,
            'total_cantonal_and_municipal': total_tax,
            'canton_multiplier': canton_multiplier,
            'municipal_multiplier': municipal_multiplier
        }

    def get_canton_info(self) -> Dict:
        """Get information about Zug canton tax system"""
        return {
            'canton_code': self.CANTON_CODE,
            'canton_name': self.CANTON_NAME,
            'canton_multiplier': float(self.CANTON_MULTIPLIER),
            'tax_year': 2024,
            'num_municipalities': 11,
            'municipal_multiplier_range': {
                'min': 0.5088,  # Baar
                'max': 0.65,    # Neuheim
            },
            'features': [
                'Progressive tax brackets (Grundtarif)',
                'Canton multiplier: 82%',
                'Simple tax system',
                'Both canton and municipality multiply same simple tax base'
            ],
            'sources': [
                'https://zg.ch/dam/jcr:e15fc182-a10a-4883-947d-619aea90265b/Grundtarif%20ab%202001-2025-28.11.24.pdf',
                'https://zg.ch/dam/jcr:3286163b-1522-4b63-92cf-0aecfbd6a1e9/Steuerfuesse%202024-22.1.24.pdf'
            ]
        }
