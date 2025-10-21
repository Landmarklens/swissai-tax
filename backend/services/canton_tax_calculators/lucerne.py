"""Lucerne Canton Tax Calculator

Source: https://www.estv.admin.ch/dam/estv/de/dokumente/estv/steuersystem/kantonsblaetter/lu-de.pdf
Municipality rates: https://steuern.lu.ch/-/media/Steuern/Dokumente/Publikationen/2024/Steuereinheiten_2024_NP.pdf
Tax year: 2024
Canton rate: 1.60 Einheiten (units)
Municipalities: 80

Progressive marginal tax system with 11 brackets (0% to 5.7%)
Special high-income rule: Over CHF 2,067,800 = flat 5.7% on entire income
"""
from decimal import Decimal
from typing import Dict
from .base import CantonTaxCalculator

class LucerneTaxCalculator(CantonTaxCalculator):
    CANTON_CODE = "LU"
    CANTON_NAME = "Lucerne"
    CANTON_MULTIPLIER = Decimal('1.60')  # 1.60 Einheiten for 2024

    def __init__(self, tax_year: int = 2024):
        super().__init__(canton_code="LU", tax_year=tax_year)

    def _load_tax_brackets(self) -> Dict:
        """
        Lucerne progressive tax brackets (§ 57 Abs. 1 StG) for 2024

        Source: Official Lucerne Kantonsblatt 2024
        11 progressive marginal brackets from 0% to 5.8%
        Special rule: Over CHF 2,067,800, flat 5.7% on entire income
        """
        return {
            'single': [
                (Decimal('9800'), Decimal('0.0000')),     # 0% up to 9,800
                (Decimal('12200'), Decimal('0.0050')),    # 0.5% next 2,400
                (Decimal('15300'), Decimal('0.0100')),    # 1.0% next 3,100
                (Decimal('16400'), Decimal('0.0200')),    # 2.0% next 1,100
                (Decimal('17600'), Decimal('0.0300')),    # 3.0% next 1,200
                (Decimal('20500'), Decimal('0.0400')),    # 4.0% next 2,900
                (Decimal('24800'), Decimal('0.0450')),    # 4.5% next 4,300
                (Decimal('108500'), Decimal('0.0500')),   # 5.0% next 83,700
                (Decimal('161600'), Decimal('0.0525')),   # 5.25% next 53,100
                (Decimal('187700'), Decimal('0.0550')),   # 5.5% next 26,100
                (Decimal('2067800'), Decimal('0.0580')),  # 5.8% next 1,880,100
                (Decimal('inf'), Decimal('0.0570')),      # 5.7% above (special flat rate)
            ],
            'married': [
                # Same brackets for married couples
                # Note: Lucerne does NOT use income splitting
                (Decimal('9800'), Decimal('0.0000')),
                (Decimal('12200'), Decimal('0.0050')),
                (Decimal('15300'), Decimal('0.0100')),
                (Decimal('16400'), Decimal('0.0200')),
                (Decimal('17600'), Decimal('0.0300')),
                (Decimal('20500'), Decimal('0.0400')),
                (Decimal('24800'), Decimal('0.0450')),
                (Decimal('108500'), Decimal('0.0500')),
                (Decimal('161600'), Decimal('0.0525')),
                (Decimal('187700'), Decimal('0.0550')),
                (Decimal('2067800'), Decimal('0.0580')),
                (Decimal('inf'), Decimal('0.0570')),
            ]
        }

    def _apply_progressive_rates(self, taxable_income: Decimal, brackets: list) -> Decimal:
        """
        Apply Lucerne's progressive marginal tax rates.

        SPECIAL RULE (§ 57 Abs. 1): Income over CHF 2,067,800
        "Bei Einkommen über 2 067 800 Franken beträgt die Steuer je Einheit 5,7 Prozent des Einkommens"
        = At income over CHF 2,067,800, tax per unit is 5.7% of the (entire) income
        """
        if taxable_income <= 0:
            return Decimal('0')

        # Special rule: Over CHF 2,067,800 = 5.7% flat on entire income
        if taxable_income > Decimal('2067800'):
            return (taxable_income * Decimal('0.057')).quantize(Decimal('0.01'))

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
        """Calculate canton tax using Lucerne's progressive system."""
        brackets = self.tax_brackets.get(marital_status, self.tax_brackets['single'])
        tax = self._apply_progressive_rates(taxable_income, brackets)

        return {
            'base_tax': tax,
            'cantonal_tax': tax * self.CANTON_MULTIPLIER,
            'canton_multiplier': self.CANTON_MULTIPLIER
        }

    def calculate_with_multiplier(self, taxable_income: Decimal, marital_status: str = 'single',
                                   num_children: int = 0, canton_multiplier: Decimal = None,
                                   municipal_multiplier: Decimal = Decimal('1.65')) -> Dict[str, Decimal]:
        """
        Calculate total tax with Lucerne's Einheiten (units) system.

        Default municipal multiplier is Luzern city: 1.65 Einheiten
        Canton multiplier: 1.60 Einheiten

        Formula: Total = Simple Tax × (Canton Units + Municipal Units)
        """
        brackets = self.tax_brackets.get(marital_status, self.tax_brackets['single'])
        simple_tax = self._apply_progressive_rates(taxable_income, brackets)

        canton_mult = canton_multiplier if canton_multiplier is not None else self.CANTON_MULTIPLIER
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
        """Return canton information."""
        return {
            'canton_code': self.CANTON_CODE,
            'canton_name': self.CANTON_NAME,
            'canton_multiplier': float(self.CANTON_MULTIPLIER),
            'tax_year': 2024,
            'num_municipalities': 80,
            'special_notes': 'Uses "Einheiten" (units) multiplier system. Canton: 1.60 units. '
                           '11 progressive brackets from 0% to 5.8%. '
                           'Special rule: Income over CHF 2,067,800 taxed at flat 5.7% on entire income. '
                           'Maximum total burden: 22.8% of income (§ 62 StG).'
        }
