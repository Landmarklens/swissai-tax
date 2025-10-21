"""Vaud Canton Wealth Tax Calculator

Official Source: https://www.vd.ch/etat-droit-finances/impots/
Tax Year: 2024
Structure: Progressive
"""
from decimal import Decimal
from .base import ProgressiveWealthTaxCalculator


class VaudWealthTaxCalculator(ProgressiveWealthTaxCalculator):
    """Vaud Canton Wealth Tax Calculator - Progressive Structure"""

    CANTON_CODE = "VD"
    CANTON_NAME = "Vaud"

    THRESHOLD_SINGLE = Decimal('50000')
    THRESHOLD_MARRIED = Decimal('50000')

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
            (Decimal('100000'), Decimal('0.48')),
            (Decimal('200000'), Decimal('1.0')),
            (Decimal('500000'), Decimal('1.5')),
            (Decimal('1000000'), Decimal('2.0')),
            (Decimal('2000000'), Decimal('3.082')),
            (None, Decimal('3.39')),  # Top bracket
        ]

    def get_canton_info(self) -> dict:
        info = super().get_info()
        info.update({
            'canton_name': self.CANTON_NAME,
            'num_brackets': len(self._load_brackets()),
            'source': 'https://www.vd.ch/etat-droit-finances/impots/',
            'notes': 'Canton coefficient 155%. Max combined 10‰'
        })
        return info
