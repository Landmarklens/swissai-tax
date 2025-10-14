"""Database transaction management utilities"""

from contextlib import contextmanager, asynccontextmanager
from typing import Optional, Any, Callable
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
import logging
from functools import wraps
import asyncio

logger = logging.getLogger(__name__)


@contextmanager
def transaction_scope(db: Session, rollback_on_error: bool = True):
    """
    Provide a transactional scope around a series of operations.

    Args:
        db: SQLAlchemy session
        rollback_on_error: Whether to rollback on error (default True)

    Usage:
        with transaction_scope(db) as session:
            session.add(model)
            session.add(another_model)
    """
    try:
        yield db
        db.commit()
        logger.debug("Transaction committed successfully")
    except SQLAlchemyError as e:
        if rollback_on_error:
            db.rollback()
            logger.error(f"Transaction rolled back due to error: {e}")
        raise
    except Exception as e:
        if rollback_on_error:
            db.rollback()
            logger.error(f"Transaction rolled back due to unexpected error: {e}")
        raise


@asynccontextmanager
async def async_transaction_scope(db: Session, rollback_on_error: bool = True):
    """
    Async version of transaction scope for async operations

    Args:
        db: SQLAlchemy session
        rollback_on_error: Whether to rollback on error (default True)
    """
    try:
        yield db
        await asyncio.get_event_loop().run_in_executor(None, db.commit)
        logger.debug("Async transaction committed successfully")
    except SQLAlchemyError as e:
        if rollback_on_error:
            await asyncio.get_event_loop().run_in_executor(None, db.rollback)
            logger.error(f"Async transaction rolled back due to error: {e}")
        raise
    except Exception as e:
        if rollback_on_error:
            await asyncio.get_event_loop().run_in_executor(None, db.rollback)
            logger.error(f"Async transaction rolled back due to unexpected error: {e}")
        raise


def transactional(rollback_on_error: bool = True):
    """
    Decorator for transactional operations

    Args:
        rollback_on_error: Whether to rollback on error

    Usage:
        @transactional()
        def create_user_with_profile(db: Session, user_data: dict):
            user = User(**user_data)
            db.add(user)
            profile = Profile(user=user)
            db.add(profile)
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Find the db session in arguments
            db = None
            for arg in args:
                if isinstance(arg, Session):
                    db = arg
                    break

            if not db and 'db' in kwargs:
                db = kwargs['db']

            if not db:
                raise ValueError("No database session found in function arguments")

            with transaction_scope(db, rollback_on_error):
                return func(*args, **kwargs)

        return wrapper
    return decorator


def async_transactional(rollback_on_error: bool = True):
    """
    Decorator for async transactional operations

    Args:
        rollback_on_error: Whether to rollback on error

    Usage:
        @async_transactional()
        async def create_user_with_extraction(db: Session, user_data: dict):
            user = User(**user_data)
            db.add(user)
            extraction = await process_extraction(user)
            db.add(extraction)
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Find the db session in arguments
            db = None
            for arg in args:
                if isinstance(arg, Session):
                    db = arg
                    break

            if not db and 'db' in kwargs:
                db = kwargs['db']

            if not db:
                raise ValueError("No database session found in function arguments")

            async with async_transaction_scope(db, rollback_on_error):
                return await func(*args, **kwargs)

        return wrapper
    return decorator


class BulkOperationManager:
    """
    Manager for bulk database operations with automatic batching

    Usage:
        bulk = BulkOperationManager(db, batch_size=1000)
        for item in large_list:
            bulk.add(Model(**item))
        bulk.commit()
    """

    def __init__(self, db: Session, batch_size: int = 1000):
        self.db = db
        self.batch_size = batch_size
        self.operations = []
        self.operation_count = 0

    def add(self, obj: Any):
        """Add object to batch"""
        self.operations.append(('add', obj))
        self.operation_count += 1

        if self.operation_count >= self.batch_size:
            self._flush()

    def update(self, obj: Any):
        """Update object in batch"""
        self.operations.append(('merge', obj))
        self.operation_count += 1

        if self.operation_count >= self.batch_size:
            self._flush()

    def delete(self, obj: Any):
        """Delete object in batch"""
        self.operations.append(('delete', obj))
        self.operation_count += 1

        if self.operation_count >= self.batch_size:
            self._flush()

    def _flush(self):
        """Flush current batch"""
        if not self.operations:
            return

        try:
            for operation, obj in self.operations:
                if operation == 'add':
                    self.db.add(obj)
                elif operation == 'merge':
                    self.db.merge(obj)
                elif operation == 'delete':
                    self.db.delete(obj)

            self.db.flush()
            logger.debug(f"Flushed batch of {self.operation_count} operations")

            self.operations.clear()
            self.operation_count = 0
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Batch operation failed: {e}")
            raise

    def commit(self):
        """Commit all pending operations"""
        if self.operations:
            self._flush()

        try:
            self.db.commit()
            logger.debug("Bulk operations committed successfully")
        except SQLAlchemyError as e:
            self.db.rollback()
            logger.error(f"Bulk commit failed: {e}")
            raise


class ReadReplicaManager:
    """
    Manager for read replica operations to distribute load

    Usage:
        read_manager = ReadReplicaManager(primary_db, replica_db)
        # Heavy read operation uses replica
        results = read_manager.query_replica(Model).filter(...)
        # Write operation uses primary
        read_manager.write_primary(new_model)
    """

    def __init__(self, primary_db: Session, replica_db: Optional[Session] = None):
        self.primary_db = primary_db
        self.replica_db = replica_db or primary_db

    def query_replica(self, model: Any):
        """Execute query on replica for read operations"""
        return self.replica_db.query(model)

    def query_primary(self, model: Any):
        """Execute query on primary (for consistency-critical reads)"""
        return self.primary_db.query(model)

    def write_primary(self, obj: Any):
        """Write to primary database"""
        with transaction_scope(self.primary_db):
            self.primary_db.add(obj)

    def bulk_write_primary(self, objects: list):
        """Bulk write to primary database"""
        bulk = BulkOperationManager(self.primary_db)
        for obj in objects:
            bulk.add(obj)
        bulk.commit()


def retry_on_deadlock(max_retries: int = 3, delay: float = 0.1):
    """
    Decorator to retry operations on database deadlock

    Args:
        max_retries: Maximum number of retry attempts
        delay: Delay between retries in seconds
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return await func(*args, **kwargs)
                except SQLAlchemyError as e:
                    if 'deadlock' in str(e).lower() and attempt < max_retries - 1:
                        logger.warning(f"Deadlock detected, retrying ({attempt + 1}/{max_retries})")
                        await asyncio.sleep(delay * (2 ** attempt))  # Exponential backoff
                    else:
                        raise

        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            import time
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except SQLAlchemyError as e:
                    if 'deadlock' in str(e).lower() and attempt < max_retries - 1:
                        logger.warning(f"Deadlock detected, retrying ({attempt + 1}/{max_retries})")
                        time.sleep(delay * (2 ** attempt))  # Exponential backoff
                    else:
                        raise

        # Return appropriate wrapper based on function type
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper

    return decorator