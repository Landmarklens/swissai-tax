"""
Zurich Canton Tax Calculator

Tax calculation for Canton Zurich (ZH).
Based on 2024 tax rates.

Key Information:
- Canton tax multiplier (Steuerfuss): 98% for 2024 (reduced from 99% in 2023)
- Municipal multipliers: Vary by municipality (72% to 141%)
- Progressive tax system based on "einfache Steuer" (simple tax)
- Family reduction: 2% per child (max 10%)

Reference: https://www.zh.ch/de/steuern-finanzen/steuern/steuerrechner.html
"""

from decimal import Decimal
from typing import Dict, List

from .base import CantonTaxCalculator, TaxBracket


class ZurichTaxCalculator(CantonTaxCalculator):
    """Tax calculator for Canton Zurich"""

    # Canton tax multiplier for 2024 (Steuerfuss Kanton)
    CANTON_MULTIPLIER = Decimal('0.98')  # 98% (reduced from 99% in 2023)

    def _load_tax_brackets(self) -> Dict[str, List[TaxBracket]]:
        """
        Load Zurich canton tax brackets for 2024.

        Zurich uses progressive tax rates that differ for single and married taxpayers.
        """
        # Tax brackets for single taxpayers
        single_brackets = [
            TaxBracket(
                min_income=Decimal('0'),
                max_income=Decimal('7000'),
                rate=Decimal('0'),
                fixed_amount=Decimal('0')
            ),
            TaxBracket(
                min_income=Decimal('7000'),
                max_income=Decimal('15000'),
                rate=Decimal('0.02'),
                fixed_amount=Decimal('0')
            ),
            TaxBracket(
                min_income=Decimal('15000'),
                max_income=Decimal('25000'),
                rate=Decimal('0.03'),
                fixed_amount=Decimal('160')
            ),
            TaxBracket(
                min_income=Decimal('25000'),
                max_income=Decimal('40000'),
                rate=Decimal('0.04'),
                fixed_amount=Decimal('460')
            ),
            TaxBracket(
                min_income=Decimal('40000'),
                max_income=Decimal('60000'),
                rate=Decimal('0.05'),
                fixed_amount=Decimal('1060')
            ),
            TaxBracket(
                min_income=Decimal('60000'),
                max_income=Decimal('80000'),
                rate=Decimal('0.06'),
                fixed_amount=Decimal('2060')
            ),
            TaxBracket(
                min_income=Decimal('80000'),
                max_income=Decimal('100000'),
                rate=Decimal('0.07'),
                fixed_amount=Decimal('3260')
            ),
            TaxBracket(
                min_income=Decimal('100000'),
                max_income=Decimal('150000'),
                rate=Decimal('0.08'),
                fixed_amount=Decimal('4660')
            ),
            TaxBracket(
                min_income=Decimal('150000'),
                max_income=Decimal('250000'),
                rate=Decimal('0.09'),
                fixed_amount=Decimal('8660')
            ),
            TaxBracket(
                min_income=Decimal('250000'),
                max_income=None,  # No upper limit
                rate=Decimal('0.11'),
                fixed_amount=Decimal('17660')
            )
        ]

        # Tax brackets for married taxpayers
        married_brackets = [
            TaxBracket(
                min_income=Decimal('0'),
                max_income=Decimal('13500'),
                rate=Decimal('0'),
                fixed_amount=Decimal('0')
            ),
            TaxBracket(
                min_income=Decimal('13500'),
                max_income=Decimal('25000'),
                rate=Decimal('0.02'),
                fixed_amount=Decimal('0')
            ),
            TaxBracket(
                min_income=Decimal('25000'),
                max_income=Decimal('40000'),
                rate=Decimal('0.03'),
                fixed_amount=Decimal('230')
            ),
            TaxBracket(
                min_income=Decimal('40000'),
                max_income=Decimal('60000'),
                rate=Decimal('0.04'),
                fixed_amount=Decimal('680')
            ),
            TaxBracket(
                min_income=Decimal('60000'),
                max_income=Decimal('80000'),
                rate=Decimal('0.05'),
                fixed_amount=Decimal('1480')
            ),
            TaxBracket(
                min_income=Decimal('80000'),
                max_income=Decimal('100000'),
                rate=Decimal('0.06'),
                fixed_amount=Decimal('2480')
            ),
            TaxBracket(
                min_income=Decimal('100000'),
                max_income=Decimal('150000'),
                rate=Decimal('0.07'),
                fixed_amount=Decimal('3680')
            ),
            TaxBracket(
                min_income=Decimal('150000'),
                max_income=Decimal('250000'),
                rate=Decimal('0.08'),
                fixed_amount=Decimal('7180')
            ),
            TaxBracket(
                min_income=Decimal('250000'),
                max_income=None,
                rate=Decimal('0.10'),
                fixed_amount=Decimal('15180')
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
        Calculate Zurich cantonal tax for given taxable income.

        The calculation follows these steps:
        1. Calculate "einfache Steuer" (simple tax) using progressive brackets
        2. Apply canton multiplier (98% for 2024)
        3. Apply family adjustments (2% per child, max 10%)

        Args:
            taxable_income: Taxable income after all deductions
            marital_status: 'single' or 'married'
            num_children: Number of children
            **kwargs: Additional parameters

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

        # Apply family adjustments (2% per child, max 10%)
        cantonal_tax = self._apply_family_adjustments(cantonal_tax, num_children)

        # Ensure non-negative
        return max(cantonal_tax, Decimal('0'))

    def _apply_family_adjustments(self, base_tax: Decimal, num_children: int) -> Decimal:
        """
        Zurich applies a 2% tax reduction per child.

        Args:
            base_tax: Base tax before adjustments
            num_children: Number of children

        Returns:
            Adjusted tax amount
        """
        if num_children > 0:
            reduction_rate = Decimal('0.02') * num_children
            reduction = base_tax * min(reduction_rate, Decimal('0.10'))  # Max 10% reduction
            return base_tax - reduction

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
        municipal_multiplier: Decimal = Decimal('1.19')  # City of Zürich
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
            canton_multiplier: Canton multiplier (defaults to 0.98 for 2024)
            municipal_multiplier: Municipal multiplier (defaults to 1.19 for City of Zürich)

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
