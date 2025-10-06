"""
User Counter Service

Business logic for the daily user counter feature.
Implements smart incremental updates that reset at midnight.
"""
import random
from datetime import datetime, time, timedelta
from sqlalchemy.orm import Session
from backend.models.user_counter import UserCounter


# Constants for user count range (daily users, not total)
MIN_USERS = 15
MAX_USERS = 291


class UserCounterService:
    """Service for managing the daily user counter"""

    @staticmethod
    def get_or_create_counter(db: Session) -> UserCounter:
        """
        Get the counter or create it if it doesn't exist.

        Args:
            db: Database session

        Returns:
            UserCounter: The user counter instance
        """
        counter = db.query(UserCounter).filter(UserCounter.id == 1).first()

        if not counter:
            # Create initial counter with random target
            counter = UserCounter(
                id=1,
                user_count=MIN_USERS,
                target_count=random.randint(MIN_USERS, MAX_USERS),
                last_reset=datetime.now(),
                last_updated=datetime.now()
            )
            db.add(counter)
            db.commit()
            db.refresh(counter)

        return counter

    @staticmethod
    def reset_counter_if_needed(db: Session, counter: UserCounter) -> bool:
        """
        Reset the counter if it's a new day.

        Args:
            db: Database session
            counter: Current counter instance

        Returns:
            bool: True if counter was reset, False otherwise
        """
        now = datetime.now()
        last_reset = counter.last_reset

        # Check if it's a new day
        if now.date() > last_reset.date():
            # Reset counter
            counter.user_count = MIN_USERS
            counter.target_count = random.randint(MIN_USERS, MAX_USERS)
            counter.last_reset = now
            counter.last_updated = now

            db.commit()
            db.refresh(counter)
            return True

        return False

    @staticmethod
    def calculate_increment(counter: UserCounter) -> int:
        """
        Calculate how much to increment the counter based on time elapsed.

        Uses a smart algorithm that:
        - Increments faster when more time is available
        - Slows down as we approach midnight
        - Never exceeds the daily target

        Args:
            counter: Current counter instance

        Returns:
            int: Amount to increment (0-5)
        """
        now = datetime.now()

        # If we've already reached the target, don't increment
        if counter.user_count >= counter.target_count:
            return 0

        # Calculate seconds until midnight
        midnight = datetime.combine(now.date() + timedelta(days=1), time.min)
        seconds_until_midnight = (midnight - now).total_seconds()

        # Don't increment in the last minute before midnight
        if seconds_until_midnight < 60:
            return 0

        # Calculate remaining increments needed
        remaining_increments = counter.target_count - counter.user_count

        # Calculate average seconds per increment needed
        avg_seconds_per_increment = seconds_until_midnight / remaining_increments if remaining_increments > 0 else 0

        # Calculate seconds since last update
        seconds_since_update = (now - counter.last_updated).total_seconds()

        # If enough time has passed, increment
        if seconds_since_update >= avg_seconds_per_increment:
            # Random increment between 1-5, but don't exceed target
            max_increment = min(5, remaining_increments)
            increment = random.randint(1, max_increment)
            return increment

        return 0

    @staticmethod
    def get_user_counter(db: Session) -> dict:
        """
        Get the current user counter with automatic increment logic.

        This is the main entry point that:
        1. Gets or creates the counter
        2. Resets if new day
        3. Calculates and applies increment
        4. Returns current state

        Args:
            db: Database session

        Returns:
            dict: Counter data with user_count, target_count, last_reset, time_until_midnight
        """
        # Get or create counter
        counter = UserCounterService.get_or_create_counter(db)

        # Reset if needed
        UserCounterService.reset_counter_if_needed(db, counter)

        # Calculate increment
        increment = UserCounterService.calculate_increment(counter)

        # Apply increment if any
        if increment > 0:
            counter.user_count += increment
            counter.last_updated = datetime.now()
            db.commit()
            db.refresh(counter)

        # Calculate time until midnight
        now = datetime.now()
        midnight = datetime.combine(now.date() + timedelta(days=1), time.min)
        time_until_midnight = (midnight - now).total_seconds()

        return {
            "user_count": counter.user_count,
            "target_count": counter.target_count,
            "last_reset": counter.last_reset,
            "time_until_midnight": time_until_midnight
        }
