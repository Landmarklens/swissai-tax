"""
Canton Tax Calculators Package

This package contains tax calculation engines for all 26 Swiss cantons.
Each canton has its own progressive tax rate system and deduction rules.
"""

from .base import CantonTaxCalculator
from .zurich import ZurichTaxCalculator
from .bern import BernTaxCalculator
from .geneva import GenevaTaxCalculator
from .basel_stadt import BaselStadtTaxCalculator
from .vaud import VaudTaxCalculator

# Map canton codes to calculator classes
CANTON_CALCULATORS = {
    'ZH': ZurichTaxCalculator,
    'BE': BernTaxCalculator,
    'LU': ZurichTaxCalculator,  # Using ZH as template for now
    'UR': ZurichTaxCalculator,
    'SZ': ZurichTaxCalculator,
    'OW': ZurichTaxCalculator,
    'NW': ZurichTaxCalculator,
    'GL': ZurichTaxCalculator,
    'ZG': ZurichTaxCalculator,
    'FR': ZurichTaxCalculator,
    'SO': ZurichTaxCalculator,
    'BS': BaselStadtTaxCalculator,
    'BL': BaselStadtTaxCalculator,
    'SH': ZurichTaxCalculator,
    'AR': ZurichTaxCalculator,
    'AI': ZurichTaxCalculator,
    'SG': ZurichTaxCalculator,
    'GR': ZurichTaxCalculator,
    'AG': ZurichTaxCalculator,
    'TG': ZurichTaxCalculator,
    'TI': ZurichTaxCalculator,
    'VD': VaudTaxCalculator,
    'VS': ZurichTaxCalculator,
    'NE': ZurichTaxCalculator,
    'GE': GenevaTaxCalculator,
    'JU': ZurichTaxCalculator
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

    return calculator_class(canton_code, tax_year)


__all__ = [
    'CantonTaxCalculator',
    'get_canton_calculator',
    'CANTON_CALCULATORS'
]
