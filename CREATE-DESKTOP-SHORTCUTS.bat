@echo off
setlocal EnableExtensions
cd /d "%~dp0"

set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"
set "PS1=%ROOT%\scripts\create-desktop-shortcuts.ps1"

if not exist "%PS1%" (
  echo Missing scripts\create-desktop-shortcuts.ps1
  pause
  exit /b 1
)

echo Creating Desktop shortcuts for Aria's Color Garden...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%PS1%" -ProjectRoot "%ROOT%"
if errorlevel 1 (
  echo.
  echo Shortcut creation failed.
  pause
  exit /b 1
)

echo.
echo You can now use:
echo   Play Aria's Color Garden
echo   Close Aria's Color Garden
echo.
pause
exit /b 0
