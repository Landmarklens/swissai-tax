"""Obwalden Canton Tax Calculator

Source: https://www.estv.admin.ch/dam/estv/de/dokumente/estv/steuersystem/kantonsblaetter/ow-de.pdf
Municipality rates: https://www.ow.ch/publikationen/8258
Tax year: 2024
Canton multiplier: 3.35 (3.25 + 0.10 flood protection levy)
Municipalities: 7

UNIQUE FEATURE: Obwalden uses a flat 1.8% rate on all taxable income (Art. 38 Abs. 1 StG)
This is one of the simplest tax systems in Switzerland - no progressive brackets!
"""
from decimal import Decimal
from typing import Dict
from .base import CantonTaxCalculator

class ObwaldenTaxCalculator(CantonTaxCalculator):
    CANTON_CODE = "OW"
    CANTON_NAME = "Obwalden"
    CANTON_MULTIPLIER = Decimal('3.35')  # 3.25 + 0.10 flood protection for 2024

    # Flat tax rate (Art. 38 Abs. 1 StG)
    FLAT_TAX_RATE = Decimal('0.018')  # 1.8%

    def __init__(self, tax_year: int = 2024):
        super().__init__(canton_code="OW", tax_year=tax_year)

    def _load_tax_brackets(self) -> Dict:
        """
        Obwalden uses a FLAT RATE of 1.8% on all taxable income.

        Art. 38 Abs. 1 StG:
        "Die einfache Steuer vom steuerbaren Einkommen für ein Steuerjahr beträgt 1,8 Prozent."
        (The simple tax on taxable income for a tax year is 1.8 percent.)

        No progressive brackets - same rate for everyone!
        Amounts under CHF 100 are not considered (Art. 38 Abs. 2).
        """
        # Return a single "bracket" representing the flat rate
        return {
            'single': [(Decimal('inf'), Decimal('0.018'))],
            'married': [(Decimal('inf'), Decimal('0.018'))]
        }

    def _apply_progressive_rates(self, taxable_income: Decimal, brackets: list) -> Decimal:
        """
        Apply Obwalden's FLAT TAX RATE of 1.8% to taxable income.

        Art. 38 Abs. 2 StG: "Restbeträge unter Fr. 100.– werden nicht berücksichtigt."
        (Amounts under CHF 100 are not considered.)

        This means we floor to nearest CHF 100.
        """
        if taxable_income <= 0:
            return Decimal('0')

        # Floor to nearest CHF 100 (ignore amounts under CHF 100)
        floored_income = (taxable_income // 100) * 100

        # Apply flat 1.8% rate
        tax = floored_income * self.FLAT_TAX_RATE
        return tax.quantize(Decimal('0.01'))

    def _apply_family_adjustments(self, tax: Decimal, num_children: int) -> Decimal:
        """No additional tax adjustments - deductions applied at income level."""
        return tax

    def calculate(self, taxable_income: Decimal, marital_status: str = 'single',
                  num_children: int = 0) -> Dict[str, Decimal]:
        """Calculate canton tax only (simple tax × canton multiplier)."""
        simple_tax = self._apply_progressive_rates(taxable_income, [])
        cantonal_tax = simple_tax * self.CANTON_MULTIPLIER

        return {
            'simple_tax': simple_tax,
            'cantonal_tax': cantonal_tax,
            'canton_multiplier': self.CANTON_MULTIPLIER
        }

    def calculate_with_multiplier(self, taxable_income: Decimal, marital_status: str = 'single',
                                   num_children: int = 0, canton_multiplier: Decimal = None,
                                   municipal_multiplier: Decimal = Decimal('3.86')) -> Dict[str, Decimal]:
        """
        Calculate total tax with canton and municipal multipliers.

        Default municipal multiplier is Sarnen: 3.86 (3.76 + 0.10 flood levy)

        Note: Obwalden uses tax units where 1.0 = 100%
        Example: Canton 3.35 = 335%, Sarnen 3.86 = 386%
        """
        if canton_multiplier is None:
            canton_multiplier = self.CANTON_MULTIPLIER

        simple_tax = self._apply_progressive_rates(taxable_income, [])

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
            'num_municipalities': 7,
            'special_notes': 'Unique flat tax rate of 1.8% on all income (no progressive brackets). '
                           'Canton multiplier includes 0.10 flood protection levy. '
                           'Amounts under CHF 100 are not taxed.'
        }
