"""
Two-Factor Authentication Service
Handles TOTP generation, verification, and backup codes
"""
import base64
import io
import json
import logging
import secrets
import string
from datetime import datetime
from typing import List, Optional, Tuple

import pyotp
import qrcode
from sqlalchemy.orm import Session

from models.swisstax import User
from utils.encryption import EncryptionService

logger = logging.getLogger(__name__)


class TwoFactorService:
    """Service for managing two-factor authentication"""

    def __init__(self):
        """Initialize the 2FA service with encryption"""
        self.encryption = EncryptionService()

    def generate_secret(self) -> str:
        """
        Generate a new TOTP secret key

        Returns:
            str: Base32-encoded secret key
        """
        return pyotp.random_base32()

    def generate_qr_code(self, secret: str, email: str, issuer_name: str = "SwissAI Tax") -> str:
        """
        Generate QR code for TOTP setup

        Args:
            secret: The TOTP secret key
            email: User's email address
            issuer_name: Name of the application

        Returns:
            str: Base64-encoded PNG image of QR code
        """
        try:
            # Create provisioning URI for authenticator apps
            totp = pyotp.TOTP(secret)
            uri = totp.provisioning_uri(
                name=email,
                issuer_name=issuer_name
            )

            # Generate QR code
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(uri)
            qr.make(fit=True)

            # Create image
            img = qr.make_image(fill_color="black", back_color="white")

            # Convert to base64
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            buffer.seek(0)
            img_base64 = base64.b64encode(buffer.getvalue()).decode()

            return f"data:image/png;base64,{img_base64}"

        except Exception as e:
            logger.error(f"QR code generation failed: {e}")
            raise

    def generate_backup_codes(self, count: int = 10) -> List[str]:
        """
        Generate backup recovery codes

        Args:
            count: Number of codes to generate (default: 10)

        Returns:
            List[str]: List of backup codes in format XXXX-XXXX
        """
        codes = []
        for _ in range(count):
            # Generate 8-character alphanumeric code
            code_part1 = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(4))
            code_part2 = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(4))
            code = f"{code_part1}-{code_part2}"
            codes.append(code)

        return codes

    def verify_totp(self, secret: str, code: str, window: int = 1) -> bool:
        """
        Verify a TOTP code against the secret

        Args:
            secret: The TOTP secret key
            code: The 6-digit code to verify
            window: Time window tolerance (±30 seconds per window)

        Returns:
            bool: True if code is valid, False otherwise
        """
        try:
            # Remove any spaces or dashes from the code
            code = code.replace(' ', '').replace('-', '')

            # Verify the code is 6 digits
            if not code.isdigit() or len(code) != 6:
                logger.warning(f"Invalid code format: {len(code)} characters")
                return False

            totp = pyotp.TOTP(secret)
            is_valid = totp.verify(code, valid_window=window)

            if is_valid:
                logger.info("TOTP verification successful")
            else:
                logger.warning("TOTP verification failed")

            return is_valid

        except Exception as e:
            logger.error(f"TOTP verification error: {e}")
            return False

    def verify_backup_code(self, user: User, code: str, db: Session) -> bool:
        """
        Verify and consume a backup code

        Args:
            user: User object
            code: Backup code to verify
            db: Database session

        Returns:
            bool: True if code is valid and consumed, False otherwise
        """
        try:
            if not user.two_factor_backup_codes:
                return False

            # Decrypt and parse backup codes
            encrypted_codes = user.two_factor_backup_codes
            decrypted_json = self.encryption.decrypt(encrypted_codes)
            backup_codes = json.loads(decrypted_json)

            # Normalize the input code
            code = code.strip().upper().replace(' ', '').replace('-', '')

            # Check if code exists in backup codes
            for stored_code in backup_codes:
                normalized_stored = stored_code.replace('-', '')
                if code == normalized_stored:
                    # Code is valid - remove it from the list
                    backup_codes.remove(stored_code)

                    # Save updated backup codes
                    updated_json = json.dumps(backup_codes)
                    user.two_factor_backup_codes = self.encryption.encrypt(updated_json)
                    db.commit()

                    logger.info(f"Backup code consumed for user {user.email}. {len(backup_codes)} codes remaining.")

                    # Warn if running low on backup codes
                    if len(backup_codes) < 3:
                        logger.warning(f"User {user.email} has only {len(backup_codes)} backup codes remaining")

                    return True

            logger.warning(f"Invalid backup code attempted for user {user.email}")
            return False

        except Exception as e:
            logger.error(f"Backup code verification error: {e}")
            return False

    def encrypt_secret(self, secret: str) -> str:
        """
        Encrypt TOTP secret for storage

        Args:
            secret: Plain text secret

        Returns:
            str: Encrypted secret
        """
        return self.encryption.encrypt(secret)

    def decrypt_secret(self, encrypted_secret: str) -> str:
        """
        Decrypt TOTP secret

        Args:
            encrypted_secret: Encrypted secret

        Returns:
            str: Plain text secret
        """
        return self.encryption.decrypt(encrypted_secret)

    def encrypt_backup_codes(self, codes: List[str]) -> str:
        """
        Encrypt backup codes for storage

        Args:
            codes: List of backup codes

        Returns:
            str: Encrypted JSON string of codes
        """
        codes_json = json.dumps(codes)
        return self.encryption.encrypt(codes_json)

    def decrypt_backup_codes(self, encrypted_codes: str) -> List[str]:
        """
        Decrypt backup codes

        Args:
            encrypted_codes: Encrypted JSON string

        Returns:
            List[str]: List of backup codes
        """
        decrypted_json = self.encryption.decrypt(encrypted_codes)
        return json.loads(decrypted_json)

    def enable_two_factor(
        self,
        user: User,
        secret: str,
        backup_codes: List[str],
        db: Session
    ) -> bool:
        """
        Enable two-factor authentication for a user

        Args:
            user: User object
            secret: TOTP secret key
            backup_codes: List of backup codes
            db: Database session

        Returns:
            bool: True if successfully enabled
        """
        try:
            # Encrypt sensitive data
            encrypted_secret = self.encrypt_secret(secret)
            encrypted_codes = self.encrypt_backup_codes(backup_codes)

            # Update user record
            user.two_factor_enabled = True
            user.two_factor_secret = encrypted_secret
            user.two_factor_backup_codes = encrypted_codes
            user.two_factor_verified_at = datetime.utcnow()

            db.commit()
            logger.info(f"2FA enabled for user {user.email}")
            return True

        except Exception as e:
            logger.error(f"Failed to enable 2FA for user {user.email}: {e}")
            db.rollback()
            return False

    def disable_two_factor(self, user: User, db: Session) -> bool:
        """
        Disable two-factor authentication for a user

        Args:
            user: User object
            db: Database session

        Returns:
            bool: True if successfully disabled
        """
        try:
            user.two_factor_enabled = False
            user.two_factor_secret = None
            user.two_factor_backup_codes = None
            user.two_factor_verified_at = None

            db.commit()
            logger.info(f"2FA disabled for user {user.email}")
            return True

        except Exception as e:
            logger.error(f"Failed to disable 2FA for user {user.email}: {e}")
            db.rollback()
            return False

    def regenerate_backup_codes(self, user: User, db: Session) -> Optional[List[str]]:
        """
        Regenerate backup codes for a user

        Args:
            user: User object
            db: Database session

        Returns:
            Optional[List[str]]: New backup codes if successful, None otherwise
        """
        try:
            if not user.two_factor_enabled:
                logger.warning(f"Cannot regenerate codes - 2FA not enabled for {user.email}")
                return None

            # Generate new backup codes
            new_codes = self.generate_backup_codes()

            # Encrypt and save
            encrypted_codes = self.encrypt_backup_codes(new_codes)
            user.two_factor_backup_codes = encrypted_codes

            db.commit()
            logger.info(f"Backup codes regenerated for user {user.email}")

            return new_codes

        except Exception as e:
            logger.error(f"Failed to regenerate backup codes for {user.email}: {e}")
            db.rollback()
            return None

    def get_remaining_backup_codes_count(self, user: User) -> int:
        """
        Get count of remaining backup codes

        Args:
            user: User object

        Returns:
            int: Number of unused backup codes
        """
        try:
            if not user.two_factor_backup_codes:
                return 0

            backup_codes = self.decrypt_backup_codes(user.two_factor_backup_codes)
            return len(backup_codes)

        except Exception as e:
            logger.error(f"Failed to count backup codes: {e}")
            return 0


# Singleton instance
two_factor_service = TwoFactorService()
