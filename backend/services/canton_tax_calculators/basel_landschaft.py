"""Basel-Landschaft Canton Tax Calculator

Source: https://www.estv.admin.ch/dam/estv/de/dokumente/estv/steuersystem/kantonsblaetter/bl-de.pdf
Municipality rates: https://statistik.bl.ch/web_portal/18_4_5
Tax year: 2024
Municipalities: 86

UNIQUE: Logarithmic formula system (§ 34 StG)
- Tax-free up to CHF 15,000
- Formula: b * x + c * x * (ln(x)-1) + d (4 brackets)
- Flat 18.62% above CHF 1,150,000
- Married: Income ÷ 2 for rate calculation
- Canton rate: 100% (can be 95-105%)
"""
from decimal import Decimal
from typing import Dict
import math
from .base import CantonTaxCalculator

class BaselLandschaftTaxCalculator(CantonTaxCalculator):
    CANTON_CODE = "BL"
    CANTON_NAME = "Basel-Landschaft"

    def __init__(self, tax_year: int = 2024):
        super().__init__(canton_code="BL", tax_year=tax_year)

    def _load_tax_brackets(self) -> Dict:
        """BL uses logarithmic formula, not brackets. Store formula parameters."""
        return {
            'formula_params': [
                # (upper_limit, b, c, d)
                (Decimal('15000'), None, None, None),  # Tax-free
                (Decimal('40000'), Decimal('-0.81773'), Decimal('0.08972'), Decimal('744.3')),
                (Decimal('100000'), Decimal('-0.323806'), Decimal('0.043109'), Decimal('1120.1564')),
                (Decimal('1150000'), Decimal('0.052296'), Decimal('0.010441'), Decimal('4386.9376')),
                (Decimal('inf'), Decimal('211306.15'), Decimal('0.1862'), None),  # Flat rate
            ]
        }

    def _apply_logarithmic_formula(self, taxable_income: Decimal) -> Decimal:
        """
        Apply Basel-Landschaft's logarithmic formula (§ 34 StG)

        Formula: b * x + c * x * (ln(x)-1) + d

        Brackets:
        - Under CHF 15,000: Tax-free
        - CHF 15,000-40,000: b1=-0.81773, c1=0.08972, d1=744.3
        - CHF 40,001-100,000: b2=-0.323806, c2=0.043109, d2=1120.1564
        - CHF 100,001-1,150,000: b3=0.052296, c3=0.010441, d3=4386.9376
        - Above CHF 1,150,000: CHF 211,306.15 + 18.62% * (x - 1,150,000)
        """
        if taxable_income < 15000:
            return Decimal('0')

        x = float(taxable_income)

        if taxable_income <= 40000:
            b = -0.81773
            c = 0.08972
            d = 744.3
            tax = b * x + c * x * (math.log(x) - 1) + d
        elif taxable_income <= 100000:
            b = -0.323806
            c = 0.043109
            d = 1120.1564
            tax = b * x + c * x * (math.log(x) - 1) + d
        elif taxable_income <= 1150000:
            b = 0.052296
            c = 0.010441
            d = 4386.9376
            tax = b * x + c * x * (math.log(x) - 1) + d
        else:
            # Flat rate above CHF 1,150,000
            tax = 211306.15 + 0.1862 * (x - 1150000)

        return Decimal(str(tax)).quantize(Decimal('0.01'))

    def _apply_family_adjustments(self, tax: Decimal, num_children: int) -> Decimal:
        """BL applies splitting at rate calculation level, not adjustments"""
        return tax

    def calculate(self, taxable_income: Decimal, marital_status: str = 'single',
                  num_children: int = 0) -> Dict[str, Decimal]:
        """Calculate using BL's logarithmic formula with income ÷ 2 for married (§ 34 Abs. 2)"""
        income_for_rate = taxable_income / 2 if marital_status == 'married' else taxable_income
        tax = self._apply_logarithmic_formula(income_for_rate)

        if marital_status == 'married':
            tax = tax * 2

        return {
            'base_tax': tax,
            'cantonal_tax': tax,
            'canton_multiplier': Decimal('1.0')  # 100%
        }

    def calculate_with_multiplier(self, taxable_income: Decimal, marital_status: str = 'single',
                                   num_children: int = 0, canton_multiplier: Decimal = Decimal('1.0'),
                                   municipal_multiplier: Decimal = Decimal('0.65')) -> Dict[str, Decimal]:
        """Calculate total tax. Default: Liestal 65% (0.65)"""
        income_for_rate = taxable_income / 2 if marital_status == 'married' else taxable_income
        simple_tax = self._apply_logarithmic_formula(income_for_rate)

        if marital_status == 'married':
            simple_tax = simple_tax * 2

        # BL system: Canton 100%, Municipality is percentage
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
            'canton_multiplier': Decimal('1.0'),  # 100%
            'tax_year': 2024,
            'num_municipalities': 86,
            'special_notes': 'UNIQUE logarithmic formula (§ 34): b*x + c*x*(ln(x)-1) + d. Flat 18.62% above CHF 1.15M. Married: income ÷ 2.'
        }
