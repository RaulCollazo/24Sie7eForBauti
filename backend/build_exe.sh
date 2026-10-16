#!/usr/bin/env bash
# Builds the onedir app bundle for 24Sie7e (Linux / macOS).
# Usage: ./build_exe.sh
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"

echo "==> Building frontend..."
cd "$ROOT/frontend"
npm install
npm run build

echo "==> Installing PyInstaller..."
cd "$HERE"
if [ -x ".venv/bin/pip" ]; then
  PIP=".venv/bin/pip"
  PYINSTALLER=".venv/bin/pyinstaller"
else
  PIP="pip"
  PYINSTALLER="pyinstaller"
fi
"$PIP" install -r requirements.txt -r requirements-build.txt

echo "==> Packaging application (onedir)..."
"$PYINSTALLER" --noconfirm --clean \
  --onedir \
  --name 24sie7e \
  --icon "$ROOT/installer/24sie7e.ico" \
  --add-data "$ROOT/frontend/dist:frontend/dist" \
  --collect-submodules uvicorn \
  run.py

echo
echo "Listo. Ejecutable en: $HERE/dist/24sie7e/24sie7e"
