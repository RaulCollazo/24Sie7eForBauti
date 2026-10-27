from __future__ import annotations

import hashlib
import urllib.request
from urllib.parse import urlparse

from app.core.paths import user_assets_dir

MAX_IMAGE_BYTES = 10 * 1024 * 1024


class ImageError(ValueError):
    pass


def _detect_extension(data: bytes) -> str | None:
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if data.startswith(b"\xff\xd8\xff"):
        return "jpg"
    if data[:6] in (b"GIF87a", b"GIF89a"):
        return "gif"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "webp"
    if data.startswith(b"BM"):
        return "bmp"
    return None


def save_image(data: bytes, content_type: str | None = None) -> str:
    if not data:
        raise ImageError("La imagen está vacía")
    if len(data) > MAX_IMAGE_BYTES:
        raise ImageError("La imagen supera el límite de 10 MB")

    normalized_type = (content_type or "").split(";")[0].strip().lower()
    if normalized_type.startswith("text/") or normalized_type in ("application/json", "application/xhtml+xml"):
        raise ImageError("La URL no apunta a una imagen válida")

    extension = _detect_extension(data)
    if extension is None:
        raise ImageError("El archivo no es una imagen compatible (PNG, JPG, GIF, WEBP o BMP)")

    digest = hashlib.sha256(data).hexdigest()[:16]
    filename = f"img_{digest}.{extension}"
    target_dir = user_assets_dir()
    target_dir.mkdir(parents=True, exist_ok=True)
    target = target_dir / filename
    if not target.is_file():
        target.write_bytes(data)
    return f"/assets/user/{filename}"


def download_image(url: str) -> str:
    parsed = urlparse(url.strip())
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise ImageError("La URL debe comenzar con http:// o https://")

    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; 24Sie7e/1.0)",
            "Accept": "image/*,*/*;q=0.8",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            content_type = response.headers.get_content_type()
            data = response.read(MAX_IMAGE_BYTES + 1)
    except ImageError:
        raise
    except Exception as exc:
        raise ImageError("No se pudo descargar la imagen de la URL indicada") from exc

    return save_image(data, content_type)
