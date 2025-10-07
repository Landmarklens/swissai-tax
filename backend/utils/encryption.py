"""
Encryption utilities for sensitive data
"""
import base64
import hashlib
import logging
import os
import secrets
from typing import Optional

from cryptography.fernet import Fernet
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

logger = logging.getLogger(__name__)


class EncryptionService:
    """Service for encrypting and decrypting sensitive data"""

    def __init__(self, key: Optional[str] = None):
        """
        Initialize encryption service with key
        If no key provided, uses environment variable or generates new one
        """
        if key:
            self.key = key.encode() if isinstance(key, str) else key
        else:
            # Try to get from environment
            env_key = os.environ.get('ENCRYPTION_KEY')
            if env_key:
                self.key = env_key.encode()
            else:
                # Generate new key (should be stored securely)
                self.key = Fernet.generate_key()
                logger.warning("Generated new encryption key - should be stored securely!")

        self.cipher = Fernet(self.key)

    def encrypt(self, data: str) -> str:
        """
        Encrypt string data
        Returns base64 encoded encrypted string
        """
        if not data:
            return data

        try:
            encrypted = self.cipher.encrypt(data.encode())
            return base64.urlsafe_b64encode(encrypted).decode()
        except Exception as e:
            logger.error(f"Encryption failed: {e}")
            raise

    def decrypt(self, encrypted_data: str) -> str:
        """
        Decrypt encrypted string
        """
        if not encrypted_data:
            return encrypted_data

        try:
            decoded = base64.urlsafe_b64decode(encrypted_data.encode())
            decrypted = self.cipher.decrypt(decoded)
            return decrypted.decode()
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            raise

    def encrypt_dict(self, data: dict, fields: list) -> dict:
        """
        Encrypt specific fields in a dictionary
        """
        encrypted_data = data.copy()
        for field in fields:
            if field in encrypted_data and encrypted_data[field]:
                encrypted_data[field] = self.encrypt(str(encrypted_data[field]))
        return encrypted_data

    def decrypt_dict(self, data: dict, fields: list) -> dict:
        """
        Decrypt specific fields in a dictionary
        """
        decrypted_data = data.copy()
        for field in fields:
            if field in decrypted_data and decrypted_data[field]:
                try:
                    decrypted_data[field] = self.decrypt(decrypted_data[field])
                except Exception:
                    # If decryption fails, assume it's not encrypted
                    pass
        return decrypted_data

    @staticmethod
    def generate_secure_token(length: int = 32) -> str:
        """
        Generate cryptographically secure random token
        Much more secure than simple random strings
        """
        return secrets.token_urlsafe(length)

    @staticmethod
    def hash_sensitive_data(data: str, salt: Optional[str] = None) -> str:
        """
        One-way hash for sensitive data that doesn't need to be decrypted
        """
        if salt is None:
            salt = secrets.token_hex(16)

        # Use PBKDF2 for secure hashing
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt.encode(),
            iterations=100000,
            backend=default_backend()
        )

        key = base64.urlsafe_b64encode(kdf.derive(data.encode()))
        # Return salt:hash format
        return f"{salt}:{key.decode()}"

    @staticmethod
    def verify_hashed_data(data: str, hashed: str) -> bool:
        """
        Verify data against hash
        """
        try:
            salt, stored_hash = hashed.split(':')
            new_hash = EncryptionService.hash_sensitive_data(data, salt)
            return new_hash == hashed
        except Exception:
            return False

    @staticmethod
    def anonymize_email(email: str) -> str:
        """
        Anonymize email address for privacy
        """
        if '@' not in email:
            return '***@***'

        local, domain = email.split('@', 1)

        # Keep first and last char of local part
        if len(local) > 2:
            anonymized_local = f"{local[0]}***{local[-1]}"
        else:
            anonymized_local = "***"

        # Keep domain
        return f"{anonymized_local}@{domain}"

    @staticmethod
    def anonymize_phone(phone: str) -> str:
        """
        Anonymize phone number
        """
        if not phone or len(phone) < 4:
            return "***"

        # Keep country code and last 2 digits
        if phone.startswith('+'):
            # International format
            if len(phone) > 6:
                return f"{phone[:3]}****{phone[-2:]}"

        # Keep last 2 digits only
        return f"****{phone[-2:]}"


# Singleton instance with thread safety
import threading

_encryption_service = None
_encryption_lock = threading.Lock()

def get_encryption_service() -> EncryptionService:
    """Get or create encryption service instance (thread-safe)"""
    global _encryption_service
    if _encryption_service is None:
        with _encryption_lock:
            # FIXED BUG #4: Double-check locking for thread safety
            if _encryption_service is None:
                _encryption_service = EncryptionService()
    return _encryption_service
