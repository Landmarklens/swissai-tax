"""
Bern Canton Tax Calculator

Tax calculation for Canton Bern (BE).
Based on 2024 tax rates.
"""

from decimal import Decimal
from typing import Dict, List

from .base import CantonTaxCalculator, TaxBracket


class BernTaxCalculator(CantonTaxCalculator):
    """Tax calculator for Canton Bern"""

    def _load_tax_brackets(self) -> Dict[str, List[TaxBracket]]:
        """Load Bern canton tax brackets for 2024"""
        single_brackets = [
            TaxBracket(Decimal('0'), Decimal('9000'), Decimal('0'), Decimal('0')),
            TaxBracket(Decimal('9000'), Decimal('18000'), Decimal('0.025'), Decimal('0')),
            TaxBracket(Decimal('18000'), Decimal('30000'), Decimal('0.04'), Decimal('225')),
            TaxBracket(Decimal('30000'), Decimal('50000'), Decimal('0.06'), Decimal('705')),
            TaxBracket(Decimal('50000'), Decimal('80000'), Decimal('0.08'), Decimal('1905')),
            TaxBracket(Decimal('80000'), Decimal('120000'), Decimal('0.10'), Decimal('4305')),
            TaxBracket(Decimal('120000'), None, Decimal('0.12'), Decimal('8305'))
        ]

        married_brackets = [
            TaxBracket(Decimal('0'), Decimal('16000'), Decimal('0'), Decimal('0')),
            TaxBracket(Decimal('16000'), Decimal('30000'), Decimal('0.025'), Decimal('0')),
            TaxBracket(Decimal('30000'), Decimal('50000'), Decimal('0.04'), Decimal('350')),
            TaxBracket(Decimal('50000'), Decimal('80000'), Decimal('0.06'), Decimal('1150')),
            TaxBracket(Decimal('80000'), Decimal('120000'), Decimal('0.08'), Decimal('2950')),
            TaxBracket(Decimal('120000'), None, Decimal('0.10'), Decimal('6150'))
        ]

        return {'single': single_brackets, 'married': married_brackets}
