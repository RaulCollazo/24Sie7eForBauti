import base64
import hashlib
import hmac
import json
import time

from app.core.config import settings


def _sign(payload: bytes) -> str:
    digest = hmac.new(
        settings.secret_key.encode(), payload, hashlib.sha256
    ).digest()
    return base64.urlsafe_b64encode(digest).decode().rstrip("=")


def create_access_token(username: str) -> str:
    payload = json.dumps(
        {"sub": username, "exp": time.time() + settings.access_token_expire_minutes * 60}
    ).encode()
    body = base64.urlsafe_b64encode(payload).decode().rstrip("=")
    return f"{body}.{_sign(payload)}"


def verify_access_token(token: str) -> str | None:
    try:
        body, signature = token.split(".")
        padding = "=" * (-len(body) % 4)
        payload = base64.urlsafe_b64decode(body + padding)
    except (ValueError, TypeError):
        return None
    if not hmac.compare_digest(signature, _sign(payload)):
        return None
    data = json.loads(payload)
    if data.get("exp", 0) < time.time():
        return None
    return data.get("sub")
