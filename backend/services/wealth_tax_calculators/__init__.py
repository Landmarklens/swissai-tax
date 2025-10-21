"""Wealth Tax Calculators Package

This package contains wealth tax (Vermögenssteuer) calculation engines for all 26 Swiss cantons.

Wealth tax is levied annually by cantons and municipalities on net worth (assets minus debts)
as of December 31st. Each canton has its own rate structure and tax-free thresholds.

Tax Year: 2024
"""

from .base import WealthTaxCalculator, ProgressiveWealthTaxCalculator, ProportionalWealthTaxCalculator

# Import all 26 canton calculators
from .zurich import ZurichWealthTaxCalculator
from .bern import BernWealthTaxCalculator
from .lucerne import LucerneWealthTaxCalculator
from .uri import UriWealthTaxCalculator
from .schwyz import SchwyzWealthTaxCalculator
from .obwalden import ObwaldenWealthTaxCalculator
from .nidwalden import NidwaldenWealthTaxCalculator
from .glarus import GlarusWealthTaxCalculator
from .zug import ZugWealthTaxCalculator
from .fribourg import FribourgWealthTaxCalculator
from .solothurn import SolothurnWealthTaxCalculator
from .basel_stadt import BaselStadtWealthTaxCalculator
from .basel_landschaft import BaselLandschaftWealthTaxCalculator
from .schaffhausen import SchaffhausenWealthTaxCalculator
from .appenzell_ausserrhoden import AppenzellAusserrhodenWealthTaxCalculator
from .appenzell_innerrhoden import AppenzellInnerrhodenWealthTaxCalculator
from .st_gallen import StGallenWealthTaxCalculator
from .graubuenden import GraubuendenWealthTaxCalculator
from .aargau import AargauWealthTaxCalculator
from .thurgau import ThurgauWealthTaxCalculator
from .ticino import TicinoWealthTaxCalculator
from .vaud import VaudWealthTaxCalculator
from .valais import ValaisWealthTaxCalculator
from .neuchatel import NeuchatelWealthTaxCalculator
from .geneva import GenevaWealthTaxCalculator
from .jura import JuraWealthTaxCalculator

# Map canton codes to calculator classes
WEALTH_TAX_CALCULATORS = {
    'ZH': ZurichWealthTaxCalculator,
    'BE': BernWealthTaxCalculator,
    'LU': LucerneWealthTaxCalculator,
    'UR': UriWealthTaxCalculator,
    'SZ': SchwyzWealthTaxCalculator,
    'OW': ObwaldenWealthTaxCalculator,
    'NW': NidwaldenWealthTaxCalculator,
    'GL': GlarusWealthTaxCalculator,
    'ZG': ZugWealthTaxCalculator,
    'FR': FribourgWealthTaxCalculator,
    'SO': SolothurnWealthTaxCalculator,
    'BS': BaselStadtWealthTaxCalculator,
    'BL': BaselLandschaftWealthTaxCalculator,
    'SH': SchaffhausenWealthTaxCalculator,
    'AR': AppenzellAusserrhodenWealthTaxCalculator,
    'AI': AppenzellInnerrhodenWealthTaxCalculator,
    'SG': StGallenWealthTaxCalculator,
    'GR': GraubuendenWealthTaxCalculator,
    'AG': AargauWealthTaxCalculator,
    'TG': ThurgauWealthTaxCalculator,
    'TI': TicinoWealthTaxCalculator,
    'VD': VaudWealthTaxCalculator,
    'VS': ValaisWealthTaxCalculator,
    'NE': NeuchatelWealthTaxCalculator,
    'GE': GenevaWealthTaxCalculator,
    'JU': JuraWealthTaxCalculator,
}


def get_wealth_tax_calculator(canton_code: str, tax_year: int = 2024) -> WealthTaxCalculator:
    """
    Get wealth tax calculator instance for specified canton.

    Args:
        canton_code: Canton code (e.g., 'ZH', 'BE', 'GE')
        tax_year: Tax year (default 2024)

    Returns:
        Canton-specific wealth tax calculator instance

    Raises:
        ValueError: If canton code is invalid or calculator not available
    """
    calculator_class = WEALTH_TAX_CALCULATORS.get(canton_code.upper())

    if not calculator_class:
        raise ValueError(
            f"Wealth tax calculator not available for canton {canton_code}. "
            f"Available cantons: {', '.join(sorted(WEALTH_TAX_CALCULATORS.keys()))}"
        )

    return calculator_class(tax_year=tax_year)


__all__ = [
    'WealthTaxCalculator',
    'ProgressiveWealthTaxCalculator',
    'ProportionalWealthTaxCalculator',
    'get_wealth_tax_calculator',
    'WEALTH_TAX_CALCULATORS'
]
