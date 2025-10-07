"""
Encryption Key Rotation Script

This script handles the rotation of encryption keys and re-encryption of all sensitive data.
It should be run during a maintenance window when no users are actively using the system.

Usage:
    python scripts/rotate_encryption_key.py --generate-key
    python scripts/rotate_encryption_key.py --rotate --old-key <OLD_KEY> --new-key <NEW_KEY>
    python scripts/rotate_encryption_key.py --verify
"""

import argparse
import logging
import os
import sys
from datetime import datetime
from typing import Any, Dict, List

from cryptography.fernet import Fernet

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.session import SessionLocal
from models.tax_answer import TaxAnswer
from models.tax_filing_session import TaxFilingSession
from utils.aws_secrets import create_encryption_key_secret, get_secrets_manager
from utils.encryption import EncryptionService

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class KeyRotationManager:
    """Manages encryption key rotation process"""

    def __init__(self, old_key: str = None, new_key: str = None):
        """
        Initialize key rotation manager

        Args:
            old_key: The current encryption key
            new_key: The new encryption key to rotate to
        """
        self.old_key = old_key
        self.new_key = new_key
        self.old_service = EncryptionService(key=old_key) if old_key else None
        self.new_service = EncryptionService(key=new_key) if new_key else None

    def generate_new_key(self) -> str:
        """
        Generate a new Fernet encryption key

        Returns:
            Base64-encoded encryption key
        """
        key = Fernet.generate_key()
        return key.decode()

    def rotate_tax_filing_sessions(self, db_session) -> Dict[str, int]:
        """
        Re-encrypt all TaxFilingSession profile data

        Args:
            db_session: Database session

        Returns:
            Dictionary with rotation statistics
        """
        logger.info("Starting rotation of TaxFilingSession profiles...")

        sessions = db_session.query(TaxFilingSession).all()
        stats = {
            'total': len(sessions),
            'success': 0,
            'failed': 0,
            'errors': []
        }

        for session in sessions:
            try:
                # The profile field is already encrypted/decrypted via EncryptedJSON type
                # We need to temporarily bypass the type decorator to access raw encrypted data

                # Get raw encrypted value from database
                raw_encrypted = session.__dict__['profile']

                if raw_encrypted and isinstance(raw_encrypted, str):
                    # Decrypt with old key
                    decrypted_json = self.old_service.decrypt(raw_encrypted)

                    # Re-encrypt with new key
                    re_encrypted = self.new_service.encrypt(decrypted_json)

                    # Update the raw value
                    session.__dict__['profile'] = re_encrypted

                    stats['success'] += 1

                    if stats['success'] % 100 == 0:
                        logger.info(f"Progress: {stats['success']}/{stats['total']} sessions rotated")
                        db_session.commit()

            except Exception as e:
                logger.error(f"Failed to rotate session {session.id}: {e}")
                stats['failed'] += 1
                stats['errors'].append({
                    'session_id': session.id,
                    'error': str(e)
                })

        db_session.commit()
        logger.info(f"Completed TaxFilingSession rotation: {stats['success']} success, {stats['failed']} failed")
        return stats

    def rotate_tax_answers(self, db_session) -> Dict[str, int]:
        """
        Re-encrypt all TaxAnswer encrypted answers

        Args:
            db_session: Database session

        Returns:
            Dictionary with rotation statistics
        """
        logger.info("Starting rotation of TaxAnswer encrypted answers...")

        answers = db_session.query(TaxAnswer).filter(TaxAnswer.is_sensitive == True).all()
        stats = {
            'total': len(answers),
            'success': 0,
            'failed': 0,
            'errors': []
        }

        for answer in answers:
            try:
                # Get raw encrypted value
                raw_encrypted = answer.__dict__['answer_value']

                if raw_encrypted and isinstance(raw_encrypted, str):
                    # Decrypt with old key
                    decrypted_value = self.old_service.decrypt(raw_encrypted)

                    # Re-encrypt with new key
                    re_encrypted = self.new_service.encrypt(decrypted_value)

                    # Update the raw value
                    answer.__dict__['answer_value'] = re_encrypted

                    stats['success'] += 1

                    if stats['success'] % 100 == 0:
                        logger.info(f"Progress: {stats['success']}/{stats['total']} answers rotated")
                        db_session.commit()

            except Exception as e:
                logger.error(f"Failed to rotate answer {answer.id}: {e}")
                stats['failed'] += 1
                stats['errors'].append({
                    'answer_id': answer.id,
                    'error': str(e)
                })

        db_session.commit()
        logger.info(f"Completed TaxAnswer rotation: {stats['success']} success, {stats['failed']} failed")
        return stats

    def perform_rotation(self) -> Dict[str, Any]:
        """
        Perform complete key rotation

        Returns:
            Dictionary with rotation results
        """
        if not self.old_service or not self.new_service:
            raise ValueError("Both old and new encryption keys must be provided")

        logger.info("=" * 80)
        logger.info("STARTING ENCRYPTION KEY ROTATION")
        logger.info("=" * 80)
        logger.info(f"Start time: {datetime.utcnow().isoformat()}")

        db = SessionLocal()
        results = {
            'start_time': datetime.utcnow().isoformat(),
            'tax_filing_sessions': None,
            'tax_answers': None,
            'end_time': None,
            'success': False
        }

        try:
            # Rotate TaxFilingSession profiles
            results['tax_filing_sessions'] = self.rotate_tax_filing_sessions(db)

            # Rotate TaxAnswer encrypted answers
            results['tax_answers'] = self.rotate_tax_answers(db)

            # Check if all rotations succeeded
            total_failed = (
                results['tax_filing_sessions']['failed'] +
                results['tax_answers']['failed']
            )

            if total_failed == 0:
                results['success'] = True
                logger.info("✅ Key rotation completed successfully!")
            else:
                logger.warning(f"⚠️ Key rotation completed with {total_failed} failures")

        except Exception as e:
            logger.error(f"❌ Key rotation failed: {e}")
            db.rollback()
            results['error'] = str(e)
            results['success'] = False
        finally:
            db.close()
            results['end_time'] = datetime.utcnow().isoformat()

        logger.info("=" * 80)
        logger.info(f"End time: {results['end_time']}")
        logger.info("=" * 80)

        return results

    def verify_encryption(self, db_session) -> Dict[str, Any]:
        """
        Verify that all encrypted data can be decrypted with the current key

        Args:
            db_session: Database session

        Returns:
            Dictionary with verification results
        """
        logger.info("Verifying encryption integrity...")

        results = {
            'tax_filing_sessions': {'total': 0, 'valid': 0, 'invalid': 0, 'errors': []},
            'tax_answers': {'total': 0, 'valid': 0, 'invalid': 0, 'errors': []}
        }

        # Verify TaxFilingSession profiles
        sessions = db_session.query(TaxFilingSession).all()
        results['tax_filing_sessions']['total'] = len(sessions)

        for session in sessions:
            try:
                # Try to access the profile (will decrypt automatically)
                profile = session.profile
                if isinstance(profile, dict) or profile is None:
                    results['tax_filing_sessions']['valid'] += 1
                else:
                    results['tax_filing_sessions']['invalid'] += 1
                    results['tax_filing_sessions']['errors'].append({
                        'session_id': session.id,
                        'error': 'Profile is not a dict'
                    })
            except Exception as e:
                results['tax_filing_sessions']['invalid'] += 1
                results['tax_filing_sessions']['errors'].append({
                    'session_id': session.id,
                    'error': str(e)
                })

        # Verify TaxAnswer encrypted answers
        answers = db_session.query(TaxAnswer).filter(TaxAnswer.is_sensitive == True).all()
        results['tax_answers']['total'] = len(answers)

        for answer in answers:
            try:
                # Try to access the answer value (will decrypt automatically)
                value = answer.answer_value
                if isinstance(value, str):
                    results['tax_answers']['valid'] += 1
                else:
                    results['tax_answers']['invalid'] += 1
                    results['tax_answers']['errors'].append({
                        'answer_id': answer.id,
                        'error': 'Answer value is not a string'
                    })
            except Exception as e:
                results['tax_answers']['invalid'] += 1
                results['tax_answers']['errors'].append({
                    'answer_id': answer.id,
                    'error': str(e)
                })

        logger.info(f"Verification complete:")
        logger.info(f"  TaxFilingSessions: {results['tax_filing_sessions']['valid']}/{results['tax_filing_sessions']['total']} valid")
        logger.info(f"  TaxAnswers: {results['tax_answers']['valid']}/{results['tax_answers']['total']} valid")

        return results

    def store_new_key_in_aws(self, new_key: str) -> bool:
        """
        Store the new encryption key in AWS Secrets Manager

        Args:
            new_key: The new encryption key

        Returns:
            True if successful, False otherwise
        """
        logger.info("Storing new key in AWS Secrets Manager...")

        try:
            success = create_encryption_key_secret(new_key)
            if success:
                logger.info("✅ New key stored in AWS Secrets Manager")
            else:
                logger.error("❌ Failed to store new key in AWS Secrets Manager")
            return success
        except Exception as e:
            logger.error(f"Error storing key in AWS: {e}")
            return False


