"""
Comprehensive unit tests for services/background_jobs.py
Tests background job scheduler and all job functions
Target: 90%+ coverage
"""
import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, Mock, patch, call
from uuid import uuid4

import pytest

from services.background_jobs import (
    BackgroundJobScheduler,
    get_scheduler,
    start_background_jobs,
    stop_background_jobs
)


class TestBackgroundJobScheduler(unittest.TestCase):
    """Test BackgroundJobScheduler class"""

    def setUp(self):
        """Set up test fixtures"""
        self.scheduler = BackgroundJobScheduler()

    def tearDown(self):
        """Clean up after tests"""
        # Reset singleton
        import services.background_jobs
        services.background_jobs._scheduler = None

    @patch('services.background_jobs.BackgroundScheduler')
    def test_init(self, mock_scheduler_class):
        """Test scheduler initialization"""
        scheduler = BackgroundJobScheduler()

        # Verify BackgroundScheduler was instantiated
        mock_scheduler_class.assert_called_once()

        # Verify initial state
        self.assertFalse(scheduler._is_running)
        self.assertIsNotNone(scheduler.scheduler)

    @patch('services.background_jobs.SessionLocal')
    @patch('services.background_jobs.UserDeletionService')
    def test_process_pending_deletions_success(self, mock_service_class, mock_session_local):
        """Test processing pending deletions successfully"""
        # Setup mocks
        mock_db = MagicMock()
        mock_session_local.return_value = mock_db

        mock_service = MagicMock()
        mock_service_class.return_value = mock_service

        # Mock deletion requests
        mock_request1 = Mock()
        mock_request1.id = uuid4()
        mock_request1.user_id = uuid4()

        mock_request2 = Mock()
        mock_request2.id = uuid4()
        mock_request2.user_id = uuid4()

        mock_service.get_deletion_requests_ready_for_execution.return_value = [
            mock_request1,
            mock_request2
        ]

        # Mock successful deletions
        mock_service.execute_deletion.side_effect = [
            {
                'status': 'success',
                's3_documents_deleted': 5,
                's3_exports_deleted': 2,
                'subscriptions_cancelled': 1
            },
            {
                'status': 'success',
                's3_documents_deleted': 3,
                's3_exports_deleted': 1,
                'subscriptions_cancelled': 0
            }
        ]

        # Execute
        self.scheduler.process_pending_deletions()

        # Verify
        mock_session_local.assert_called_once()
        mock_service_class.assert_called_once_with(mock_db)
        mock_service.get_deletion_requests_ready_for_execution.assert_called_once()

        # Verify both deletions were executed
        self.assertEqual(mock_service.execute_deletion.call_count, 2)
        mock_service.execute_deletion.assert_any_call(mock_request1.id)
        mock_service.execute_deletion.assert_any_call(mock_request2.id)

        # Verify DB session was closed
        mock_db.close.assert_called_once()

    @patch('services.background_jobs.SessionLocal')
    @patch('services.background_jobs.UserDeletionService')
    def test_process_pending_deletions_no_requests(self, mock_service_class, mock_session_local):
        """Test processing when no deletion requests are ready"""
        # Setup mocks
        mock_db = MagicMock()
        mock_session_local.return_value = mock_db

        mock_service = MagicMock()
        mock_service_class.return_value = mock_service
        mock_service.get_deletion_requests_ready_for_execution.return_value = []

        # Execute
        self.scheduler.process_pending_deletions()

        # Verify
        mock_service.get_deletion_requests_ready_for_execution.assert_called_once()
        mock_service.execute_deletion.assert_not_called()
        mock_db.close.assert_called_once()

    @patch('services.background_jobs.SessionLocal')
    @patch('services.background_jobs.UserDeletionService')
    @patch('services.background_jobs.logger')
    def test_process_pending_deletions_with_failures(
        self, mock_logger, mock_service_class, mock_session_local
    ):
        """Test processing deletions with some failures"""
        # Setup mocks
        mock_db = MagicMock()
        mock_session_local.return_value = mock_db

        mock_service = MagicMock()
        mock_service_class.return_value = mock_service

        mock_request1 = Mock()
        mock_request1.id = uuid4()
        mock_request1.user_id = uuid4()

        mock_request2 = Mock()
        mock_request2.id = uuid4()
        mock_request2.user_id = uuid4()

        mock_service.get_deletion_requests_ready_for_execution.return_value = [
            mock_request1,
            mock_request2
        ]

        # First succeeds, second fails
        mock_service.execute_deletion.side_effect = [
            {'status': 'success', 's3_documents_deleted': 5},
            {'status': 'error', 'error': 'Database error'}
        ]

        # Execute
        self.scheduler.process_pending_deletions()

        # Verify both were attempted
        self.assertEqual(mock_service.execute_deletion.call_count, 2)

        # Verify error was logged
        mock_logger.error.assert_called()

        mock_db.close.assert_called_once()

    @patch('services.background_jobs.SessionLocal')
    @patch('services.background_jobs.UserDeletionService')
    @patch('services.background_jobs.logger')
    def test_process_pending_deletions_exception_handling(
        self, mock_logger, mock_service_class, mock_session_local
    ):
        """Test exception handling during deletion processing"""
        # Setup mocks
        mock_db = MagicMock()
        mock_session_local.return_value = mock_db

        mock_service = MagicMock()
        mock_service_class.return_value = mock_service

        mock_request = Mock()
        mock_request.id = uuid4()
        mock_request.user_id = uuid4()

        mock_service.get_deletion_requests_ready_for_execution.return_value = [mock_request]

        # Raise exception during deletion
        mock_service.execute_deletion.side_effect = Exception("Unexpected error")

        # Execute (should not raise)
        self.scheduler.process_pending_deletions()

        # Verify error was logged
        mock_logger.error.assert_called()

        # Verify DB was still closed
        mock_db.close.assert_called_once()

    @patch('services.background_jobs.SessionLocal')
    @patch('services.background_jobs.logger')
    def test_process_pending_deletions_session_error(self, mock_logger, mock_session_local):
        """Test handling of session creation errors"""
        # Mock session creation failure
        mock_session_local.side_effect = Exception("Database connection failed")

        # Execute (should not raise)
        self.scheduler.process_pending_deletions()

        # Verify error was logged
        mock_logger.error.assert_called()

    @patch('services.background_jobs.SessionLocal')
    @patch('services.background_jobs.DataExportService')
    def test_process_pending_exports_success(self, mock_service_class, mock_session_local):
        """Test processing pending exports successfully"""
        # Setup mocks
        mock_db = MagicMock()
        mock_session_local.return_value = mock_db

        mock_service = MagicMock()
        mock_service_class.return_value = mock_service

        # Mock pending exports
        mock_export1 = Mock()
        mock_export1.id = uuid4()
        mock_export1.user_id = uuid4()

        mock_export2 = Mock()
        mock_export2.id = uuid4()
        mock_export2.user_id = uuid4()

        # Mock query result
        mock_query = MagicMock()
        mock_query.filter.return_value = mock_query
        mock_query.limit.return_value = mock_query
        mock_query.all.return_value = [mock_export1, mock_export2]

        mock_db.query.return_value = mock_query

        # Execute
        self.scheduler.process_pending_exports()

        # Verify
        mock_session_local.assert_called_once()
        mock_service_class.assert_called_once_with(mock_db)

        # Verify both exports were processed
        self.assertEqual(mock_service.generate_export.call_count, 2)
        mock_service.generate_export.assert_any_call(mock_export1.id)
        mock_service.generate_export.assert_any_call(mock_export2.id)

        mock_db.close.assert_called_once()

    @patch('services.background_jobs.SessionLocal')
    @patch('services.background_jobs.DataExportService')
    def test_process_pending_exports_no_exports(self, mock_service_class, mock_session_local):
        """Test processing when no pending exports exist"""
        # Setup mocks
        mock_db = MagicMock()
        mock_session_local.return_value = mock_db

        mock_service = MagicMock()
        mock_service_class.return_value = mock_service

        # Mock empty query result
        mock_query = MagicMock()
        mock_query.filter.return_value = mock_query
        mock_query.limit.return_value = mock_query
        mock_query.all.return_value = []

        mock_db.query.return_value = mock_query

        # Execute
        self.scheduler.process_pending_exports()

        # Verify
        mock_service.generate_export.assert_not_called()
        mock_db.close.assert_called_once()

    @patch('services.background_jobs.SessionLocal')
    @patch('services.background_jobs.DataExportService')
    @patch('services.background_jobs.logger')
    def test_process_pending_exports_with_failures(
        self, mock_logger, mock_service_class, mock_session_local
    ):
        """Test processing exports with some failures"""
        # Setup mocks
        mock_db = MagicMock()
        mock_session_local.return_value = mock_db

        mock_service = MagicMock()
        mock_service_class.return_value = mock_service

        mock_export1 = Mock()
        mock_export1.id = uuid4()
        mock_export1.user_id = uuid4()

        mock_export2 = Mock()
        mock_export2.id = uuid4()
        mock_export2.user_id = uuid4()

        mock_query = MagicMock()
        mock_query.filter.return_value = mock_query
        mock_query.limit.return_value = mock_query
        mock_query.all.return_value = [mock_export1, mock_export2]

        mock_db.query.return_value = mock_query

        # First succeeds, second fails
        mock_service.generate_export.side_effect = [
            None,  # Success
            Exception("S3 upload failed")  # Failure
        ]

        # Execute
        self.scheduler.process_pending_exports()

        # Verify both were attempted
        self.assertEqual(mock_service.generate_export.call_count, 2)

        # Verify error was logged
        mock_logger.error.assert_called()

        mock_db.close.assert_called_once()

    @patch('services.background_jobs.SessionLocal')
    @patch('services.background_jobs.logger')
    def test_process_pending_exports_query_limit(self, mock_logger, mock_session_local):
        """Test that export processing limits to 10 at a time"""
        # Setup mocks
        mock_db = MagicMock()
        mock_session_local.return_value = mock_db

        mock_query = MagicMock()
        mock_query.filter.return_value = mock_query
        mock_query.limit.return_value = mock_query
        mock_query.all.return_value = []

        mock_db.query.return_value = mock_query

        # Execute
        self.scheduler.process_pending_exports()

        # Verify limit was called with 10
        mock_query.limit.assert_called_once_with(10)

    @patch('services.background_jobs.SessionLocal')
    @patch('services.background_jobs.logger')
    def test_process_pending_exports_session_error(self, mock_logger, mock_session_local):
        """Test handling of session creation errors in export processing"""
        # Mock session creation failure
        mock_session_local.side_effect = Exception("Database connection failed")

        # Execute (should not raise)
        self.scheduler.process_pending_exports()

        # Verify error was logged
        mock_logger.error.assert_called()

    @patch('services.background_jobs.SessionLocal')
    @patch('services.background_jobs.DataExportService')
    def test_cleanup_expired_exports_success(self, mock_service_class, mock_session_local):
        """Test cleanup of expired exports successfully"""
        # Setup mocks
        mock_db = MagicMock()
        mock_session_local.return_value = mock_db

        mock_service = MagicMock()
        mock_service_class.return_value = mock_service
        mock_service.cleanup_expired_exports.return_value = 5

        # Execute
        self.scheduler.cleanup_expired_exports()

        # Verify
        mock_session_local.assert_called_once()
        mock_service_class.assert_called_once_with(mock_db)
        mock_service.cleanup_expired_exports.assert_called_once()
        mock_db.close.assert_called_once()

    @patch('services.background_jobs.SessionLocal')
    @patch('services.background_jobs.DataExportService')
    @patch('services.background_jobs.logger')
    def test_cleanup_expired_exports_exception(
        self, mock_logger, mock_service_class, mock_session_local
    ):
        """Test exception handling during export cleanup"""
        # Setup mocks
        mock_db = MagicMock()
        mock_session_local.return_value = mock_db

        mock_service = MagicMock()
        mock_service_class.return_value = mock_service
        mock_service.cleanup_expired_exports.side_effect = Exception("S3 error")

        # Execute (should not raise)
        self.scheduler.cleanup_expired_exports()

        # Verify error was logged
        mock_logger.error.assert_called()
        mock_db.close.assert_called_once()

    @patch('services.background_jobs.SessionLocal')
    @patch('services.background_jobs.AuditLogService')
    def test_cleanup_old_audit_logs_success(self, mock_service_class, mock_session_local):
        """Test cleanup of old audit logs successfully"""
        # Setup mocks
        mock_db = MagicMock()
        mock_session_local.return_value = mock_db

        mock_service_class.cleanup_old_logs.return_value = 150

        # Execute
        self.scheduler.cleanup_old_audit_logs()

        # Verify
        mock_session_local.assert_called_once()
        mock_service_class.cleanup_old_logs.assert_called_once_with(
            mock_db,
            retention_days=365
        )
        mock_db.close.assert_called_once()

    @patch('services.background_jobs.SessionLocal')
    @patch('services.background_jobs.AuditLogService')
    @patch('services.background_jobs.logger')
    def test_cleanup_old_audit_logs_exception(
        self, mock_logger, mock_service_class, mock_session_local
    ):
        """Test exception handling during audit log cleanup"""
        # Setup mocks
        mock_db = MagicMock()
        mock_session_local.return_value = mock_db

        mock_service_class.cleanup_old_logs.side_effect = Exception("Database error")

        # Execute (should not raise)
        self.scheduler.cleanup_old_audit_logs()

        # Verify error was logged
        mock_logger.error.assert_called()
        mock_db.close.assert_called_once()

    @patch('services.background_jobs.BackgroundScheduler')
    @patch('services.background_jobs.IntervalTrigger')
    @patch('services.background_jobs.CronTrigger')
    def test_start_scheduler_success(self, mock_cron, mock_interval, mock_scheduler_class):
        """Test starting scheduler successfully"""
        # Setup mocks
        mock_scheduler = MagicMock()
        mock_scheduler_class.return_value = mock_scheduler

        scheduler = BackgroundJobScheduler()

        # Execute
        scheduler.start()

        # Verify scheduler was started
        mock_scheduler.start.assert_called_once()
        self.assertTrue(scheduler._is_running)

        # Verify jobs were added (5 jobs)
        self.assertEqual(mock_scheduler.add_job.call_count, 5)

        # Verify job IDs
        job_ids = [call[1]['id'] for call in mock_scheduler.add_job.call_args_list]
        self.assertIn('process_pending_deletions', job_ids)
        self.assertIn('process_pending_exports', job_ids)
        self.assertIn('cleanup_expired_exports', job_ids)
        self.assertIn('cleanup_old_audit_logs', job_ids)
        self.assertIn('cleanup_expired_sessions', job_ids)

    @patch('services.background_jobs.BackgroundScheduler')
    @patch('services.background_jobs.logger')
    def test_start_scheduler_already_running(self, mock_logger, mock_scheduler_class):
        """Test starting scheduler when already running"""
        mock_scheduler = MagicMock()
        mock_scheduler_class.return_value = mock_scheduler

        scheduler = BackgroundJobScheduler()
        scheduler._is_running = True

        # Execute
        scheduler.start()

        # Verify warning was logged
        mock_logger.warning.assert_called()

        # Verify scheduler.start was not called
        mock_scheduler.start.assert_not_called()

    @patch('services.background_jobs.BackgroundScheduler')
    @patch('services.background_jobs.logger')
    def test_start_scheduler_exception(self, mock_logger, mock_scheduler_class):
        """Test exception handling when starting scheduler"""
        mock_scheduler = MagicMock()
        mock_scheduler_class.return_value = mock_scheduler
        mock_scheduler.start.side_effect = Exception("Scheduler error")

        scheduler = BackgroundJobScheduler()

        # Execute and expect exception
        with self.assertRaises(Exception):
            scheduler.start()

        # Verify error was logged
        mock_logger.error.assert_called()

    @patch('services.background_jobs.BackgroundScheduler')
    def test_stop_scheduler_success(self, mock_scheduler_class):
        """Test stopping scheduler successfully"""
        mock_scheduler = MagicMock()
        mock_scheduler_class.return_value = mock_scheduler

        scheduler = BackgroundJobScheduler()
        scheduler._is_running = True

        # Execute
        scheduler.stop()

        # Verify
        mock_scheduler.shutdown.assert_called_once_with(wait=True)
        self.assertFalse(scheduler._is_running)

    @patch('services.background_jobs.BackgroundScheduler')
    @patch('services.background_jobs.logger')
    def test_stop_scheduler_not_running(self, mock_logger, mock_scheduler_class):
        """Test stopping scheduler when not running"""
        mock_scheduler = MagicMock()
        mock_scheduler_class.return_value = mock_scheduler

        scheduler = BackgroundJobScheduler()
        scheduler._is_running = False

        # Execute
        scheduler.stop()

        # Verify warning was logged
        mock_logger.warning.assert_called()

        # Verify shutdown was not called
        mock_scheduler.shutdown.assert_not_called()

    @patch('services.background_jobs.BackgroundScheduler')
    @patch('services.background_jobs.logger')
    def test_stop_scheduler_exception(self, mock_logger, mock_scheduler_class):
        """Test exception handling when stopping scheduler"""
        mock_scheduler = MagicMock()
        mock_scheduler_class.return_value = mock_scheduler
        mock_scheduler.shutdown.side_effect = Exception("Shutdown error")

        scheduler = BackgroundJobScheduler()
        scheduler._is_running = True

        # Execute (should not raise)
        scheduler.stop()

        # Verify error was logged
        mock_logger.error.assert_called()

    @patch('services.background_jobs.BackgroundScheduler')
    def test_get_jobs_status_running(self, mock_scheduler_class):
        """Test getting job status when scheduler is running"""
        mock_scheduler = MagicMock()
        mock_scheduler_class.return_value = mock_scheduler

        # Mock jobs
        mock_job1 = Mock()
        mock_job1.id = 'process_pending_deletions'
        mock_job1.name = 'Process Pending Account Deletions'
        mock_job1.next_run_time = datetime.now(timezone.utc)
        mock_job1.trigger = 'interval[1:00:00]'

        mock_job2 = Mock()
        mock_job2.id = 'process_pending_exports'
        mock_job2.name = 'Process Pending Data Exports'
        mock_job2.next_run_time = datetime.now(timezone.utc)
        mock_job2.trigger = 'interval[0:05:00]'

        mock_scheduler.get_jobs.return_value = [mock_job1, mock_job2]

        scheduler = BackgroundJobScheduler()
        scheduler._is_running = True

        # Execute
        status = scheduler.get_jobs_status()

        # Verify
        self.assertEqual(status['status'], 'running')
        self.assertEqual(len(status['jobs']), 2)

        # Verify job details
        job1 = status['jobs'][0]
        self.assertEqual(job1['id'], 'process_pending_deletions')
        self.assertEqual(job1['name'], 'Process Pending Account Deletions')
        self.assertIsNotNone(job1['next_run'])

        job2 = status['jobs'][1]
        self.assertEqual(job2['id'], 'process_pending_exports')

    @patch('services.background_jobs.BackgroundScheduler')
    def test_get_jobs_status_stopped(self, mock_scheduler_class):
        """Test getting job status when scheduler is stopped"""
        mock_scheduler = MagicMock()
        mock_scheduler_class.return_value = mock_scheduler

        scheduler = BackgroundJobScheduler()
        scheduler._is_running = False

        # Execute
        status = scheduler.get_jobs_status()

        # Verify
        self.assertEqual(status['status'], 'stopped')
        self.assertEqual(status['jobs'], [])

        # Verify get_jobs was not called
        mock_scheduler.get_jobs.assert_not_called()

    @patch('services.background_jobs.BackgroundScheduler')
    def test_get_jobs_status_with_no_next_run(self, mock_scheduler_class):
        """Test getting job status when job has no next_run_time"""
        mock_scheduler = MagicMock()
        mock_scheduler_class.return_value = mock_scheduler

        # Mock job with no next_run_time
        mock_job = Mock()
        mock_job.id = 'test_job'
        mock_job.name = 'Test Job'
        mock_job.next_run_time = None
        mock_job.trigger = 'cron'

        mock_scheduler.get_jobs.return_value = [mock_job]

        scheduler = BackgroundJobScheduler()
        scheduler._is_running = True

        # Execute
        status = scheduler.get_jobs_status()

        # Verify
        self.assertEqual(len(status['jobs']), 1)
        self.assertIsNone(status['jobs'][0]['next_run'])


