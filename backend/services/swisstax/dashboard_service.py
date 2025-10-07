"""
Dashboard Service
Business logic for dashboard data retrieval
"""

from datetime import date, datetime
from sqlalchemy.orm import Session
from models.swisstax import Filing
from models import InterviewSession, TaxCalculation


class DashboardService:
    """Service for dashboard operations"""

    def get_dashboard_data(self, user_id: str, db: Session):
        """Get complete dashboard data for user"""

        # Get active filings
        active_filings = self._get_active_filings(user_id, db)

        # Get past filings
        past_filings = self._get_past_filings(user_id, db)

        # Calculate stats
        stats = self._calculate_stats(user_id, db)

        # Get reminders
        reminders = self._get_reminders(user_id, db)

        return {
            "active_filings": active_filings,
            "past_filings": past_filings,
            "stats": stats,
            "reminders": reminders
        }

    def _get_active_filings(self, user_id: str, db: Session):
        """Get active/in-progress filings"""
        sessions = db.query(InterviewSession).filter(
            InterviewSession.user_id == user_id,
            InterviewSession.status.in_(['in_progress', 'completed'])
        ).all()

        active = []
        for session in sessions:
            # Get latest calculation for estimated refund
            calc = db.query(TaxCalculation).filter(
                TaxCalculation.session_id == session.id
            ).order_by(TaxCalculation.created_at.desc()).first()

            estimated_refund = None
            if calc:
                # Calculate refund from total_tax and paid amount
                # This is simplified - real calculation would need payment data
                estimated_refund = float(calc.total_tax or 0)

            active.append({
                "id": str(session.id),
                "tax_year": session.tax_year,
                "status": session.status,
                "progress": session.completion_percentage,
                "last_saved": session.started_at,  # Would use updated_at if available
                "estimated_refund": estimated_refund
            })

        return active

    def _get_past_filings(self, user_id: str, db: Session):
        """Get submitted/completed filings"""
        filings = db.query(Filing).filter(
            Filing.user_id == user_id,
            Filing.status.in_(['submitted', 'confirmed'])
        ).order_by(Filing.submitted_at.desc()).all()

        return [{
            "id": str(f.id),
            "tax_year": f.tax_year,
            "status": f.status,
            "submitted_at": f.submitted_at,
            "confirmation_number": f.confirmation_number,
            "refund_amount": float(f.refund_amount) if f.refund_amount else None,
            "payment_amount": float(f.payment_amount) if f.payment_amount else None,
            "pdf_url": f.pdf_url
        } for f in filings]

    def _calculate_stats(self, user_id: str, db: Session):
        """Calculate user statistics"""
        filings = db.query(Filing).filter(Filing.user_id == user_id).all()

        total_filings = len(filings)
        total_refunds = sum(float(f.refund_amount or 0) for f in filings)
        avg_refund = total_refunds / total_filings if total_filings > 0 else 0

        # Calculate days until deadline
        deadline = date(2025, 4, 30)  # Swiss tax deadline
        days_until = (deadline - date.today()).days

        return {
            "total_filings": total_filings,
            "total_refunds": round(total_refunds, 2),
            "average_refund": round(avg_refund, 2),
            "days_until_deadline": max(0, days_until)
        }

    def _get_reminders(self, user_id: str, db: Session):
        """Get user reminders and tips"""
        reminders = []

        # Deadline reminder
        days_until = self._calculate_stats(user_id, db)["days_until_deadline"]
        if days_until < 60:
            reminders.append({
                "type": "deadline",
                "message": f"Only {days_until} days left until filing deadline",
                "priority": "high" if days_until < 30 else "medium",
                "date": None
            })

        # Tax tips
        reminders.append({
            "type": "tip",
            "message": "Don't forget to claim pillar 3a deductions",
            "priority": "low",
            "date": None
        })

        return reminders


# Singleton instance
dashboard_service = DashboardService()
