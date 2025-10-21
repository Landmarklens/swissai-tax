"""Valais (VS) Canton Tax Calculator

Source: https://www.estv.admin.ch/estv/de/home/die-estv/steuersystem-schweiz/kantonsblaetter.html
Municipality rates: https://www.vs.ch/web/scc/baremes-canton-communes
Kantonsblatt: https://www.estv.admin.ch/dam/estv/de/dokumente/estv/steuersystem/kantonsblaetter/vs-fr.pdf
Tax table: IC_167.pdf (Canton indexation 167% for 2024)
Tax year: 2024
Municipalities: 121 (as of 2024, down from 126 due to mergers)

Bilingual canton (German: Wallis / French: Valais)
Progressive tax system using lookup tables with canton AND municipal coefficients
- Canton indexation: 167% for 2024 (applied to base tariff)
- Municipal multipliers: 1.00 to 1.45 (coefficient)
- Municipal indexations: 110% to 176% (variable by municipality)

UNIQUE SYSTEM:
VS uses a dual-multiplier system:
1. Canton indexation (167% for 2024) - fixed for the tax year
2. Municipal coefficient × municipal indexation (variable per municipality)

Tax Calculation:
- Base tax is calculated from progressive tariff
- Cantonal tax = base tax × canton indexation (167%)
- Municipal tax = base tax × municipal coefficient × municipal indexation
- Total tax = cantonal tax + municipal tax

Example (Sion: coefficient 1.10, indexation 173%):
- If base tax = CHF 100
- Cantonal: CHF 100 × 1.67 = CHF 167
- Municipal: CHF 100 × 1.10 × 1.73 = CHF 190.30
- Total: CHF 357.30
"""
from decimal import Decimal
from typing import Dict
from .base import CantonTaxCalculator

