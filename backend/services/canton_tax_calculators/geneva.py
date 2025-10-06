"""
Geneva Canton Tax Calculator

Tax calculation for Canton Geneva (GE).
Based on 2024 tax rates.

Reference: https://www.ge.ch/calculer-son-impot
"""

from decimal import Decimal
from typing import Dict, List

from .base import CantonTaxCalculator, TaxBracket


class GenevaTaxCalculator(CantonTaxCalculator):
    """Tax calculator for Canton Geneva"""

    def _load_tax_brackets(self) -> Dict[str, List[TaxBracket]]:
        """
        Load Geneva canton tax brackets for 2024.

        Geneva has higher rates than most cantons but no church tax.
        """
        # Simplified Geneva brackets (actual system is more complex)
        single_brackets = [
            TaxBracket(Decimal('0'), Decimal('10000'), Decimal('0'), Decimal('0')),
            TaxBracket(Decimal('10000'), Decimal('20000'), Decimal('0.03'), Decimal('0')),
            TaxBracket(Decimal('20000'), Decimal('40000'), Decimal('0.05'), Decimal('300')),
            TaxBracket(Decimal('40000'), Decimal('70000'), Decimal('0.08'), Decimal('1300')),
            TaxBracket(Decimal('70000'), Decimal('100000'), Decimal('0.12'), Decimal('3700')),
            TaxBracket(Decimal('100000'), Decimal('150000'), Decimal('0.15'), Decimal('7300')),
            TaxBracket(Decimal('150000'), None, Decimal('0.175'), Decimal('14800'))
        ]

        married_brackets = [
            TaxBracket(Decimal('0'), Decimal('17000'), Decimal('0'), Decimal('0')),
            TaxBracket(Decimal('17000'), Decimal('35000'), Decimal('0.03'), Decimal('0')),
            TaxBracket(Decimal('35000'), Decimal('60000'), Decimal('0.05'), Decimal('540')),
            TaxBracket(Decimal('60000'), Decimal('100000'), Decimal('0.08'), Decimal('1790')),
            TaxBracket(Decimal('100000'), Decimal('150000'), Decimal('0.12'), Decimal('4990')),
            TaxBracket(Decimal('150000'), None, Decimal('0.15'), Decimal('10990'))
        ]

        return {'single': single_brackets, 'married': married_brackets}
