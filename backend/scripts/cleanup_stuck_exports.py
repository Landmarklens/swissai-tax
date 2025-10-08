#!/usr/bin/env python3
"""
Cleanup script for stuck data exports
Resets exports stuck in 'processing' status for more than 1 hour
"""
import logging
import sys
import os
from datetime import datetime, timedelta, timezone

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from db.session import SessionLocal
from models.swisstax import DataExport

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def cleanup_stuck_exports(dry_run: bool = True, reset_to_pending: bool = True):
    """
    Clean up exports stuck in 'processing' status

    Args:
        dry_run: If True, only show what would be done without making changes
        reset_to_pending: If True, reset to 'pending' to retry. If False, mark as 'failed'
    """
    db = SessionLocal()

    try:
        # Find exports stuck in processing for more than 1 hour
        one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)

        stuck_exports = db.query(DataExport).filter(
            DataExport.status == 'processing',
            DataExport.created_at < one_hour_ago
        ).all()

        if not stuck_exports:
            logger.info("✓ No stuck exports found")
            return 0

        logger.info(f"Found {len(stuck_exports)} stuck exports")

        for export in stuck_exports:
            age_hours = (datetime.now(timezone.utc) - export.created_at.replace(tzinfo=timezone.utc)).total_seconds() / 3600
            logger.info(
                f"  Export {export.id[:8]}... "
                f"(user: {export.user_id}, format: {export.format}, "
                f"age: {age_hours:.1f}h, created: {export.created_at})"
            )

            if not dry_run:
                if reset_to_pending:
                    export.status = 'pending'
                    export.error_message = None
                    logger.info(f"    → Reset to 'pending' for retry")
                else:
                    export.status = 'failed'
                    export.error_message = 'Export timed out after being stuck in processing'
                    logger.info(f"    → Marked as 'failed'")

        if dry_run:
            logger.info("\n⚠️  DRY RUN - No changes made")
            logger.info(f"   Run with --execute to {('reset to pending' if reset_to_pending else 'mark as failed')}")
        else:
            db.commit()
            logger.info(f"\n✓ Updated {len(stuck_exports)} stuck exports")

        return len(stuck_exports)

    finally:
        db.close()


def reset_all_processing_exports():
    """Reset ALL processing exports to pending (emergency recovery)"""
    db = SessionLocal()

    try:
        processing_exports = db.query(DataExport).filter(
            DataExport.status == 'processing'
        ).all()

        if not processing_exports:
            logger.info("✓ No processing exports found")
            return 0

        logger.info(f"Resetting {len(processing_exports)} processing exports to pending...")

        for export in processing_exports:
            export.status = 'pending'
            export.error_message = None

        db.commit()
        logger.info(f"✓ Reset {len(processing_exports)} exports to pending")

        return len(processing_exports)

    finally:
        db.close()


def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description='Cleanup stuck data exports')
    parser.add_argument(
        '--execute',
        action='store_true',
        help='Actually make changes (default is dry-run)'
    )
    parser.add_argument(
        '--mark-failed',
        action='store_true',
        help='Mark stuck exports as failed instead of resetting to pending'
    )
    parser.add_argument(
        '--reset-all',
        action='store_true',
        help='Reset ALL processing exports to pending (emergency recovery)'
    )

    args = parser.parse_args()

    logger.info("=" * 60)
    logger.info("Data Export Cleanup Script")
    logger.info("=" * 60)

    if args.reset_all:
        if not args.execute:
            logger.error("--reset-all requires --execute flag for safety")
            return 1

        logger.warning("⚠️  EMERGENCY MODE: Resetting ALL processing exports")
        count = reset_all_processing_exports()
        logger.info(f"Reset {count} exports")
        return 0

    dry_run = not args.execute
    reset_to_pending = not args.mark_failed

    if dry_run:
        logger.info("Mode: DRY RUN (no changes will be made)")
    else:
        logger.info("Mode: EXECUTE (changes will be made)")

    action = "Reset to pending" if reset_to_pending else "Mark as failed"
    logger.info(f"Action: {action}")
    logger.info("-" * 60)

    count = cleanup_stuck_exports(dry_run=dry_run, reset_to_pending=reset_to_pending)

    logger.info("=" * 60)
    logger.info(f"Found {count} stuck exports")

    return 0


if __name__ == "__main__":
    sys.exit(main())
