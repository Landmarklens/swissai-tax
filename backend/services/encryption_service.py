"""Encryption service for sensitive data storage"""

import os
import base64
import hashlib
import json
from typing import Any, Optional, Union
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2
from cryptography.hazmat.backends import default_backend
import logging

logger = logging.getLogger(__name__)


class EncryptionService:
    """Service for encrypting/decrypting sensitive data"""

    # Fields that should always be encrypted
    SENSITIVE_FIELDS = {
        'ahv_number',
        'social_security_number',
        'bank_account_number',
        'iban',
        'credit_card_number',
        'passport_number',
        'tax_number',
        'birth_date',
        'salary',
        'gross_salary',
        'net_salary',
        'bank_balance',
        'investment_value',
        'medical_records',
        'password',
        'pin',
        'private_key',
        'api_key',
        'secret_key'
    }

    def __init__(self, encryption_key: Optional[str] = None):
        """
        Initialize encryption service

        Args:
            encryption_key: Base64 encoded encryption key or None to use from environment
        """
        if encryption_key:
            self.cipher = Fernet(encryption_key.encode() if isinstance(encryption_key, str) else encryption_key)
        else:
            # Get or generate encryption key
            key = self._get_or_create_key()
            self.cipher = Fernet(key)

    def _get_or_create_key(self) -> bytes:
        """Get encryption key from environment or create one"""
        key_env = os.environ.get('ENCRYPTION_KEY')

        if key_env:
            # Decode from base64
            return base64.urlsafe_b64decode(key_env)

        # Generate a new key from a master password (should be in secure storage)
        master_password = os.environ.get('MASTER_PASSWORD', 'SwissAI-Tax-2024-Secure-Key!')

        # Use PBKDF2 to derive a key from the password
        kdf = PBKDF2(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b'SwissAI-Tax-Salt-2024',  # In production, use a random salt per user
            iterations=100000,
            backend=default_backend()
        )

        key = base64.urlsafe_b64encode(kdf.derive(master_password.encode()))

        # Log warning if using default password
        if master_password == 'SwissAI-Tax-2024-Secure-Key!':
            logger.warning("Using default encryption password. Set MASTER_PASSWORD environment variable!")

        return key

    def encrypt(self, data: Union[str, dict, Any]) -> str:
        """
        Encrypt data and return base64 encoded string

        Args:
            data: Data to encrypt (string, dict, or any JSON-serializable object)

        Returns:
            Base64 encoded encrypted string
        """
        try:
            # Convert to string if needed
            if isinstance(data, dict):
                data_str = json.dumps(data)
            elif not isinstance(data, str):
                data_str = str(data)
            else:
                data_str = data

            # Encrypt
            encrypted = self.cipher.encrypt(data_str.encode())

            # Return base64 encoded
            return base64.urlsafe_b64encode(encrypted).decode()

        except Exception as e:
            logger.error(f"Encryption failed: {e}")
            raise ValueError("Failed to encrypt data")

    def decrypt(self, encrypted_data: str) -> Union[str, dict]:
        """
        Decrypt base64 encoded encrypted data

        Args:
            encrypted_data: Base64 encoded encrypted string

        Returns:
            Decrypted data (string or dict if JSON)
        """
        try:
            # Decode from base64
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_data.encode())

            # Decrypt
            decrypted = self.cipher.decrypt(encrypted_bytes).decode()

            # Try to parse as JSON
            try:
                return json.loads(decrypted)
            except json.JSONDecodeError:
                return decrypted

        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            raise ValueError("Failed to decrypt data")

    def encrypt_dict(self, data: dict, fields_to_encrypt: Optional[list] = None) -> dict:
        """
        Encrypt specific fields in a dictionary

        Args:
            data: Dictionary containing data
            fields_to_encrypt: List of field names to encrypt (None = auto-detect sensitive fields)

        Returns:
            Dictionary with encrypted fields
        """
        encrypted_data = data.copy()

        # Determine which fields to encrypt
        if fields_to_encrypt is None:
            # Auto-detect sensitive fields
            fields_to_encrypt = [
                field for field in data.keys()
                if any(sensitive in field.lower() for sensitive in self.SENSITIVE_FIELDS)
            ]

        # Encrypt specified fields
        for field in fields_to_encrypt:
            if field in data and data[field] is not None:
                # Add prefix to indicate encrypted field
                encrypted_data[f"encrypted_{field}"] = self.encrypt(data[field])
                # Remove original field or replace with masked value
                encrypted_data[field] = "***ENCRYPTED***"

        return encrypted_data

    def decrypt_dict(self, data: dict) -> dict:
        """
        Decrypt encrypted fields in a dictionary

        Args:
            data: Dictionary with encrypted fields

        Returns:
            Dictionary with decrypted fields
        """
        decrypted_data = data.copy()

        # Find and decrypt encrypted fields
        for field, value in data.items():
            if field.startswith('encrypted_'):
                original_field = field.replace('encrypted_', '')
                try:
                    decrypted_data[original_field] = self.decrypt(value)
                    # Remove encrypted field
                    del decrypted_data[field]
                except Exception as e:
                    logger.warning(f"Failed to decrypt field {field}: {e}")

        return decrypted_data

    def hash_value(self, value: str, salt: Optional[str] = None) -> str:
        """
        Create a one-way hash of a value (for comparison without storing original)

        Args:
            value: Value to hash
            salt: Optional salt (will be generated if not provided)

        Returns:
            Hashed value with salt
        """
        if salt is None:
            salt = base64.urlsafe_b64encode(os.urandom(16)).decode()

        # Combine value and salt
        value_with_salt = f"{value}{salt}"

        # Create hash
        hash_obj = hashlib.sha256(value_with_salt.encode())
        hashed = base64.urlsafe_b64encode(hash_obj.digest()).decode()

        # Return hash with salt (separated by $)
        return f"{salt}${hashed}"

    def verify_hash(self, value: str, hashed_value: str) -> bool:
        """
        Verify a value against a hash

        Args:
            value: Value to verify
            hashed_value: Hash to compare against (format: salt$hash)

        Returns:
            True if value matches hash
        """
        try:
            # Extract salt and hash
            salt, hash_part = hashed_value.split('$')

            # Hash the value with the same salt
            new_hash = self.hash_value(value, salt)

            # Compare
            return new_hash == hashed_value

        except Exception as e:
            logger.error(f"Hash verification failed: {e}")
            return False

    def mask_sensitive_data(self, value: str, field_type: str = 'default') -> str:
        """
        Mask sensitive data for display purposes

        Args:
            value: Value to mask
            field_type: Type of field (ahv, iban, phone, email, default)

        Returns:
            Masked value
        """
        if not value:
            return value

        if field_type == 'ahv':
            # Show first 3 and last 2 digits: 756.XXXX.XXXX.XX
            if len(value) >= 13:
                return f"{value[:3]}.XXXX.XXXX.{value[-2:]}"

        elif field_type == 'iban':
            # Show country and last 4: CH93 XXXX XXXX XXXX X000 0
            if len(value) >= 8:
                return f"{value[:4]} {'X' * (len(value) - 8)} {value[-4:]}"

        elif field_type == 'phone':
            # Show area code and last 2: +41 XX XXX XX 34
            if len(value) >= 5:
                return f"{value[:3]} {'X' * (len(value) - 5)} {value[-2:]}"

        elif field_type == 'email':
            # Show first 2 chars and domain: ab***@domain.com
            if '@' in value:
                local, domain = value.split('@')
                if len(local) > 2:
                    return f"{local[:2]}{'*' * (len(local) - 2)}@{domain}"
                return f"{'*' * len(local)}@{domain}"

        # Default masking - show first and last character
        if len(value) > 2:
            return f"{value[0]}{'*' * (len(value) - 2)}{value[-1]}"
        else:
            return '*' * len(value)


