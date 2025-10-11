#!/usr/bin/env python3
"""
Manual script to process pending data exports
Use this when background scheduler is not running
"""
import logging
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from services.background_jobs import get_scheduler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def main():
    """Main entry point"""
    logger.info("=" * 60)
    logger.info("Manual Data Export Processing")
    logger.info("=" * 60)

    scheduler = get_scheduler()

    try:
        logger.info("Processing pending exports...")
        scheduler.process_pending_exports()
        logger.info("✓ Export processing completed!")
        return 0
    except Exception as e:
        logger.error(f"❌ Error processing exports: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
