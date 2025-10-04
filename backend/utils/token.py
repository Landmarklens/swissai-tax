import jwt
from config.env import env
from datetime import datetime, timedelta, timezone

secret_key = env["SECRET_KEY"]
token_lifetime = env["ACCESS_TOKEN_EXPIRE_MINUTES"]


def createAccessToken(id: int, email: str):
  to_encode = {
    "id": id,
    "email": email,
    "exp": datetime.now(tz=timezone.utc) + timedelta(minutes=token_lifetime)
  }
  return jwt.encode(to_encode, secret_key, algorithm="HS256")


def verifyAccessToken(token: str):
  try:
    payload = jwt.decode(token, secret_key, algorithms=["HS256"])
    return payload
  except jwt.ExpiredSignatureError:
    # Token has expired
    return None
  except jwt.InvalidTokenError:
    # Invalid token (wrong signature, malformed, etc.)
    return None
  except Exception as e:
    # Log unexpected errors but don't expose details
    import logging
    logging.error(f"Unexpected error verifying token: {type(e).__name__}")
    return None