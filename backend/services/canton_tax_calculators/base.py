"""
Base Canton Tax Calculator

Abstract base class for canton-specific tax calculation engines.
Each canton inherits from this and implements canton-specific logic.
"""

import logging
from abc import ABC, abstractmethod
from decimal import Decimal
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class TaxBracket:
    """Represents a single tax bracket"""

    def __init__(
        self,
        min_income: Decimal,
        max_income: Optional[Decimal],
        rate: Decimal,
        fixed_amount: Decimal = Decimal('0')
    ):
        self.min_income = min_income
        self.max_income = max_income
        self.rate = rate
        self.fixed_amount = fixed_amount

    def calculate_tax(self, taxable_income: Decimal) -> Decimal:
        """Calculate tax for this bracket"""
        if taxable_income <= self.min_income:
            return Decimal('0')

        # Income subject to this bracket's rate
        if self.max_income:
            bracket_income = min(taxable_income, self.max_income) - self.min_income
        else:
            bracket_income = taxable_income - self.min_income

        return self.fixed_amount + (bracket_income * self.rate)


class CantonTaxCalculator(ABC):
    """
    Base class for canton-specific tax calculators.

    Each canton implements its own progressive tax rate system.
    """

    def __init__(self, canton_code: str, tax_year: int):
        self.canton = canton_code
        self.tax_year = tax_year
        self.tax_brackets = self._load_tax_brackets()

    @abstractmethod
    def _load_tax_brackets(self) -> Dict[str, List[TaxBracket]]:
        """
        Load tax brackets for this canton.

        Returns:
            Dict with keys 'single', 'married' containing lists of TaxBracket
        """
        pass

    def calculate(
        self,
        taxable_income: Decimal,
        marital_status: str = 'single',
        num_children: int = 0,
        **kwargs
    ) -> Decimal:
        """
        Calculate cantonal tax for given taxable income.

        Args:
            taxable_income: Taxable income after all deductions
            marital_status: 'single' or 'married'
            num_children: Number of children (affects some canton calculations)
            **kwargs: Additional canton-specific parameters

        Returns:
            Calculated cantonal tax amount
        """
        if taxable_income <= 0:
            return Decimal('0')

        # Get appropriate brackets
        brackets = self.tax_brackets.get(marital_status, self.tax_brackets['single'])

        # Apply progressive rates
        total_tax = self._apply_progressive_rates(taxable_income, brackets)

        # Apply family deductions if applicable
        total_tax = self._apply_family_adjustments(total_tax, num_children)

        # Ensure non-negative
        return max(total_tax, Decimal('0'))

    def _apply_progressive_rates(
        self,
        taxable_income: Decimal,
        brackets: List[TaxBracket]
    ) -> Decimal:
        """
        Apply progressive tax brackets to calculate total tax.

        Args:
            taxable_income: Taxable income
            brackets: List of tax brackets

        Returns:
            Total tax amount
        """
        total_tax = Decimal('0')

        for bracket in brackets:
            if taxable_income <= bracket.min_income:
                break

            # Calculate income in this bracket
            if bracket.max_income:
                bracket_income = min(taxable_income, bracket.max_income) - bracket.min_income
            else:
                bracket_income = taxable_income - bracket.min_income

            # Apply rate
            bracket_tax = bracket.fixed_amount + (bracket_income * bracket.rate)
            total_tax = bracket_tax  # Use highest bracket's total

        return total_tax

    def _apply_family_adjustments(
        self,
        base_tax: Decimal,
        num_children: int
    ) -> Decimal:
        """
        Apply family-based tax adjustments.

        Some cantons reduce tax based on number of children.
        Default implementation: no adjustment.
        Override in canton-specific calculators if needed.

        Args:
            base_tax: Base tax before adjustments
            num_children: Number of children

        Returns:
            Adjusted tax amount
        """
        return base_tax

    def get_marginal_rate(self, taxable_income: Decimal, marital_status: str = 'single') -> Decimal:
        """
        Get marginal tax rate for given income level.

        Args:
            taxable_income: Taxable income
            marital_status: 'single' or 'married'

        Returns:
            Marginal tax rate as decimal (e.g., 0.12 for 12%)
        """
        brackets = self.tax_brackets.get(marital_status, self.tax_brackets['single'])

        for bracket in reversed(brackets):
            if taxable_income >= bracket.min_income:
                return bracket.rate

        return Decimal('0')

    def calculate_breakdown(
        self,
        taxable_income: Decimal,
        marital_status: str = 'single',
        num_children: int = 0
    ) -> Dict[str, Any]:
        """
        Calculate tax with detailed breakdown.

        Args:
            taxable_income: Taxable income
            marital_status: Marital status
            num_children: Number of children

        Returns:
            Dict with detailed breakdown
        """
        total_tax = self.calculate(taxable_income, marital_status, num_children)
        marginal_rate = self.get_marginal_rate(taxable_income, marital_status)

        return {
            'canton': self.canton,
            'tax_year': self.tax_year,
            'taxable_income': float(taxable_income),
            'marital_status': marital_status,
            'num_children': num_children,
            'total_tax': float(total_tax),
            'marginal_rate': float(marginal_rate),
            'effective_rate': float(total_tax / taxable_income) if taxable_income > 0 else 0
        }
