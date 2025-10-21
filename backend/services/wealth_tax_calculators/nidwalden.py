"""Nidwalden Canton Wealth Tax Calculator

Official Source: https://www.steuern-nw.ch/
Tax Year: 2024
Structure: Proportional (Flat Rate)
"""
from decimal import Decimal
from .base import ProportionalWealthTaxCalculator


class NidwaldenWealthTaxCalculator(ProportionalWealthTaxCalculator):
    """Nidwalden Canton Wealth Tax Calculator - Proportional Structure"""

    CANTON_CODE = "NW"
    CANTON_NAME = "Nidwalden"

    THRESHOLD_SINGLE = Decimal('35000')
    THRESHOLD_MARRIED = Decimal('70000')
    RATE_PER_MILLE = Decimal('0.25')

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
            'source': 'https://www.steuern-nw.ch/',
            'notes': 'LOWEST in Switzerland! Per child: CHF 15K. Share rights: 0.2‰'
        })
        return info