class ValaisTaxCalculator(CantonTaxCalculator):
    CANTON_CODE = "VS"
    CANTON_NAME = "Valais"  # German: Wallis
    CANTON_INDEXATION_2024 = Decimal('1.67')  # 167%

    def __init__(self, tax_year: int = 2024):
        super().__init__(canton_code="VS", tax_year=tax_year)

    def _load_tax_brackets(self) -> Dict:
        """
        VS progressive tax brackets (base tariff, before indexation).

        These brackets are derived from the official IC_167 lookup table
        by reverse-engineering the base rates (dividing by 1.67).

        The official system uses lookup tables rather than explicit brackets,
        but we approximate with progressive marginal rates for calculation.
        """
        return {
            'single': [
                # Low income: ~2% base rate
                (Decimal('9400'), Decimal('0.0200')),    # 2.0% up to 9,400
                # Progressive increase
                (Decimal('15000'), Decimal('0.0280')),   # 2.8% next bracket
                (Decimal('25000'), Decimal('0.0350')),   # 3.5%
                (Decimal('40000'), Decimal('0.0420')),   # 4.2%
                (Decimal('60000'), Decimal('0.0500')),   # 5.0%
                (Decimal('80000'), Decimal('0.0580')),   # 5.8%
                (Decimal('100000'), Decimal('0.0650')),  # 6.5%
                (Decimal('150000'), Decimal('0.0720')),  # 7.2%
                (Decimal('200000'), Decimal('0.0780')),  # 7.8%
                (Decimal('300000'), Decimal('0.0830')),  # 8.3%
                (Decimal('inf'), Decimal('0.0870')),     # 8.7% above 300k
            ],
            'married': [
                # Married couples - lower rates (approximately quotient conjugal 2.0)
                (Decimal('18000'), Decimal('0.0180')),   # 1.8% up to 18,000
                (Decimal('30000'), Decimal('0.0250')),   # 2.5%
                (Decimal('50000'), Decimal('0.0320')),   # 3.2%
                (Decimal('80000'), Decimal('0.0390')),   # 3.9%
                (Decimal('120000'), Decimal('0.0460')),  # 4.6%
                (Decimal('160000'), Decimal('0.0530')),  # 5.3%
                (Decimal('200000'), Decimal('0.0600')),  # 6.0%
                (Decimal('300000'), Decimal('0.0670')),  # 6.7%
                (Decimal('400000'), Decimal('0.0730')),  # 7.3%
                (Decimal('600000'), Decimal('0.0780')),  # 7.8%
                (Decimal('inf'), Decimal('0.0820')),     # 8.2% above 600k
            ]
        }

    def _apply_progressive_rates(self, taxable_income: Decimal, brackets: list) -> Decimal:
        """Apply VS progressive marginal rates to calculate base tax"""
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
        """VS uses separate brackets for married, no additional child adjustments in tax calculation"""
        return tax

    def calculate(self, taxable_income: Decimal, marital_status: str = 'single',
                  num_children: int = 0) -> Dict[str, Decimal]:
        """
        Calculate VS base tax (before indexation/multipliers).

        This returns the theoretical base tax. In practice, the canton publishes
        lookup tables at various indexation levels (e.g., IC_167 for 167%).
        """
        brackets = self.tax_brackets.get(marital_status, self.tax_brackets['single'])
        base_tax = self._apply_progressive_rates(taxable_income, brackets)

        return {
            'base_tax': base_tax,
            'cantonal_tax': base_tax * self.CANTON_INDEXATION_2024,
            'canton_indexation': self.CANTON_INDEXATION_2024
        }

    def calculate_with_multiplier(self, taxable_income: Decimal, marital_status: str = 'single',
                                   num_children: int = 0,
                                   canton_multiplier: Decimal = None,  # Not used - fixed indexation
                                   municipal_multiplier: Decimal = Decimal('1.10'),  # Default: Sion coefficient
                                   municipal_indexation: Decimal = Decimal('1.73')) -> Dict[str, Decimal]:
        """
        Calculate total VS tax with canton + municipal components.

        VS UNIQUE DUAL-MULTIPLIER SYSTEM:
        - Canton indexation: Fixed at 167% for 2024
        - Municipal: coefficient × indexation (both vary by municipality)

        Default values: Sion (capital)
        - Municipal coefficient: 1.10
        - Municipal indexation: 173%

        Args:
            taxable_income: Taxable income in CHF
            marital_status: 'single' or 'married'
            num_children: Number of children (for documentation only)
            canton_multiplier: Ignored - VS uses fixed indexation
            municipal_multiplier: Municipal coefficient (1.00-1.45)
            municipal_indexation: Municipal indexation percentage as decimal (1.10-1.76)
        """
        brackets = self.tax_brackets.get(marital_status, self.tax_brackets['single'])
        base_tax = self._apply_progressive_rates(taxable_income, brackets)

        # VS dual-multiplier system
        cantonal_tax = base_tax * self.CANTON_INDEXATION_2024
        municipal_tax = base_tax * municipal_multiplier * municipal_indexation
        total_tax = cantonal_tax + municipal_tax
        effective_rate = (total_tax / taxable_income * 100) if taxable_income > 0 else Decimal('0')

        return {
            'base_tax': base_tax,
            'cantonal_tax': cantonal_tax,
            'municipal_tax': municipal_tax,
            'total_cantonal_and_municipal': total_tax,
            'effective_rate': effective_rate.quantize(Decimal('0.01')),
            'canton_indexation': self.CANTON_INDEXATION_2024,
            'municipal_coefficient': municipal_multiplier,
            'municipal_indexation': municipal_indexation
        }

    def get_canton_info(self) -> Dict:
        return {
            'canton_code': self.CANTON_CODE,
            'canton_name': self.CANTON_NAME,
            'canton_name_de': 'Wallis',
            'canton_indexation': self.CANTON_INDEXATION_2024,
            'tax_year': 2024,
            'num_municipalities': 121,
            'bilingual': True,
            'languages': ['French', 'German'],
            'special_notes': (
                'Bilingual canton (Valais/Wallis). UNIQUE dual-multiplier system: '
                'fixed canton indexation (167%) + variable municipal coefficient×indexation (1.00-1.45 × 110%-176%). '
                'Progressive base tariff. Tax = base × 1.67 + base × coeff × index_munic'
            )
        }
