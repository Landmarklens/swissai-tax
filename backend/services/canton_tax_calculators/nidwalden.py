"""Nidwalden Canton Tax Calculator

Source: https://www.estv.admin.ch/dam/estv/de/dokumente/estv/steuersystem/kantonsblaetter/nw-de.pdf
Municipality rates: https://www.steuern-nw.ch/app/uploads/2024/01/Steuerfuesse_2024.pdf
Tax year: 2024
Canton multiplier: 2.66
Municipalities: 11

Tax brackets: 18 progressive brackets (Art. 40 StG)
Special feature: Reduced rate for high incomes (2.75% for income over CHF 160,300)
"""
from decimal import Decimal
from typing import Dict
from .base import CantonTaxCalculator

class NidwaldenTaxCalculator(CantonTaxCalculator):
    CANTON_CODE = "NW"
    CANTON_NAME = "Nidwalden"
    CANTON_MULTIPLIER = Decimal('2.66')  # 2024

    def __init__(self, tax_year: int = 2024):
        super().__init__(canton_code="NW", tax_year=tax_year)

    def _load_tax_brackets(self) -> Dict:
        """
        Progressive tax brackets from Art. 40 StG

        18 brackets with rates from 0% to 3.3%, then reducing to 2.75% for high income
        Special feature: Rate drops to 2.75% for income over CHF 160,300
        """
        return {
            'single': [
                (Decimal('11200'), Decimal('0.0000')),   # 0.00% first 11,200
                (Decimal('13500'), Decimal('0.0050')),   # 0.50% next 2,300
                (Decimal('14600'), Decimal('0.0100')),   # 1.00% next 1,100
                (Decimal('15700'), Decimal('0.0120')),   # 1.20% next 1,100
                (Decimal('16800'), Decimal('0.0140')),   # 1.40% next 1,100
                (Decimal('17900'), Decimal('0.0160')),   # 1.60% next 1,100
                (Decimal('19000'), Decimal('0.0180')),   # 1.80% next 1,100
                (Decimal('20100'), Decimal('0.0200')),   # 2.00% next 1,100
                (Decimal('21200'), Decimal('0.0220')),   # 2.20% next 1,100
                (Decimal('22300'), Decimal('0.0240')),   # 2.40% next 1,100
                (Decimal('23400'), Decimal('0.0260')),   # 2.60% next 1,100
                (Decimal('31200'), Decimal('0.0280')),   # 2.80% next 7,800
                (Decimal('48000'), Decimal('0.0290')),   # 2.90% next 16,800
                (Decimal('78200'), Decimal('0.0300')),   # 3.00% next 30,200
                (Decimal('111800'), Decimal('0.0310')),  # 3.10% next 33,600
                (Decimal('143600'), Decimal('0.0320')),  # 3.20% next 31,800
                (Decimal('160300'), Decimal('0.0330')),  # 3.30% next 16,700 (peak)
                (Decimal('inf'), Decimal('0.0275')),     # 2.75% over 160,300 (reduces!)
            ],
            'married': [
                (Decimal('11200'), Decimal('0.0000')),
                (Decimal('13500'), Decimal('0.0050')),
                (Decimal('14600'), Decimal('0.0100')),
                (Decimal('15700'), Decimal('0.0120')),
                (Decimal('16800'), Decimal('0.0140')),
                (Decimal('17900'), Decimal('0.0160')),
                (Decimal('19000'), Decimal('0.0180')),
                (Decimal('20100'), Decimal('0.0200')),
                (Decimal('21200'), Decimal('0.0220')),
                (Decimal('22300'), Decimal('0.0240')),
                (Decimal('23400'), Decimal('0.0260')),
                (Decimal('31200'), Decimal('0.0280')),
                (Decimal('48000'), Decimal('0.0290')),
                (Decimal('78200'), Decimal('0.0300')),
                (Decimal('111800'), Decimal('0.0310')),
                (Decimal('143600'), Decimal('0.0320')),
                (Decimal('160300'), Decimal('0.0330')),
                (Decimal('inf'), Decimal('0.0275')),
            ]
        }

    def _apply_progressive_rates(self, taxable_income: Decimal, brackets: list) -> Decimal:
        """Apply progressive marginal tax rates."""
        if taxable_income <= 0:
            return Decimal('0')

        tax = Decimal('0')
        previous_limit = Decimal('0')

        for upper_limit, rate in brackets:
            if taxable_income <= previous_limit:
                break

            taxable_in_bracket = min(taxable_income, upper_limit) - previous_limit
            tax += taxable_in_bracket * rate
            previous_limit = upper_limit

            if taxable_income <= upper_limit:
                break

        return tax.quantize(Decimal('0.01'))

    def _apply_family_adjustments(self, tax: Decimal, num_children: int) -> Decimal:
        """No additional tax adjustments - deductions applied at income level."""
        return tax

    def calculate(self, taxable_income: Decimal, marital_status: str = 'single',
                  num_children: int = 0) -> Dict[str, Decimal]:
        """Calculate canton tax only (simple tax × canton multiplier)."""
        brackets = self.tax_brackets.get(marital_status, self.tax_brackets['single'])
        simple_tax = self._apply_progressive_rates(taxable_income, brackets)
        cantonal_tax = simple_tax * self.CANTON_MULTIPLIER

        return {
            'simple_tax': simple_tax,
            'cantonal_tax': cantonal_tax,
            'canton_multiplier': self.CANTON_MULTIPLIER
        }

    def calculate_with_multiplier(self, taxable_income: Decimal, marital_status: str = 'single',
                                   num_children: int = 0, canton_multiplier: Decimal = None,
                                   municipal_multiplier: Decimal = Decimal('2.35')) -> Dict[str, Decimal]:
        """
        Calculate total tax with canton and municipal multipliers.

        Default municipal multiplier is Stans (capital): 2.35
        Rates use tax units where 1.0 = 100%
        """
        if canton_multiplier is None:
            canton_multiplier = self.CANTON_MULTIPLIER

        brackets = self.tax_brackets.get(marital_status, self.tax_brackets['single'])
        simple_tax = self._apply_progressive_rates(taxable_income, brackets)

        cantonal_tax = simple_tax * canton_multiplier
        municipal_tax = simple_tax * municipal_multiplier
        total_tax = cantonal_tax + municipal_tax

        effective_rate = (total_tax / taxable_income * 100) if taxable_income > 0 else Decimal('0')

        return {
            'simple_tax': simple_tax,
            'cantonal_tax': cantonal_tax,
            'municipal_tax': municipal_tax,
            'total_cantonal_and_municipal': total_tax,
            'effective_rate': effective_rate.quantize(Decimal('0.01')),
            'canton_multiplier': canton_multiplier,
            'municipal_multiplier': municipal_multiplier
        }

    def get_canton_info(self) -> Dict:
        """Return canton information."""
        return {
            'canton_code': self.CANTON_CODE,
            'canton_name': self.CANTON_NAME,
            'canton_multiplier': float(self.CANTON_MULTIPLIER),
            'tax_year': 2024,
            'num_municipalities': 11,
            'special_notes': '18 progressive brackets. Rate reduces to 2.75% for income over CHF 160,300.'
        }
