"""Graubünden Canton Wealth Tax Calculator

Official Source: https://www.stv.gr.ch/
Tax Year: 2024
Structure: Progressive
"""
from decimal import Decimal
from .base import ProgressiveWealthTaxCalculator


class GraubuendenWealthTaxCalculator(ProgressiveWealthTaxCalculator):
    """Graubünden Canton Wealth Tax Calculator - Progressive Structure"""

    CANTON_CODE = "GR"
    CANTON_NAME = "Graubünden"

    THRESHOLD_SINGLE = Decimal('80000')
    THRESHOLD_MARRIED = Decimal('160000')

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
            (Decimal('500000'), Decimal('1.2')),
            (Decimal('1500000'), Decimal('2.0')),
            (None, Decimal('2.8')),  # Top bracket
        ]

    def get_canton_info(self) -> dict:
        info = super().get_info()
        info.update({
            'canton_name': self.CANTON_NAME,
            'num_brackets': len(self._load_brackets()),
            'source': 'https://www.stv.gr.ch/',
            'notes': 'Articles 54 ff. Steuergesetz. Trilingual canton'
        })
        return info
