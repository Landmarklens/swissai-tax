"""
Zurich Canton Tax Calculator

Tax calculation for Canton Zurich (ZH).
Based on 2024 tax rates.

Reference: https://www.zh.ch/de/steuern-finanzen/steuern/steuerrechner.html
"""

from decimal import Decimal
from typing import Dict, List

from .base import CantonTaxCalculator, TaxBracket


class ZurichTaxCalculator(CantonTaxCalculator):
    """Tax calculator for Canton Zurich"""

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