class TestModuleFunctions(unittest.TestCase):
    """Test module-level functions"""

    def tearDown(self):
        """Clean up after tests"""
        # Reset singleton
        import services.background_jobs
        services.background_jobs._scheduler = None

    @patch('services.background_jobs.BackgroundScheduler')
    def test_get_scheduler_creates_instance(self, mock_scheduler_class):
        """Test get_scheduler creates new instance"""
        scheduler = get_scheduler()

        self.assertIsNotNone(scheduler)
        self.assertIsInstance(scheduler, BackgroundJobScheduler)

    @patch('services.background_jobs.BackgroundScheduler')
    def test_get_scheduler_returns_singleton(self, mock_scheduler_class):
        """Test get_scheduler returns same instance"""
        scheduler1 = get_scheduler()
        scheduler2 = get_scheduler()

        self.assertIs(scheduler1, scheduler2)

    @patch('services.background_jobs.BackgroundScheduler')
    def test_start_background_jobs(self, mock_scheduler_class):
        """Test start_background_jobs function"""
        mock_scheduler = MagicMock()
        mock_scheduler_class.return_value = mock_scheduler

        result = start_background_jobs()

        # Verify scheduler was started
        mock_scheduler.start.assert_called_once()

        # Verify returned scheduler
        self.assertIsInstance(result, BackgroundJobScheduler)

    @patch('services.background_jobs.BackgroundScheduler')
    def test_stop_background_jobs(self, mock_scheduler_class):
        """Test stop_background_jobs function"""
        mock_scheduler = MagicMock()
        mock_scheduler_class.return_value = mock_scheduler

        # Start first to create scheduler
        start_background_jobs()

        # Now stop
        stop_background_jobs()

        # Verify scheduler was stopped
        mock_scheduler.shutdown.assert_called_once()


