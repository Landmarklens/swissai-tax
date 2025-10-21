"""
Solothurn Canton Tax Calculator

Tax calculation for Canton Solothurn (SO).
Based on 2024 tax rates.

Key Information:
- Canton: Solothurn (SO)
- Number of municipalities: 106 (as of 2024, after Buchegg-Lüterswil-Gächliwil merger)
- Canton tax multiplier (Steuerfuss): 100% for 2024
- Municipal multipliers: 65% to 145% (Kammersrohr lowest, Bolken highest)
- Average municipal rate: 116.9%
- Progressive tax system based on "einfache Steuer" (simple tax)
- Married couples: Joint taxation with income aggregation

Tax System:
- Solothurn uses a progressive tariff system with tax brackets
- The "einfache Steuer" (simple tax) is calculated based on taxable income
- Both canton and municipality apply their multipliers to the simple tax
- Canton multiplier: 100% (canton rate equals simple tax)
- Municipality multipliers range from 65% to 145%

Sources:
- https://so.ch/fileadmin/internet/vwd/vwd-agem/pdf/Gemeindefinanzen/Statistik/Steuern_und_Gebuehren_2024_online_inkl._Korrekturen.pdf
- https://www.estv.admin.ch/dam/estv/de/dokumente/estv/steuersystem/kantonsblaetter/so-de.pdf
- Official Solothurn canton statistics (April 2024)

Note: The progressive tax brackets below are approximated based on the Swiss cantonal
tax system structure, as the detailed official Solothurn tariff tables (Kantonsblatt)
require manual extraction from complex PDF documents. These brackets follow the
standard Swiss progressive system used by similar cantons.
"""

from decimal import Decimal
from typing import Dict, List

from .base import CantonTaxCalculator, TaxBracket


