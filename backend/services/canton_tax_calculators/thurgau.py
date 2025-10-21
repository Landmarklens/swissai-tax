"""Thurgau Canton Tax Calculator

Source: https://www.estv.admin.ch/dam/estv/de/dokumente/estv/steuersystem/kantonsblaetter/tg-de.pdf
Municipality rates: https://data.tg.ch/explore/dataset/sk-stat-70/
Tax year: 2024
Municipalities: 80

UNIQUE: Cumulative progressive tax system (8 brackets)
Married: Income ÷ 2.0 for rate calculation
"""
from decimal import Decimal
from typing import Dict
from .base import CantonTaxCalculator

class ThurgauTaxCalculator(CantonTaxCalculator):
    CANTON_CODE = "TG"
    CANTON_NAME = "Thurgau"

    def __init__(self, tax_year: int = 2024):
        super().__init__(canton_code="TG", tax_year=tax_year)

    def _load_tax_brackets(self) -> Dict:
        """Thurgau cumulative progressive brackets (§ 37 StG) for 2024"""
        return {
            'single': [
                (Decimal('12200'), Decimal('0'), Decimal('0.02')),
                (Decimal('14600'), Decimal('48'), Decimal('0.03')),
                (Decimal('16800'), Decimal('114'), Decimal('0.04')),
                (Decimal('18900'), Decimal('198'), Decimal('0.05')),
                (Decimal('21000'), Decimal('303'), Decimal('0.06')),
                (Decimal('36800'), Decimal('1251'), Decimal('0.07')),
                (Decimal('84400'), Decimal('4583'), Decimal('0.075')),
                (Decimal('inf'), Decimal('10133'), Decimal('0.08')),
            ],
            'married': [
                (Decimal('12200'), Decimal('0'), Decimal('0.02')),
                (Decimal('14600'), Decimal('48'), Decimal('0.03')),
                (Decimal('16800'), Decimal('114'), Decimal('0.04')),
                (Decimal('18900'), Decimal('198'), Decimal('0.05')),
                (Decimal('21000'), Decimal('303'), Decimal('0.06')),
                (Decimal('36800'), Decimal('1251'), Decimal('0.07')),
                (Decimal('84400'), Decimal('4583'), Decimal('0.075')),
                (Decimal('inf'), Decimal('10133'), Decimal('0.08')),
            ]
        }

    def _apply_cumulative_rates(self, taxable_income: Decimal, brackets: list) -> Decimal:
        """Apply Thurgau's CUMULATIVE progressive tax system"""
        if taxable_income <= 0:
            return Decimal('0')

        for upper_limit, base_tax, marginal_rate in brackets:
            if taxable_income <= upper_limit:
                tax = base_tax + ((taxable_income - (upper_limit if upper_limit == Decimal('12200') else brackets[brackets.index((upper_limit, base_tax, marginal_rate))-1][0])) * marginal_rate)
                return tax.quantize(Decimal('0.01'))

        # Last bracket
        last_upper = brackets[-2][0]
        tax = brackets[-1][1] + ((taxable_income - last_upper) * brackets[-1][2])
        return tax.quantize(Decimal('0.01'))

    def _apply_family_adjustments(self, tax: Decimal, num_children: int) -> Decimal:
        return tax

    def calculate(self, taxable_income: Decimal, marital_status: str = 'single',
                  num_children: int = 0) -> Dict[str, Decimal]:
        """Calculate using Thurgau's divisor 2.0 for married (§ 37 Abs. 2)"""
        income_for_rate = taxable_income / 2 if marital_status == 'married' else taxable_income
        brackets = self.tax_brackets['single']
        tax = self._apply_cumulative_rates(income_for_rate, brackets)
        if marital_status == 'married':
            tax = tax * 2

        return {
            'base_tax': tax,
            'cantonal_tax': tax,
            'canton_multiplier': None
        }

    def calculate_with_multiplier(self, taxable_income: Decimal, marital_status: str = 'single',
                                   num_children: int = 0, canton_multiplier: Decimal = None,
                                   municipal_multiplier: Decimal = Decimal('2.53')) -> Dict[str, Decimal]:
        """Calculate total tax. Default: Frauenfeld 2.53 (253%)"""
        income_for_rate = taxable_income / 2 if marital_status == 'married' else taxable_income
        brackets = self.tax_brackets['single']
        simple_tax = self._apply_cumulative_rates(income_for_rate, brackets)
        if marital_status == 'married':
            simple_tax = simple_tax * 2

        cantonal_tax = simple_tax
        municipal_tax = simple_tax * municipal_multiplier
        total_tax = cantonal_tax + municipal_tax
        effective_rate = (total_tax / taxable_income * 100) if taxable_income > 0 else Decimal('0')

        return {
            'base_tax': simple_tax,
            'cantonal_tax': cantonal_tax,
            'municipal_tax': municipal_tax,
            'total_cantonal_and_municipal': total_tax,
            'effective_rate': effective_rate.quantize(Decimal('0.01')),
            'canton_multiplier': None,
            'municipal_multiplier': municipal_multiplier
        }

    def get_canton_info(self) -> Dict:
        return {
            'canton_code': self.CANTON_CODE,
            'canton_name': self.CANTON_NAME,
            'canton_multiplier': None,
            'tax_year': 2024,
            'num_municipalities': 80,
            'special_notes': 'UNIQUE cumulative progressive system (8 brackets). Married: income ÷ 2.0.'
        }
