"""
Vaud Canton Tax Calculator

Tax calculation for Canton Vaud (VD).
Based on 2024 tax rates.
"""

from decimal import Decimal
from typing import Dict, List

from .base import CantonTaxCalculator, TaxBracket


class VaudTaxCalculator(CantonTaxCalculator):
    """Tax calculator for Canton Vaud"""

    def _load_tax_brackets(self) -> Dict[str, List[TaxBracket]]:
        """Load Vaud canton tax brackets for 2024"""
        single_brackets = [
            TaxBracket(Decimal('0'), Decimal('8000'), Decimal('0'), Decimal('0')),
            TaxBracket(Decimal('8000'), Decimal('15000'), Decimal('0.025'), Decimal('0')),
            TaxBracket(Decimal('15000'), Decimal('26000'), Decimal('0.04'), Decimal('175')),
            TaxBracket(Decimal('26000'), Decimal('42000'), Decimal('0.06'), Decimal('615')),
            TaxBracket(Decimal('42000'), Decimal('65000'), Decimal('0.08'), Decimal('1575')),
            TaxBracket(Decimal('65000'), Decimal('95000'), Decimal('0.10'), Decimal('3415')),
            TaxBracket(Decimal('95000'), Decimal('140000'), Decimal('0.12'), Decimal('6415')),
            TaxBracket(Decimal('140000'), None, Decimal('0.14'), Decimal('11815'))
        ]

        married_brackets = [
            TaxBracket(Decimal('0'), Decimal('14000'), Decimal('0'), Decimal('0')),
            TaxBracket(Decimal('14000'), Decimal('26000'), Decimal('0.025'), Decimal('0')),
            TaxBracket(Decimal('26000'), Decimal('44000'), Decimal('0.04'), Decimal('300')),
            TaxBracket(Decimal('44000'), Decimal('70000'), Decimal('0.06'), Decimal('1020')),
            TaxBracket(Decimal('70000'), Decimal('105000'), Decimal('0.08'), Decimal('2580')),
            TaxBracket(Decimal('105000'), Decimal('155000'), Decimal('0.10'), Decimal('5380')),
            TaxBracket(Decimal('155000'), None, Decimal('0.12'), Decimal('10380'))
        ]

        return {'single': single_brackets, 'married': married_brackets}
