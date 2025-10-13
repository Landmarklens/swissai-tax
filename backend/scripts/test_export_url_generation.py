#!/usr/bin/env python3
"""
Test script to verify S3 export URL generation is working correctly
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import settings
from utils.s3_encryption import get_s3_storage
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def test_s3_configuration():
    """Test that S3 is configured with the correct region"""
    logger.info("=" * 60)
    logger.info("Testing S3 Configuration")
    logger.info("=" * 60)

    # Check settings
    logger.info(f"\nConfiguration Values:")
    logger.info(f"  AWS_S3_BUCKET_NAME: {settings.AWS_S3_BUCKET_NAME}")
    logger.info(f"  AWS_S3_REGION: {settings.AWS_S3_REGION}")
    logger.info(f"  AWS_REGION (general): {settings.AWS_REGION}")

    # Check S3 storage instance
    s3_storage = get_s3_storage()
    logger.info(f"\nS3 Storage Instance:")
    logger.info(f"  Bucket: {s3_storage.bucket_name}")
    logger.info(f"  Region: {s3_storage.region_name}")
    logger.info(f"  S3 Client Region: {s3_storage.s3_client.meta.region_name}")

    # Verify regions match
    if s3_storage.region_name == "eu-central-2":
        logger.info("\n✓ SUCCESS: S3 client is configured with the correct region (eu-central-2)")
        return True
    else:
        logger.error(f"\n✗ ERROR: S3 client region mismatch! Expected eu-central-2, got {s3_storage.region_name}")
        return False


def test_presigned_url_generation():
    """Test presigned URL generation with a sample export path"""
    logger.info("\n" + "=" * 60)
    logger.info("Testing Presigned URL Generation")
    logger.info("=" * 60)

    s3_storage = get_s3_storage()

    # Generate a sample URL (doesn't need to exist for URL generation test)
    test_key = "exports/test-user-id/test-export-id_20251013_184150.json"

    try:
        url = s3_storage.get_document_url(test_key, expiration=3600)
        if url:
            logger.info(f"\nGenerated URL:")
            logger.info(f"  {url}")

            # Check if URL contains the correct region
            if "eu-central-2" in url:
                logger.info("\n✓ SUCCESS: URL contains correct region (eu-central-2)")
                return True
            else:
                logger.error(f"\n✗ ERROR: URL does not contain eu-central-2 region")
                logger.error(f"  URL: {url}")
                return False
        else:
            logger.error("\n✗ ERROR: Failed to generate presigned URL")
            return False
    except Exception as e:
        logger.error(f"\n✗ ERROR generating presigned URL: {e}")
        return False


if __name__ == "__main__":
    logger.info("Starting S3 Export URL Generation Test\n")

    # Run tests
    test1 = test_s3_configuration()
    test2 = test_presigned_url_generation()

    # Summary
    logger.info("\n" + "=" * 60)
    logger.info("Test Summary")
    logger.info("=" * 60)
    logger.info(f"Configuration Test: {'PASSED' if test1 else 'FAILED'}")
    logger.info(f"URL Generation Test: {'PASSED' if test2 else 'FAILED'}")

    if test1 and test2:
        logger.info("\n✓ All tests passed! Export URL generation should work correctly now.")
        sys.exit(0)
    else:
        logger.error("\n✗ Some tests failed. Please review the errors above.")
        sys.exit(1)
