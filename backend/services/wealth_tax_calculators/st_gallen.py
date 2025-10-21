"""St. Gallen Canton Wealth Tax Calculator

Official Source: https://www.sg.ch/
Tax Year: 2024
Structure: Progressive
"""
from decimal import Decimal
from .base import ProgressiveWealthTaxCalculator


class StGallenWealthTaxCalculator(ProgressiveWealthTaxCalculator):
    """St. Gallen Canton Wealth Tax Calculator - Progressive Structure"""

    CANTON_CODE = "SG"
    CANTON_NAME = "St. Gallen"

    THRESHOLD_SINGLE = Decimal('260800')
    THRESHOLD_MARRIED = Decimal('260800')

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
            (Decimal('100000'), Decimal('0.8')),
            (Decimal('200000'), Decimal('1.2')),
            (Decimal('500000'), Decimal('1.5')),
            (Decimal('1000000'), Decimal('1.7')),
            (None, Decimal('1.9')),  # Top bracket
        ]

    def get_canton_info(self) -> dict:
        info = super().get_info()
        info.update({
            'canton_name': self.CANTON_NAME,
            'num_brackets': len(self._load_brackets()),
            'source': 'https://www.sg.ch/',
            'notes': 'Canton coefficient 105%. Effective rate 1.785‰'
        })
        return info
