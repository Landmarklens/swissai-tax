"""
Church Tax Service

Handles Swiss church tax calculations for all 26 cantons.
22 cantons levy church tax, 4 cantons do not (GE, NE, VD, TI).

Church tax is calculated as: Church Tax = Cantonal Tax × Church Tax Rate
Rates vary by canton, municipality/parish, and denomination (Catholic/Reformed/Christian Catholic/Jewish).
"""

from decimal import Decimal
from typing import Dict, List, Optional, Any
from database.connection import execute_one, execute_query
import logging

logger = logging.getLogger(__name__)


class ChurchTaxService:
    """Service for calculating Swiss church tax across all 26 cantons."""

    def __init__(self, tax_year: int = 2025):
        """
        Initialize ChurchTaxService.

        Args:
            tax_year: Tax year for calculations (default 2025)
        """
        self.tax_year = tax_year

    def calculate_church_tax(
        self,
        canton_code: str,
        cantonal_tax: Decimal,
        denomination: str,
        municipality_id: Optional[int] = None,
        municipality_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Calculate church tax for a given canton and denomination.

        Args:
            canton_code: Swiss canton code (e.g., 'ZH', 'BE')
            cantonal_tax: Cantonal tax amount (base for church tax calculation)
            denomination: Religious denomination ('catholic', 'reformed', 'christian_catholic', 'jewish', 'none')
            municipality_id: Optional municipality ID for precise rates
            municipality_name: Optional municipality name

        Returns:
            Dictionary with church tax breakdown:
            {
                'applies': bool,
                'canton': str,
                'denomination': str,
                'cantonal_tax': Decimal,
                'rate_percentage': Decimal,
                'church_tax': Decimal,
                'municipality_name': Optional[str],
                'source': str,
                'canton_info': Dict
            }
        """
        canton_code = canton_code.upper()

        # Check if user belongs to a church
        if denomination == 'none':
            return self._no_church_tax_response(
                canton_code, cantonal_tax, denomination, "user_not_member"
            )

        try:
            # Get canton configuration
            canton_config = self._get_canton_config(canton_code)

            if not canton_config:
                logger.warning(f"No church tax config found for canton {canton_code}")
                return self._no_church_tax_response(
                    canton_code, cantonal_tax, denomination, "canton_not_found"
                )

            # Check if canton levies church tax
            if not canton_config['has_church_tax']:
                return self._no_church_tax_response(
                    canton_code, cantonal_tax, denomination, "canton_no_tax",
                    canton_info=canton_config
                )

            # Check if denomination is recognized
            if denomination not in canton_config['recognized_denominations']:
                logger.info(
                    f"Denomination {denomination} not recognized in canton {canton_code}"
                )
                return self._no_church_tax_response(
                    canton_code, cantonal_tax, denomination, "denomination_not_recognized",
                    canton_info=canton_config
                )

            # Get church tax rate (municipality-specific or canton-level)
            rate_data = self._get_church_tax_rate(
                canton_code, denomination, municipality_id
            )

            if not rate_data:
                logger.warning(
                    f"No church tax rate found for {canton_code}/{denomination}"
                )
                return self._no_church_tax_response(
                    canton_code, cantonal_tax, denomination, "rate_not_found",
                    canton_info=canton_config
                )

            # Calculate church tax
            rate_percentage = Decimal(str(rate_data['rate_percentage']))
            church_tax = cantonal_tax * rate_percentage

            return {
                'applies': True,
                'canton': canton_code,
                'denomination': denomination,
                'cantonal_tax': float(cantonal_tax),
                'rate_percentage': float(rate_percentage),
                'church_tax': float(church_tax),
                'municipality_id': rate_data.get('municipality_id'),
                'municipality_name': rate_data.get('municipality_name') or municipality_name,
                'parish_name': rate_data.get('parish_name'),
                'source': rate_data['source'],
                'official_source': rate_data.get('official_source'),
                'canton_info': canton_config
            }

        except Exception as e:
            logger.error(f"Error calculating church tax: {str(e)}")
            return self._no_church_tax_response(
                canton_code, cantonal_tax, denomination, "calculation_error"
            )

    def _get_canton_config(self, canton_code: str) -> Optional[Dict]:
        """Get canton church tax configuration."""
        query = """
            SELECT canton, has_church_tax, recognized_denominations,
                   calculation_method, notes, official_source
            FROM swisstax.church_tax_config
            WHERE canton = %s AND tax_year = %s
        """

        result = execute_one(query, (canton_code, self.tax_year))

        if not result:
            return None

        return {
            'canton': result['canton'],
            'has_church_tax': result['has_church_tax'],
            'recognized_denominations': result['recognized_denominations'] or [],
            'calculation_method': result['calculation_method'],
            'notes': result['notes'],
            'official_source': result['official_source']
        }

    def _get_church_tax_rate(
        self,
        canton_code: str,
        denomination: str,
        municipality_id: Optional[int] = None
    ) -> Optional[Dict]:
        """
        Get church tax rate for canton/municipality/denomination.

        Tries municipality-specific rate first, falls back to canton-level average.
        """
        # Try municipality-specific rate first
        if municipality_id:
            query = """
                SELECT canton, municipality_id, municipality_name, denomination,
                       rate_percentage, source, parish_name, official_source
                FROM swisstax.church_tax_rates
                WHERE canton = %s
                  AND municipality_id = %s
                  AND denomination = %s
                  AND tax_year = %s
                ORDER BY source DESC  -- Prefer 'official_parish' over 'canton_average'
                LIMIT 1
            """

            result = execute_one(
                query,
                (canton_code, municipality_id, denomination, self.tax_year)
            )

            if result:
                return {
                    'canton': result['canton'],
                    'municipality_id': result['municipality_id'],
                    'municipality_name': result['municipality_name'],
                    'denomination': result['denomination'],
                    'rate_percentage': result['rate_percentage'],
                    'source': result['source'],
                    'parish_name': result['parish_name'],
                    'official_source': result['official_source']
                }

        # Fall back to canton-level average
        query = """
            SELECT canton, municipality_id, municipality_name, denomination,
                   rate_percentage, source, parish_name, official_source
            FROM swisstax.church_tax_rates
            WHERE canton = %s
              AND municipality_id IS NULL
              AND denomination = %s
              AND tax_year = %s
            LIMIT 1
        """

        result = execute_one(
            query,
            (canton_code, denomination, self.tax_year)
        )

        if not result:
            return None

        return {
            'canton': result['canton'],
            'municipality_id': result['municipality_id'],
            'municipality_name': result['municipality_name'],
            'denomination': result['denomination'],
            'rate_percentage': result['rate_percentage'],
            'source': result['source'],
            'parish_name': result['parish_name'],
            'official_source': result['official_source']
        }

    def _no_church_tax_response(
        self,
        canton_code: str,
        cantonal_tax: Decimal,
        denomination: str,
        reason: str,
        canton_info: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Return a no church tax response with reason."""
        return {
            'applies': False,
            'reason': reason,
            'canton': canton_code,
            'denomination': denomination,
            'cantonal_tax': float(cantonal_tax),
            'church_tax': 0.0,
            'canton_info': canton_info
        }

    def get_canton_info(self, canton_code: str) -> Dict[str, Any]:
        """
        Get church tax information for a specific canton.

        Args:
            canton_code: Swiss canton code (e.g., 'ZH', 'BE')

        Returns:
            Dictionary with canton church tax information
        """
        canton_code = canton_code.upper()

        try:
            config = self._get_canton_config(canton_code)

            if not config:
                return {
                    'canton': canton_code,
                    'has_church_tax': False,
                    'error': 'Canton not found'
                }

            # Get all rates for this canton
            query = """
                SELECT denomination, rate_percentage, source, municipality_name
                FROM swisstax.church_tax_rates
                WHERE canton = %s
                  AND tax_year = %s
                  AND municipality_id IS NULL
                ORDER BY denomination
            """

            results = execute_query(query, (canton_code, self.tax_year))

            rates = {}
            for row in results:
                rates[row['denomination']] = {
                    'rate_percentage': float(row['rate_percentage']),
                    'source': row['source']
                }

            return {
                'canton': canton_code,
                'has_church_tax': config['has_church_tax'],
                'recognized_denominations': config['recognized_denominations'],
                'rates': rates,
                'calculation_method': config['calculation_method'],
                'notes': config['notes'],
                'official_source': config['official_source']
            }

        except Exception as e:
            logger.error(f"Error getting canton info: {str(e)}")
            return {
                'canton': canton_code,
                'error': str(e)
            }

    def get_all_cantons_info(self) -> Dict[str, Dict[str, Any]]:
        """
        Get church tax information for all 26 cantons.

        Returns:
            Dictionary with canton codes as keys and info as values
        """
        try:
            query = """
                SELECT canton, has_church_tax, recognized_denominations,
                       calculation_method, notes, official_source
                FROM swisstax.church_tax_config
                WHERE tax_year = %s
                ORDER BY canton
            """

            results = execute_query(query, (self.tax_year,))

            cantons = {}
            for row in results:
                canton_code = row['canton']
                cantons[canton_code] = {
                    'has_church_tax': row['has_church_tax'],
                    'recognized_denominations': row['recognized_denominations'] or [],
                    'calculation_method': row['calculation_method'],
                    'notes': row['notes'],
                    'official_source': row['official_source']
                }

            return cantons

        except Exception as e:
            logger.error(f"Error getting all cantons info: {str(e)}")
            return {}

    def is_church_tax_applicable(
        self,
        canton_code: str,
        denomination: str
    ) -> bool:
        """
        Check if church tax applies for a canton and denomination.

        Args:
            canton_code: Swiss canton code
            denomination: Religious denomination

        Returns:
            True if church tax applies, False otherwise
        """
        if denomination == 'none':
            return False

        canton_code = canton_code.upper()

        try:
            config = self._get_canton_config(canton_code)

            if not config:
                return False

            return (
                config['has_church_tax']
                and denomination in config['recognized_denominations']
            )

        except Exception as e:
            logger.error(f"Error checking church tax applicability: {str(e)}")
            return False

    def compare_cantons(
        self,
        cantonal_tax: Decimal,
        denomination: str,
        canton_codes: Optional[List[str]] = None
    ) -> Dict[str, Dict[str, Any]]:
        """
        Compare church tax across cantons.

        Args:
            cantonal_tax: Cantonal tax amount for comparison
            denomination: Religious denomination
            canton_codes: Optional list of canton codes to compare (default: all)

        Returns:
            Dictionary with canton codes as keys and comparison data as values
        """
        if canton_codes is None:
            canton_codes = [
                'ZH', 'BE', 'LU', 'UR', 'SZ', 'OW', 'NW', 'GL', 'ZG', 'FR',
                'SO', 'BS', 'BL', 'SH', 'AR', 'AI', 'SG', 'GR', 'AG', 'TG',
                'TI', 'VD', 'VS', 'NE', 'GE', 'JU'
            ]

        comparisons = {}

        for canton_code in canton_codes:
            result = self.calculate_church_tax(
                canton_code=canton_code.upper(),
                cantonal_tax=cantonal_tax,
                denomination=denomination
            )

            comparisons[canton_code.upper()] = {
                'applies': result['applies'],
                'church_tax': result['church_tax'],
                'rate_percentage': result.get('rate_percentage', 0.0),
                'notes': result.get('canton_info', {}).get('notes', '')
            }

        return comparisons
