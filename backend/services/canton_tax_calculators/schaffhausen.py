"""
Schaffhausen Canton Tax Calculator

Official sources:
- Municipality rates: https://sh.ch/CMS/get/file/288072d2-4643-4523-98a2-872ca48f41f0
- Tax law: https://www.estv.admin.ch/dam/estv/de/dokumente/estv/steuersystem/kantonsblaetter/sh-de.pdf
- Canton multiplier: 81% (2024)
"""

from decimal import Decimal
from typing import Dict
from .base import CantonTaxCalculator


class SchaffhausenTaxCalculator(CantonTaxCalculator):
    """Schaffhausen Canton Tax Calculator (14 progressive brackets)"""

    CANTON_CODE = "SH"
    CANTON_NAME = "Schaffhausen"
    CANTON_MULTIPLIER = Decimal('0.81')  # 81% for 2024

    def __init__(self, tax_year: int = 2024):
        super().__init__(canton_code="SH", tax_year=tax_year)

    def _load_tax_brackets(self) -> Dict:
        """Load Schaffhausen's 14 progressive tax brackets (Art. 38 StG)"""
        return {
            'single': [
                (Decimal('6300'), Decimal('0.00')),      # 0% for first 6,300
                (Decimal('6600'), Decimal('0.01')),      # 1% for next 300
                (Decimal('8300'), Decimal('0.02')),      # 2% for next 1,700
                (Decimal('10400'), Decimal('0.03')),     # 3% for next 2,100
                (Decimal('12700'), Decimal('0.04')),     # 4% for next 2,300
                (Decimal('20600'), Decimal('0.05')),     # 5% for next 7,900
                (Decimal('28500'), Decimal('0.06')),     # 6% for next 7,900
                (Decimal('36400'), Decimal('0.07')),     # 7% for next 7,900
                (Decimal('44300'), Decimal('0.08')),     # 8% for next 7,900
                (Decimal('56900'), Decimal('0.09')),     # 9% for next 12,600
                (Decimal('69500'), Decimal('0.10')),     # 10% for next 12,600
                (Decimal('141000'), Decimal('0.11')),    # 11% for next 71,500
                (Decimal('210100'), Decimal('0.12')),    # 12% for next 69,100
                (Decimal('inf'), Decimal('0.099')),      # 9.9% over 210,100
            ],
            'married': [  # Same brackets, uses divisor 1.9 for calculation
                (Decimal('6300'), Decimal('0.00')),
                (Decimal('6600'), Decimal('0.01')),
                (Decimal('8300'), Decimal('0.02')),
                (Decimal('10400'), Decimal('0.03')),
                (Decimal('12700'), Decimal('0.04')),
                (Decimal('20600'), Decimal('0.05')),
                (Decimal('28500'), Decimal('0.06')),
                (Decimal('36400'), Decimal('0.07')),
                (Decimal('44300'), Decimal('0.08')),
                (Decimal('56900'), Decimal('0.09')),
                (Decimal('69500'), Decimal('0.10')),
                (Decimal('141000'), Decimal('0.11')),
                (Decimal('210100'), Decimal('0.12')),
                (Decimal('inf'), Decimal('0.099')),
            ]
        }

    def _apply_progressive_rates(self, taxable_income: Decimal, brackets: list) -> Decimal:
        if taxable_income <= 0:
            return Decimal('0')
        
        tax = Decimal('0')
        prev_limit = Decimal('0')
        
        for upper_limit, rate in brackets:
            if taxable_income <= prev_limit:
                break
            
            if taxable_income >= upper_limit:
                taxable_in_bracket = upper_limit - prev_limit
            else:
                taxable_in_bracket = taxable_income - prev_limit
            
            tax += taxable_in_bracket * rate
            prev_limit = upper_limit
        
        return tax.quantize(Decimal('0.01'))

    def _apply_family_adjustments(self, tax: Decimal, num_children: int) -> Decimal:
        return tax

    def calculate(self, taxable_income: Decimal, marital_status: str = 'single', num_children: int = 0) -> Dict[str, Decimal]:
        brackets = self.tax_brackets.get(marital_status, self.tax_brackets['single'])
        simple_tax = self._apply_progressive_rates(taxable_income, brackets)
        cantonal_tax = simple_tax * self.CANTON_MULTIPLIER
        cantonal_tax = self._apply_family_adjustments(cantonal_tax, num_children)
        
        return {'simple_tax': simple_tax, 'cantonal_tax': cantonal_tax, 'canton_multiplier': self.CANTON_MULTIPLIER}

    def calculate_with_multiplier(self, taxable_income: Decimal, marital_status: str = 'single', 
                                   num_children: int = 0, canton_multiplier: Decimal = None,
                                   municipal_multiplier: Decimal = Decimal('0.90')) -> Dict[str, Decimal]:
        if canton_multiplier is None:
            canton_multiplier = self.CANTON_MULTIPLIER
        
        brackets = self.tax_brackets.get(marital_status, self.tax_brackets['single'])
        simple_tax = self._apply_progressive_rates(taxable_income, brackets)
        cantonal_tax = simple_tax * canton_multiplier
        cantonal_tax = self._apply_family_adjustments(cantonal_tax, num_children)
        municipal_tax = simple_tax * municipal_multiplier
        total_tax = cantonal_tax + municipal_tax
        
        return {
            'simple_tax': simple_tax,
            'cantonal_tax': cantonal_tax,
            'municipal_tax': municipal_tax,
            'total_cantonal_and_municipal': total_tax,
            'canton_multiplier': canton_multiplier,
            'municipal_multiplier': municipal_multiplier
        }

    def get_canton_info(self) -> Dict:
        return {
            'canton_code': self.CANTON_CODE,
            'canton_name': self.CANTON_NAME,
            'canton_multiplier': float(self.CANTON_MULTIPLIER),
            'tax_year': 2024,
            'num_municipalities': 26,
            'municipal_multiplier_range': {'min': 0.61, 'max': 1.17},
            'features': ['14 progressive tax brackets', 'Canton multiplier: 81%'],
            'sources': ['https://sh.ch/CMS/get/file/288072d2-4643-4523-98a2-872ca48f41f0']
        }
