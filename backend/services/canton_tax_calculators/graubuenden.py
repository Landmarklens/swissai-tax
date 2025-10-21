"""Graubünden Canton Tax Calculator

Source: https://www.estv.admin.ch/dam/estv/de/dokumente/estv/steuersystem/kantonsblaetter/gr-de.pdf
Municipality rates: https://www.gr.ch/DE/institutionen/verwaltung/dfg/stv/berechnen/Documents/gemeindesteuerfuesse2024.pdf
Tax year: 2024
Municipalities: 101

UNIQUE: 20 progressive brackets with flat rate rule above CHF 716,000
- Married: Income ÷ 1.9 for rate calculation (NO multiplication back)
- Canton rate: 95%
- Flat 11.0% on entire income when exceeding CHF 716,000
"""
from decimal import Decimal
from typing import Dict
from .base import CantonTaxCalculator

class GraubuendenTaxCalculator(CantonTaxCalculator):
    CANTON_CODE = "GR"
    CANTON_NAME = "Graubünden"

    def __init__(self, tax_year: int = 2024):
        super().__init__(canton_code="GR", tax_year=tax_year)

    def _load_tax_brackets(self) -> Dict:
        """Graubünden 20 progressive brackets (§ 38 StG) for 2024"""
        # These are the 2024 indexed values
        return {
            'single': [
                (Decimal('16895'), Decimal('0.000')),    # 0.0% up to 16,895 (indexed from 15,500)
                (Decimal('17985'), Decimal('0.025')),    # 2.5% next 1,090
                (Decimal('19075'), Decimal('0.040')),    # 4.0% next 1,090
                (Decimal('20165'), Decimal('0.050')),    # 5.0% next 1,090
                (Decimal('21255'), Decimal('0.060')),    # 6.0% next 1,090
                (Decimal('22345'), Decimal('0.065')),    # 6.5% next 1,090
                (Decimal('24525'), Decimal('0.070')),    # 7.0% next 2,180
                (Decimal('31065'), Decimal('0.080')),    # 8.0% next 6,540
                (Decimal('35425'), Decimal('0.085')),    # 8.5% next 4,360
                (Decimal('39785'), Decimal('0.090')),    # 9.0% next 4,360
                (Decimal('44145'), Decimal('0.095')),    # 9.5% next 4,360
                (Decimal('65945'), Decimal('0.103')),    # 10.3% next 21,800
                (Decimal('87745'), Decimal('0.106')),    # 10.6% next 21,800
                (Decimal('109545'), Decimal('0.107')),   # 10.7% next 21,800
                (Decimal('218545'), Decimal('0.112')),   # 11.2% next 109,000
                (Decimal('327545'), Decimal('0.113')),   # 11.3% next 109,000
                (Decimal('436545'), Decimal('0.114')),   # 11.4% next 109,000
                (Decimal('780440'), Decimal('0.116')),   # 11.6% next 343,895
                (Decimal('inf'), Decimal('0.110')),      # 11.0% FLAT on entire income above 780,440
            ],
            'married': [
                (Decimal('16895'), Decimal('0.000')),
                (Decimal('17985'), Decimal('0.025')),
                (Decimal('19075'), Decimal('0.040')),
                (Decimal('20165'), Decimal('0.050')),
                (Decimal('21255'), Decimal('0.060')),
                (Decimal('22345'), Decimal('0.065')),
                (Decimal('24525'), Decimal('0.070')),
                (Decimal('31065'), Decimal('0.080')),
                (Decimal('35425'), Decimal('0.085')),
                (Decimal('39785'), Decimal('0.090')),
                (Decimal('44145'), Decimal('0.095')),
                (Decimal('65945'), Decimal('0.103')),
                (Decimal('87745'), Decimal('0.106')),
                (Decimal('109545'), Decimal('0.107')),
                (Decimal('218545'), Decimal('0.112')),
                (Decimal('327545'), Decimal('0.113')),
                (Decimal('436545'), Decimal('0.114')),
                (Decimal('780440'), Decimal('0.116')),
                (Decimal('inf'), Decimal('0.110')),
            ]
        }

    def _apply_progressive_rates(self, taxable_income: Decimal, brackets: list) -> Decimal:
        """
        Apply GR's progressive rates with special flat-rate rule.

        SPECIAL RULE: Income over CHF 780,440 (indexed from 716,000)
        = flat 11.0% on entire income (not marginal)
        """
        if taxable_income <= 0:
            return Decimal('0')

        # Special flat rate rule for high income
        if taxable_income > Decimal('780440'):
            return (taxable_income * Decimal('0.110')).quantize(Decimal('0.01'))

        # Standard progressive calculation
        tax = Decimal('0')
        previous_limit = Decimal('0')

        for upper_limit, rate in brackets:
            if upper_limit == Decimal('inf'):
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
        """GR uses income splitting for married, no additional adjustments"""
        return tax

    def calculate(self, taxable_income: Decimal, marital_status: str = 'single',
                  num_children: int = 0) -> Dict[str, Decimal]:
        """
        Calculate using GR's divisor 1.9 for married (special rule: NO multiplication back)

        IMPORTANT: Unlike most cantons, GR divides married income by 1.9 but does NOT
        multiply the tax back. The resulting tax is used as-is.
        """
        if marital_status == 'married':
            # Divide income by 1.9 for rate calculation
            income_for_rate = taxable_income / Decimal('1.9')
        else:
            income_for_rate = taxable_income

        brackets = self.tax_brackets['single']  # Same brackets for both
        tax = self._apply_progressive_rates(income_for_rate, brackets)

        # IMPORTANT: Do NOT multiply back for married (unlike other cantons)
        # This is GR's unique system

        return {
            'base_tax': tax,
            'cantonal_tax': tax,
            'canton_multiplier': Decimal('0.95')  # 95%
        }

    def calculate_with_multiplier(self, taxable_income: Decimal, marital_status: str = 'single',
                                   num_children: int = 0, canton_multiplier: Decimal = Decimal('0.95'),
                                   municipal_multiplier: Decimal = Decimal('0.90')) -> Dict[str, Decimal]:
        """Calculate total tax. Default: Chur 90%, Canton 95%"""
        if marital_status == 'married':
            income_for_rate = taxable_income / Decimal('1.9')
        else:
            income_for_rate = taxable_income

        brackets = self.tax_brackets['single']
        simple_tax = self._apply_progressive_rates(income_for_rate, brackets)

        # Do NOT multiply back for married

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
            'municipal_multiplier': municipal_multiplier
        }

    def get_canton_info(self) -> Dict:
        return {
            'canton_code': self.CANTON_CODE,
            'canton_name': self.CANTON_NAME,
            'canton_multiplier': Decimal('0.95'),
            'tax_year': 2024,
            'num_municipalities': 101,
            'special_notes': 'UNIQUE: 20 brackets, ÷1.9 married (NO multiply back), 95% canton, flat 11% >716k'
        }
