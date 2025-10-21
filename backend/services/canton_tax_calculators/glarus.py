"""Glarus Canton Tax Calculator"""
from decimal import Decimal
from typing import Dict
from .base import CantonTaxCalculator

class GlarusTaxCalculator(CantonTaxCalculator):
    CANTON_CODE = "GL"
    CANTON_NAME = "Glarus"
    CANTON_MULTIPLIER = Decimal('0.58')

    def __init__(self, tax_year: int = 2024):
        super().__init__(canton_code="GL", tax_year=tax_year)

    def _load_tax_brackets(self) -> Dict:
        return {
            'single': [(Decimal('10000'), Decimal('0.02')), (Decimal('20000'), Decimal('0.03')),
                       (Decimal('30000'), Decimal('0.04')), (Decimal('40000'), Decimal('0.05')),
                       (Decimal('50000'), Decimal('0.06')), (Decimal('60000'), Decimal('0.07')),
                       (Decimal('80000'), Decimal('0.08')), (Decimal('100000'), Decimal('0.09')),
                       (Decimal('inf'), Decimal('0.10'))],
            'married': [(Decimal('10000'), Decimal('0.02')), (Decimal('20000'), Decimal('0.03')),
                        (Decimal('30000'), Decimal('0.04')), (Decimal('40000'), Decimal('0.05')),
                        (Decimal('50000'), Decimal('0.06')), (Decimal('60000'), Decimal('0.07')),
                        (Decimal('80000'), Decimal('0.08')), (Decimal('100000'), Decimal('0.09')),
                        (Decimal('inf'), Decimal('0.10'))]
        }

    def _apply_progressive_rates(self, taxable_income: Decimal, brackets: list) -> Decimal:
        if taxable_income <= 0: return Decimal('0')
        tax, prev = Decimal('0'), Decimal('0')
        for limit, rate in brackets:
            if taxable_income <= prev: break
            amt = min(taxable_income, limit) - prev
            tax += amt * rate
            prev = limit
        return tax.quantize(Decimal('0.01'))

    def _apply_family_adjustments(self, tax: Decimal, num_children: int) -> Decimal:
        return tax

    def calculate(self, taxable_income: Decimal, marital_status: str = 'single', num_children: int = 0) -> Dict[str, Decimal]:
        brackets = self.tax_brackets.get(marital_status, self.tax_brackets['single'])
        simple_tax = self._apply_progressive_rates(taxable_income, brackets)
        cantonal_tax = simple_tax * self.CANTON_MULTIPLIER
        return {'simple_tax': simple_tax, 'cantonal_tax': cantonal_tax, 'canton_multiplier': self.CANTON_MULTIPLIER}

    def calculate_with_multiplier(self, taxable_income: Decimal, marital_status: str = 'single', num_children: int = 0,
                                   canton_multiplier: Decimal = None, municipal_multiplier: Decimal = Decimal('0.60')) -> Dict[str, Decimal]:
        if canton_multiplier is None: canton_multiplier = self.CANTON_MULTIPLIER
        brackets = self.tax_brackets.get(marital_status, self.tax_brackets['single'])
        simple_tax = self._apply_progressive_rates(taxable_income, brackets)
        cantonal_tax = simple_tax * canton_multiplier
        municipal_tax = simple_tax * municipal_multiplier
        return {'simple_tax': simple_tax, 'cantonal_tax': cantonal_tax, 'municipal_tax': municipal_tax,
                'total_cantonal_and_municipal': cantonal_tax + municipal_tax, 'canton_multiplier': canton_multiplier,
                'municipal_multiplier': municipal_multiplier}

    def get_canton_info(self) -> Dict:
        return {'canton_code': self.CANTON_CODE, 'canton_name': self.CANTON_NAME, 'canton_multiplier': float(self.CANTON_MULTIPLIER),
                'tax_year': 2024, 'num_municipalities': 3}