class SecureDataStore:
    """Wrapper for secure data storage with automatic encryption"""

    def __init__(self, encryption_service: EncryptionService):
        self.encryption = encryption_service

    def prepare_for_storage(self, data: dict) -> dict:
        """
        Prepare data for storage by encrypting sensitive fields

        Args:
            data: Data to prepare

        Returns:
            Data with encrypted sensitive fields
        """
        # Identify sensitive fields
        sensitive_fields = []
        for field in data.keys():
            # Check if field name indicates sensitive data
            field_lower = field.lower()
            if any(sensitive in field_lower for sensitive in EncryptionService.SENSITIVE_FIELDS):
                sensitive_fields.append(field)

        # Encrypt sensitive fields
        if sensitive_fields:
            return self.encryption.encrypt_dict(data, sensitive_fields)

        return data

    def retrieve_from_storage(self, data: dict) -> dict:
        """
        Retrieve data from storage by decrypting sensitive fields

        Args:
            data: Data from storage

        Returns:
            Data with decrypted sensitive fields
        """
        return self.encryption.decrypt_dict(data)

    def search_encrypted_field(self, field_name: str, search_value: str, records: list) -> list:
        """
        Search encrypted fields (requires decryption of all records)

        Args:
            field_name: Field to search
            search_value: Value to search for
            records: List of encrypted records

        Returns:
            Matching records
        """
        matches = []

        for record in records:
            # Decrypt the record
            decrypted = self.retrieve_from_storage(record)

            # Check if field matches
            if field_name in decrypted and decrypted[field_name] == search_value:
                matches.append(decrypted)

        return matches