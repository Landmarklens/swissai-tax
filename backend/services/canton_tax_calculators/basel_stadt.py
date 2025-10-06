"""
Basel-Stadt Canton Tax Calculator

Tax calculation for Canton Basel-Stadt (BS).
Based on 2024 tax rates.
"""

from decimal import Decimal
from typing import Dict, List

from .base import CantonTaxCalculator, TaxBracket


class BaselStadtTaxCalculator(CantonTaxCalculator):
    """Tax calculator for Canton Basel-Stadt"""

    def _load_tax_brackets(self) -> Dict[str, List[TaxBracket]]:
        """Load Basel-Stadt tax brackets for 2024"""
        single_brackets = [
            TaxBracket(Decimal('0'), Decimal('8000'), Decimal('0'), Decimal('0')),
            TaxBracket(Decimal('8000'), Decimal('16000'), Decimal('0.03'), Decimal('0')),
            TaxBracket(Decimal('16000'), Decimal('28000'), Decimal('0.05'), Decimal('240')),
            TaxBracket(Decimal('28000'), Decimal('45000'), Decimal('0.07'), Decimal('840')),
            TaxBracket(Decimal('45000'), Decimal('70000'), Decimal('0.09'), Decimal('2030')),
            TaxBracket(Decimal('70000'), Decimal('110000'), Decimal('0.11'), Decimal('4280')),
            TaxBracket(Decimal('110000'), None, Decimal('0.13'), Decimal('8680'))
        ]

        married_brackets = [
            TaxBracket(Decimal('0'), Decimal('14000'), Decimal('0'), Decimal('0')),
            TaxBracket(Decimal('14000'), Decimal('28000'), Decimal('0.03'), Decimal('0')),
            TaxBracket(Decimal('28000'), Decimal('48000'), Decimal('0.05'), Decimal('420')),
            TaxBracket(Decimal('48000'), Decimal('75000'), Decimal('0.07'), Decimal('1420')),
            TaxBracket(Decimal('75000'), Decimal('120000'), Decimal('0.09'), Decimal('3310')),
            TaxBracket(Decimal('120000'), None, Decimal('0.11'), Decimal('7360'))
        ]

        return {'single': single_brackets, 'married': married_brackets}