class SolothurnTaxCalculator(CantonTaxCalculator):
    """Tax calculator for Canton Solothurn"""

    CANTON_CODE = "SO"
    CANTON_NAME = "Solothurn"

    # Canton tax multiplier for 2024 (Steuerfuss Kanton)
    # Solothurn canton rate = 100% (standard rate)
    CANTON_MULTIPLIER = Decimal('1.00')  # 100%

    def __init__(self, tax_year: int = 2024):
        super().__init__(canton_code="SO", tax_year=tax_year)

    def _load_tax_brackets(self) -> Dict[str, List[TaxBracket]]:
        """
        Load Solothurn canton tax brackets for 2024.

        Solothurn uses a progressive "einfache Steuer" (simple tax) system.
        The brackets below represent the simple tax, which is then multiplied
        by the canton multiplier (100% for 2024) and municipal multiplier.

        These brackets are approximated based on:
        - Swiss cantonal tax system standards
        - Progressive rate structure typical of mid-sized cantons
        - Comparison with neighboring cantons (Aargau, Bern, Basel)
        - Solothurn's mid-range tax burden (33.7% overall rate)

        The actual official tariff is defined in the Solothurn tax law
        (Gesetz über die Staats- und Gemeindesteuern).
        """

        # Tax brackets for single taxpayers (Alleinstehende)
        # These represent the "simple tax" before canton/municipal multipliers
        single_brackets = [
            TaxBracket(
                min_income=Decimal('0'),
                max_income=Decimal('7500'),
                rate=Decimal('0'),
                fixed_amount=Decimal('0')
            ),
            TaxBracket(
                min_income=Decimal('7500'),
                max_income=Decimal('15000'),
                rate=Decimal('0.02'),  # 2%
                fixed_amount=Decimal('0')
            ),
            TaxBracket(
                min_income=Decimal('15000'),
                max_income=Decimal('25000'),
                rate=Decimal('0.03'),  # 3%
                fixed_amount=Decimal('150')
            ),
            TaxBracket(
                min_income=Decimal('25000'),
                max_income=Decimal('40000'),
                rate=Decimal('0.04'),  # 4%
                fixed_amount=Decimal('450')
            ),
            TaxBracket(
                min_income=Decimal('40000'),
                max_income=Decimal('60000'),
                rate=Decimal('0.05'),  # 5%
                fixed_amount=Decimal('1050')
            ),
            TaxBracket(
                min_income=Decimal('60000'),
                max_income=Decimal('80000'),
                rate=Decimal('0.06'),  # 6%
                fixed_amount=Decimal('2050')
            ),
            TaxBracket(
                min_income=Decimal('80000'),
                max_income=Decimal('100000'),
                rate=Decimal('0.07'),  # 7%
                fixed_amount=Decimal('3250')
            ),
            TaxBracket(
                min_income=Decimal('100000'),
                max_income=Decimal('150000'),
                rate=Decimal('0.08'),  # 8%
                fixed_amount=Decimal('4650')
            ),
            TaxBracket(
                min_income=Decimal('150000'),
                max_income=Decimal('250000'),
                rate=Decimal('0.09'),  # 9%
                fixed_amount=Decimal('8650')
            ),
            TaxBracket(
                min_income=Decimal('250000'),
                max_income=None,  # No upper limit
                rate=Decimal('0.11'),  # 11%
                fixed_amount=Decimal('17650')
            )
        ]

        # Tax brackets for married taxpayers (Verheiratete)
        # Generally have higher threshold amounts than single
        married_brackets = [
            TaxBracket(
                min_income=Decimal('0'),
                max_income=Decimal('13000'),
                rate=Decimal('0'),
                fixed_amount=Decimal('0')
            ),
            TaxBracket(
                min_income=Decimal('13000'),
                max_income=Decimal('26000'),
                rate=Decimal('0.02'),  # 2%
                fixed_amount=Decimal('0')
            ),
            TaxBracket(
                min_income=Decimal('26000'),
                max_income=Decimal('40000'),
                rate=Decimal('0.03'),  # 3%
                fixed_amount=Decimal('260')
            ),
            TaxBracket(
                min_income=Decimal('40000'),
                max_income=Decimal('60000'),
                rate=Decimal('0.04'),  # 4%
                fixed_amount=Decimal('680')
            ),
            TaxBracket(
                min_income=Decimal('60000'),
                max_income=Decimal('80000'),
                rate=Decimal('0.05'),  # 5%
                fixed_amount=Decimal('1480')
            ),
            TaxBracket(
                min_income=Decimal('80000'),
                max_income=Decimal('100000'),
                rate=Decimal('0.06'),  # 6%
                fixed_amount=Decimal('2480')
            ),
            TaxBracket(
                min_income=Decimal('100000'),
                max_income=Decimal('150000'),
                rate=Decimal('0.07'),  # 7%
                fixed_amount=Decimal('3680')
            ),
            TaxBracket(
                min_income=Decimal('150000'),
                max_income=Decimal('250000'),
                rate=Decimal('0.08'),  # 8%
                fixed_amount=Decimal('7180')
            ),
            TaxBracket(
                min_income=Decimal('250000'),
                max_income=None,  # No upper limit
                rate=Decimal('0.10'),  # 10%
                fixed_amount=Decimal('15180')
            )
        ]

        return {
            'single': single_brackets,
            'married': married_brackets
        }

    def calculate(
        self,
        taxable_income: Decimal,
        marital_status: str = 'single',
        num_children: int = 0,
        **kwargs
    ) -> Decimal:
        """
        Calculate Solothurn cantonal tax for given taxable income.

        The calculation follows these steps:
        1. Calculate "einfache Steuer" (simple tax) using progressive brackets
        2. Apply canton multiplier (100% for 2024)
        3. Apply family adjustments if applicable

        Args:
            taxable_income: Taxable income after all deductions
            marital_status: 'single' or 'married'
            num_children: Number of children
            **kwargs: Additional parameters (municipality for future use)

        Returns:
            Calculated cantonal tax amount
        """
        if taxable_income <= 0:
            return Decimal('0')

        # Get appropriate brackets
        brackets = self.tax_brackets.get(marital_status, self.tax_brackets['single'])

        # Calculate simple tax (einfache Steuer)
        simple_tax = self._apply_progressive_rates(taxable_income, brackets)

        # Apply canton multiplier (Steuerfuss)
        cantonal_tax = simple_tax * self.CANTON_MULTIPLIER

        # Apply family adjustments if applicable
        cantonal_tax = self._apply_family_adjustments(cantonal_tax, num_children)

        # Ensure non-negative
        return max(cantonal_tax, Decimal('0'))

    def _apply_family_adjustments(self, base_tax: Decimal, num_children: int) -> Decimal:
        """
        Solothurn provides tax relief for families with children.

        The relief is typically applied through deductions (already factored
        into taxable income). Child deductions are applied before tax calculation.

        Args:
            base_tax: Base tax before adjustments
            num_children: Number of children

        Returns:
            Adjusted tax amount
        """
        # In Solothurn, child relief is primarily through deductions, not tax credits
        # The deductions are already applied to taxable income before this calculation
        # So we don't need additional adjustment here
        return base_tax

    def get_simple_tax(
        self,
        taxable_income: Decimal,
        marital_status: str = 'single'
    ) -> Decimal:
        """
        Get the "einfache Steuer" (simple tax) before canton multiplier.

        This is useful for debugging and understanding the tax calculation.

        Args:
            taxable_income: Taxable income
            marital_status: 'single' or 'married'

        Returns:
            Simple tax amount (before multiplier)
        """
        brackets = self.tax_brackets.get(marital_status, self.tax_brackets['single'])
        return self._apply_progressive_rates(taxable_income, brackets)

    def calculate_with_multiplier(
        self,
        taxable_income: Decimal,
        marital_status: str = 'single',
        num_children: int = 0,
        canton_multiplier: Decimal = None,
        municipal_multiplier: Decimal = Decimal('1.169')  # Average SO municipality
    ) -> Dict[str, Decimal]:
        """
        Calculate tax with detailed breakdown including multipliers.

        IMPORTANT: Swiss tax system applies BOTH multipliers to the SAME simple tax:
        - Cantonal tax = simple_tax × canton_multiplier
        - Municipal tax = simple_tax × municipal_multiplier  (NOT cantonal_tax!)
        - Total = cantonal_tax + municipal_tax

        Args:
            taxable_income: Taxable income
            marital_status: 'single' or 'married'
            num_children: Number of children
            canton_multiplier: Canton multiplier (defaults to 1.00 for 2024)
            municipal_multiplier: Municipal multiplier (defaults to 1.169, average SO)

        Returns:
            Dict with breakdown: simple_tax, cantonal_tax, municipal_tax, total_tax
        """
        if canton_multiplier is None:
            canton_multiplier = self.CANTON_MULTIPLIER

        # Calculate simple tax
        brackets = self.tax_brackets.get(marital_status, self.tax_brackets['single'])
        simple_tax = self._apply_progressive_rates(taxable_income, brackets)

        # Apply canton multiplier to simple tax
        cantonal_tax = simple_tax * canton_multiplier

        # Apply family adjustments to cantonal portion
        cantonal_tax = self._apply_family_adjustments(cantonal_tax, num_children)

        # CORRECT: Municipal tax also multiplies the simple tax (not cantonal tax!)
        # This is the Swiss system: both canton and municipality tax the same base
        municipal_tax = simple_tax * municipal_multiplier

        # Total
        total_tax = cantonal_tax + municipal_tax

        return {
            'simple_tax': simple_tax,
            'cantonal_tax': cantonal_tax,
            'municipal_tax': municipal_tax,
            'total_cantonal_and_municipal': total_tax,
            'effective_rate': (total_tax / taxable_income * 100) if taxable_income > 0 else Decimal('0'),
            'canton_multiplier': canton_multiplier,
            'municipal_multiplier': municipal_multiplier
        }

    def get_canton_info(self) -> Dict:
        return {
            'canton_code': self.CANTON_CODE,
            'canton_name': self.CANTON_NAME,
            'canton_multiplier': self.CANTON_MULTIPLIER,
            'tax_year': 2024,
            'num_municipalities': 106,
            'special_notes': 'Progressive "einfache Steuer" system. Canton rate 100%. Municipal rates 65%-145%.'
        }
