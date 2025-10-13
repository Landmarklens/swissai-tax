#!/usr/bin/env python3
"""
Test script to verify export API response includes is_available field
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
from sqlalchemy.orm import Session
from db.session import SessionLocal
from models.swisstax import DataExport, User
from schemas.data_export import DataExportResponse
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def test_export_response_serialization():
    """Test that exports are properly serialized with is_available field"""
    db = SessionLocal()

    try:
        # Get a completed export from database
        export = db.query(DataExport).filter(
            DataExport.status == 'completed'
        ).first()

        if not export:
            logger.warning("No completed exports found in database")
            return False

        logger.info(f"\nTesting Export ID: {export.id}")
        logger.info(f"Status: {export.status}")
        logger.info(f"File URL: {export.file_url[:80] if export.file_url else 'None'}...")
        logger.info(f"Expires At: {export.expires_at}")

        # Test properties
        logger.info(f"\nProperty Values:")
        logger.info(f"  is_completed: {export.is_completed}")
        logger.info(f"  is_expired: {export.is_expired}")
        logger.info(f"  is_available: {export.is_available}")
        logger.info(f"  file_size_mb: {export.file_size_mb}")
        logger.info(f"  hours_until_expiry: {export.hours_until_expiry}")

        # Serialize to Pydantic model
        try:
            is_available = bool(export.is_available)
            is_expired = bool(export.is_expired)
            hours_until_expiry = float(export.hours_until_expiry) if export.hours_until_expiry is not None else 0.0

            response = DataExportResponse(
                id=export.id,
                status=export.status,
                format=export.format,
                file_url=export.file_url,
                file_size_mb=export.file_size_mb,
                created_at=export.created_at,
                completed_at=export.completed_at,
                expires_at=export.expires_at,
                hours_until_expiry=hours_until_expiry,
                is_available=is_available,
                is_expired=is_expired,
                error_message=export.error_message
            )

            # Convert to dict (simulating JSON response)
            response_dict = response.model_dump()
            logger.info(f"\nSerialized Response:")
            logger.info(json.dumps(response_dict, indent=2, default=str))

            # Check if is_available is in the response
            if 'is_available' in response_dict:
                logger.info(f"\n✓ SUCCESS: is_available field is present: {response_dict['is_available']}")
                return True
            else:
                logger.error(f"\n✗ ERROR: is_available field is MISSING from response")
                return False

        except Exception as e:
            logger.error(f"\n✗ ERROR serializing export: {e}", exc_info=True)
            return False

    finally:
        db.close()


if __name__ == "__main__":
    logger.info("Testing Export API Response Serialization\n")
    logger.info("=" * 60)

    success = test_export_response_serialization()

    logger.info("\n" + "=" * 60)
    if success:
        logger.info("✓ Test PASSED: is_available field is properly serialized")
        sys.exit(0)
    else:
        logger.error("✗ Test FAILED: is_available field issue detected")
        sys.exit(1)
