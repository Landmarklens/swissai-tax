"""Base Wealth Tax Calculator

Base class for calculating Swiss wealth tax (Vermögenssteuer) across all cantons.

Wealth tax is levied by cantons and municipalities on net worth (assets minus debts)
as of December 31st each year. Each canton has its own rate structure.

Tax Year: 2024
"""
from abc import ABC, abstractmethod
from decimal import Decimal
from typing import Dict, Optional


class WealthTaxCalculator(ABC):
    """Base class for canton wealth tax calculators"""

    def __init__(self, canton_code: str, tax_year: int = 2024):
        """
        Initialize wealth tax calculator.

        Args:
            canton_code: 2-letter canton code (e.g., 'ZH', 'VD')
            tax_year: Tax year (default 2024)
        """
        self.canton_code = canton_code.upper()
        self.tax_year = tax_year

        # Load tax-free thresholds and rate structure
        self.threshold_single = self._load_threshold_single()
        self.threshold_married = self._load_threshold_married()
        self.rate_structure = self._load_rate_structure()  # 'progressive' or 'proportional'
        self.has_municipal_multiplier = self._load_municipal_multiplier_flag()

    @abstractmethod
    def _load_threshold_single(self) -> Decimal:
        """Load tax-free threshold for single taxpayers"""
        pass

    @abstractmethod
    def _load_threshold_married(self) -> Decimal:
        """Load tax-free threshold for married taxpayers"""
        pass

    @abstractmethod
    def _load_rate_structure(self) -> str:
        """Load rate structure type: 'progressive' or 'proportional'"""
        pass

    @abstractmethod
    def _load_municipal_multiplier_flag(self) -> bool:
        """Check if canton applies municipal multipliers to wealth tax"""
        pass

    @abstractmethod
    def calculate_base_tax(self, taxable_wealth: Decimal, marital_status: str = 'single') -> Decimal:
        """
        Calculate base wealth tax before municipal multiplier.

        Args:
            taxable_wealth: Net wealth after tax-free threshold
            marital_status: 'single' or 'married'

        Returns:
            Base wealth tax amount
        """
        pass

    def calculate(self, net_wealth: Decimal, marital_status: str = 'single') -> Dict[str, Decimal]:
        """
        Calculate wealth tax (canton only, no municipal).

        Args:
            net_wealth: Total net wealth (assets - debts) in CHF
            marital_status: 'single' or 'married'

        Returns:
            Dictionary with:
            - net_wealth: Input net wealth
            - tax_free_threshold: Threshold applied
            - taxable_wealth: Net wealth minus threshold
            - canton_wealth_tax: Canton wealth tax
            - effective_rate: Effective tax rate as percentage
        """
        if net_wealth <= 0:
            return self._zero_result()

        # Apply tax-free threshold
        threshold = self.threshold_married if marital_status == 'married' else self.threshold_single

        # Calculate taxable wealth
        taxable_wealth = max(Decimal('0'), net_wealth - threshold)

        if taxable_wealth == 0:
            return {
                'net_wealth': net_wealth,
                'tax_free_threshold': threshold,
                'taxable_wealth': Decimal('0'),
                'canton_wealth_tax': Decimal('0'),
                'effective_rate': Decimal('0.00')
            }

        # Calculate base tax
        base_tax = self.calculate_base_tax(taxable_wealth, marital_status)

        # Effective rate
        effective_rate = (base_tax / net_wealth * Decimal('100')) if net_wealth > 0 else Decimal('0')

        return {
            'net_wealth': net_wealth.quantize(Decimal('0.01')),
            'tax_free_threshold': threshold,
            'taxable_wealth': taxable_wealth.quantize(Decimal('0.01')),
            'canton_wealth_tax': base_tax.quantize(Decimal('0.01')),
            'effective_rate': effective_rate.quantize(Decimal('0.01'))
        }

    def calculate_with_multiplier(self, net_wealth: Decimal, marital_status: str = 'single',
                                  canton_multiplier: Optional[Decimal] = None,
                                  municipal_multiplier: Optional[Decimal] = None) -> Dict[str, Decimal]:
        """
        Calculate total wealth tax with canton and municipal multipliers.

        Args:
            net_wealth: Total net wealth (assets - debts) in CHF
            marital_status: 'single' or 'married'
            canton_multiplier: Canton multiplier (default: from config)
            municipal_multiplier: Municipal multiplier (default: 0 if not applicable)

        Returns:
            Dictionary with complete wealth tax breakdown
        """
        # Get base calculation
        base_result = self.calculate(net_wealth, marital_status)

        if base_result['canton_wealth_tax'] == 0:
            result = base_result.copy()
            result.update({
                'canton_multiplier': Decimal('0'),
                'municipal_multiplier': Decimal('0'),
                'municipal_wealth_tax': Decimal('0'),
                'total_wealth_tax': Decimal('0'),
                'effective_rate_total': Decimal('0.00')
            })
            return result

        # Apply canton multiplier (if provided)
        base_tax = base_result['canton_wealth_tax']
        if canton_multiplier is not None:
            canton_tax = base_tax * canton_multiplier
        else:
            canton_tax = base_tax  # No multiplier = 100%

        # Apply municipal multiplier (if applicable)
        if self.has_municipal_multiplier and municipal_multiplier is not None:
            municipal_tax = base_tax * municipal_multiplier
        else:
            municipal_tax = Decimal('0')

        total_tax = canton_tax + municipal_tax

        # Effective rate on total wealth
        effective_rate_total = (total_tax / net_wealth * Decimal('100')) if net_wealth > 0 else Decimal('0')

        result = base_result.copy()
        result.update({
            'canton_multiplier': canton_multiplier if canton_multiplier is not None else Decimal('1.00'),
            'canton_wealth_tax_with_multiplier': canton_tax.quantize(Decimal('0.01')),
            'municipal_multiplier': municipal_multiplier if municipal_multiplier is not None else Decimal('0'),
            'municipal_wealth_tax': municipal_tax.quantize(Decimal('0.01')),
            'total_wealth_tax': total_tax.quantize(Decimal('0.01')),
            'effective_rate_total': effective_rate_total.quantize(Decimal('0.01'))
        })

        return result

    def _zero_result(self) -> Dict[str, Decimal]:
        """Return zero result for no wealth"""
        return {
            'net_wealth': Decimal('0'),
            'tax_free_threshold': Decimal('0'),
            'taxable_wealth': Decimal('0'),
            'canton_wealth_tax': Decimal('0'),
            'effective_rate': Decimal('0.00')
        }

    def get_info(self) -> Dict:
        """Get calculator information"""
        return {
            'canton_code': self.canton_code,
            'tax_year': self.tax_year,
            'threshold_single': float(self.threshold_single),
            'threshold_married': float(self.threshold_married),
            'rate_structure': self.rate_structure,
            'has_municipal_multiplier': self.has_municipal_multiplier
        }


