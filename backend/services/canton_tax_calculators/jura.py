"""Jura Canton Tax Calculator

Source: https://www.estv.admin.ch/dam/estv/de/dokumente/estv/steuersystem/kantonsblaetter/ju-fr.pdf
Municipality rates: https://www.jura.ch/Htdocs/Files/v/3557c2fc0376fd220a118f89a272fa2c78bd77b5753a4df800ed829f9ff792b5.pdf/quotites_2024.pdf
Calculator: https://guichet.jura.ch/ExternalServices/TaxCalculator_v2/calculator.aspx
Tax year: 2024
Municipalities: 50 (down from 53 due to mergers, e.g. Beurnevésin + Bonfol → Basse-Vendline 01.01.2024)

French-speaking canton with progressive tax system
Canton quotité: 100% (canton multiplier = 1.00)
Municipal quotités: variable by commune
Overall effective rates: 36%-42%
Tax rate reductions implemented for 2024-2025
"""
from decimal import Decimal
from typing import Dict
from .base import CantonTaxCalculator

class JuraTaxCalculator(CantonTaxCalculator):
    CANTON_CODE = "JU"
    CANTON_NAME = "Jura"
    CANTON_QUOTITE_2024 = Decimal('1.00')  # 100%

    def __init__(self, tax_year: int = 2024):
        super().__init__(canton_code="JU", tax_year=tax_year)

    def _load_tax_brackets(self) -> Dict:
        """
        Jura progressive brackets for 2024.

        Based on Swiss progressive tax standards and Canton JU official calculator.
        Progressive system with 13 brackets, separate thresholds for married couples.

        Note: Jura implemented tax reductions for 2024-2025.
        """
        return {
            'single': [
                (Decimal('13000'), Decimal('0.000')),    # 0% up to 13,000
                (Decimal('18000'), Decimal('0.015')),    # 1.5% next 5,000
                (Decimal('26000'), Decimal('0.025')),    # 2.5% next 8,000
                (Decimal('35000'), Decimal('0.035')),    # 3.5% next 9,000
                (Decimal('45000'), Decimal('0.045')),    # 4.5% next 10,000
                (Decimal('60000'), Decimal('0.055')),    # 5.5% next 15,000
                (Decimal('78000'), Decimal('0.065')),    # 6.5% next 18,000
                (Decimal('100000'), Decimal('0.075')),   # 7.5% next 22,000
                (Decimal('130000'), Decimal('0.085')),   # 8.5% next 30,000
                (Decimal('170000'), Decimal('0.092')),   # 9.2% next 40,000
                (Decimal('220000'), Decimal('0.097')),   # 9.7% next 50,000
                (Decimal('300000'), Decimal('0.100')),   # 10.0% next 80,000
                (Decimal('inf'), Decimal('0.103')),      # 10.3% above 300,000
            ],
            'married': [
                (Decimal('26000'), Decimal('0.000')),    # 0% up to 26,000
                (Decimal('36000'), Decimal('0.015')),    # 1.5% next 10,000
                (Decimal('52000'), Decimal('0.025')),    # 2.5% next 16,000
                (Decimal('70000'), Decimal('0.035')),    # 3.5% next 18,000
                (Decimal('90000'), Decimal('0.045')),    # 4.5% next 20,000
                (Decimal('120000'), Decimal('0.055')),   # 5.5% next 30,000
                (Decimal('156000'), Decimal('0.065')),   # 6.5% next 36,000
                (Decimal('200000'), Decimal('0.075')),   # 7.5% next 44,000
                (Decimal('260000'), Decimal('0.085')),   # 8.5% next 60,000
                (Decimal('340000'), Decimal('0.092')),   # 9.2% next 80,000
                (Decimal('440000'), Decimal('0.097')),   # 9.7% next 100,000
                (Decimal('600000'), Decimal('0.100')),   # 10.0% next 160,000
                (Decimal('inf'), Decimal('0.103')),      # 10.3% above 600,000
            ]
        }

    def _apply_progressive_rates(self, taxable_income: Decimal, brackets: list) -> Decimal:
        """Apply JU's progressive marginal rates"""
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
        """Calculate JU canton tax using separate brackets for married"""
        brackets = self.tax_brackets.get(marital_status, self.tax_brackets['single'])
        tax = self._apply_progressive_rates(taxable_income, brackets)

        return {
            'base_tax': tax,
            'cantonal_tax': tax,
            'canton_multiplier': self.CANTON_QUOTITE_2024
        }

    def calculate_with_multiplier(self, taxable_income: Decimal, marital_status: str = 'single',
                                   num_children: int = 0, canton_multiplier: Decimal = None,
                                   municipal_multiplier: Decimal = Decimal('1.15')) -> Dict[str, Decimal]:
        """
        Calculate total tax. Default: Delémont (capital) ~115%

        Canton quotité: 100% for 2024
        Municipal quotités: variable by commune (resulting in 36%-42% effective rates)
        """
        if canton_multiplier is None:
            canton_multiplier = self.CANTON_QUOTITE_2024

        brackets = self.tax_brackets.get(marital_status, self.tax_brackets['single'])
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
            'municipal_multiplier': municipal_multiplier
        }

    def get_canton_info(self) -> Dict:
        return {
            'canton_code': self.CANTON_CODE,
            'canton_name': self.CANTON_NAME,
            'canton_multiplier': self.CANTON_QUOTITE_2024,
            'tax_year': 2024,
            'num_municipalities': 50,
            'special_notes': 'French-speaking canton. Progressive system, separate married brackets. Canton quotité 100%. Tax rate reductions for 2024-2025. Municipal quotités variable.'
        }
