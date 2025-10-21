"""Appenzell Innerrhoden Canton Wealth Tax Calculator

Official Source: https://www.ai.ch/
Tax Year: 2024
Structure: Proportional (Flat Rate)
"""
from decimal import Decimal
from .base import ProportionalWealthTaxCalculator


class AppenzellInnerrhodenWealthTaxCalculator(ProportionalWealthTaxCalculator):
    """Appenzell Innerrhoden Canton Wealth Tax Calculator - Proportional Structure"""

    CANTON_CODE = "AI"
    CANTON_NAME = "Appenzell Innerrhoden"

    THRESHOLD_SINGLE = Decimal('0')
    THRESHOLD_MARRIED = Decimal('0')
    RATE_PER_MILLE = Decimal('1.5')

    def __init__(self, tax_year: int = 2024):
        super().__init__(canton_code=self.CANTON_CODE, tax_year=tax_year)

    def _load_threshold_single(self) -> Decimal:
        return self.THRESHOLD_SINGLE

    def _load_threshold_married(self) -> Decimal:
        return self.THRESHOLD_MARRIED

    def _load_rate_structure(self) -> str:
        return 'proportional'

    def _load_municipal_multiplier_flag(self) -> bool:
        return True

    def _load_proportional_rate(self) -> Decimal:
        return self.RATE_PER_MILLE

    def get_canton_info(self) -> dict:
        info = super().get_info()
        info.update({
            'canton_name': self.CANTON_NAME,
            'rate_per_mille': float(self.RATE_PER_MILLE),
            'rate_percentage': float(self.RATE_PER_MILLE / 10),
            'source': 'https://www.ai.ch/',
            'notes': 'No explicit threshold. Pillar 2/3a tax-free until due'
        })
        return info
