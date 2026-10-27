import os
import sys
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import Base, engine
from app.core.paths import user_assets_dir
from app.seed import seed_data

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    seed_data()


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok"}


def _frontend_dist() -> Path | None:
    """Locate the built frontend (works both in dev and PyInstaller bundles)."""
    if getattr(sys, "frozen", False):
        base = Path(getattr(sys, "_MEIPASS", Path(sys.executable).parent))
        candidate = base / "frontend" / "dist"
    else:
        candidate = Path(__file__).resolve().parents[2] / "frontend" / "dist"
    return candidate if candidate.is_dir() else None


def mount_user_assets() -> None:
    directory = user_assets_dir()
    directory.mkdir(parents=True, exist_ok=True)
    app.mount("/assets/user", StaticFiles(directory=directory), name="user-assets")


def mount_frontend() -> None:
    dist = _frontend_dist()
    if dist is None:
        return

    assets = dist / "assets"
    if assets.is_dir():
        app.mount("/assets", StaticFiles(directory=assets), name="assets")

    index_file = dist / "index.html"

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa(full_path: str) -> FileResponse:
        requested = dist / full_path
        if full_path and requested.is_file():
            return FileResponse(requested)
        return FileResponse(index_file)


mount_user_assets()

if os.getenv("SERVE_FRONTEND", "1") == "1":
    mount_frontend()
