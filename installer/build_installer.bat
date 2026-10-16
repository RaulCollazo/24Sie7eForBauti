@echo off
REM Builds the Windows app bundle and then the wizard installer.
REM Output: dist_installer\24Sie7eSetup.exe
REM Usage: build_installer.bat

set "HERE=%~dp0"
set "ROOT=%HERE%.."

echo ==^> Building application bundle...
call "%ROOT%\backend\build_exe.bat"

echo ==^> Locating Inno Setup compiler...
set "ISCC=%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe"
if not exist "%ISCC%" set "ISCC=%ProgramFiles%\Inno Setup 6\ISCC.exe"
if not exist "%ISCC%" (
  echo ERROR: No se encontro Inno Setup 6. Descargalo de https://jrsoftware.org/isdl.php
  pause
  exit /b 1
)

echo ==^> Compiling installer...
"%ISCC%" "%HERE%24sie7e.iss"

echo.
echo Listo. Instalador en: %ROOT%\dist_installer\24Sie7eSetup.exe
pause
