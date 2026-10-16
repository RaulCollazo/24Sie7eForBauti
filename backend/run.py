import os
import socket
import sys
import threading
import webbrowser


def _prepare_runtime() -> None:
    """When frozen (installed app), store data in the user's writable dir."""
    if not getattr(sys, "frozen", False):
        return

    from app.core.paths import sqlite_url, user_data_dir

    data_dir = user_data_dir()
    data_dir.mkdir(parents=True, exist_ok=True)
    os.environ.setdefault("DATABASE_URL", sqlite_url(data_dir / "24sie7e.db"))


def _port_in_use(host: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.5)
        return sock.connect_ex((host, port)) == 0


def main() -> None:
    _prepare_runtime()

    import uvicorn

    from app.main import app

    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    url = f"http://{host}:{port}"

    # Single instance: if the app is already running, just open the browser.
    if _port_in_use(host, port):
        print(f"24Sie7e ya está corriendo en {url}")
        if os.getenv("OPEN_BROWSER", "1") == "1":
            webbrowser.open(url)
        return

    if os.getenv("OPEN_BROWSER", "1") == "1":
        threading.Timer(1.5, lambda: webbrowser.open(url)).start()

    print(f"24Sie7e disponible en {url}")
    uvicorn.run(app, host=host, port=port, log_level="info")


if __name__ == "__main__":
    main()
