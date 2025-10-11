#!/usr/bin/env python3
"""
Test script to diagnose background scheduler startup issues
"""
import logging
import sys
import os
import traceback

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def main():
    """Test background scheduler startup"""
    logger.info("=" * 60)
    logger.info("Testing Background Scheduler Startup")
    logger.info("=" * 60)

    try:
        logger.info("Step 1: Importing background_jobs module...")
        from services.background_jobs import start_background_jobs, get_scheduler
        logger.info("✓ Import successful")

        logger.info("\nStep 2: Getting scheduler instance...")
        scheduler = get_scheduler()
        logger.info(f"✓ Scheduler instance created: {scheduler}")
        logger.info(f"  Is running: {scheduler._is_running}")

        logger.info("\nStep 3: Attempting to start background jobs...")
        start_background_jobs()
        logger.info("✓ Background jobs started successfully!")

        logger.info("\nStep 4: Checking scheduler status...")
        status = scheduler.get_jobs_status()
        logger.info(f"✓ Scheduler status: {status['status']}")
        logger.info(f"  Number of jobs: {len(status.get('jobs', []))}")

        if status.get('jobs'):
            logger.info("\n  Scheduled jobs:")
            for job in status['jobs']:
                logger.info(f"    - {job['name']}")
                logger.info(f"      ID: {job['id']}")
                logger.info(f"      Next run: {job['next_run']}")
                logger.info(f"      Trigger: {job['trigger']}")

        logger.info("\n" + "=" * 60)
        logger.info("✓ All tests passed! Background scheduler is working.")
        logger.info("=" * 60)

        # Stop scheduler before exiting
        from services.background_jobs import stop_background_jobs
        logger.info("\nStopping scheduler...")
        stop_background_jobs()
        logger.info("✓ Scheduler stopped")

        return 0

    except Exception as e:
        logger.error("\n" + "=" * 60)
        logger.error("❌ ERROR: Background scheduler failed to start")
        logger.error("=" * 60)
        logger.error(f"\nError type: {type(e).__name__}")
        logger.error(f"Error message: {str(e)}")
        logger.error("\nFull traceback:")
        traceback.print_exc()
        logger.error("=" * 60)
        return 1


if __name__ == "__main__":
    sys.exit(main())
