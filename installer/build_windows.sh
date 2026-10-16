#!/usr/bin/env bash
# Builds the Windows app bundle + wizard installer on Linux using Docker + Wine.
# Output: dist_installer/24Sie7eSetup.exe
#
# Usage: installer/build_windows.sh
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
IMAGE="24sie7e-winbuilder"
PREFIX_VOL="24sie7e-wineprefix"

echo "==> 1/3 Building frontend (Linux)..."
cd "$ROOT/frontend"
npm install
npm run build

echo "==> 2/3 Building Windows toolchain image (Wine)..."
docker build -t "$IMAGE" "$HERE/docker"

echo "==> 3/3 Packaging app + compiling installer under Wine..."
# --security-opt seccomp=unconfined is required: Docker's default seccomp
# profile blocks a syscall that Wine 9 needs (otherwise wine exits with
# "socket : Function not implemented").
docker run --rm \
    --security-opt seccomp=unconfined \
    -e PYTHONDONTWRITEBYTECODE=1 \
    -v "$ROOT":/work \
    -v "$PREFIX_VOL":/wine \
    -w /work "$IMAGE" bash -lc '
  set -e
  wine_toolchain.sh

  echo "--- optimizing frontend copy ---"
  rm -rf /tmp/optdist
  cp -r /work/frontend/dist /tmp/optdist
  optimize_images.sh /tmp/optdist/assets/products

  cd /work/backend
  echo "--- pip install ---"
  wine "C:\Python312\python.exe" -m pip install --no-warn-script-location \
      -r requirements.txt pyinstaller
  echo "--- pyinstaller ---"
  wine "C:\Python312\python.exe" -m PyInstaller --noconfirm --clean --onedir \
      --name 24sie7e \
      --icon "Z:\work\installer\24sie7e.ico" \
      --add-data "Z:\tmp\optdist;frontend/dist" \
      --collect-submodules uvicorn \
      run.py
  echo "--- Inno Setup ---"
  wine "C:\InnoSetup6\ISCC.exe" "Z:\work\installer\24sie7e.iss"
'

# Docker runs as root; hand generated artifacts back to the host user.
docker run --rm -v "$ROOT":/work -e OWNER="$(id -u):$(id -g)" "$IMAGE" \
    bash -lc 'chown -R "$OWNER" /work/backend/build /work/backend/dist /work/dist_installer 2>/dev/null || true'

echo
echo "Listo. Instalador en: $ROOT/dist_installer/24Sie7eSetup.exe"
