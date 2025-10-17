"""
Aargau Canton Tax Calculator

Tax calculation for Canton Aargau (AG).
Based on 2024 tax rates with cold progression adjustments.

Key Information:
- Canton tax multiplier (Steuerfuss): 112% for 2024
- Municipal multipliers: Vary by municipality (median 102%)
- Progressive tax system based on "einfache Steuer" (simple tax)
- Cold progression adjustments applied in 2024

Reference:
- https://www.ag.ch (Official Canton Aargau website)
- Wegleitung zur Steuererklärung 2024
- Calculated from online tax calculators and official rates
"""

from decimal import Decimal
from typing import Dict, List

from .base import CantonTaxCalculator, TaxBracket


class AargauTaxCalculator(CantonTaxCalculator):
    """Tax calculator for Canton Aargau"""

    # Canton tax multiplier for 2024 (Steuerfuss Kanton)
    CANTON_MULTIPLIER = Decimal('1.12')  # 112%

    def _load_tax_brackets(self) -> Dict[str, List[TaxBracket]]:
        """
        Load Aargau canton tax brackets for 2024.

        Aargau uses a progressive "einfache Steuer" (simple tax) system.
        The brackets below represent the simple tax, which is then multiplied
        by the canton multiplier (112% for 2024).

        These brackets are approximated based on:
        - Online tax calculator results
        - Swiss progressive tax system structure
        - Federal tax administration guidelines
        - Comparison with similar cantons (Zurich, Bern)

        Note: The actual "einfache Steuer" tariff is defined in the
        Aargau Steuergesetz (Tax Law) and published in the official
        Einkommenssteuertarif PDF (67 pages).
        """

        # Tax brackets for single taxpayers (Alleinstehende)
        # These represent the "simple tax" before canton multiplier
        single_brackets = [
            TaxBracket(
                min_income=Decimal('0'),
                max_income=Decimal('6700'),
                rate=Decimal('0'),
                fixed_amount=Decimal('0')
            ),
            TaxBracket(
                min_income=Decimal('6700'),
                max_income=Decimal('13400'),
                rate=Decimal('0.015'),  # 1.5%
                fixed_amount=Decimal('0')
            ),
            TaxBracket(
                min_income=Decimal('13400'),
                max_income=Decimal('20100'),
                rate=Decimal('0.025'),  # 2.5%
                fixed_amount=Decimal('100')
            ),
            TaxBracket(
                min_income=Decimal('20100'),
                max_income=Decimal('26800'),
                rate=Decimal('0.035'),  # 3.5%
                fixed_amount=Decimal('268')
            ),
            TaxBracket(
                min_income=Decimal('26800'),
                max_income=Decimal('40200'),
                rate=Decimal('0.045'),  # 4.5%
                fixed_amount=Decimal('502')
            ),
            TaxBracket(
                min_income=Decimal('40200'),
                max_income=Decimal('53600'),
                rate=Decimal('0.055'),  # 5.5%
                fixed_amount=Decimal('1105')
            ),
            TaxBracket(
                min_income=Decimal('53600'),
                max_income=Decimal('67000'),
                rate=Decimal('0.065'),  # 6.5%
                fixed_amount=Decimal('1842')
            ),
            TaxBracket(
                min_income=Decimal('67000'),
                max_income=Decimal('80400'),
                rate=Decimal('0.075'),  # 7.5%
                fixed_amount=Decimal('2713')
            ),
            TaxBracket(
                min_income=Decimal('80400'),
                max_income=Decimal('107200'),
                rate=Decimal('0.085'),  # 8.5%
                fixed_amount=Decimal('3718')
            ),
            TaxBracket(
                min_income=Decimal('107200'),
                max_income=Decimal('134000'),
                rate=Decimal('0.095'),  # 9.5%
                fixed_amount=Decimal('5996')
            ),
            TaxBracket(
                min_income=Decimal('134000'),
                max_income=Decimal('174800'),
                rate=Decimal('0.105'),  # 10.5%
                fixed_amount=Decimal('8542')
            ),
            TaxBracket(
                min_income=Decimal('174800'),
                max_income=Decimal('268000'),
                rate=Decimal('0.115'),  # 11.5%
                fixed_amount=Decimal('12826')
            ),
            TaxBracket(
                min_income=Decimal('268000'),
                max_income=None,  # No upper limit
                rate=Decimal('0.125'),  # 12.5%
                fixed_amount=Decimal('23544')
            )
        ]

        # Tax brackets for married taxpayers (Verheiratete)
        # Generally have higher threshold amounts than single
        married_brackets = [
            TaxBracket(
                min_income=Decimal('0'),
                max_income=Decimal('13400'),
                rate=Decimal('0'),
                fixed_amount=Decimal('0')
            ),
            TaxBracket(
                min_income=Decimal('13400'),
                max_income=Decimal('26800'),
                rate=Decimal('0.015'),  # 1.5%
                fixed_amount=Decimal('0')
            ),
            TaxBracket(
                min_income=Decimal('26800'),
                max_income=Decimal('40200'),
                rate=Decimal('0.025'),  # 2.5%
                fixed_amount=Decimal('201')
            ),
            TaxBracket(
                min_income=Decimal('40200'),
                max_income=Decimal('53600'),
                rate=Decimal('0.035'),  # 3.5%
                fixed_amount=Decimal('536')
            ),
            TaxBracket(
                min_income=Decimal('53600'),
                max_income=Decimal('67000'),
                rate=Decimal('0.045'),  # 4.5%
                fixed_amount=Decimal('1005')
            ),
            TaxBracket(
                min_income=Decimal('67000'),
                max_income=Decimal('80400'),
                rate=Decimal('0.055'),  # 5.5%
                fixed_amount=Decimal('1608')
            ),
            TaxBracket(
                min_income=Decimal('80400'),
                max_income=Decimal('107200'),
                rate=Decimal('0.065'),  # 6.5%
                fixed_amount=Decimal('2345')
            ),
            TaxBracket(
                min_income=Decimal('107200'),
                max_income=Decimal('134000'),
                rate=Decimal('0.075'),  # 7.5%
                fixed_amount=Decimal('4087')
            ),
            TaxBracket(
                min_income=Decimal('134000'),
                max_income=Decimal('174800'),
                rate=Decimal('0.085'),  # 8.5%
                fixed_amount=Decimal('6097')
            ),
            TaxBracket(
                min_income=Decimal('174800'),
                max_income=Decimal('268000'),
                rate=Decimal('0.095'),  # 9.5%
                fixed_amount=Decimal('9565')
            ),
            TaxBracket(
                min_income=Decimal('268000'),
                max_income=Decimal('402000'),
                rate=Decimal('0.105'),  # 10.5%
                fixed_amount=Decimal('18429')
            ),
            TaxBracket(
                min_income=Decimal('402000'),
                max_income=None,  # No upper limit
                rate=Decimal('0.115'),  # 11.5%
                fixed_amount=Decimal('32499')
            )
        ]

        return {
            'single': single_brackets,
            'married': married_brackets
        }

    def calculate(
        self,
        taxable_income: Decimal,
        marital_status: str = 'single',
        num_children: int = 0,
        **kwargs
    ) -> Decimal:
        """
        Calculate Aargau cantonal tax for given taxable income.

        The calculation follows these steps:
        1. Calculate "einfache Steuer" (simple tax) using progressive brackets
        2. Apply canton multiplier (112% for 2024)
        3. Apply family adjustments if applicable

        Args:
            taxable_income: Taxable income after all deductions
            marital_status: 'single' or 'married'
            num_children: Number of children
            **kwargs: Additional parameters (municipality for future use)

        Returns:
            Calculated cantonal tax amount
        """
        if taxable_income <= 0:
            return Decimal('0')

        # Get appropriate brackets
        brackets = self.tax_brackets.get(marital_status, self.tax_brackets['single'])

        # Calculate simple tax (einfache Steuer)
        simple_tax = self._apply_progressive_rates(taxable_income, brackets)

        # Apply canton multiplier (Steuerfuss)
        cantonal_tax = simple_tax * self.CANTON_MULTIPLIER

        # Apply family adjustments if applicable
        cantonal_tax = self._apply_family_adjustments(cantonal_tax, num_children)

        # Ensure non-negative
        return max(cantonal_tax, Decimal('0'))

    def _apply_family_adjustments(self, base_tax: Decimal, num_children: int) -> Decimal:
        """
        Aargau provides tax relief for families with children.

        The relief is typically applied through deductions (already factored
        into taxable income), but some additional relief may apply.

        For 2024:
        - Child deductions: CHF 7,400 (under 14), CHF 9,500 (under 18),
          CHF 11,600 (in training)
        - These are applied as income deductions before tax calculation

        Args:
            base_tax: Base tax before adjustments
            num_children: Number of children

        Returns:
            Adjusted tax amount
        """
        # In Aargau, child relief is primarily through deductions, not tax credits
        # The deductions are already applied to taxable income before this calculation
        # So we don't need additional adjustment here
        return base_tax

    def get_simple_tax(
        self,
        taxable_income: Decimal,
        marital_status: str = 'single'
    ) -> Decimal:
        """
        Get the "einfache Steuer" (simple tax) before canton multiplier.

        This is useful for debugging and understanding the tax calculation.

        Args:
            taxable_income: Taxable income
            marital_status: 'single' or 'married'

        Returns:
            Simple tax amount (before multiplier)
        """
        brackets = self.tax_brackets.get(marital_status, self.tax_brackets['single'])
        return self._apply_progressive_rates(taxable_income, brackets)

    def calculate_with_multiplier(
        self,
        taxable_income: Decimal,
        marital_status: str = 'single',
        num_children: int = 0,
        canton_multiplier: Decimal = None,
        municipal_multiplier: Decimal = Decimal('1.02')  # Median Aargau municipality
    ) -> Dict[str, Decimal]:
        """
        Calculate tax with detailed breakdown including multipliers.

        IMPORTANT: Swiss tax system applies BOTH multipliers to the SAME simple tax:
        - Cantonal tax = simple_tax × canton_multiplier
        - Municipal tax = simple_tax × municipal_multiplier  (NOT cantonal_tax!)
        - Total = cantonal_tax + municipal_tax

        Args:
            taxable_income: Taxable income
            marital_status: 'single' or 'married'
            num_children: Number of children
            canton_multiplier: Canton multiplier (defaults to 1.12 for 2024)
            municipal_multiplier: Municipal multiplier (defaults to 1.02, median)

        Returns:
            Dict with breakdown: simple_tax, cantonal_tax, municipal_tax, total_tax
        """
        if canton_multiplier is None:
            canton_multiplier = self.CANTON_MULTIPLIER

        # Calculate simple tax
        brackets = self.tax_brackets.get(marital_status, self.tax_brackets['single'])
        simple_tax = self._apply_progressive_rates(taxable_income, brackets)

        # Apply canton multiplier to simple tax
        cantonal_tax = simple_tax * canton_multiplier

        # Apply family adjustments to cantonal portion
        cantonal_tax = self._apply_family_adjustments(cantonal_tax, num_children)

        # CORRECT: Municipal tax also multiplies the simple tax (not cantonal tax!)
        # This is the Swiss system: both canton and municipality tax the same base
        municipal_tax = simple_tax * municipal_multiplier

        # Total
        total_tax = cantonal_tax + municipal_tax

        return {
            'simple_tax': simple_tax,
            'cantonal_tax': cantonal_tax,
            'municipal_tax': municipal_tax,
            'total_cantonal_and_municipal': total_tax,
            'canton_multiplier': canton_multiplier,
            'municipal_multiplier': municipal_multiplier
        }
