"""Neuchâtel Canton Tax Calculator

Source: https://www.estv.admin.ch/dam/estv/de/dokumente/estv/steuersystem/kantonsblaetter/ne-fr.pdf
Municipality rates: https://www.ne.ch/autorites/DFS/SCCO/impot-pp/Pages/coefficients.aspx
Tax year: 2024
Municipalities: 27 (2024), reduced to 24 in 2025 (merger of Enges, Hauterive, La Tène, Saint-Blaise → Laténa)

French-speaking canton with progressive tax system
Canton multiplier: 125% (2024), reducing to 124% (2025)
Municipal multipliers: 63%-79%

OFFICIAL CALCULATION METHOD:
- Married couples: Income is multiplied by 52% (0.52 coefficient), then single brackets apply
- This is NOT income splitting - it's a coefficient applied to income before bracket lookup
"""
from decimal import Decimal
from typing import Dict
from .base import CantonTaxCalculator

class NeuchatelTaxCalculator(CantonTaxCalculator):
    CANTON_CODE = "NE"
    CANTON_NAME = "Neuchâtel"
    CANTON_MULTIPLIER_2024 = Decimal('1.25')  # 125%
    MARRIED_COEFFICIENT = Decimal('0.52')  # 52% for married couples

    def __init__(self, tax_year: int = 2024):
        super().__init__(canton_code="NE", tax_year=tax_year)

    def _load_tax_brackets(self) -> Dict:
        """
        Neuchâtel progressive brackets for 2024-2025.

        Based on official barème from https://www.ne.ch/autorites/DFS/SCCO/impot-pp/Pages/Baremes.aspx

        Single progressive tax table is used for all taxpayers.
        For married couples, income is multiplied by 0.52 before applying these brackets.
        """
        return {
            'single': [
                (Decimal('7700'), Decimal('0.0000')),      # 0.00% up to 7,700
                (Decimal('10300'), Decimal('0.0198')),     # 1.98% next 2,600
                (Decimal('15500'), Decimal('0.0396')),     # 3.96% next 5,200
                (Decimal('20600'), Decimal('0.0792')),     # 7.92% next 5,100
                (Decimal('30900'), Decimal('0.1148')),     # 11.48% next 10,300
                (Decimal('41200'), Decimal('0.1178')),     # 11.78% next 10,300
                (Decimal('51500'), Decimal('0.1218')),     # 12.18% next 10,300
                (Decimal('61800'), Decimal('0.1267')),     # 12.67% next 10,300
                (Decimal('72100'), Decimal('0.1317')),     # 13.17% next 10,300
                (Decimal('82400'), Decimal('0.1366')),     # 13.66% next 10,300
                (Decimal('92700'), Decimal('0.1406')),     # 14.06% next 10,300
                (Decimal('103000'), Decimal('0.1436')),    # 14.36% next 10,300
                (Decimal('113300'), Decimal('0.1465')),    # 14.65% next 10,300
                (Decimal('123600'), Decimal('0.1495')),    # 14.95% next 10,300
                (Decimal('133900'), Decimal('0.1525')),    # 15.25% next 10,300
                (Decimal('144200'), Decimal('0.1554')),    # 15.54% next 10,300
                (Decimal('154500'), Decimal('0.1584')),    # 15.84% next 10,300
                (Decimal('164800'), Decimal('0.1614')),    # 16.14% next 10,300
                (Decimal('175100'), Decimal('0.1643')),    # 16.43% next 10,300
                (Decimal('inf'), Decimal('0.1673')),       # 16.73% above 175,100
            ]
        }

    def _apply_progressive_rates(self, taxable_income: Decimal, brackets: list) -> Decimal:
        """Apply NE's progressive marginal rates"""
        if taxable_income <= 0:
            return Decimal('0')

        tax = Decimal('0')
        previous_limit = Decimal('0')

        for upper_limit, rate in brackets:
            if upper_limit == Decimal('inf'):
                tax += (taxable_income - previous_limit) * rate
                break

            if taxable_income <= previous_limit:
                break

            taxable_in_bracket = min(taxable_income, upper_limit) - previous_limit
            tax += taxable_in_bracket * rate
            previous_limit = upper_limit

            if taxable_income <= upper_limit:
                break

        return tax.quantize(Decimal('0.01'))

    def calculate(self, taxable_income: Decimal, marital_status: str = 'single',
                  num_children: int = 0) -> Dict[str, Decimal]:
        """
        Calculate NE canton tax using official 52% coefficient for married.

        OFFICIAL METHOD:
        - Married couples: income × 0.52, then apply single brackets
        - Single/others: apply single brackets directly
        """
        brackets = self.tax_brackets['single']

        if marital_status == 'married':
            # Apply 52% coefficient to income for married couples
            adjusted_income = taxable_income * self.MARRIED_COEFFICIENT
            tax = self._apply_progressive_rates(adjusted_income, brackets)
        else:
            tax = self._apply_progressive_rates(taxable_income, brackets)

        return {
            'base_tax': tax,
            'cantonal_tax': tax,
            'canton_multiplier': self.CANTON_MULTIPLIER_2024
        }

    def calculate_with_multiplier(self, taxable_income: Decimal, marital_status: str = 'single',
                                   num_children: int = 0, canton_multiplier: Decimal = None,
                                   municipal_multiplier: Decimal = Decimal('0.65')) -> Dict[str, Decimal]:
        """
        Calculate total tax. Default: Neuchâtel city 65%

        Canton multiplier: 125% for 2024
        Municipal multipliers: 63%-79%
        """
        if canton_multiplier is None:
            canton_multiplier = self.CANTON_MULTIPLIER_2024

        brackets = self.tax_brackets['single']

        if marital_status == 'married':
            # Apply 52% coefficient to income for married couples
            adjusted_income = taxable_income * self.MARRIED_COEFFICIENT
            simple_tax = self._apply_progressive_rates(adjusted_income, brackets)
        else:
            simple_tax = self._apply_progressive_rates(taxable_income, brackets)

        cantonal_tax = simple_tax * canton_multiplier
        municipal_tax = simple_tax * municipal_multiplier
        total_tax = cantonal_tax + municipal_tax
        effective_rate = (total_tax / taxable_income * 100) if taxable_income > 0 else Decimal('0')

        return {
            'base_tax': simple_tax,
            'cantonal_tax': cantonal_tax,
            'municipal_tax': municipal_tax,
            'total_cantonal_and_municipal': total_tax,
            'effective_rate': effective_rate.quantize(Decimal('0.01')),
            'canton_multiplier': canton_multiplier,
            'municipal_multiplier': municipal_multiplier,
            'married_coefficient': self.MARRIED_COEFFICIENT if marital_status == 'married' else None
        }

    def get_canton_info(self) -> Dict:
        return {
            'canton_code': self.CANTON_CODE,
            'canton_name': self.CANTON_NAME,
            'canton_multiplier': self.CANTON_MULTIPLIER_2024,
            'tax_year': 2024,
            'num_municipalities': 27,
            'special_notes': 'French-speaking canton. Progressive system with 52% coefficient for married couples (NOT income splitting). Canton 125% (2024). Municipal 63%-79%.'
        }