class TestJobSchedulingConfiguration(unittest.TestCase):
    """Test job scheduling configuration details"""

    @patch('services.background_jobs.BackgroundScheduler')
    @patch('services.background_jobs.IntervalTrigger')
    def test_pending_deletions_job_config(self, mock_interval, mock_scheduler_class):
        """Test pending deletions job configuration"""
        mock_scheduler = MagicMock()
        mock_scheduler_class.return_value = mock_scheduler

        scheduler = BackgroundJobScheduler()
        scheduler.start()

        # Find the pending deletions job call
        calls = mock_scheduler.add_job.call_args_list
        deletions_call = [c for c in calls if c[1]['id'] == 'process_pending_deletions'][0]

        # Verify configuration
        self.assertEqual(deletions_call[1]['func'], scheduler.process_pending_deletions)
        self.assertEqual(deletions_call[1]['max_instances'], 1)
        self.assertEqual(deletions_call[1]['misfire_grace_time'], 300)
        self.assertTrue(deletions_call[1]['replace_existing'])

    @patch('services.background_jobs.BackgroundScheduler')
    @patch('services.background_jobs.IntervalTrigger')
    def test_pending_exports_job_config(self, mock_interval, mock_scheduler_class):
        """Test pending exports job configuration"""
        mock_scheduler = MagicMock()
        mock_scheduler_class.return_value = mock_scheduler

        scheduler = BackgroundJobScheduler()
        scheduler.start()

        # Find the pending exports job call
        calls = mock_scheduler.add_job.call_args_list
        exports_call = [c for c in calls if c[1]['id'] == 'process_pending_exports'][0]

        # Verify configuration
        self.assertEqual(exports_call[1]['func'], scheduler.process_pending_exports)
        self.assertEqual(exports_call[1]['max_instances'], 1)
        self.assertEqual(exports_call[1]['misfire_grace_time'], 60)
        self.assertTrue(exports_call[1]['replace_existing'])

    @patch('services.background_jobs.BackgroundScheduler')
    @patch('services.background_jobs.CronTrigger')
    def test_cleanup_expired_exports_job_config(self, mock_cron, mock_scheduler_class):
        """Test cleanup expired exports job configuration"""
        mock_scheduler = MagicMock()
        mock_scheduler_class.return_value = mock_scheduler

        scheduler = BackgroundJobScheduler()
        scheduler.start()

        # Find the cleanup exports job call
        calls = mock_scheduler.add_job.call_args_list
        cleanup_call = [c for c in calls if c[1]['id'] == 'cleanup_expired_exports'][0]

        # Verify configuration
        self.assertEqual(cleanup_call[1]['func'], scheduler.cleanup_expired_exports)
        self.assertEqual(cleanup_call[1]['max_instances'], 1)
        self.assertEqual(cleanup_call[1]['misfire_grace_time'], 3600)
        self.assertTrue(cleanup_call[1]['replace_existing'])

    @patch('services.background_jobs.BackgroundScheduler')
    @patch('services.background_jobs.CronTrigger')
    def test_cleanup_audit_logs_job_config(self, mock_cron, mock_scheduler_class):
        """Test cleanup audit logs job configuration"""
        mock_scheduler = MagicMock()
        mock_scheduler_class.return_value = mock_scheduler

        scheduler = BackgroundJobScheduler()
        scheduler.start()

        # Find the cleanup audit logs job call
        calls = mock_scheduler.add_job.call_args_list
        audit_call = [c for c in calls if c[1]['id'] == 'cleanup_old_audit_logs'][0]

        # Verify configuration
        self.assertEqual(audit_call[1]['func'], scheduler.cleanup_old_audit_logs)
        self.assertEqual(audit_call[1]['max_instances'], 1)
        self.assertEqual(audit_call[1]['misfire_grace_time'], 3600)
        self.assertTrue(audit_call[1]['replace_existing'])


