#!/usr/bin/env python3
"""
Test script to verify S3 access and AWS credentials
Run this to diagnose S3 upload issues
"""
import boto3
import logging
import os
import sys
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def test_aws_credentials():
    """Test if AWS credentials are configured"""
    logger.info("Testing AWS credentials...")
    try:
        sts = boto3.client('sts', region_name=settings.AWS_REGION)
        identity = sts.get_caller_identity()
        logger.info(f"✓ AWS credentials valid")
        logger.info(f"  Account: {identity['Account']}")
        logger.info(f"  ARN: {identity['Arn']}")
        return True
    except Exception as e:
        logger.error(f"✗ AWS credentials invalid: {e}")
        return False


def test_s3_bucket_access():
    """Test S3 bucket access"""
    logger.info(f"\nTesting S3 bucket access: {settings.AWS_S3_BUCKET_NAME}...")
    try:
        s3 = boto3.client('s3', region_name=settings.AWS_REGION)

        # Test bucket exists
        s3.head_bucket(Bucket=settings.AWS_S3_BUCKET_NAME)
        logger.info(f"✓ Bucket exists and is accessible")

        # Test write permission
        test_key = f"test/access_test_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.txt"
        test_data = b"Test file for S3 access verification"

        s3.put_object(
            Bucket=settings.AWS_S3_BUCKET_NAME,
            Key=test_key,
            Body=test_data,
            ServerSideEncryption='AES256'
        )
        logger.info(f"✓ Write permission confirmed (uploaded {test_key})")

        # Test read permission
        obj = s3.get_object(Bucket=settings.AWS_S3_BUCKET_NAME, Key=test_key)
        data = obj['Body'].read()
        assert data == test_data
        logger.info(f"✓ Read permission confirmed")

        # Test delete permission
        s3.delete_object(Bucket=settings.AWS_S3_BUCKET_NAME, Key=test_key)
        logger.info(f"✓ Delete permission confirmed")

        return True
    except Exception as e:
        logger.error(f"✗ S3 bucket access failed: {e}")
        return False


def test_s3_storage_service():
    """Test the S3EncryptedStorage service"""
    logger.info("\nTesting S3EncryptedStorage service...")
    try:
        from utils.s3_encryption import S3EncryptedStorage

        storage = S3EncryptedStorage()
        logger.info(f"  Bucket: {storage.bucket_name}")
        logger.info(f"  Region: {storage.region_name}")
        logger.info(f"  Encryption: {storage.encryption_type}")

        # Test upload
        import io
        test_file = io.BytesIO(b"Test export data")
        test_key = f"test/service_test_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.txt"

        success = storage.upload_fileobj(
            file_obj=test_file,
            object_key=test_key,
            metadata={'test': 'true'},
            content_type='text/plain'
        )

        if success:
            logger.info(f"✓ S3EncryptedStorage upload successful")

            # Cleanup
            storage.delete_document(test_key)
            logger.info(f"✓ Cleanup successful")
            return True
        else:
            logger.error(f"✗ S3EncryptedStorage upload failed")
            return False

    except Exception as e:
        logger.error(f"✗ S3EncryptedStorage test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests"""
    logger.info("=" * 60)
    logger.info("S3 Access Diagnostic Test")
    logger.info("=" * 60)

    results = []

    results.append(("AWS Credentials", test_aws_credentials()))
    results.append(("S3 Bucket Access", test_s3_bucket_access()))
    results.append(("S3 Storage Service", test_s3_storage_service()))

    logger.info("\n" + "=" * 60)
    logger.info("Test Results Summary")
    logger.info("=" * 60)

    all_passed = True
    for name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        logger.info(f"{name:.<40} {status}")
        if not passed:
            all_passed = False

    logger.info("=" * 60)

    if all_passed:
        logger.info("✓ All tests passed! S3 access is working correctly.")
        return 0
    else:
        logger.error("✗ Some tests failed. Check the errors above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
