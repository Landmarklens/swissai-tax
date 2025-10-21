"""Geneva Canton Wealth Tax Calculator

Official Source: https://www.ge.ch/document/baremes-icc-impots-revenu-fortune-avec-exemples-calcul-2024
Tax Year: 2024
Structure: Progressive
"""
from decimal import Decimal
from .base import ProgressiveWealthTaxCalculator


class GenevaWealthTaxCalculator(ProgressiveWealthTaxCalculator):
    """Geneva Canton Wealth Tax Calculator - Progressive Structure"""

    CANTON_CODE = "GE"
    CANTON_NAME = "Geneva"

    THRESHOLD_SINGLE = Decimal('86833')
    THRESHOLD_MARRIED = Decimal('173666')

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
            (Decimal('114621'), Decimal('1.75')),
            (Decimal('229242'), Decimal('2.0')),
            (Decimal('343863'), Decimal('2.25')),
            (Decimal('572305'), Decimal('2.5')),
            (Decimal('858458'), Decimal('2.75')),
            (Decimal('1144610'), Decimal('3.0')),
            (Decimal('1719304'), Decimal('3.5')),
            (None, Decimal('4.5')),  # Top bracket
        ]

    def get_canton_info(self) -> dict:
        info = super().get_info()
        info.update({
            'canton_name': self.CANTON_NAME,
            'num_brackets': len(self._load_brackets()),
            'source': 'https://www.ge.ch/document/baremes-icc-impots-revenu-fortune-avec-exemples-calcul-2024',
            'notes': 'Per child: CHF 43,417. Official barème 2024'
        })
        return info
