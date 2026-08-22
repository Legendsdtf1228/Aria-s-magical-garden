@echo off
setlocal EnableExtensions
title Aria's Color Garden
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js was not found.
  echo Install Node.js 22 or newer from https://nodejs.org/
  echo Then double-click START-GAME.bat again.
  echo.
  pause
  exit /b 1
)

if not exist "%~dp0npm.cmd" if not exist "%ProgramFiles%\nodejs\npm.cmd" (
  where npm.cmd >nul 2>nul
  if errorlevel 1 (
    echo.
    echo npm.cmd was not found.
    echo Reinstall Node.js and make sure "Add to PATH" is checked.
    echo.
    pause
    exit /b 1
  )
)

if not exist "node_modules\" (
  echo.
  echo First launch: installing packages. This can take a few minutes...
  echo.
  call npm.cmd install
  if errorlevel 1 (
    echo.
    echo Installation failed. Check your internet connection and try again.
    echo.
    pause
    exit /b 1
  )
)

echo.
echo Starting Aria's Color Garden...
echo When Vite is ready, open: http://localhost:5173
echo.
start "" cmd /c "timeout /t 4 /nobreak >nul & start http://localhost:5173/"
call npm.cmd run dev
set EXITCODE=%ERRORLEVEL%
if not "%EXITCODE%"=="0" (
  echo.
  echo The game did not start successfully.
  echo Try running: npm.cmd install
  echo Then: npm.cmd run dev
  echo.
)
pause
exit /b %EXITCODE%
