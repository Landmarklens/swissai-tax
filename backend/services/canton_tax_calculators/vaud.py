"""Vaud Canton Tax Calculator

Source: https://www.estv.admin.ch/dam/estv/de/dokumente/estv/steuersystem/kantonsblaetter/vd-fr.pdf
Tax brackets: https://www.vd.ch/fileadmin/user_upload/organisation/dfin/aci/fichiers_pdf/Barèmes_revenu_2024.pdf
Municipality rates: https://www.vd.ch/fileadmin/user_upload/themes/territoire/communes/finances_communales/fichiers_xls/Arrêtés_d_imposition_2024.xlsx
Tax year: 2024
Municipalities: 303

French-speaking canton (largest French-speaking canton in Switzerland)
Canton coefficient: 155% (2024, with 3.5% reduction on income tax)
Municipal coefficients: 3%-83% (most communes 49%-81%, some fractions very low)

OFFICIAL CALCULATION METHOD (Family Quotient System):
1. Divide taxable income by family quotient:
   - Single: 1.0
   - Married (no children): 1.8
   - Married + 1 child: 2.3
   - Married + 2 children: 2.8
   - Single parent + 1 child: 1.3
   - Single parent + 2 children: 1.6
   - (Each additional child adds +0.5)
2. Apply single progressive tax table to quotient income
3. Multiply resulting tax by the same quotient
4. Apply canton coefficient (155%) with 3.5% reduction
5. Apply municipal coefficient
"""
from decimal import Decimal
from typing import Dict
from .base import CantonTaxCalculator

