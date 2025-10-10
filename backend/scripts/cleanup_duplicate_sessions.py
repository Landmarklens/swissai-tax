"""
Cleanup script for duplicate user sessions.
This script removes duplicate sessions that were created due to the auto-creation bug.
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from db.session import SessionLocal
from models.user_session import UserSession
from sqlalchemy import func, and_
from datetime import datetime

def cleanup_duplicate_sessions():
    """Remove duplicate sessions, keeping only the most recent one per unique combination"""
    db = SessionLocal()

    try:
        print("Starting duplicate session cleanup...")

        # Get all active sessions
        sessions = db.query(UserSession).filter(
            UserSession.is_active == True
        ).order_by(UserSession.user_id, UserSession.created_at.desc()).all()

        print(f"Found {len(sessions)} active sessions")

        # Group sessions by user_id, device_name, ip_address
        session_groups = {}
        for session in sessions:
            key = (session.user_id, session.device_name, session.ip_address)
            if key not in session_groups:
                session_groups[key] = []
            session_groups[key].append(session)

        # Find duplicates
        duplicates_found = 0
        duplicates_removed = 0

        for key, group in session_groups.items():
            if len(group) > 1:
                duplicates_found += len(group) - 1
                print(f"\nFound {len(group)} duplicate sessions for user {key[0]}:")
                print(f"  Device: {key[1]}, IP: {key[2]}")

                # Keep the most recent session, mark others as inactive
                keep_session = group[0]  # Most recent (already sorted desc)
                print(f"  Keeping session {keep_session.id} (created: {keep_session.created_at})")

                for duplicate in group[1:]:
                    print(f"  Removing session {duplicate.id} (created: {duplicate.created_at})")
                    duplicate.revoke()
                    duplicates_removed += 1

        # Commit changes
        db.commit()

        print(f"\n✓ Cleanup complete!")
        print(f"  Total duplicates found: {duplicates_found}")
        print(f"  Duplicates removed: {duplicates_removed}")
        print(f"  Unique sessions remaining: {len(session_groups)}")

    except Exception as e:
        print(f"✗ Error during cleanup: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_duplicate_sessions()
