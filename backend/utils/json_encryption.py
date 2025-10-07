"""
Utilities for field-level encryption within JSON columns
Allows encrypting only specific sensitive fields within a JSON document
"""
import copy
import json
import logging
from typing import Any, Dict, List, Set

from utils.encryption import get_encryption_service

logger = logging.getLogger(__name__)


class JSONFieldEncryptor:
    """
    Encrypts specific fields within JSON objects
    Useful for partial encryption where only sensitive fields need protection
    """

    def __init__(self):
        self.encryption_service = get_encryption_service()

    def encrypt_fields(self, data: Dict[str, Any], sensitive_fields: Set[str]) -> Dict[str, Any]:
        """
        Encrypt specific fields within a dictionary

        Args:
            data: Dictionary containing data to encrypt
            sensitive_fields: Set of field names to encrypt

        Returns:
            Dictionary with specified fields encrypted
        """
        if not data:
            return data

        # FIXED BUG #13: Use deep copy to avoid mutating nested structures
        encrypted_data = copy.deepcopy(data)

        for field in sensitive_fields:
            if field in encrypted_data and encrypted_data[field] is not None:
                try:
                    # Convert to string and encrypt
                    value = str(encrypted_data[field])
                    encrypted_value = self.encryption_service.encrypt(value)
                    encrypted_data[field] = f"__encrypted__{encrypted_value}"
                    logger.debug(f"Encrypted field: {field}")
                except Exception as e:
                    logger.error(f"Failed to encrypt field {field}: {e}")
                    # Leave field as-is on error
                    pass

        return encrypted_data

    def decrypt_fields(self, data: Dict[str, Any], sensitive_fields: Set[str]) -> Dict[str, Any]:
        """
        Decrypt specific fields within a dictionary

        Args:
            data: Dictionary containing encrypted data
            sensitive_fields: Set of field names to decrypt

        Returns:
            Dictionary with specified fields decrypted
        """
        if not data:
            return data

        # FIXED BUG #13: Use deep copy
        decrypted_data = copy.deepcopy(data)

        for field in sensitive_fields:
            if field in decrypted_data and decrypted_data[field] is not None:
                value = str(decrypted_data[field])

                # Check if value is encrypted
                if value.startswith("__encrypted__"):
                    try:
                        encrypted_value = value.replace("__encrypted__", "", 1)
                        decrypted_value = self.encryption_service.decrypt(encrypted_value)
                        decrypted_data[field] = decrypted_value
                        logger.debug(f"Decrypted field: {field}")
                    except Exception as e:
                        logger.error(f"Failed to decrypt field {field}: {e}")
                        # Leave as-is on error
                        pass

        return decrypted_data

    def encrypt_nested(self, data: Dict[str, Any], field_paths: Set[str]) -> Dict[str, Any]:
        """
        Encrypt fields at any nesting level using dot notation

        Args:
            data: Dictionary with potentially nested structure
            field_paths: Set of field paths in dot notation (e.g., "spouse.first_name")

        Returns:
            Dictionary with specified nested fields encrypted
        """
        if not data:
            return data

        result = data.copy()

        for path in field_paths:
            try:
                self._encrypt_nested_field(result, path.split('.'))
            except Exception as e:
                logger.error(f"Failed to encrypt nested field {path}: {e}")

        return result

    def decrypt_nested(self, data: Dict[str, Any], field_paths: Set[str]) -> Dict[str, Any]:
        """
        Decrypt fields at any nesting level using dot notation

        Args:
            data: Dictionary with potentially nested structure
            field_paths: Set of field paths in dot notation (e.g., "spouse.first_name")

        Returns:
            Dictionary with specified nested fields decrypted
        """
        if not data:
            return data

        result = data.copy()

        for path in field_paths:
            try:
                self._decrypt_nested_field(result, path.split('.'))
            except Exception as e:
                logger.error(f"Failed to decrypt nested field {path}: {e}")

        return result

    def _encrypt_nested_field(self, data: Dict[str, Any], path_parts: List[str]) -> None:
        """Helper to encrypt a nested field in place"""
        if len(path_parts) == 1:
            # Reached target field
            field = path_parts[0]
            if field in data and data[field] is not None:
                value = str(data[field])
                encrypted_value = self.encryption_service.encrypt(value)
                data[field] = f"__encrypted__{encrypted_value}"
        else:
            # Navigate deeper
            current_field = path_parts[0]
            if current_field in data and isinstance(data[current_field], dict):
                self._encrypt_nested_field(data[current_field], path_parts[1:])

    def _decrypt_nested_field(self, data: Dict[str, Any], path_parts: List[str]) -> None:
        """Helper to decrypt a nested field in place"""
        if len(path_parts) == 1:
            # Reached target field
            field = path_parts[0]
            if field in data and data[field] is not None:
                value = str(data[field])
                if value.startswith("__encrypted__"):
                    encrypted_value = value.replace("__encrypted__", "", 1)
                    decrypted_value = self.encryption_service.decrypt(encrypted_value)
                    data[field] = decrypted_value
        else:
            # Navigate deeper
            current_field = path_parts[0]
            if current_field in data and isinstance(data[current_field], dict):
                self._decrypt_nested_field(data[current_field], path_parts[1:])


# Tax-specific field encryptor with predefined sensitive fields
class TaxProfileEncryptor(JSONFieldEncryptor):
    """
    Specialized encryptor for tax profile JSON data
    Knows which fields in a tax profile are sensitive
    """

    # Define sensitive fields for tax profiles
    SENSITIVE_FIELDS = {
        'municipality',          # Location data
        'pillar_3a_amount',      # Financial data
        'donation_amount',       # Financial data
        'alimony_amount',        # Financial data
        'medical_expense_amount', # Financial data
    }

    # Define sensitive nested fields
    SENSITIVE_NESTED_FIELDS = {
        'spouse.first_name',
        'spouse.last_name',
        'spouse.date_of_birth',
    }

    def encrypt_profile(self, profile: Dict[str, Any]) -> Dict[str, Any]:
        """
        Encrypt all sensitive fields in a tax profile

        Args:
            profile: Tax profile dictionary

        Returns:
            Profile with sensitive fields encrypted
        """
        # First encrypt top-level fields
        result = self.encrypt_fields(profile, self.SENSITIVE_FIELDS)

        # Then encrypt nested fields
        result = self.encrypt_nested(result, self.SENSITIVE_NESTED_FIELDS)

        return result

    def decrypt_profile(self, profile: Dict[str, Any]) -> Dict[str, Any]:
        """
        Decrypt all sensitive fields in a tax profile

        Args:
            profile: Tax profile with encrypted fields

        Returns:
            Profile with sensitive fields decrypted
        """
        # First decrypt nested fields
        result = self.decrypt_nested(profile, self.SENSITIVE_NESTED_FIELDS)

        # Then decrypt top-level fields
        result = self.decrypt_fields(result, self.SENSITIVE_FIELDS)

        return result


# Singleton instances
_json_field_encryptor = None
_tax_profile_encryptor = None


def get_json_field_encryptor() -> JSONFieldEncryptor:
    """Get or create JSON field encryptor instance"""
    global _json_field_encryptor
    if _json_field_encryptor is None:
        _json_field_encryptor = JSONFieldEncryptor()
    return _json_field_encryptor


def get_tax_profile_encryptor() -> TaxProfileEncryptor:
    """Get or create tax profile encryptor instance"""
    global _tax_profile_encryptor
    if _tax_profile_encryptor is None:
        _tax_profile_encryptor = TaxProfileEncryptor()
    return _tax_profile_encryptor
