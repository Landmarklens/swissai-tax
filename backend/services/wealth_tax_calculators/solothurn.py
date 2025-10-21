"""Solothurn Canton Wealth Tax Calculator

Official Source: https://steuerbuch.so.ch/
Tax Year: 2024
Structure: Progressive
"""
from decimal import Decimal
from .base import ProgressiveWealthTaxCalculator


class SolothurnWealthTaxCalculator(ProgressiveWealthTaxCalculator):
    """Solothurn Canton Wealth Tax Calculator - Progressive Structure"""

    CANTON_CODE = "SO"
    CANTON_NAME = "Solothurn"

    THRESHOLD_SINGLE = Decimal('60000')
    THRESHOLD_MARRIED = Decimal('100000')

    def __init__(self, tax_year: int = 2024):
        super().__init__(canton_code=self.CANTON_CODE, tax_year=tax_year)

    def _load_threshold_single(self) -> Decimal:
        return self.THRESHOLD_SINGLE

    def _load_threshold_married(self) -> Decimal:
        return self.THRESHOLD_MARRIED

    def _load_rate_structure(self) -> str:
        return 'progressive'

    def _load_municipal_multiplier_flag(self) -> bool:
        return True

    def _load_brackets(self) -> list:
        """Progressive brackets - rates in per mille (‰)"""
        return [
            (Decimal('500000'), Decimal('0.75')),
            (Decimal('1000000'), Decimal('0.9')),
            (Decimal('2000000'), Decimal('1.1')),
            (Decimal('3000000'), Decimal('1.2')),
            (None, Decimal('1.3')),  # Top bracket
        ]

    def get_canton_info(self) -> dict:
        info = super().get_info()
        info.update({
            'canton_name': self.CANTON_NAME,
            'num_brackets': len(self._load_brackets()),
            'source': 'https://steuerbuch.so.ch/',
            'notes': 'Canton multiplier 104%. Municipal avg ~115%'
        })
        return info
