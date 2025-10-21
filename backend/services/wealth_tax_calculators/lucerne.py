"""Lucerne Canton Wealth Tax Calculator

Official Source: https://steuern.lu.ch/
Tax Year: 2024
Structure: Proportional (Flat Rate)
"""
from decimal import Decimal
from .base import ProportionalWealthTaxCalculator


class LucerneWealthTaxCalculator(ProportionalWealthTaxCalculator):
    """Lucerne Canton Wealth Tax Calculator - Proportional Structure"""

    CANTON_CODE = "LU"
    CANTON_NAME = "Lucerne"

    # THRESHOLDS PENDING OFFICIAL VERIFICATION
    # Source: § 52 StG (SRL 620) "Steuerfreie Beträge bei der Vermögenssteuer"
    # These values based on pattern matching with similar cantons (AG: 80K/160K, ZH: 80K/159K)
    # Official verification attempted but requires:
    #   - Wegleitung zur Steuererklärung 2024 PDF (authentication required)
    #   - Direct access to SRL 620 § 52 legal text (authentication required)
    # Confidence: MEDIUM (65-75%) - values are plausible and consistent with Swiss patterns
    # Recommended: Manual verification before production use
    THRESHOLD_SINGLE = Decimal('80000')  # UNVERIFIED - based on pattern matching
    THRESHOLD_MARRIED = Decimal('160000')  # UNVERIFIED - based on pattern matching
    RATE_PER_MILLE = Decimal('0.75')  # VERIFIED (reduced from 0.875‰ in 2024)

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
            'source': 'https://steuern.lu.ch/',
            'notes': 'Rate 0.75‰ VERIFIED (reduced from 0.875‰). Max combined 3.0‰. ' +
                     'THRESHOLDS UNVERIFIED: CHF 80,000/160,000 based on pattern matching, pending § 52 StG confirmation. ' +
                     'Manual verification recommended: Download Wegleitung 2024 from steuern.lu.ch or contact steuern@lu.ch',
            'calculation_method': 'proportional',
            'rate_verified': True,
            'thresholds_verified': False,  # Requires manual verification
            'threshold_confidence': 'medium',  # 65-75% confidence
            'verification_required': 'Download https://steuern.lu.ch/-/media/Steuern/Dokumente/Steuerformulare/2024/Wegleitung930109LU2024HAkorr.pdf',
            'official_sources': [
                'https://steuern.lu.ch/ (Rate confirmed)',
                'https://srl.lu.ch/app/de/texts_of_law/620 (§ 52 StG - requires manual check)',
                'https://steuerbuch.lu.ch/band1/vermoegenssteuer/steuerfreie_betraege (requires authentication)'
            ]
        })
        return info