def main():
    """Main entry point for key rotation script"""
    parser = argparse.ArgumentParser(description='Encryption key rotation tool')
    parser.add_argument('--generate-key', action='store_true',
                       help='Generate a new encryption key')
    parser.add_argument('--rotate', action='store_true',
                       help='Perform key rotation')
    parser.add_argument('--old-key', type=str,
                       help='Current encryption key')
    parser.add_argument('--new-key', type=str,
                       help='New encryption key to rotate to')
    parser.add_argument('--verify', action='store_true',
                       help='Verify encryption integrity')
    parser.add_argument('--store-in-aws', action='store_true',
                       help='Store new key in AWS Secrets Manager')

    args = parser.parse_args()

    if args.generate_key:
        manager = KeyRotationManager()
        new_key = manager.generate_new_key()
        print("=" * 80)
        print("NEW ENCRYPTION KEY GENERATED")
        print("=" * 80)
        print(f"Key: {new_key}")
        print()
        print("IMPORTANT: Store this key securely!")
        print("  1. Save to AWS Secrets Manager: python rotate_encryption_key.py --store-in-aws --new-key <KEY>")
        print("  2. Set ENCRYPTION_KEY environment variable")
        print("  3. Set ENCRYPTION_KEY_CREATED_AT=" + datetime.utcnow().isoformat())
        print("=" * 80)
        return

    if args.store_in_aws:
        if not args.new_key:
            print("Error: --new-key required when using --store-in-aws")
            return
        manager = KeyRotationManager()
        success = manager.store_new_key_in_aws(args.new_key)
        sys.exit(0 if success else 1)

    if args.rotate:
        if not args.old_key or not args.new_key:
            print("Error: Both --old-key and --new-key are required for rotation")
            return

        print("=" * 80)
        print("⚠️  WARNING: KEY ROTATION IS A CRITICAL OPERATION")
        print("=" * 80)
        print("This will re-encrypt ALL sensitive data with the new key.")
        print("Ensure you have:")
        print("  1. A recent database backup")
        print("  2. A maintenance window (users should not be accessing the system)")
        print("  3. Verified both old and new keys are correct")
        print()
        response = input("Type 'ROTATE' to confirm: ")

        if response != 'ROTATE':
            print("Rotation cancelled.")
            return

        manager = KeyRotationManager(old_key=args.old_key, new_key=args.new_key)
        results = manager.perform_rotation()

        # Print summary
        print()
        print("=" * 80)
        print("ROTATION SUMMARY")
        print("=" * 80)
        print(f"Success: {results['success']}")
        print(f"Start: {results['start_time']}")
        print(f"End: {results['end_time']}")
        print()
        print("TaxFilingSessions:")
        print(f"  Total: {results['tax_filing_sessions']['total']}")
        print(f"  Success: {results['tax_filing_sessions']['success']}")
        print(f"  Failed: {results['tax_filing_sessions']['failed']}")
        print()
        print("TaxAnswers:")
        print(f"  Total: {results['tax_answers']['total']}")
        print(f"  Success: {results['tax_answers']['success']}")
        print(f"  Failed: {results['tax_answers']['failed']}")
        print("=" * 80)

        if results['success']:
            print()
            print("✅ KEY ROTATION COMPLETED SUCCESSFULLY")
            print()
            print("NEXT STEPS:")
            print("  1. Update ENCRYPTION_KEY environment variable with new key")
            print("  2. Update ENCRYPTION_KEY_CREATED_AT=" + datetime.utcnow().isoformat())
            print("  3. Restart application servers")
            print("  4. Run verification: python rotate_encryption_key.py --verify")
            print("  5. Monitor application logs for decryption errors")
        else:
            print()
            print("❌ KEY ROTATION FAILED")
            print("Review errors above and restore from backup if necessary.")

        sys.exit(0 if results['success'] else 1)

    if args.verify:
        db = SessionLocal()
        manager = KeyRotationManager()
        results = manager.verify_encryption(db)
        db.close()

        total_invalid = results['tax_filing_sessions']['invalid'] + results['tax_answers']['invalid']

        if total_invalid == 0:
            print("✅ All encrypted data verified successfully")
            sys.exit(0)
        else:
            print(f"❌ Found {total_invalid} encryption errors")
            print("Review errors above")
            sys.exit(1)

    parser.print_help()


if __name__ == '__main__':
    main()
