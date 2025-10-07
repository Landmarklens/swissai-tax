"""
Password reset service
"""

import secrets
from datetime import datetime, timedelta

from jose import jwt

from config import settings


class ResetPasswordService:
    """Service for password reset functionality"""

    @staticmethod
    def create_password_reset_token(email: str) -> str:
        """Create a JWT token for password reset"""
        payload = {
            "email": email,
            "exp": datetime.utcnow() + timedelta(hours=1)  # Token expires in 1 hour
        }
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
        return token

    @staticmethod
    def verify_password_reset_token(token: str) -> bool:
        """Verify a password reset token"""
        try:
            jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            return True
        except:
            return False

    @staticmethod
    def get_reset_link(token: str) -> str:
        """Get the password reset link"""
        # This should point to your frontend reset password page
        base_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        return f"{base_url}/reset-password?token={token}"
