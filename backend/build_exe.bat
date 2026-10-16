@echo off
REM Builds the onedir app bundle for 24Sie7e (Windows).
REM Usage: build_exe.bat

set "HERE=%~dp0"
set "ROOT=%HERE%.."

echo ==^> Building frontend...
cd /d "%ROOT%\frontend"
call npm install
call npm run build

echo ==^> Installing PyInstaller...
cd /d "%HERE%"
if exist ".venv\Scripts\pip.exe" (
  set "PIP=.venv\Scripts\pip.exe"
  set "PYI=.venv\Scripts\pyinstaller.exe"
) else (
  set "PIP=pip"
  set "PYI=pyinstaller"
)
"%PIP%" install -r requirements.txt -r requirements-build.txt

echo ==^> Packaging application (onedir)...
"%PYI%" --noconfirm --clean ^
  --onedir ^
  --name 24sie7e ^
  --icon "%ROOT%\installer\24sie7e.ico" ^
  --add-data "%ROOT%\frontend\dist;frontend/dist" ^
  --collect-submodules uvicorn ^
  run.py

echo.
echo Listo. Carpeta en: %HERE%dist\24sie7e\
