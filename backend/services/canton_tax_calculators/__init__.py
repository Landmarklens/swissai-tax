"""
Canton Tax Calculators Package

This package contains tax calculation engines for all 26 Swiss cantons.
Each canton has its own progressive tax rate system and deduction rules.
"""

from .aargau import AargauTaxCalculator
from .appenzell_ausserrhoden import AppenzellAusserrhodenTaxCalculator
from .appenzell_innerrhoden import AppenzellInnerrhodenTaxCalculator
from .base import CantonTaxCalculator
from .basel_landschaft import BaselLandschaftTaxCalculator
from .basel_stadt import BaselStadtTaxCalculator
from .bern import BernTaxCalculator
from .fribourg import FribourgTaxCalculator
from .geneva import GenevaTaxCalculator
from .glarus import GlarusTaxCalculator
from .graubuenden import GraubuendenTaxCalculator
from .jura import JuraTaxCalculator
from .lucerne import LucerneTaxCalculator
from .neuchatel import NeuchatelTaxCalculator
from .nidwalden import NidwaldenTaxCalculator
from .obwalden import ObwaldenTaxCalculator
from .schaffhausen import SchaffhausenTaxCalculator
from .schwyz import SchwyzTaxCalculator
from .solothurn import SolothurnTaxCalculator
from .st_gallen import StGallenTaxCalculator
from .thurgau import ThurgauTaxCalculator
from .ticino import TicinoTaxCalculator
from .uri import UriTaxCalculator
from .valais import ValaisTaxCalculator
from .vaud import VaudTaxCalculator
from .zug import ZugTaxCalculator
from .zurich import ZurichTaxCalculator

# Map canton codes to calculator classes
CANTON_CALCULATORS = {
    'ZH': ZurichTaxCalculator,
    'BE': BernTaxCalculator,
    'LU': LucerneTaxCalculator,
    'UR': UriTaxCalculator,
    'SZ': SchwyzTaxCalculator,
    'OW': ObwaldenTaxCalculator,
    'NW': NidwaldenTaxCalculator,
    'GL': GlarusTaxCalculator,
    'ZG': ZugTaxCalculator,
    'FR': FribourgTaxCalculator,
    'SO': SolothurnTaxCalculator,
    'BS': BaselStadtTaxCalculator,
    'BL': BaselLandschaftTaxCalculator,
    'SH': SchaffhausenTaxCalculator,
    'AR': AppenzellAusserrhodenTaxCalculator,
    'AI': AppenzellInnerrhodenTaxCalculator,
    'SG': StGallenTaxCalculator,
    'GR': GraubuendenTaxCalculator,
    'AG': AargauTaxCalculator,
    'TG': ThurgauTaxCalculator,
    'TI': TicinoTaxCalculator,
    'VD': VaudTaxCalculator,
    'VS': ValaisTaxCalculator,
    'NE': NeuchatelTaxCalculator,
    'GE': GenevaTaxCalculator,
    'JU': JuraTaxCalculator
}


def get_canton_calculator(canton_code: str, tax_year: int) -> CantonTaxCalculator:
    """
    Get calculator instance for specified canton.

    Args:
        canton_code: Canton code (e.g., 'ZH', 'BE', 'GE')
        tax_year: Tax year

    Returns:
        Canton calculator instance

    Raises:
        ValueError: If canton code is invalid
    """
    calculator_class = CANTON_CALCULATORS.get(canton_code)

    if not calculator_class:
        raise ValueError(f"No calculator available for canton {canton_code}")

    # Try to instantiate with tax_year only (for custom calculators)
    # If that fails, use canton_code and tax_year (for base class)
    try:
        return calculator_class(tax_year)
    except TypeError:
        return calculator_class(canton_code, tax_year)


__all__ = [
    'CantonTaxCalculator',
    'get_canton_calculator',
    'CANTON_CALCULATORS'
]
