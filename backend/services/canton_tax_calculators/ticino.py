"""Ticino Canton Tax Calculator

Source: https://www.estv.admin.ch/dam/estv/de/dokumente/estv/steuersystem/kantonsblaetter/ti-it.pdf
Municipality rates: https://www.fiduciariamega.ch/wp-content/uploads/2024/10/FM_Moltiplicatori_2024.pdf
Tax year: 2024
Municipalities: 107

Italian-speaking canton with 14/15 progressive brackets
NO canton multiplier - only municipal multipliers apply
"""
from decimal import Decimal
from typing import Dict
from .base import CantonTaxCalculator

class TicinoTaxCalculator(CantonTaxCalculator):
    CANTON_CODE = "TI"
    CANTON_NAME = "Ticino"

    def __init__(self, tax_year: int = 2024):
        super().__init__(canton_code="TI", tax_year=tax_year)

    def _load_tax_brackets(self) -> Dict:
        """Ticino progressive brackets for 2024 (14 single, 15 married)"""
        return {
            'single': [
                (Decimal('12500'), Decimal('0.00160')),   # 0.160% up to 12,500
                (Decimal('15000'), Decimal('0.01820')),   # 1.820% next 2,500
                (Decimal('17500'), Decimal('0.03480')),   # 3.480% next 2,500
                (Decimal('20000'), Decimal('0.05140')),   # 5.140% next 2,500
                (Decimal('27500'), Decimal('0.06800')),   # 6.800% next 7,500
                (Decimal('37500'), Decimal('0.08460')),   # 8.460% next 10,000
                (Decimal('50000'), Decimal('0.10120')),   # 10.120% next 12,500
                (Decimal('75000'), Decimal('0.11780')),   # 11.780% next 25,000
                (Decimal('100000'), Decimal('0.12610')),  # 12.610% next 25,000
                (Decimal('150000'), Decimal('0.13440')),  # 13.440% next 50,000
                (Decimal('200000'), Decimal('0.14270')),  # 14.270% next 50,000
                (Decimal('300000'), Decimal('0.14685')),  # 14.685% next 100,000
                (Decimal('380700'), Decimal('0.14920')),  # 14.920% next 80,700
                (Decimal('inf'), Decimal('0.14500')),     # 14.500% above 380,700
            ],
            'married': [
                (Decimal('20400'), Decimal('0.00145')),   # 0.145% up to 20,400
                (Decimal('24400'), Decimal('0.01640')),   # 1.640% next 4,000
                (Decimal('28400'), Decimal('0.03135')),   # 3.135% next 4,000
                (Decimal('32500'), Decimal('0.04630')),   # 4.630% next 4,100
                (Decimal('44900'), Decimal('0.06125')),   # 6.125% next 12,400
                (Decimal('61500'), Decimal('0.07620')),   # 7.620% next 16,600
                (Decimal('82000'), Decimal('0.09115')),   # 9.115% next 20,500
                (Decimal('122900'), Decimal('0.10610')),  # 10.610% next 40,900
                (Decimal('163900'), Decimal('0.11355')),  # 11.355% next 41,000
                (Decimal('245900'), Decimal('0.12100')),  # 12.100% next 82,000
                (Decimal('327900'), Decimal('0.12845')),  # 12.845% next 82,000
                (Decimal('491900'), Decimal('0.13217')),  # 13.217% next 164,000
                (Decimal('655900'), Decimal('0.13425')),  # 13.425% next 164,000
                (Decimal('761500'), Decimal('0.13590')),  # 13.590% next 105,600
                (Decimal('inf'), Decimal('0.14500')),     # 14.500% above 761,500
            ]
        }

    def _apply_progressive_rates(self, taxable_income: Decimal, brackets: list) -> Decimal:
        """Apply TI's progressive marginal rates"""
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

    def _apply_family_adjustments(self, tax: Decimal, num_children: int) -> Decimal:
        """TI uses separate brackets, no additional adjustments"""
        return tax

    def calculate(self, taxable_income: Decimal, marital_status: str = 'single',
                  num_children: int = 0) -> Dict[str, Decimal]:
        """Calculate TI cantonal tax using separate brackets for married"""
        brackets = self.tax_brackets.get(marital_status, self.tax_brackets['single'])
        tax = self._apply_progressive_rates(taxable_income, brackets)

        return {
            'base_tax': tax,
            'cantonal_tax': tax,
            'canton_multiplier': None  # TI has no canton multiplier
        }

    def calculate_with_multiplier(self, taxable_income: Decimal, marital_status: str = 'single',
                                   num_children: int = 0, canton_multiplier: Decimal = None,
                                   municipal_multiplier: Decimal = Decimal('0.77')) -> Dict[str, Decimal]:
        """
        Calculate total tax. Default: Lugano 77%

        UNIQUE: TI has NO canton multiplier - only municipal multiplier applies.
        Cantonal tax = base tax (not multiplied)
        Municipal tax = base tax × municipal multiplier
        """
        brackets = self.tax_brackets.get(marital_status, self.tax_brackets['single'])
        base_tax = self._apply_progressive_rates(taxable_income, brackets)

        # TI unique: cantonal tax is the base tax, not multiplied
        cantonal_tax = base_tax
        municipal_tax = base_tax * municipal_multiplier
        total_tax = cantonal_tax + municipal_tax
        effective_rate = (total_tax / taxable_income * 100) if taxable_income > 0 else Decimal('0')

        return {
            'base_tax': base_tax,
            'cantonal_tax': cantonal_tax,
            'municipal_tax': municipal_tax,
            'total_cantonal_and_municipal': total_tax,
            'effective_rate': effective_rate.quantize(Decimal('0.01')),
            'canton_multiplier': None,
            'municipal_multiplier': municipal_multiplier
        }

    def get_canton_info(self) -> Dict:
        return {
            'canton_code': self.CANTON_CODE,
            'canton_name': self.CANTON_NAME,
            'canton_multiplier': None,
            'tax_year': 2024,
            'num_municipalities': 107,
            'special_notes': 'Italian-speaking canton. UNIQUE: NO canton multiplier, only municipal (55%-100%). 14/15 brackets.'
        }
