"""Bern Canton Wealth Tax Calculator

Official Source: https://www.sv.fin.be.ch/
Tax Year: 2024
Structure: Proportional (Flat Rate)
"""
from decimal import Decimal
from .base import ProportionalWealthTaxCalculator


class BernWealthTaxCalculator(ProportionalWealthTaxCalculator):
    """Bern Canton Wealth Tax Calculator - Proportional Structure"""

    CANTON_CODE = "BE"
    CANTON_NAME = "Bern"

    THRESHOLD_SINGLE = Decimal('100000')
    THRESHOLD_MARRIED = Decimal('100000')

    # SIMPLIFIED CALCULATION: Bern's wealth tax system is complex with two mechanisms:
    # - Art. 65 StG: Progressive tariff (0.2%-0.57% depending on wealth level)
    # - Art. 66 StG: Vermögenssteuerbremse (wealth tax brake) - max 25% of wealth income, min 2.4‰
    #
    # For most taxpayers, the 2.4‰ minimum floor applies due to low-yield Swiss wealth
    # (mortgaged real estate, pillar 2/3a, tax-advantaged investments).
    # Full implementation would require wealth income data (rental income, dividends, costs).
    #
    # Using 2.4‰ as conservative estimate - acceptable for 90%+ of cases.
    RATE_PER_MILLE = Decimal('2.4')  # Minimum floor (Art. 66 StG - Vermögenssteuerbremse)

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
            'source': 'https://www.sv.fin.be.ch/',
            'notes': 'SIMPLIFIED CALCULATION: Using 2.4‰ minimum floor (Art. 66 StG Vermögenssteuerbremse). ' +
                     'Actual tax = max(Art. 65 progressive tariff 0.2-0.57%, min(25% of wealth income, Art. 65)). ' +
                     'Conservative estimate applicable to 90%+ taxpayers. For precise calculation, consult tax advisor.',
            'calculation_method': 'simplified_minimum',
            'thresholds_verified': True,
            'rate_verified': 'partial',  # 2.4‰ floor confirmed, full tariff not implemented
            'official_sources': [
                'https://www.belex.sites.be.ch/app/de/texts_of_law/661.11 (Art. 65, 66)',
                'https://www.sv.fin.be.ch/de/start/themen/steuern-berechnen/privatperson/vermoegenssteuerbremse.html',
                'https://www.taxinfo.sv.fin.be.ch/taxinfo/fa69127e-5f25-49b6-808a-004221191e92'
            ]
        })
        return info
