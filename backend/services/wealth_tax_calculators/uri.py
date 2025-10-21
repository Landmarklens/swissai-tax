"""Uri Canton Wealth Tax Calculator

Official Source: https://www.ur.ch/dienstleistungen/3196
Tax Year: 2024
Structure: Proportional (Flat Rate)
"""
from decimal import Decimal
from .base import ProportionalWealthTaxCalculator


class UriWealthTaxCalculator(ProportionalWealthTaxCalculator):
    """Uri Canton Wealth Tax Calculator - Proportional Structure"""

    CANTON_CODE = "UR"
    CANTON_NAME = "Uri"

    THRESHOLD_SINGLE = Decimal('100000')
    THRESHOLD_MARRIED = Decimal('200000')
    RATE_PER_MILLE = Decimal('2.3')  # Reduced from 2.6‰ to 2.3‰ in 2011 tax reform

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
            'source': 'https://www.ur.ch/dienstleistungen/3196',
            'notes': 'Per child: CHF 30K. +1.69% inflation adjustment 2024'
        })
        return info
