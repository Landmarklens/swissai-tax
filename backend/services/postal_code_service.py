"""
Swiss Postal Code Service
Maps Swiss postal codes to municipalities and cantons
"""
import logging
import re
from typing import Dict, Optional, Tuple

import requests

logger = logging.getLogger(__name__)


class PostalCodeService:
    """Service for looking up Swiss municipalities and cantons from postal codes"""

    # Swiss postal codes are 4 digits
    POSTAL_CODE_PATTERN = re.compile(r'^\d{4}$')

    # Nominatim API (OpenStreetMap) for geocoding
    NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

    # Canton code to full name mapping (multiple language variants)
    CANTON_NAMES = {
        'AG': 'Aargau', 'AI': 'Appenzell Innerrhoden', 'AR': 'Appenzell Ausserrhoden',
        'BE': 'Bern', 'BL': 'Basel-Landschaft', 'BS': 'Basel-Stadt',
        'FR': 'Fribourg', 'GE': 'Geneva', 'GL': 'Glarus',
        'GR': 'Graubünden', 'JU': 'Jura', 'LU': 'Luzern',
        'NE': 'Neuchâtel', 'NW': 'Nidwalden', 'OW': 'Obwalden',
        'SG': 'St. Gallen', 'SH': 'Schaffhausen', 'SO': 'Solothurn',
        'SZ': 'Schwyz', 'TG': 'Thurgau', 'TI': 'Ticino',
        'UR': 'Uri', 'VD': 'Vaud', 'VS': 'Valais', 'ZG': 'Zug', 'ZH': 'Zürich'
    }

    # Alternative canton names (French, Italian, Romansh variants)
    CANTON_VARIANTS = {
        'genève': 'GE', 'geneva': 'GE', 'ginevra': 'GE',
        'zürich': 'ZH', 'zurich': 'ZH', 'zurigo': 'ZH',
        'berne': 'BE', 'bern': 'BE', 'berna': 'BE',
        'lucerne': 'LU', 'luzern': 'LU', 'lucerna': 'LU',
        'fribourg': 'FR', 'freiburg': 'FR',
        'neuchâtel': 'NE', 'neuenburg': 'NE',
        'valais': 'VS', 'wallis': 'VS', 'vallese': 'VS',
        'vaud': 'VD', 'waadt': 'VD',
        'ticino': 'TI', 'tessin': 'TI',
        'graubünden': 'GR', 'grisons': 'GR', 'grigioni': 'GR',
        'st. gallen': 'SG', 'sankt gallen': 'SG', 'san gallo': 'SG',
        'aargau': 'AG', 'argovie': 'AG', 'argovia': 'AG',
        'thurgau': 'TG', 'thurgovie': 'TG', 'turgovia': 'TG',
        'schaffhausen': 'SH', 'schaffhouse': 'SH', 'sciaffusa': 'SH',
        'basel-stadt': 'BS', 'bâle-ville': 'BS', 'basilea-città': 'BS',
        'basel-landschaft': 'BL', 'bâle-campagne': 'BL', 'basilea-campagna': 'BL',
        'solothurn': 'SO', 'soleure': 'SO', 'soletta': 'SO',
        'glarus': 'GL', 'glaris': 'GL', 'glarona': 'GL',
        'zug': 'ZG', 'zoug': 'ZG', 'zugo': 'ZG',
        'schwyz': 'SZ', 'schwytz': 'SZ', 'svitto': 'SZ',
        'uri': 'UR',
        'obwalden': 'OW', 'obwald': 'OW', 'obvaldo': 'OW',
        'nidwalden': 'NW', 'nidwald': 'NW', 'nidvaldo': 'NW',
        'appenzell ausserrhoden': 'AR', 'appenzell rhodes-extérieures': 'AR',
        'appenzell innerrhoden': 'AI', 'appenzell rhodes-intérieures': 'AI',
        'jura': 'JU', 'giura': 'JU'
    }

    def __init__(self):
        """Initialize postal code service"""
        self.session = requests.Session()
        # Nominatim requires User-Agent
        self.session.headers.update({
            'User-Agent': 'SwissAI-Tax/1.0 (tax filing application)'
        })

    def validate_postal_code(self, postal_code: str) -> Tuple[bool, Optional[str]]:
        """
        Validate Swiss postal code format

        Args:
            postal_code: Postal code to validate

        Returns:
            Tuple of (is_valid, error_message)
        """
        if not postal_code:
            return False, "Postal code is required"

        # Remove any whitespace
        postal_code = postal_code.strip()

        if not self.POSTAL_CODE_PATTERN.match(postal_code):
            return False, "Swiss postal code must be exactly 4 digits"

        # Check if in valid range (1000-9999)
        code_int = int(postal_code)
        if code_int < 1000 or code_int > 9999:
            return False, "Postal code must be between 1000 and 9999"

        return True, None

    def lookup_postal_code(self, postal_code: str) -> Optional[Dict[str, str]]:
        """
        Look up municipality and canton from postal code

        Args:
            postal_code: 4-digit Swiss postal code

        Returns:
            Dict with:
                - postal_code: The postal code
                - municipality: Municipality name
                - canton: Canton code (2 letters)
                - canton_name: Full canton name
                - formatted_address: Full formatted address
            Or None if not found
        """
        # Validate postal code
        is_valid, error = self.validate_postal_code(postal_code)
        if not is_valid:
            logger.warning(f"Invalid postal code: {postal_code} - {error}")
            return None

        postal_code = postal_code.strip()

        try:
            # Query Nominatim for the postal code in Switzerland
            params = {
                'postalcode': postal_code,
                'country': 'Switzerland',
                'format': 'json',
                'addressdetails': 1,
                'limit': 1
            }

            response = self.session.get(
                self.NOMINATIM_URL,
                params=params,
                timeout=5
            )
            response.raise_for_status()

            data = response.json()

            if not data or len(data) == 0:
                logger.warning(f"No results found for postal code: {postal_code}")
                return None

            result = data[0]
            address = result.get('address', {})

            # Extract municipality (can be in different fields)
            municipality = (
                address.get('city') or
                address.get('town') or
                address.get('village') or
                address.get('municipality') or
                address.get('suburb')
            )

            if not municipality:
                logger.warning(f"Could not extract municipality for postal code: {postal_code}")
                return None

            # Extract canton code from state
            state = address.get('state', '')
            canton_code = self._extract_canton_code(state)

            if not canton_code:
                logger.warning(f"Could not extract canton for postal code: {postal_code}")
                return None

            return {
                'postal_code': postal_code,
                'municipality': municipality,
                'canton': canton_code,
                'canton_name': self.CANTON_NAMES.get(canton_code, state),
                'formatted_address': result.get('display_name', f"{postal_code} {municipality}, Switzerland")
            }

        except requests.RequestException as e:
            logger.error(f"Error looking up postal code {postal_code}: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error looking up postal code {postal_code}: {e}", exc_info=True)
            return None

    def _extract_canton_code(self, state_name: str) -> Optional[str]:
        """
        Extract 2-letter canton code from state name

        Args:
            state_name: Full canton name or code (in any language)

        Returns:
            2-letter canton code or None
        """
        if not state_name:
            return None

        # If already a 2-letter code, return it
        if len(state_name) == 2 and state_name.upper() in self.CANTON_NAMES:
            return state_name.upper()

        # Normalize the state name
        state_lower = state_name.lower().strip()

        # Try exact match in variants first
        if state_lower in self.CANTON_VARIANTS:
            return self.CANTON_VARIANTS[state_lower]

        # Try to match full name from CANTON_NAMES
        for code, name in self.CANTON_NAMES.items():
            if name.lower() == state_lower:
                return code

        # Try partial match in CANTON_NAMES
        for code, name in self.CANTON_NAMES.items():
            if name.lower() in state_lower or state_lower in name.lower():
                return code

        # Try partial match in variants
        for variant, code in self.CANTON_VARIANTS.items():
            if variant in state_lower or state_lower in variant:
                return code

        return None

    def batch_lookup(self, postal_codes: list) -> Dict[str, Optional[Dict[str, str]]]:
        """
        Look up multiple postal codes

        Args:
            postal_codes: List of postal codes

        Returns:
            Dict mapping postal code to result
        """
        results = {}
        for postal_code in postal_codes:
            results[postal_code] = self.lookup_postal_code(postal_code)
        return results


# Singleton instance
_postal_code_service = None


def get_postal_code_service() -> PostalCodeService:
    """Get singleton instance of PostalCodeService"""
    global _postal_code_service
    if _postal_code_service is None:
        _postal_code_service = PostalCodeService()
    return _postal_code_service
