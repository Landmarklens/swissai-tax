"""Geneva Canton Tax Calculator

Source: https://www.estv.admin.ch/dam/estv/fr/dokumente/estv/steuersystem/kantonsblaetter/ge-fr.pdf
Municipality rates: https://www.ge.ch/document/7698/telecharger
Tax Guide: https://www.getax.ch/support/guide/declaration2024/Impotsurlerevenubaremesetcalculs.html
Tax year: 2024
Canton rate: 47.5 centimes additionnels
Municipalities: 45

UNIQUE SYSTEM: Geneva uses "centimes additionnels" (additional centimes)
- Progressive brackets determine base tax (impôt de base)
- The published barème includes centimes effects
- Canton: 47.5 centimes / Municipal: 25-51 centimes typically
"""
from decimal import Decimal
from typing import Dict
from .base import CantonTaxCalculator

class GenevaTaxCalculator(CantonTaxCalculator):
    CANTON_CODE = "GE"
    CANTON_NAME = "Geneva"
    CANTON_CENTIMES = Decimal('47.5')  # 47.5 centimes additionnels for 2024

    def __init__(self, tax_year: int = 2024):
        super().__init__(canton_code="GE", tax_year=tax_year)

    def _load_tax_brackets(self) -> Dict:
        """
        Geneva progressive tax brackets (barème) for 2024

        Source: Official Geneva tax guide 2024
        These are the official ICC (Impôt cantonal et communal) rates
        18 progressive brackets from 0% to 19%
        """
        return {
            'single': [
                (Decimal('18479'), Decimal('0.0000')),    # 0% up to 18,479
                (Decimal('22264'), Decimal('0.0800')),    # 8% to 22,264
                (Decimal('24491'), Decimal('0.0900')),    # 9% to 24,491
                (Decimal('26717'), Decimal('0.1000')),    # 10% to 26,717
                (Decimal('28943'), Decimal('0.1100')),    # 11% to 28,943
                (Decimal('34509'), Decimal('0.1200')),    # 12% to 34,509
                (Decimal('38962'), Decimal('0.1300')),    # 13% to 38,962
                (Decimal('43416'), Decimal('0.1400')),    # 14% to 43,416
                (Decimal('47868'), Decimal('0.1450')),    # 14.5% to 47,868
                (Decimal('76811'), Decimal('0.1500')),    # 15% to 76,811
                (Decimal('125793'), Decimal('0.1550')),   # 15.5% to 125,793
                (Decimal('169208'), Decimal('0.1600')),   # 16% to 169,208
                (Decimal('191473'), Decimal('0.1650')),   # 16.5% to 191,473
                (Decimal('273850'), Decimal('0.1700')),   # 17% to 273,850
                (Decimal('291661'), Decimal('0.1750')),   # 17.5% to 291,661
                (Decimal('410775'), Decimal('0.1800')),   # 18% to 410,775
                (Decimal('643435'), Decimal('0.1850')),   # 18.5% to 643,435
                (Decimal('inf'), Decimal('0.1900')),      # 19% above 643,435
            ],
            'married': [
                (Decimal('18479'), Decimal('0.0000')),
                (Decimal('22264'), Decimal('0.0800')),
                (Decimal('24491'), Decimal('0.0900')),
                (Decimal('26717'), Decimal('0.1000')),
                (Decimal('28943'), Decimal('0.1100')),
                (Decimal('34509'), Decimal('0.1200')),
                (Decimal('38962'), Decimal('0.1300')),
                (Decimal('43416'), Decimal('0.1400')),
                (Decimal('47868'), Decimal('0.1450')),
                (Decimal('76811'), Decimal('0.1500')),
                (Decimal('125793'), Decimal('0.1550')),
                (Decimal('169208'), Decimal('0.1600')),
                (Decimal('191473'), Decimal('0.1650')),
                (Decimal('273850'), Decimal('0.1700')),
                (Decimal('291661'), Decimal('0.1750')),
                (Decimal('410775'), Decimal('0.1800')),
                (Decimal('643435'), Decimal('0.1850')),
                (Decimal('inf'), Decimal('0.1900')),
            ]
        }

    def _apply_progressive_rates(self, taxable_income: Decimal, brackets: list) -> Decimal:
        """Apply Geneva's progressive marginal tax rates."""
        if taxable_income <= 0:
            return Decimal('0')

        tax = Decimal('0')
        previous_limit = Decimal('0')

        for upper_limit, rate in brackets:
            if taxable_income <= previous_limit:
                break

            taxable_in_bracket = min(taxable_income, upper_limit) - previous_limit
            tax += taxable_in_bracket * rate
            previous_limit = upper_limit

            if taxable_income <= upper_limit:
                break

        return tax.quantize(Decimal('0.01'))

    def _apply_family_adjustments(self, tax: Decimal, num_children: int) -> Decimal:
        """No additional tax adjustments - deductions applied at income level."""
        return tax

    def calculate(self, taxable_income: Decimal, marital_status: str = 'single',
                  num_children: int = 0) -> Decimal:
        """Calculate canton tax using Geneva's system.

        Returns: Decimal - The calculated tax amount
        """
        brackets = self.tax_brackets.get(marital_status, self.tax_brackets['single'])

        # For married couples, Geneva uses "splitting" - tax on 50% of income, then doubled
        if marital_status == 'married':
            split_income = taxable_income / 2
            tax = self._apply_progressive_rates(split_income, brackets) * 2
        else:
            tax = self._apply_progressive_rates(taxable_income, brackets)

        return tax.quantize(Decimal('0.01'))

    def calculate_with_multiplier(self, taxable_income: Decimal, marital_status: str = 'single',
                                   num_children: int = 0, canton_multiplier: Decimal = None,
                                   municipal_multiplier: Decimal = Decimal('0.4549')) -> Dict[str, Decimal]:
        """
        Calculate total tax with Geneva's centimes additionnels system.

        Default municipal multiplier is Genève city: 45.49 centimes (0.4549)

        Note: The barème already represents effective combined rates.
        Municipal multiplier is stored as decimal (45.49 centimes = 0.4549)
        """
        brackets = self.tax_brackets.get(marital_status, self.tax_brackets['single'])

        # For married couples, Geneva uses "splitting"
        if marital_status == 'married':
            split_income = taxable_income / 2
            total_tax = self._apply_progressive_rates(split_income, brackets) * 2
        else:
            total_tax = self._apply_progressive_rates(taxable_income, brackets)

        # The total_tax represents combined canton + municipal
        # We can estimate the breakdown based on centimes ratio
        canton_centimes = self.CANTON_CENTIMES if canton_multiplier is None else canton_multiplier * 100
        municipal_centimes = municipal_multiplier * 100
        total_centimes = canton_centimes + municipal_centimes

        canton_portion = canton_centimes / total_centimes if total_centimes > 0 else Decimal('0.5')
        municipal_portion = municipal_centimes / total_centimes if total_centimes > 0 else Decimal('0.5')

        cantonal_tax = total_tax * canton_portion
        municipal_tax = total_tax * municipal_portion

        effective_rate = (total_tax / taxable_income * 100) if taxable_income > 0 else Decimal('0')

        return {
            'base_tax': total_tax,
            'cantonal_tax': cantonal_tax,
            'municipal_tax': municipal_tax,
            'total_cantonal_and_municipal': total_tax,
            'effective_rate': effective_rate.quantize(Decimal('0.01')),
            'canton_multiplier': canton_centimes / 100,
            'municipal_multiplier': municipal_multiplier
        }

    def get_canton_info(self) -> Dict:
        """Return canton information."""
        return {
            'canton_code': self.CANTON_CODE,
            'canton_name': self.CANTON_NAME,
            'canton_centimes': float(self.CANTON_CENTIMES),
            'tax_year': 2024,
            'num_municipalities': 45,
            'special_notes': 'Uses "centimes additionnels" system. Canton: 47.5 centimes. '
                           'Married couples benefit from income splitting (50% rate). '
                           '18 progressive brackets from 0% to 19%.'
        }
