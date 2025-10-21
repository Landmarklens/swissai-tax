"""St. Gallen Canton Tax Calculator

Source: https://www.estv.admin.ch/dam/estv/de/dokumente/estv/steuersystem/kantonsblaetter/sg-de.pdf
Municipality rates: https://www.sg.ch/content/dam/sgch/steuern-finanzen/steuern/formulare-und-wegleitungen/einkommens-und-vermoegenssteuer/tarife-und-steuerfuesse/steuerfuesse-st-gallische-gemeinden/Steuerfuss%202024.pdf
Tax year: 2024
Canton rate: 105% (1.05 multiplier)
Municipalities: 77

6 progressive brackets (0% to 9.4%)
Special: Over CHF 264,200 = flat 8.5% on entire income
Married: Use half income for rate calculation (splitting)
"""
from decimal import Decimal
from typing import Dict
from .base import CantonTaxCalculator

class StGallenTaxCalculator(CantonTaxCalculator):
    CANTON_CODE = "SG"
    CANTON_NAME = "St. Gallen"
    CANTON_MULTIPLIER = Decimal('1.05')

    def __init__(self, tax_year: int = 2024):
        super().__init__(canton_code="SG", tax_year=tax_year)

    def _load_tax_brackets(self) -> Dict:
        return {
            'single': [
                (Decimal('11600'), Decimal('0.0000')),
                (Decimal('15800'), Decimal('0.0400')),
                (Decimal('33800'), Decimal('0.0600')),
                (Decimal('60200'), Decimal('0.0800')),
                (Decimal('98300'), Decimal('0.0920')),
                (Decimal('264200'), Decimal('0.0940')),
                (Decimal('inf'), Decimal('0.0850')),
            ],
            'married': [
                (Decimal('11600'), Decimal('0.0000')),
                (Decimal('15800'), Decimal('0.0400')),
                (Decimal('33800'), Decimal('0.0600')),
                (Decimal('60200'), Decimal('0.0800')),
                (Decimal('98300'), Decimal('0.0920')),
                (Decimal('264200'), Decimal('0.0940')),
                (Decimal('inf'), Decimal('0.0850')),
            ]
        }

    def _apply_progressive_rates(self, taxable_income: Decimal, brackets: list) -> Decimal:
        if taxable_income <= 0:
            return Decimal('0')
        if taxable_income > Decimal('264200'):
            return (taxable_income * Decimal('0.085')).quantize(Decimal('0.01'))

        tax = Decimal('0')
        prev = Decimal('0')
        for upper, rate in brackets:
            if taxable_income <= prev:
                break
            taxable_in_bracket = min(taxable_income, upper) - prev
            tax += taxable_in_bracket * rate
            prev = upper
            if taxable_income <= upper:
                break
        return tax.quantize(Decimal('0.01'))

    def _apply_family_adjustments(self, tax: Decimal, num_children: int) -> Decimal:
        return tax

    def calculate(self, taxable_income: Decimal, marital_status: str = 'single',
                  num_children: int = 0) -> Dict[str, Decimal]:
        income_for_rate = taxable_income / 2 if marital_status == 'married' else taxable_income
        brackets = self.tax_brackets['single']
        tax = self._apply_progressive_rates(income_for_rate, brackets)
        if marital_status == 'married':
            tax = tax * 2

        return {
            'base_tax': tax,
            'cantonal_tax': tax * self.CANTON_MULTIPLIER,
            'canton_multiplier': self.CANTON_MULTIPLIER
        }

    def calculate_with_multiplier(self, taxable_income: Decimal, marital_status: str = 'single',
                                   num_children: int = 0, canton_multiplier: Decimal = None,
                                   municipal_multiplier: Decimal = Decimal('1.16')) -> Dict[str, Decimal]:
        income_for_rate = taxable_income / 2 if marital_status == 'married' else taxable_income
        brackets = self.tax_brackets['single']
        simple_tax = self._apply_progressive_rates(income_for_rate, brackets)
        if marital_status == 'married':
            simple_tax = simple_tax * 2

        canton_mult = canton_multiplier if canton_multiplier else self.CANTON_MULTIPLIER
        cantonal_tax = simple_tax * canton_mult
        municipal_tax = simple_tax * municipal_multiplier
        total_tax = cantonal_tax + municipal_tax
        effective_rate = (total_tax / taxable_income * 100) if taxable_income > 0 else Decimal('0')

        return {
            'base_tax': simple_tax,
            'cantonal_tax': cantonal_tax,
            'municipal_tax': municipal_tax,
            'total_cantonal_and_municipal': total_tax,
            'effective_rate': effective_rate.quantize(Decimal('0.01')),
            'canton_multiplier': canton_mult,
            'municipal_multiplier': municipal_multiplier
        }

    def get_canton_info(self) -> Dict:
        return {
            'canton_code': self.CANTON_CODE,
            'canton_name': self.CANTON_NAME,
            'canton_multiplier': float(self.CANTON_MULTIPLIER),
            'tax_year': 2024,
            'num_municipalities': 77,
            'special_notes': 'Uses percentage multiplier (105%). 6 brackets, flat 8.5% over CHF 264,200. Married: income ÷ 2.'
        }