class VaudTaxCalculator(CantonTaxCalculator):
    CANTON_CODE = "VD"
    CANTON_NAME = "Vaud"
    CANTON_COEFFICIENT_2024 = Decimal('1.55')  # 155%
    CANTON_REDUCTION_2024 = Decimal('0.965')  # 3.5% reduction = multiply by 96.5%

    # Family quotient factors (official VD system)
    QUOTIENT_SINGLE = Decimal('1.0')
    QUOTIENT_MARRIED = Decimal('1.8')
    QUOTIENT_SINGLE_PARENT_1CHILD = Decimal('1.3')
    QUOTIENT_SINGLE_PARENT_2CHILD = Decimal('1.6')
    QUOTIENT_CHILD_INCREMENT = Decimal('0.5')  # Per additional child

    def __init__(self, canton_code: str = "VD", tax_year: int = 2024):
        super().__init__(canton_code=canton_code, tax_year=tax_year)

    def _get_family_quotient(self, marital_status: str, num_children: int) -> Decimal:
        """
        Calculate family quotient based on marital status and number of children.

        Official VD quotient system:
        - Single: 1.0
        - Married (0 children): 1.8
        - Married (1 child): 2.3 (1.8 + 0.5)
        - Married (2 children): 2.8 (1.8 + 1.0)
        - Single parent (1 child): 1.3
        - Single parent (2 children): 1.6 (1.3 + 0.3, special rule)
        - Each additional child: +0.5
        """
        if marital_status == 'married':
            quotient = self.QUOTIENT_MARRIED
            if num_children > 0:
                quotient += Decimal(num_children) * self.QUOTIENT_CHILD_INCREMENT
        elif marital_status in ['single_parent', 'widowed', 'divorced', 'separated']:
            if num_children == 0:
                quotient = self.QUOTIENT_SINGLE
            elif num_children == 1:
                quotient = self.QUOTIENT_SINGLE_PARENT_1CHILD
            elif num_children == 2:
                quotient = self.QUOTIENT_SINGLE_PARENT_2CHILD
            else:
                # 2+ children: 1.6 + 0.5 per additional child beyond 2
                quotient = self.QUOTIENT_SINGLE_PARENT_2CHILD + \
                          (Decimal(num_children - 2) * self.QUOTIENT_CHILD_INCREMENT)
        else:  # single
            quotient = self.QUOTIENT_SINGLE

        return quotient

    def _load_tax_brackets(self) -> Dict:
        """
        Vaud progressive brackets for 2024 (base tariff at 100%).

        Based on official barème from:
        https://www.vd.ch/fileadmin/user_upload/organisation/dfin/aci/fichiers_pdf/Barèmes_revenu_2024.pdf

        Single progressive table applies to quotient income.
        For married couples, income is divided by quotient BEFORE applying these brackets,
        then tax is multiplied by quotient AFTER calculation.

        Marginal rates extracted from official barème.
        """
        return {
            'single': [
                (Decimal('0'), Decimal('0.0100')),        # 1.00% from 100
                (Decimal('1600'), Decimal('0.0110')),     # 1.10% from 1,700
                (Decimal('2000'), Decimal('0.0120')),     # 1.20%
                (Decimal('2500'), Decimal('0.0130')),     # 1.30%
                (Decimal('3000'), Decimal('0.0140')),     # 1.40%
                (Decimal('3500'), Decimal('0.0170')),     # 1.70%
                (Decimal('5000'), Decimal('0.0200')),     # 2.00%
                (Decimal('10000'), Decimal('0.0318')),    # 3.18%
                (Decimal('20000'), Decimal('0.0476')),    # 4.76%
                (Decimal('30000'), Decimal('0.0573')),    # 5.73%
                (Decimal('40000'), Decimal('0.0630')),    # 6.30%
                (Decimal('50000'), Decimal('0.0684')),    # 6.84%
                (Decimal('60000'), Decimal('0.0710')),    # 7.10%
                (Decimal('80000'), Decimal('0.0770')),    # 7.70%
                (Decimal('100000'), Decimal('0.0810')),   # 8.10%
                (Decimal('150000'), Decimal('0.0960')),   # 9.60%
                (Decimal('200000'), Decimal('0.1089')),   # 10.89%
                (Decimal('250000'), Decimal('0.1157')),   # 11.57%
                (Decimal('300000'), Decimal('0.1170')),   # 11.70%
                (Decimal('inf'), Decimal('0.1550')),      # 15.50% flat above 300k
            ]
        }

    def _apply_progressive_rates(self, taxable_income: Decimal, brackets: list) -> Decimal:
        """Apply VD's progressive marginal rates"""
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
        Calculate VD canton tax using official family quotient system.

        OFFICIAL METHOD:
        1. Calculate family quotient based on marital status & children
        2. Divide income by quotient
        3. Apply single brackets to quotient income
        4. Multiply tax by quotient
        """
        brackets = self.tax_brackets['single']
        quotient = self._get_family_quotient(marital_status, num_children)

        # VD quotient system: income ÷ quotient, calculate tax, multiply tax by quotient
        quotient_income = taxable_income / quotient
        quotient_tax = self._apply_progressive_rates(quotient_income, brackets)
        base_tax = quotient_tax * quotient

        return {
            'base_tax': base_tax,
            'cantonal_tax': base_tax,
            'canton_coefficient': self.CANTON_COEFFICIENT_2024,
            'family_quotient': quotient
        }

    def calculate_with_multiplier(self, taxable_income: Decimal, marital_status: str = 'single',
                                   num_children: int = 0, canton_multiplier: Decimal = None,
                                   municipal_multiplier: Decimal = Decimal('0.785')) -> Dict[str, Decimal]:
        """
        Calculate total tax. Default: Lausanne 78.5%

        Canton coefficient: 155% for 2024 (with 3.5% reduction on income)
        Municipal coefficients: 3%-83% (most 49%-81%)

        Note: The 3.5% reduction applies only to cantonal income tax, not wealth tax.
        """
        if canton_multiplier is None:
            canton_multiplier = self.CANTON_COEFFICIENT_2024

        brackets = self.tax_brackets['single']
        quotient = self._get_family_quotient(marital_status, num_children)

        # VD quotient system
        quotient_income = taxable_income / quotient
        quotient_tax = self._apply_progressive_rates(quotient_income, brackets)
        simple_tax = quotient_tax * quotient

        # Apply canton coefficient with 3.5% reduction for 2024
        cantonal_tax = simple_tax * canton_multiplier * self.CANTON_REDUCTION_2024
        municipal_tax = simple_tax * municipal_multiplier
        total_tax = cantonal_tax + municipal_tax
        effective_rate = (total_tax / taxable_income * 100) if taxable_income > 0 else Decimal('0')

        return {
            'base_tax': simple_tax,
            'cantonal_tax': cantonal_tax,
            'municipal_tax': municipal_tax,
            'total_cantonal_and_municipal': total_tax,
            'effective_rate': effective_rate.quantize(Decimal('0.01')),
            'canton_coefficient': canton_multiplier,
            'canton_reduction': self.CANTON_REDUCTION_2024,
            'municipal_multiplier': municipal_multiplier,
            'family_quotient': quotient
        }

    def get_canton_info(self) -> Dict:
        return {
            'canton_code': self.CANTON_CODE,
            'canton_name': self.CANTON_NAME,
            'canton_multiplier': self.CANTON_COEFFICIENT_2024,
            'canton_reduction': self.CANTON_REDUCTION_2024,
            'tax_year': 2024,
            'num_municipalities': 303,
            'special_notes': 'Largest French-speaking canton. Family quotient system (married÷1.8, +0.5 per child). Canton 155% with 3.5% income reduction. Municipal 3%-83%.'
        }