class TestIntegrationScenarios(unittest.TestCase):
    """Test complete workflow scenarios"""

    def tearDown(self):
        """Clean up after tests"""
        import services.background_jobs
        services.background_jobs._scheduler = None

    @patch('services.background_jobs.BackgroundScheduler')
    @patch('services.background_jobs.SessionLocal')
    @patch('services.background_jobs.UserDeletionService')
    def test_complete_deletion_workflow(
        self, mock_service_class, mock_session_local, mock_scheduler_class
    ):
        """Test complete deletion workflow from start to execution"""
        # Setup
        mock_scheduler = MagicMock()
        mock_scheduler_class.return_value = mock_scheduler

        mock_db = MagicMock()
        mock_session_local.return_value = mock_db

        mock_service = MagicMock()
        mock_service_class.return_value = mock_service

        mock_request = Mock()
        mock_request.id = uuid4()
        mock_request.user_id = uuid4()

        mock_service.get_deletion_requests_ready_for_execution.return_value = [mock_request]
        mock_service.execute_deletion.return_value = {
            'status': 'success',
            's3_documents_deleted': 10,
            's3_exports_deleted': 2,
            'subscriptions_cancelled': 1
        }

        # Execute
        scheduler = BackgroundJobScheduler()
        scheduler.start()
        scheduler.process_pending_deletions()
        scheduler.stop()

        # Verify complete workflow
        mock_scheduler.start.assert_called_once()
        mock_service.execute_deletion.assert_called_once_with(mock_request.id)
        mock_scheduler.shutdown.assert_called_once()

    @patch('services.background_jobs.BackgroundScheduler')
    @patch('services.background_jobs.SessionLocal')
    @patch('services.background_jobs.DataExportService')
    @patch('services.background_jobs.AuditLogService')
    def test_multiple_jobs_execution(
        self, mock_audit_service, mock_export_service_class,
        mock_session_local, mock_scheduler_class
    ):
        """Test executing multiple different jobs"""
        # Setup
        mock_scheduler = MagicMock()
        mock_scheduler_class.return_value = mock_scheduler

        mock_db = MagicMock()
        mock_session_local.return_value = mock_db

        mock_export_service = MagicMock()
        mock_export_service_class.return_value = mock_export_service
        mock_export_service.cleanup_expired_exports.return_value = 5

        mock_audit_service.cleanup_old_logs.return_value = 100

        # Mock empty query for exports
        mock_query = MagicMock()
        mock_query.filter.return_value = mock_query
        mock_query.limit.return_value = mock_query
        mock_query.all.return_value = []
        mock_db.query.return_value = mock_query

        # Execute
        scheduler = BackgroundJobScheduler()
        scheduler.process_pending_exports()
        scheduler.cleanup_expired_exports()
        scheduler.cleanup_old_audit_logs()

        # Verify all jobs ran
        mock_export_service.cleanup_expired_exports.assert_called_once()
        mock_audit_service.cleanup_old_logs.assert_called_once_with(mock_db, retention_days=365)

        # Verify DB was closed for each job
        self.assertEqual(mock_db.close.call_count, 3)


if __name__ == '__main__':
    unittest.main()
