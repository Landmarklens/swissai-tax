"""Appenzell Ausserrhoden Canton Tax Calculator

Source: https://www.estv.admin.ch/dam/estv/de/dokumente/estv/steuersystem/kantonsblaetter/ar-de.pdf
Municipality rates: https://ar.ch/fileadmin/user_upload/Departement_Finanzen/Steuerverwaltung/Bibliothek/2024/Steuerfuesse_2024.pdf
Tax year: 2024
Canton rate: 3.30 Einheiten (units)
Municipalities: 20

Progressive marginal tax system with 12 brackets (0% to 2.9%)
Special high-income rule: Over CHF 260,800 = flat 2.6% on entire income
"""
from decimal import Decimal
from typing import Dict
from .base import CantonTaxCalculator

class AppenzellAusserrhodenTaxCalculator(CantonTaxCalculator):
    CANTON_CODE = "AR"
    CANTON_NAME = "Appenzell Ausserrhoden"
    CANTON_MULTIPLIER = Decimal('3.30')  # 3.30 Einheiten for 2024

    def __init__(self, tax_year: int = 2024):
        super().__init__(canton_code="AR", tax_year=tax_year)

    def _load_tax_brackets(self) -> Dict:
        """
        Appenzell Ausserrhoden progressive tax brackets (Art. 39 Abs. 1 lit. b StG) for 2024

        Source: Official AR Kantonsblatt 2024 (adjusted for inflation)
        12 progressive marginal brackets from 0% to 2.9%
        Special rule: Over CHF 260,800, flat 2.6% on entire income
        """
        return {
            'single': [
                (Decimal('8300'), Decimal('0.0000')),     # 0% up to 8,300
                (Decimal('9900'), Decimal('0.0060')),     # 0.6% next 1,600
                (Decimal('11500'), Decimal('0.0100')),    # 1.0% next 1,600
                (Decimal('15700'), Decimal('0.0150')),    # 1.5% next 4,200
                (Decimal('27200'), Decimal('0.0180')),    # 1.8% next 11,500
                (Decimal('41800'), Decimal('0.0220')),    # 2.2% next 14,600
                (Decimal('54300'), Decimal('0.0240')),    # 2.4% next 12,500
                (Decimal('74100'), Decimal('0.0260')),    # 2.6% next 19,800
                (Decimal('88700'), Decimal('0.0270')),    # 2.7% next 14,600
                (Decimal('125200'), Decimal('0.0280')),   # 2.8% next 36,500
                (Decimal('260800'), Decimal('0.0290')),   # 2.9% next 135,600
                (Decimal('inf'), Decimal('0.0260')),      # 2.6% above 260,800
            ],
            'married': [
                # Same brackets for married couples
                (Decimal('8300'), Decimal('0.0000')),
                (Decimal('9900'), Decimal('0.0060')),
                (Decimal('11500'), Decimal('0.0100')),
                (Decimal('15700'), Decimal('0.0150')),
                (Decimal('27200'), Decimal('0.0180')),
                (Decimal('41800'), Decimal('0.0220')),
                (Decimal('54300'), Decimal('0.0240')),
                (Decimal('74100'), Decimal('0.0260')),
                (Decimal('88700'), Decimal('0.0270')),
                (Decimal('125200'), Decimal('0.0280')),
                (Decimal('260800'), Decimal('0.0290')),
                (Decimal('inf'), Decimal('0.0260')),
            ]
        }

    def _apply_progressive_rates(self, taxable_income: Decimal, brackets: list) -> Decimal:
        """
        Apply AR's progressive marginal tax rates.

        SPECIAL RULE (Art. 39 Abs. 1 lit. b Nr. 12): Income over CHF 260,800
        = 2.6% of the (entire) taxable income
        """
        if taxable_income <= 0:
            return Decimal('0')

        # Special rule: Over CHF 260,800 = 2.6% flat on entire income
        if taxable_income > Decimal('260800'):
            return (taxable_income * Decimal('0.026')).quantize(Decimal('0.01'))

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
        """Calculate canton tax using AR's progressive system."""
        brackets = self.tax_brackets.get(marital_status, self.tax_brackets['single'])
        tax = self._apply_progressive_rates(taxable_income, brackets)

        return {
            'base_tax': tax,
            'cantonal_tax': tax * self.CANTON_MULTIPLIER,
            'canton_multiplier': self.CANTON_MULTIPLIER
        }

    def calculate_with_multiplier(self, taxable_income: Decimal, marital_status: str = 'single',
                                   num_children: int = 0, canton_multiplier: Decimal = None,
                                   municipal_multiplier: Decimal = Decimal('4.10')) -> Dict[str, Decimal]:
        """
        Calculate total tax with AR's Einheiten (units) system.

        Default municipal multiplier is Herisau: 4.10 Einheiten
        Canton multiplier: 3.30 Einheiten

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
            'num_municipalities': 20,
            'special_notes': 'Uses "Einheiten" (units) multiplier system. Canton: 3.30 units. '
                           '12 progressive brackets from 0% to 2.9%. '
                           'Special rule: Income over CHF 260,800 taxed at flat 2.6% on entire income.'
        }
