"""
SQLAlchemy custom types for automatic encryption/decryption
"""
import logging
from typing import Optional

from sqlalchemy import String, Text, TypeDecorator
from sqlalchemy.types import TypeEngine

from utils.encryption import get_encryption_service

logger = logging.getLogger(__name__)


class EncryptedString(TypeDecorator):
    """
    SQLAlchemy type that automatically encrypts/decrypts string data
    Uses the application's encryption service transparently
    """
    impl = Text
    cache_ok = True

    def __init__(self, length: Optional[int] = None, *args, **kwargs):
        """
        Initialize encrypted string type

        Args:
            length: Maximum length of the string (for database column definition)
        """
        self.length = length
        super().__init__(*args, **kwargs)

    def load_dialect_impl(self, dialect):
        """Load the appropriate implementation for the dialect"""
        if self.length:
            return dialect.type_descriptor(String(self.length))
        return dialect.type_descriptor(Text())

    def process_bind_param(self, value, dialect):
        """
        Encrypt data before storing in database

        Args:
            value: Plain text value
            dialect: Database dialect

        Returns:
            Encrypted value
        """
        if value is None:
            return value

        try:
            encryption_service = get_encryption_service()
            encrypted = encryption_service.encrypt(value)
            return encrypted
        except Exception as e:
            logger.error(f"Encryption failed for value: {e}")
            raise

    def process_result_value(self, value, dialect):
        """
        Decrypt data when reading from database

        Args:
            value: Encrypted value from database
            dialect: Database dialect

        Returns:
            Decrypted plain text value
        """
        if value is None:
            return value

        try:
            encryption_service = get_encryption_service()
            decrypted = encryption_service.decrypt(value)
            return decrypted
        except Exception as e:
            logger.error(f"CRITICAL: Decryption failed for value: {e}")
            # FIXED BUG #8: Don't silently return None - raise to prevent data loss
            raise ValueError(f"Failed to decrypt database value. This may indicate key rotation or data corruption: {e}")


class EncryptedText(TypeDecorator):
    """
    SQLAlchemy type for encrypted text fields (larger content)
    """
    impl = Text
    cache_ok = True

    def process_bind_param(self, value, dialect):
        """Encrypt data before storing"""
        if value is None:
            return value

        try:
            encryption_service = get_encryption_service()
            return encryption_service.encrypt(value)
        except Exception as e:
            logger.error(f"Encryption failed for text value: {e}")
            raise

    def process_result_value(self, value, dialect):
        """Decrypt data when reading"""
        if value is None:
            return value

        try:
            encryption_service = get_encryption_service()
            return encryption_service.decrypt(value)
        except Exception as e:
            logger.error(f"CRITICAL: Decryption failed for text value: {e}")
            # FIXED BUG #8: Don't silently return None
            raise ValueError(f"Failed to decrypt text value: {e}")


class EncryptedJSON(TypeDecorator):
    """
    SQLAlchemy type for encrypted JSON fields
    Encrypts the entire JSON string, not individual fields
    """
    impl = Text
    cache_ok = True

    def process_bind_param(self, value, dialect):
        """Encrypt JSON data before storing"""
        if value is None:
            return value

        try:
            import json

            # FIXED BUG #9: Handle non-JSON-serializable types (datetime, etc.)
            json_string = json.dumps(value, default=str)
            encryption_service = get_encryption_service()
            return encryption_service.encrypt(json_string)
        except Exception as e:
            logger.error(f"Encryption failed for JSON value: {e}")
            raise

    def process_result_value(self, value, dialect):
        """Decrypt JSON data when reading"""
        if value is None:
            return value

        try:
            import json
            encryption_service = get_encryption_service()
            decrypted = encryption_service.decrypt(value)
            return json.loads(decrypted)
        except json.JSONDecodeError as e:
            # FIXED BUG #10: Handle JSON parse errors separately
            logger.error(f"JSON parse failed for decrypted value: {e}")
            return {}  # Return empty dict instead of None
        except Exception as e:
            # Handle encryption key mismatch gracefully
            logger.warning(f"Decryption failed (likely key mismatch), returning empty dict: {e}")
            return {}  # Return empty dict instead of raising error


class HashedString(TypeDecorator):
    """
    SQLAlchemy type for one-way hashed strings (e.g., passwords, tokens)
    Data cannot be decrypted, only verified
    """
    impl = String(255)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        """Hash data before storing"""
        if value is None:
            return value

        try:
            from utils.encryption import EncryptionService
            return EncryptionService.hash_sensitive_data(value)
        except Exception as e:
            logger.error(f"Hashing failed for value: {e}")
            raise

    def process_result_value(self, value, dialect):
        """Return hashed value as-is (cannot decrypt)"""
        return value

    @staticmethod
    def verify(plain_value: str, hashed_value: str) -> bool:
        """
        Verify plain value against stored hash

        Args:
            plain_value: Plain text value to verify
            hashed_value: Stored hash from database

        Returns:
            True if values match, False otherwise
        """
        try:
            from utils.encryption import EncryptionService
            return EncryptionService.verify_hashed_data(plain_value, hashed_value)
        except Exception:
            return False
