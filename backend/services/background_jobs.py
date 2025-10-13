"""
Background Job Scheduler
Handles scheduled tasks for account deletions, export cleanup, and audit log maintenance
"""
import logging
from datetime import datetime
from typing import Optional

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from db.session import SessionLocal
from services.user_deletion_service import UserDeletionService
from services.data_export_service import DataExportService
from services.audit_log_service import AuditLogService
from services.session_service import session_service

logger = logging.getLogger(__name__)


class BackgroundJobScheduler:
    """
    Background job scheduler for automated tasks
    Uses APScheduler for job management
    """

    def __init__(self):
        """Initialize scheduler"""
        self.scheduler = BackgroundScheduler()
        self._is_running = False
        logger.info("Initialized background job scheduler")

    def process_pending_deletions(self):
        """
        Process all deletion requests that are ready for execution
        Runs every hour
        """
        try:
            logger.info("Starting pending deletions processing job")
            db = SessionLocal()

            try:
                service = UserDeletionService(db)
                ready_requests = service.get_deletion_requests_ready_for_execution()

                if not ready_requests:
                    logger.info("No deletion requests ready for execution")
                    return

                logger.info(f"Found {len(ready_requests)} deletion requests ready for execution")

                success_count = 0
                failure_count = 0

                for request in ready_requests:
                    try:
                        logger.info(f"Executing deletion request: {request.id} for user {request.user_id}")
                        result = service.execute_deletion(request.id)

                        if result['status'] == 'success':
                            success_count += 1
                            logger.info(
                                f"Successfully deleted account for user {request.user_id}: "
                                f"s3_files={result.get('s3_documents_deleted', 0) + result.get('s3_exports_deleted', 0)}, "
                                f"subscriptions={result.get('subscriptions_cancelled', 0)}"
                            )

                            # TODO: Send deletion completed email
                        else:
                            failure_count += 1
                            logger.error(f"Failed to delete account for user {request.user_id}: {result.get('error')}")

                    except Exception as e:
                        failure_count += 1
                        logger.error(f"Error executing deletion for request {request.id}: {e}", exc_info=True)

                logger.info(
                    f"Pending deletions processing completed: "
                    f"{success_count} successful, {failure_count} failed"
                )

            finally:
                db.close()

        except Exception as e:
            logger.error(f"Error in pending deletions job: {e}", exc_info=True)

    def process_pending_exports(self):
        """
        Process pending data export requests
        Runs every 5 minutes
        """
        try:
            logger.info("Starting pending exports processing job")
            db = SessionLocal()

            try:
                from models.swisstax import DataExport
                service = DataExportService(db)

                # Get pending/processing exports
                pending_exports = db.query(DataExport).filter(
                    DataExport.status.in_(['pending', 'processing'])
                ).limit(10).all()  # Process up to 10 at a time

                if not pending_exports:
                    logger.info("No pending exports to process")
                    return

                logger.info(f"Found {len(pending_exports)} pending exports to process")

                success_count = 0
                failure_count = 0

                for export in pending_exports:
                    try:
                        logger.info(f"Processing export: {export.id} for user {export.user_id}")
                        service.generate_export(export.id)
                        success_count += 1
                        logger.info(f"Successfully generated export {export.id}")
                    except Exception as e:
                        failure_count += 1
                        logger.error(f"Failed to generate export {export.id}: {e}", exc_info=True)

                logger.info(
                    f"Pending exports processing completed: "
                    f"{success_count} successful, {failure_count} failed"
                )

            finally:
                db.close()

        except Exception as e:
            logger.error(f"Error in pending exports processing job: {e}", exc_info=True)

    def cleanup_expired_exports(self):
        """
        Clean up expired data exports
        Runs daily at 2 AM
        """
        try:
            logger.info("Starting expired exports cleanup job")
            db = SessionLocal()

            try:
                service = DataExportService(db)
                deleted_count = service.cleanup_expired_exports()

                logger.info(f"Expired exports cleanup completed: {deleted_count} exports deleted")

            finally:
                db.close()

        except Exception as e:
            logger.error(f"Error in expired exports cleanup job: {e}", exc_info=True)

    def cleanup_old_audit_logs(self):
        """
        Clean up old audit logs (older than retention period)
        Runs weekly on Sunday at 3 AM
        """
        try:
            logger.info("Starting old audit logs cleanup job")
            db = SessionLocal()

            try:
                deleted_count = AuditLogService.cleanup_old_logs(
                    db,
                    retention_days=365  # Keep 1 year of audit logs
                )

                logger.info(f"Old audit logs cleanup completed: {deleted_count} logs deleted")

            finally:
                db.close()

        except Exception as e:
            logger.error(f"Error in audit logs cleanup job: {e}", exc_info=True)

    def cleanup_expired_sessions(self):
        """
        Clean up expired user sessions
        Runs every hour
        """
        try:
            logger.info("Starting expired sessions cleanup job")
            db = SessionLocal()

            try:
                deleted_count = session_service.cleanup_expired_sessions(db)

                logger.info(f"Expired sessions cleanup completed: {deleted_count} sessions cleaned up")

            finally:
                db.close()

        except Exception as e:
            logger.error(f"Error in expired sessions cleanup job: {e}", exc_info=True)

    def start(self):
        """Start the background scheduler"""
        if self._is_running:
            logger.warning("Scheduler is already running")
            return

        try:
            # Job 1: Process pending deletions every hour
            self.scheduler.add_job(
                func=self.process_pending_deletions,
                trigger=IntervalTrigger(hours=1),
                id='process_pending_deletions',
                name='Process Pending Account Deletions',
                replace_existing=True,
                max_instances=1,  # Prevent concurrent runs
                misfire_grace_time=300  # 5 minute grace period for misfires
            )
            logger.info("Scheduled job: Process pending deletions (every hour)")

            # Job 2: Process pending data exports every 30 seconds
            self.scheduler.add_job(
                func=self.process_pending_exports,
                trigger=IntervalTrigger(seconds=30),
                id='process_pending_exports',
                name='Process Pending Data Exports',
                replace_existing=True,
                max_instances=1,  # Prevent concurrent runs
                misfire_grace_time=30  # 30 seconds grace period
            )
            logger.info("Scheduled job: Process pending exports (every 30 seconds)")

            # Job 3: Clean up expired exports daily at 2 AM
            self.scheduler.add_job(
                func=self.cleanup_expired_exports,
                trigger=CronTrigger(hour=2, minute=0),
                id='cleanup_expired_exports',
                name='Clean Up Expired Data Exports',
                replace_existing=True,
                max_instances=1,
                misfire_grace_time=3600  # 1 hour grace period
            )
            logger.info("Scheduled job: Clean up expired exports (daily at 2 AM)")

            # Job 4: Clean up old audit logs weekly on Sunday at 3 AM
            self.scheduler.add_job(
                func=self.cleanup_old_audit_logs,
                trigger=CronTrigger(day_of_week='sun', hour=3, minute=0),
                id='cleanup_old_audit_logs',
                name='Clean Up Old Audit Logs',
                replace_existing=True,
                max_instances=1,
                misfire_grace_time=3600  # 1 hour grace period
            )
            logger.info("Scheduled job: Clean up old audit logs (weekly on Sunday at 3 AM)")

            # Job 5: Clean up expired sessions every hour
            self.scheduler.add_job(
                func=self.cleanup_expired_sessions,
                trigger=IntervalTrigger(hours=1),
                id='cleanup_expired_sessions',
                name='Clean Up Expired User Sessions',
                replace_existing=True,
                max_instances=1,
                misfire_grace_time=300  # 5 minute grace period
            )
            logger.info("Scheduled job: Clean up expired sessions (every hour)")

            # Start scheduler
            self.scheduler.start()
            self._is_running = True

            logger.info("Background job scheduler started successfully")

        except Exception as e:
            logger.error(f"Failed to start scheduler: {e}", exc_info=True)
            raise

    def stop(self):
        """Stop the background scheduler"""
        if not self._is_running:
            logger.warning("Scheduler is not running")
            return

        try:
            self.scheduler.shutdown(wait=True)
            self._is_running = False
            logger.info("Background job scheduler stopped")

        except Exception as e:
            logger.error(f"Error stopping scheduler: {e}", exc_info=True)

    def get_jobs_status(self):
        """Get status of all scheduled jobs"""
        if not self._is_running:
            return {'status': 'stopped', 'jobs': []}

        jobs = []
        for job in self.scheduler.get_jobs():
            next_run = job.next_run_time.isoformat() if job.next_run_time else None
            jobs.append({
                'id': job.id,
                'name': job.name,
                'next_run': next_run,
                'trigger': str(job.trigger)
            })

        return {
            'status': 'running',
            'jobs': jobs
        }


# Singleton instance
_scheduler = None


def get_scheduler() -> BackgroundJobScheduler:
    """Get or create background scheduler instance"""
    global _scheduler
    if _scheduler is None:
        _scheduler = BackgroundJobScheduler()
    return _scheduler


def start_background_jobs():
    """Start background jobs (call this on application startup)"""
    scheduler = get_scheduler()
    scheduler.start()
    return scheduler


def stop_background_jobs():
    """Stop background jobs (call this on application shutdown)"""
    scheduler = get_scheduler()
    scheduler.stop()
