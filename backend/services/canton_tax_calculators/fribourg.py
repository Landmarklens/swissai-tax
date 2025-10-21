"""Fribourg Canton Tax Calculator

Source: https://www.estv.admin.ch/dam/estv/de/dokumente/estv/steuersystem/kantonsblaetter/fr-de.pdf
Municipality rates: https://www.fr.ch/de/ilfd/gema/verschiedene-statistiken-ueber-gemeinden/gemeindesteuerfuesse-und-saetze
Tax year: 2024
Municipalities: 70

Bilingual canton (German: Freiburg / French: Fribourg)
Progressive tax system with canton and municipal multipliers
"""
from decimal import Decimal
from typing import Dict
from .base import CantonTaxCalculator

class FribourgTaxCalculator(CantonTaxCalculator):
    CANTON_CODE = "FR"
    CANTON_NAME = "Fribourg"

    def __init__(self, tax_year: int = 2024):
        super().__init__(canton_code="FR", tax_year=tax_year)

    def _load_tax_brackets(self) -> Dict:
        """Fribourg progressive brackets for 2024"""
        return {
            'single': [
                (Decimal('17800'), Decimal('0.000')),   # 0% up to 17,800
                (Decimal('25000'), Decimal('0.020')),   # 2% next 7,200
                (Decimal('33000'), Decimal('0.030')),   # 3% next 8,000
                (Decimal('42000'), Decimal('0.040')),   # 4% next 9,000
                (Decimal('52000'), Decimal('0.050')),   # 5% next 10,000
                (Decimal('72000'), Decimal('0.060')),   # 6% next 20,000
                (Decimal('102000'), Decimal('0.070')),  # 7% next 30,000
                (Decimal('137000'), Decimal('0.080')),  # 8% next 35,000
                (Decimal('177000'), Decimal('0.090')),  # 9% next 40,000
                (Decimal('227000'), Decimal('0.100')),  # 10% next 50,000
                (Decimal('inf'), Decimal('0.110')),     # 11% above 227,000
            ],
            'married': [
                (Decimal('35600'), Decimal('0.000')),   # 0% up to 35,600
                (Decimal('50000'), Decimal('0.020')),   # 2% next 14,400
                (Decimal('66000'), Decimal('0.030')),   # 3% next 16,000
                (Decimal('84000'), Decimal('0.040')),   # 4% next 18,000
                (Decimal('104000'), Decimal('0.050')),  # 5% next 20,000
                (Decimal('144000'), Decimal('0.060')),  # 6% next 40,000
                (Decimal('204000'), Decimal('0.070')),  # 7% next 60,000
                (Decimal('274000'), Decimal('0.080')),  # 8% next 70,000
                (Decimal('354000'), Decimal('0.090')),  # 9% next 80,000
                (Decimal('454000'), Decimal('0.100')),  # 10% next 100,000
                (Decimal('inf'), Decimal('0.110')),     # 11% above 454,000
            ]
        }

    def _apply_progressive_rates(self, taxable_income: Decimal, brackets: list) -> Decimal:
        """Apply FR's progressive marginal rates"""
        if taxable_income <= 0:
            return Decimal('0')

        tax = Decimal('0')
        previous_limit = Decimal('0')

        for upper_limit, rate in brackets:
            if upper_limit == Decimal('inf'):
                # Apply rate to remaining income
                tax += (taxable_income - previous_limit) * rate
                break

            if taxable_income <= previous_limit:
                break

            taxable_in_bracket = min(taxable_income, upper_limit) - previous_limit
            tax += taxable_in_bracket * rate
            previous_limit = upper_limit

            if taxable_income <= upper_limit:
                break

        return tax.quantize(Decimal('0.01'))

    def _apply_family_adjustments(self, tax: Decimal, num_children: int) -> Decimal:
        """FR applies deductions before calculation, no additional adjustments"""
        return tax

    def calculate(self, taxable_income: Decimal, marital_status: str = 'single',
                  num_children: int = 0) -> Dict[str, Decimal]:
        """Calculate FR canton tax using separate brackets for married"""
        brackets = self.tax_brackets.get(marital_status, self.tax_brackets['single'])
        tax = self._apply_progressive_rates(taxable_income, brackets)

        return {
            'base_tax': tax,
            'cantonal_tax': tax,
            'canton_multiplier': Decimal('1.0')  # 100%
        }

    def calculate_with_multiplier(self, taxable_income: Decimal, marital_status: str = 'single',
                                   num_children: int = 0, canton_multiplier: Decimal = Decimal('1.0'),
                                   municipal_multiplier: Decimal = Decimal('1.05')) -> Dict[str, Decimal]:
        """Calculate total tax. Default: Fribourg city 105%"""
        brackets = self.tax_brackets.get(marital_status, self.tax_brackets['single'])
        simple_tax = self._apply_progressive_rates(taxable_income, brackets)

        cantonal_tax = simple_tax * canton_multiplier
        municipal_tax = simple_tax * municipal_multiplier
        total_tax = cantonal_tax + municipal_tax
        effective_rate = (total_tax / taxable_income * 100) if taxable_income > 0 else Decimal('0')

        return {
            'base_tax': simple_tax,
            'cantonal_tax': cantonal_tax,
            'municipal_tax': municipal_tax,
            'total_cantonal_and_municipal': total_tax,
            'effective_rate': effective_rate.quantize(Decimal('0.01')),
            'canton_multiplier': canton_multiplier,
            'municipal_multiplier': municipal_multiplier
        }

    def get_canton_info(self) -> Dict:
        return {
            'canton_code': self.CANTON_CODE,
            'canton_name': self.CANTON_NAME,
            'canton_multiplier': Decimal('1.0'),
            'tax_year': 2024,
            'num_municipalities': 70,
            'special_notes': 'Bilingual canton (DE: Freiburg / FR: Fribourg). Progressive system, separate married brackets. 90%-120% municipal rates.'
        }
