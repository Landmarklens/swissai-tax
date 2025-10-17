"""
Basel-Stadt Canton Tax Calculator

Official sources:
- Tax tariffs: https://media.bs.ch/original_file/12a2569768d1cae30205ccb8a3a6674faa042050/17000-steuertarife-2024.pdf
- Canton website: https://www.bs.ch/fd/steuerverwaltung

IMPORTANT: Basel-Stadt has a UNIQUE tax system:
1. Only 3 municipalities: Basel (city), Bettingen, Riehen
2. Basel city: 100% canton tax, NO municipal tax
3. Bettingen & Riehen: 50% canton + municipal tax
4. Flat rates within brackets (not progressive marginal rates like other cantons)
"""

from decimal import Decimal
from typing import Dict
from .base import CantonTaxCalculator


class BaselStadtTaxCalculator(CantonTaxCalculator):
    """
    Basel-Stadt Canton Tax Calculator

    UNIQUE SYSTEM:
    - Basel city pays 100% cantonal tax, NO municipal tax
    - Bettingen pays 50% cantonal + 37.50% municipal = 87.50% total
    - Riehen pays 50% cantonal + 40.00% municipal = 90.00% total

    TAX CALCULATION METHOD:
    - Uses flat rate for entire income within each bracket
    - NOT progressive marginal rates like most other cantons
    - Only 3 simple brackets
    """

    CANTON_CODE = "BS"
    CANTON_NAME = "Basel-Stadt"
    CANTON_MULTIPLIER = Decimal('1.00')  # 100% for Basel city
    CANTON_MULTIPLIER_MUNICIPALITIES = Decimal('0.50')  # 50% for Bettingen & Riehen

    def __init__(self, tax_year: int = 2024):
        super().__init__(canton_code="BS", tax_year=tax_year)

    def _load_tax_brackets(self) -> Dict:
        """
        Load Basel-Stadt's simple tax brackets (2024)

        IMPORTANT: Basel-Stadt uses FLAT RATES within each bracket,
        not progressive marginal rates!

        The ENTIRE income is taxed at the rate for the bracket it falls into.

        Source: Kantonaler Einkommenssteuertarif A/B 2024
        "CHF X je CHF 100" = X% flat rate
        """
        return {
            'single': [
                # (upper_limit, flat_rate)
                # "CHF 21.– je CHF 100.–" = 21% flat rate on entire income
                (Decimal('209800'), Decimal('0.21')),      # 21% for income up to CHF 209,800
                (Decimal('312300'), Decimal('0.2725')),    # 27.25% for income CHF 209,800 - 312,300
                (Decimal('inf'), Decimal('0.2825')),       # 28.25% for income over CHF 312,300
            ],
            # TODO: Add Tarif B (married) - currently using same as single
            'married': [
                (Decimal('209800'), Decimal('0.21')),
                (Decimal('312300'), Decimal('0.2725')),
                (Decimal('inf'), Decimal('0.2825')),
            ]
        }

    def _apply_progressive_rates(
        self,
        taxable_income: Decimal,
        brackets: list
    ) -> Decimal:
        """
        Apply Basel-Stadt's FLAT RATE system

        IMPORTANT: This is NOT progressive marginal taxation!
        The ENTIRE income is taxed at the rate for the bracket it falls into.

        Example:
        - CHF 100,000 income falls in bracket 1 (up to CHF 209,800 at 21%)
        - Tax = CHF 100,000 × 21% = CHF 21,000
        - NOT progressive calculation of different rates on different portions

        Args:
            taxable_income: The taxable income amount
            brackets: List of (upper_limit, flat_rate) tuples

        Returns:
            Simple tax amount (before multipliers)
        """
        if taxable_income <= 0:
            return Decimal('0')

        # Find which bracket the income falls into
        flat_rate = Decimal('0')
        for upper_limit, rate in brackets:
            if taxable_income <= upper_limit:
                flat_rate = rate
                break

        # Apply flat rate to ENTIRE income
        tax = taxable_income * flat_rate

        return tax.quantize(Decimal('0.01'))

    def _apply_family_adjustments(
        self,
        tax: Decimal,
        num_children: int
    ) -> Decimal:
        """
        Apply family deductions/adjustments

        Note: Basel-Stadt provides deductions at the income level (before tax calculation)
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
        Calculate Basel-Stadt cantonal tax (without municipal component)

        For Basel city, this is the full tax (100% canton, no municipal).
        For Bettingen/Riehen, this returns 50% canton tax only.

        Args:
            taxable_income: Taxable income in CHF
            marital_status: 'single' or 'married'
            num_children: Number of dependent children

        Returns:
            Dictionary with:
                - simple_tax: Base tax using flat rate
                - cantonal_tax: Final cantonal tax (simple_tax × multiplier)
                - canton_multiplier: The multiplier used (1.00 for Basel)
        """
        # Get appropriate brackets
        brackets = self.tax_brackets.get(marital_status, self.tax_brackets['single'])

        # Calculate simple tax using flat rate system
        simple_tax = self._apply_progressive_rates(taxable_income, brackets)

        # Apply canton multiplier (100% for Basel city)
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
        municipal_multiplier: Decimal = Decimal('0.00'),  # Basel city default (no municipal)
        municipality: str = 'Basel'
    ) -> Dict[str, Decimal]:
        """
        Calculate complete Basel-Stadt tax with both canton and municipal components

        IMPORTANT: Basel-Stadt has a UNIQUE system:

        1. Basel (city):
           - Canton multiplier: 100% (1.00)
           - Municipal multiplier: 0% (no municipal tax)
           - Total: simple_tax × 1.00

        2. Bettingen:
           - Canton multiplier: 50% (0.50)
           - Municipal multiplier: 37.50% (0.3750)
           - Total: (simple_tax × 0.50) + (simple_tax × 0.3750) = simple_tax × 0.8750

        3. Riehen:
           - Canton multiplier: 50% (0.50)
           - Municipal multiplier: 40.00% (0.4000)
           - Total: (simple_tax × 0.50) + (simple_tax × 0.4000) = simple_tax × 0.9000

        Args:
            taxable_income: Taxable income in CHF
            marital_status: 'single' or 'married'
            num_children: Number of dependent children
            canton_multiplier: Canton multiplier (auto-determined from municipality)
            municipal_multiplier: Municipal multiplier (default 0.00 for Basel)
            municipality: Municipality name ('Basel', 'Bettingen', or 'Riehen')

        Returns:
            Dictionary with:
                - simple_tax: Base tax using flat rate
                - cantonal_tax: Canton tax component
                - municipal_tax: Municipal tax component (0 for Basel)
                - total_cantonal_and_municipal: Combined tax
                - canton_multiplier: Canton multiplier used
                - municipal_multiplier: Municipal multiplier used
                - municipality: Municipality name
        """
        # Auto-determine multipliers based on municipality if not explicitly provided
        if canton_multiplier is None:
            if municipality == 'Basel':
                canton_multiplier = Decimal('1.00')  # 100%
                if municipal_multiplier == Decimal('0.00'):  # If not overridden
                    municipal_multiplier = Decimal('0.00')   # No municipal tax
            else:  # Bettingen or Riehen
                canton_multiplier = Decimal('0.50')  # 50%
                if municipal_multiplier == Decimal('0.00'):  # If not explicitly set
                    # Use default municipal rates
                    if municipality == 'Bettingen':
                        municipal_multiplier = Decimal('0.3750')  # 37.50%
                    elif municipality == 'Riehen':
                        municipal_multiplier = Decimal('0.4000')  # 40.00%

        # Get appropriate brackets
        brackets = self.tax_brackets.get(marital_status, self.tax_brackets['single'])

        # Calculate simple tax using flat rate system
        simple_tax = self._apply_progressive_rates(taxable_income, brackets)

        # Calculate cantonal tax
        cantonal_tax = simple_tax * canton_multiplier
        cantonal_tax = self._apply_family_adjustments(cantonal_tax, num_children)

        # Calculate municipal tax (Swiss formula: multiply same simple tax)
        municipal_tax = simple_tax * municipal_multiplier

        # Total cantonal and municipal tax
        total_tax = cantonal_tax + municipal_tax

        return {
            'simple_tax': simple_tax,
            'cantonal_tax': cantonal_tax,
            'municipal_tax': municipal_tax,
            'total_cantonal_and_municipal': total_tax,
            'canton_multiplier': canton_multiplier,
            'municipal_multiplier': municipal_multiplier,
            'municipality': municipality
        }

    def get_canton_info(self) -> Dict:
        """Get information about Basel-Stadt canton tax system"""
        return {
            'canton_code': self.CANTON_CODE,
            'canton_name': self.CANTON_NAME,
            'canton_multiplier': float(self.CANTON_MULTIPLIER),
            'tax_year': 2024,
            'num_municipalities': 3,
            'municipalities': {
                'Basel': {
                    'canton_multiplier': 1.00,
                    'municipal_multiplier': 0.00,
                    'total': 1.00,
                    'notes': 'City - full canton tax, no municipal tax'
                },
                'Bettingen': {
                    'canton_multiplier': 0.50,
                    'municipal_multiplier': 0.3750,
                    'total': 0.8750,
                    'notes': 'Reduced canton + municipal tax'
                },
                'Riehen': {
                    'canton_multiplier': 0.50,
                    'municipal_multiplier': 0.4000,
                    'total': 0.9000,
                    'notes': 'Reduced canton + municipal tax'
                }
            },
            'features': [
                'Only 3 municipalities',
                'Flat rate system (not progressive marginal rates)',
                'Basel: 100% canton, 0% municipal',
                'Bettingen & Riehen: 50% canton + municipal',
                'Very simple 3-bracket structure'
            ],
            'sources': [
                'https://media.bs.ch/original_file/12a2569768d1cae30205ccb8a3a6674faa042050/17000-steuertarife-2024.pdf'
            ]
        }