class ProgressiveWealthTaxCalculator(WealthTaxCalculator):
    """Wealth tax calculator for cantons with progressive rates"""

    def __init__(self, canton_code: str, tax_year: int = 2024):
        self.brackets = None  # Will be loaded in subclass
        super().__init__(canton_code, tax_year)

    @abstractmethod
    def _load_brackets(self) -> list:
        """
        Load progressive brackets.

        Returns:
            List of tuples: [(wealth_to, rate_per_mille), ...]
            Rate in per mille (‰), e.g., 3.5 = 0.35%
        """
        pass

    def calculate_base_tax(self, taxable_wealth: Decimal, marital_status: str = 'single') -> Decimal:
        """Calculate tax using progressive brackets"""
        if taxable_wealth <= 0:
            return Decimal('0')

        if self.brackets is None:
            self.brackets = self._load_brackets()

        tax = Decimal('0')
        previous_limit = Decimal('0')

        for upper_limit, rate_per_mille in self.brackets:
            if taxable_wealth <= previous_limit:
                break

            # Calculate wealth in this bracket
            if upper_limit is None:  # Top bracket (infinity)
                wealth_in_bracket = taxable_wealth - previous_limit
            else:
                wealth_in_bracket = min(taxable_wealth, upper_limit) - previous_limit

            # Apply rate (convert per mille to decimal: ‰ / 1000)
            rate_decimal = rate_per_mille / Decimal('1000')
            tax += wealth_in_bracket * rate_decimal

            if upper_limit is None or taxable_wealth <= upper_limit:
                break

            previous_limit = upper_limit

        return tax.quantize(Decimal('0.01'))


class ProportionalWealthTaxCalculator(WealthTaxCalculator):
    """Wealth tax calculator for cantons with proportional (flat) rates"""

    def __init__(self, canton_code: str, tax_year: int = 2024):
        self.rate_per_mille = None  # Will be loaded in subclass
        super().__init__(canton_code, tax_year)

    @abstractmethod
    def _load_proportional_rate(self) -> Decimal:
        """
        Load proportional rate.

        Returns:
            Rate in per mille (‰), e.g., 0.6 = 0.06%
        """
        pass

    def calculate_base_tax(self, taxable_wealth: Decimal, marital_status: str = 'single') -> Decimal:
        """Calculate tax using proportional rate"""
        if taxable_wealth <= 0:
            return Decimal('0')

        if self.rate_per_mille is None:
            self.rate_per_mille = self._load_proportional_rate()

        # Convert per mille to decimal: ‰ / 1000
        rate_decimal = self.rate_per_mille / Decimal('1000')

        tax = taxable_wealth * rate_decimal

        return tax.quantize(Decimal('0.01'))
