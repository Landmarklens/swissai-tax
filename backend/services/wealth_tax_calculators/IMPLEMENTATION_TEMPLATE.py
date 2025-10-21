"""Template for Canton-Specific Wealth Tax Calculator

This template shows how to implement a wealth tax calculator for a specific canton.
Copy this file and rename it to the canton name (e.g., zurich.py, bern.py, etc.)

EXAMPLE 1: Progressive Rate Canton (like Zurich)
EXAMPLE 2: Proportional Rate Canton (like Schwyz)
"""

from decimal import Decimal
from .base import ProgressiveWealthTaxCalculator, ProportionalWealthTaxCalculator


# ============================================================================
# EXAMPLE 1: PROGRESSIVE RATE CANTON (e.g., Zurich)
# ============================================================================

class ZurichWealthTaxCalculator(ProgressiveWealthTaxCalculator):
    """
    Zurich Canton Wealth Tax Calculator

    Source: https://www.zh.ch/de/steuern-finanzen/steuern/steuertarife.html
    Tax year: 2024

    Zurich uses a progressive rate structure with multiple brackets.
    Municipal multipliers apply.
    """

    CANTON_CODE = "ZH"
    CANTON_NAME = "Zurich"

    # Tax-free thresholds (replace with actual values from research)
    THRESHOLD_SINGLE = Decimal('51000')     # CHF 51,000
    THRESHOLD_MARRIED = Decimal('102000')   # CHF 102,000

    def __init__(self, tax_year: int = 2024):
        super().__init__(canton_code=self.CANTON_CODE, tax_year=tax_year)

    def _load_threshold_single(self) -> Decimal:
        """Load tax-free threshold for single taxpayers"""
        return self.THRESHOLD_SINGLE

    def _load_threshold_married(self) -> Decimal:
        """Load tax-free threshold for married taxpayers"""
        return self.THRESHOLD_MARRIED

    def _load_rate_structure(self) -> str:
        """Rate structure: progressive"""
        return 'progressive'

    def _load_municipal_multiplier_flag(self) -> bool:
        """Zurich applies municipal multipliers"""
        return True

    def _load_brackets(self) -> list:
        """
        Load progressive wealth tax brackets for Zurich.

        Returns:
            List of tuples: [(wealth_to, rate_per_mille), ...]
            - wealth_to: Upper limit of bracket (None for top bracket)
            - rate_per_mille: Tax rate in per mille (‰)

        Example rates (REPLACE WITH ACTUAL DATA):
        """
        return [
            (Decimal('100000'), Decimal('0.3')),    # 0-100k: 0.3‰ (0.03%)
            (Decimal('200000'), Decimal('0.5')),    # 100k-200k: 0.5‰
            (Decimal('500000'), Decimal('1.0')),    # 200k-500k: 1.0‰
            (Decimal('1000000'), Decimal('2.0')),   # 500k-1M: 2.0‰
            (None, Decimal('3.5')),                 # 1M+: 3.5‰
        ]

    def get_canton_info(self) -> dict:
        """Get canton-specific information"""
        return {
            'canton_code': self.CANTON_CODE,
            'canton_name': self.CANTON_NAME,
            'tax_year': self.tax_year,
            'threshold_single': float(self.THRESHOLD_SINGLE),
            'threshold_married': float(self.THRESHOLD_MARRIED),
            'rate_structure': 'progressive',
            'has_municipal_multiplier': True,
            'num_brackets': len(self._load_brackets()),
            'source': 'https://www.zh.ch/de/steuern-finanzen/steuern/steuertarife.html'
        }


# ============================================================================
# EXAMPLE 2: PROPORTIONAL RATE CANTON (e.g., Schwyz)
# ============================================================================

