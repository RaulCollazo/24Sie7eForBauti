#!/usr/bin/env bash
# Installs the Windows toolchain (Python + Inno Setup) inside the Wine prefix.
# Idempotent: skips components already present. Must run with an unconfined
# seccomp profile (see build_windows.sh).
set -euo pipefail

PY_VER="${PY_VER:-3.12.10}"
INNO_VER="${INNO_VER:-6.7.3}"

if [ ! -f "$WINEPREFIX/drive_c/Python312/python.exe" ]; then
    echo "==> Installing Windows Python ${PY_VER}..."
    wget -q -O /tmp/python.exe \
        "https://www.python.org/ftp/python/${PY_VER}/python-${PY_VER}-amd64.exe"
    xvfb-run -a wine /tmp/python.exe /quiet InstallAllUsers=1 \
        TargetDir=C:\\Python312 PrependPath=1 Include_test=0 Include_launcher=0
    wineserver -k || true
    rm -f /tmp/python.exe
    test -f "$WINEPREFIX/drive_c/Python312/python.exe"
else
    echo "==> Windows Python already installed."
fi

if [ ! -f "$WINEPREFIX/drive_c/InnoSetup6/ISCC.exe" ]; then
    echo "==> Installing Inno Setup ${INNO_VER}..."
    wget -q -O /tmp/innosetup.exe \
        "https://github.com/jrsoftware/issrc/releases/download/is-${INNO_VER//./_}/innosetup-${INNO_VER}.exe"
    xvfb-run -a wine /tmp/innosetup.exe /VERYSILENT /SUPPRESSMSGBOXES \
        /NORESTART /SP- /DIR=C:\\InnoSetup6
    wineserver -k || true
    rm -f /tmp/innosetup.exe
    test -f "$WINEPREFIX/drive_c/InnoSetup6/ISCC.exe"
else
    echo "==> Inno Setup already installed."
fi

echo "==> Toolchain ready."
