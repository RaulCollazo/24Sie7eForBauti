import os
import sys
import threading
import webbrowser
from pathlib import Path


def _prepare_runtime() -> None:
    """When frozen, run next to the executable so 24sie7e.db lands there."""
    if getattr(sys, "frozen", False):
        os.chdir(Path(sys.executable).resolve().parent)


def main() -> None:
    _prepare_runtime()

    import uvicorn

    from app.main import app

    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    url = f"http://{host}:{port}"

    if os.getenv("OPEN_BROWSER", "1") == "1":
        threading.Timer(1.5, lambda: webbrowser.open(url)).start()

    print(f"24Sie7e disponible en {url}")
    uvicorn.run(app, host=host, port=port, log_level="info")


if __name__ == "__main__":
    main()
