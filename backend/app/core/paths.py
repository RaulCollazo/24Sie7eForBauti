import os
import sys
from pathlib import Path

APP_DIR_NAME = "24Sie7e"


def user_data_dir() -> Path:
    """Per-user writable data directory (DB, config) for installed builds."""
    override = os.getenv("APP_DATA_DIR")
    if override:
        return Path(override)
    if sys.platform == "win32":
        base = os.getenv("LOCALAPPDATA") or str(Path.home() / "AppData" / "Local")
        return Path(base) / APP_DIR_NAME
    if sys.platform == "darwin":
        return Path.home() / "Library" / "Application Support" / APP_DIR_NAME
    base = os.getenv("XDG_DATA_HOME") or str(Path.home() / ".local" / "share")
    return Path(base) / APP_DIR_NAME


def sqlite_url(db_path: Path) -> str:
    return f"sqlite:///{db_path.as_posix()}"