class SchwyzWealthTaxCalculator(ProportionalWealthTaxCalculator):
    """
    Schwyz Canton Wealth Tax Calculator

    Source: https://www.sz.ch/verwaltung/finanzdepartement/steuerverwaltung.html
    Tax year: 2024

    Schwyz uses a simple proportional (flat) rate.
    Municipal multipliers apply.
    """

    CANTON_CODE = "SZ"
    CANTON_NAME = "Schwyz"

    # Tax-free thresholds (replace with actual values from research)
    THRESHOLD_SINGLE = Decimal('125000')    # CHF 125,000
    THRESHOLD_MARRIED = Decimal('250000')   # CHF 250,000

    # Proportional rate (replace with actual value from research)
    RATE_PER_MILLE = Decimal('0.6')        # 0.6‰ (0.06%)

    def __init__(self, tax_year: int = 2024):
        super().__init__(canton_code=self.CANTON_CODE, tax_year=tax_year)

    def _load_threshold_single(self) -> Decimal:
        """Load tax-free threshold for single taxpayers"""
        return self.THRESHOLD_SINGLE

    def _load_threshold_married(self) -> Decimal:
        """Load tax-free threshold for married taxpayers"""
        return self.THRESHOLD_MARRIED

    def _load_rate_structure(self) -> str:
        """Rate structure: proportional"""
        return 'proportional'

    def _load_municipal_multiplier_flag(self) -> bool:
        """Schwyz applies municipal multipliers"""
        return True

    def _load_proportional_rate(self) -> Decimal:
        """Load proportional wealth tax rate for Schwyz"""
        return self.RATE_PER_MILLE

    def get_canton_info(self) -> dict:
        """Get canton-specific information"""
        return {
            'canton_code': self.CANTON_CODE,
            'canton_name': self.CANTON_NAME,
            'tax_year': self.tax_year,
            'threshold_single': float(self.THRESHOLD_SINGLE),
            'threshold_married': float(self.THRESHOLD_MARRIED),
            'rate_structure': 'proportional',
            'has_municipal_multiplier': True,
            'rate_per_mille': float(self.RATE_PER_MILLE),
            'rate_percentage': float(self.RATE_PER_MILLE / 10),  # Convert to %
            'source': 'https://www.sz.ch/verwaltung/finanzdepartement/steuerverwaltung.html'
        }


# ============================================================================
# USAGE EXAMPLES
# ============================================================================

if __name__ == "__main__":
    """
    Example usage of wealth tax calculators
    """
    from decimal import Decimal

    print("=" * 70)
    print("EXAMPLE 1: Progressive Rate Canton (Zurich)")
    print("=" * 70)

    zh_calc = ZurichWealthTaxCalculator(tax_year=2024)

    # Example: CHF 500,000 net wealth, single taxpayer
    result = zh_calc.calculate(
        net_wealth=Decimal('500000'),
        marital_status='single'
    )

    print(f"\nNet wealth: CHF {result['net_wealth']:,.2f}")
    print(f"Tax-free threshold: CHF {result['tax_free_threshold']:,.2f}")
    print(f"Taxable wealth: CHF {result['taxable_wealth']:,.2f}")
    print(f"Canton wealth tax: CHF {result['canton_wealth_tax']:,.2f}")
    print(f"Effective rate: {result['effective_rate']:.2f}%")

    # With municipal multiplier
    result_with_muni = zh_calc.calculate_with_multiplier(
        net_wealth=Decimal('500000'),
        marital_status='single',
        canton_multiplier=Decimal('1.0'),
        municipal_multiplier=Decimal('1.19')  # Zurich city
    )

    print(f"\nWith Zurich city multiplier (119%):")
    print(f"Total wealth tax: CHF {result_with_muni['total_wealth_tax']:,.2f}")
    print(f"Effective rate: {result_with_muni['effective_rate_total']:.2f}%")

    print("\n" + "=" * 70)
    print("EXAMPLE 2: Proportional Rate Canton (Schwyz)")
    print("=" * 70)

    sz_calc = SchwyzWealthTaxCalculator(tax_year=2024)

    # Example: CHF 500,000 net wealth, single taxpayer
    result = sz_calc.calculate(
        net_wealth=Decimal('500000'),
        marital_status='single'
    )

    print(f"\nNet wealth: CHF {result['net_wealth']:,.2f}")
    print(f"Tax-free threshold: CHF {result['tax_free_threshold']:,.2f}")
    print(f"Taxable wealth: CHF {result['taxable_wealth']:,.2f}")
    print(f"Canton wealth tax: CHF {result['canton_wealth_tax']:,.2f}")
    print(f"Effective rate: {result['effective_rate']:.2f}%")

    print("\n" + "=" * 70)
    print("Calculator Info")
    print("=" * 70)

    print("\nZurich:", zh_calc.get_canton_info())
    print("\nSchwyz:", sz_calc.get_canton_info())
