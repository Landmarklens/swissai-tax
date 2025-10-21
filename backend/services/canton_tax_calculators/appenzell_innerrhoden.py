"""Appenzell Innerrhoden Canton Tax Calculator

Source: https://www.estv.admin.ch/dam/estv/de/dokumente/estv/steuersystem/kantonsblaetter/ai-de.pdf
Tax year: 2024
Canton multiplier: 96% (Art. 38 StG)
Municipalities: 5 districts (Bezirke)
"""
from decimal import Decimal
from typing import Dict
from .base import CantonTaxCalculator

class AppenzellInnerrhodenTaxCalculator(CantonTaxCalculator):
    CANTON_CODE = "AI"
    CANTON_NAME = "Appenzell Innerrhoden"
    CANTON_MULTIPLIER = Decimal('0.96')  # 96% for 2024

    def __init__(self, tax_year: int = 2024):
        super().__init__(canton_code="AI", tax_year=tax_year)

    def _load_tax_brackets(self) -> Dict:
        """
        Progressive tax brackets from Art. 38 StG (Kantonsblatt AI)

        Art. 38 Abs. 1 and 2:
        - 0% for first CHF 3,000
        - 1% for next CHF 3,000 (to CHF 6,000)
        - 2% for next CHF 3,000 (to CHF 9,000)
        - 3% for next CHF 3,000 (to CHF 12,000)
        - 4% for next CHF 3,000 (to CHF 15,000)
        - 5% for next CHF 3,000 (to CHF 18,000)
        - 6% for next CHF 4,000 (to CHF 22,000)
        - 7% for next CHF 4,000 (to CHF 26,000)
        - 7.5% for next CHF 4,000 (to CHF 30,000)
        - 8% for next CHF 10,000 (to CHF 40,000)
        - 8.5% for next CHF 34,000 (to CHF 74,000)
        - 9% for next CHF 66,000 (to CHF 140,000)
        - 8.5% for next CHF 60,000 (to CHF 200,000)
        - 8% for income over CHF 200,000 (applies to ENTIRE income)

        Art. 38 Abs. 3: Vollsplitting (full splitting) for married couples
        """
        return {
            'single': [
                (Decimal('3000'), Decimal('0.00')),    # 0% first 3,000
                (Decimal('6000'), Decimal('0.01')),    # 1% next 3,000
                (Decimal('9000'), Decimal('0.02')),    # 2% next 3,000
                (Decimal('12000'), Decimal('0.03')),   # 3% next 3,000
                (Decimal('15000'), Decimal('0.04')),   # 4% next 3,000
                (Decimal('18000'), Decimal('0.05')),   # 5% next 3,000
                (Decimal('22000'), Decimal('0.06')),   # 6% next 4,000
                (Decimal('26000'), Decimal('0.07')),   # 7% next 4,000
                (Decimal('30000'), Decimal('0.075')),  # 7.5% next 4,000
                (Decimal('40000'), Decimal('0.08')),   # 8% next 10,000
                (Decimal('74000'), Decimal('0.085')),  # 8.5% next 34,000
                (Decimal('140000'), Decimal('0.09')),  # 9% next 66,000
                (Decimal('200000'), Decimal('0.085')), # 8.5% next 60,000
                (Decimal('inf'), Decimal('0.08')),     # 8% over 200,000 (flat on whole income)
            ],
            'married': [
                (Decimal('3000'), Decimal('0.00')),
                (Decimal('6000'), Decimal('0.01')),
                (Decimal('9000'), Decimal('0.02')),
                (Decimal('12000'), Decimal('0.03')),
                (Decimal('15000'), Decimal('0.04')),
                (Decimal('18000'), Decimal('0.05')),
                (Decimal('22000'), Decimal('0.06')),
                (Decimal('26000'), Decimal('0.07')),
                (Decimal('30000'), Decimal('0.075')),
                (Decimal('40000'), Decimal('0.08')),
                (Decimal('74000'), Decimal('0.085')),
                (Decimal('140000'), Decimal('0.09')),
                (Decimal('200000'), Decimal('0.085')),
                (Decimal('inf'), Decimal('0.08')),
            ]
        }

    def _apply_progressive_rates(self, taxable_income: Decimal, brackets: list) -> Decimal:
        """
        Apply progressive marginal tax rates.

        SPECIAL CASE: Income over CHF 200,000
        Art. 38 Abs. 2: "Für steuerbare Einkommen über Fr. 200'000.– beträgt die
        einfache Steuer für das ganze Einkommen acht Prozent."
        (For taxable income over CHF 200,000, the simple tax on the ENTIRE income is 8%)

        This is a flat rate on the whole income, not marginal.
        """
        if taxable_income <= 0:
            return Decimal('0')

        # Special rule: Over CHF 200,000 = 8% flat on entire income
        if taxable_income > Decimal('200000'):
            return (taxable_income * Decimal('0.08')).quantize(Decimal('0.01'))

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
                                   municipal_multiplier: Decimal = Decimal('0.56')) -> Dict[str, Decimal]:
        """
        Calculate total tax with canton and municipal multipliers.

        IMPORTANT: In AI, municipal tax includes both District (Bezirk) and School (Schulgemeinde)
        Default is Appenzell: 16% (Bezirk) + 40% (Schulgemeinde) = 56% total municipal
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
            'num_municipalities': 5,
            'special_notes': 'Municipal tax includes District (Bezirk) + School (Schulgemeinde). '
                           'Flat 8% rate on entire income over CHF 200,000.'
        }
