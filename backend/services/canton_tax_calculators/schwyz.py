"""Schwyz Canton Tax Calculator

Source: https://www.estv.admin.ch/dam/estv/de/dokumente/estv/steuersystem/kantonsblaetter/sz-de.pdf
Municipality rates: https://data.sz.ch/explore/dataset/gesamtsteuerfuesse-der-schwyzer-gemeinden/
Tax year: 2024
Municipalities: 30

UNIQUE DUAL-TARIFF SYSTEM:
- Canton tax: § 36a (17 brackets + additional tier, max 5% flat rate above CHF 385,900)
- Municipal tax: § 36 (17 brackets, max 3.65% flat rate above CHF 230,400)
- Married couples: Income divided by 1.9 for rate calculation (splitting)
"""
from decimal import Decimal
from typing import Dict
from .base import CantonTaxCalculator

class SchwyzTaxCalculator(CantonTaxCalculator):
    CANTON_CODE = "SZ"
    CANTON_NAME = "Schwyz"
    # Canton rates are calculated separately (no simple multiplier)

    def __init__(self, tax_year: int = 2024):
        super().__init__(canton_code="SZ", tax_year=tax_year)

    def _load_tax_brackets(self) -> Dict:
        """
        Schwyz MUNICIPAL tax brackets (§ 36) for 2024

        17 progressive marginal brackets from 0.25% to 3.9%
        Special rule: Over CHF 230,400, flat 3.65% on entire income
        """
        municipal_brackets = [
            (Decimal('1300'), Decimal('0.0025')),     # 0.25% first 1,300
            (Decimal('2400'), Decimal('0.0050')),     # 0.5% next 1,100
            (Decimal('3400'), Decimal('0.0075')),     # 0.75% next 1,000
            (Decimal('4300'), Decimal('0.0100')),     # 1.0% next 900
            (Decimal('5200'), Decimal('0.0125')),     # 1.25% next 900
            (Decimal('6200'), Decimal('0.0150')),     # 1.5% next 1,000
            (Decimal('7300'), Decimal('0.0175')),     # 1.75% next 1,100
            (Decimal('8900'), Decimal('0.0200')),     # 2.0% next 1,600
            (Decimal('11000'), Decimal('0.0225')),    # 2.25% next 2,100
            (Decimal('14200'), Decimal('0.0250')),    # 2.5% next 3,200
            (Decimal('19500'), Decimal('0.0275')),    # 2.75% next 5,300
            (Decimal('26900'), Decimal('0.0300')),    # 3.0% next 7,400
            (Decimal('36400'), Decimal('0.0325')),    # 3.25% next 9,500
            (Decimal('46900'), Decimal('0.0350')),    # 3.5% next 10,500
            (Decimal('55300'), Decimal('0.0365')),    # 3.65% next 8,400
            (Decimal('230400'), Decimal('0.0390')),   # 3.9% next 175,100
            (Decimal('inf'), Decimal('0.0365')),      # 3.65% flat above 230,400
        ]

        return {
            'single': municipal_brackets,
            'married': municipal_brackets  # Same brackets, but use 1.9 divisor
        }

    def _load_canton_brackets(self) -> list:
        """
        Schwyz CANTON tax brackets (§ 36a) for 2024

        Same 17 brackets as municipal + additional tier
        Special rule: Over CHF 385,900, flat 5% on entire income
        """
        return [
            (Decimal('1300'), Decimal('0.0025')),
            (Decimal('2400'), Decimal('0.0050')),
            (Decimal('3400'), Decimal('0.0075')),
            (Decimal('4300'), Decimal('0.0100')),
            (Decimal('5200'), Decimal('0.0125')),
            (Decimal('6200'), Decimal('0.0150')),
            (Decimal('7300'), Decimal('0.0175')),
            (Decimal('8900'), Decimal('0.0200')),
            (Decimal('11000'), Decimal('0.0225')),
            (Decimal('14200'), Decimal('0.0250')),
            (Decimal('19500'), Decimal('0.0275')),
            (Decimal('26900'), Decimal('0.0300')),
            (Decimal('36400'), Decimal('0.0325')),
            (Decimal('46900'), Decimal('0.0350')),
            (Decimal('55300'), Decimal('0.0365')),
            (Decimal('230400'), Decimal('0.0390')),   # 3.9% next 175,100
            (Decimal('385900'), Decimal('0.0700')),   # 7% additional tier for next 155,500
            (Decimal('inf'), Decimal('0.0500')),      # 5% flat above 385,900
        ]

    def _apply_progressive_rates(self, taxable_income: Decimal, brackets: list,
                                   threshold_for_flat: Decimal, flat_rate: Decimal) -> Decimal:
        """
        Apply progressive marginal rates with special flat-rate rule.

        Args:
            taxable_income: Income to tax
            brackets: Progressive bracket structure
            threshold_for_flat: Income level where flat rate kicks in
            flat_rate: Flat rate to apply on entire income above threshold
        """
        if taxable_income <= 0:
            return Decimal('0')

        # Special rule: Above threshold = flat rate on entire income
        if taxable_income > threshold_for_flat:
            return (taxable_income * flat_rate).quantize(Decimal('0.01'))

        # Otherwise, progressive marginal rates
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
        """
        Calculate canton tax using Schwyz's dual-tariff system.

        Married couples: Income divided by 1.9 for rate calculation (§ 36 Abs. 2)
        """
        # For married couples, divide by 1.9 for rate calculation
        income_for_rate = taxable_income / Decimal('1.9') if marital_status == 'married' else taxable_income

        # Canton tax: § 36a (flat 5% above CHF 385,900)
        canton_brackets = self._load_canton_brackets()
        canton_tax = self._apply_progressive_rates(
            income_for_rate,
            canton_brackets,
            Decimal('385900'),
            Decimal('0.05')
        )

        # For married, multiply back by 1.9
        if marital_status == 'married':
            canton_tax = canton_tax * Decimal('1.9')

        return {
            'base_tax': canton_tax,  # Canton tax is the "base" for this system
            'cantonal_tax': canton_tax,
            'canton_multiplier': None  # No simple multiplier in Schwyz
        }

    def calculate_with_multiplier(self, taxable_income: Decimal, marital_status: str = 'single',
                                   num_children: int = 0, canton_multiplier: Decimal = None,
                                   municipal_multiplier: Decimal = Decimal('3.25')) -> Dict[str, Decimal]:
        """
        Calculate total tax with Schwyz's dual-tariff system.

        Default municipal multiplier is Schwyz town: 3.25 (325%)

        UNIQUE SYSTEM:
        - Canton tax: Calculated directly from § 36a brackets
        - Municipal tax: § 36 brackets × municipal multiplier
        """
        # For married couples, divide by 1.9 for rate calculation
        income_for_rate = taxable_income / Decimal('1.9') if marital_status == 'married' else taxable_income

        # 1. Canton tax (§ 36a - with 7% additional tier and 5% max)
        canton_brackets = self._load_canton_brackets()
        canton_base = self._apply_progressive_rates(
            income_for_rate,
            canton_brackets,
            Decimal('385900'),
            Decimal('0.05')
        )
        cantonal_tax = canton_base * Decimal('1.9') if marital_status == 'married' else canton_base

        # 2. Municipal tax (§ 36 - with 3.65% max)
        municipal_brackets = self.tax_brackets['single']  # Same for all
        municipal_base = self._apply_progressive_rates(
            income_for_rate,
            municipal_brackets,
            Decimal('230400'),
            Decimal('0.0365')
        )
        if marital_status == 'married':
            municipal_base = municipal_base * Decimal('1.9')

        municipal_tax = municipal_base * municipal_multiplier

        total_tax = cantonal_tax + municipal_tax
        effective_rate = (total_tax / taxable_income * 100) if taxable_income > 0 else Decimal('0')

        return {
            'base_tax': municipal_base,  # Municipal simple tax (before multiplier)
            'cantonal_tax': cantonal_tax,
            'municipal_tax': municipal_tax,
            'total_cantonal_and_municipal': total_tax,
            'effective_rate': effective_rate.quantize(Decimal('0.01')),
            'canton_multiplier': None,  # Canton has its own bracket system
            'municipal_multiplier': municipal_multiplier
        }

    def get_canton_info(self) -> Dict:
        """Return canton information."""
        return {
            'canton_code': self.CANTON_CODE,
            'canton_name': self.CANTON_NAME,
            'canton_multiplier': None,
            'tax_year': 2024,
            'num_municipalities': 30,
            'special_notes': 'UNIQUE dual-tariff system. '
                           'Canton tax: § 36a (18 brackets, flat 5% above CHF 385,900). '
                           'Municipal tax: § 36 (17 brackets, flat 3.65% above CHF 230,400) × multiplier. '
                           'Married couples: Income ÷ 1.9 for rate calculation (splitting).'
        }
