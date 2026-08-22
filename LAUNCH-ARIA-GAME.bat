@echo off
setlocal EnableExtensions
cd /d "%~dp0"

set "GAME_URL=http://localhost:5173"
set "PORT=5173"

where node.exe >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js was not found.
  echo Install Node.js 22 or newer from https://nodejs.org/
  echo.
  pause
  exit /b 1
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo.
  echo npm.cmd was not found.
  echo Reinstall Node.js and make sure "Add to PATH" is checked.
  echo.
  pause
  exit /b 1
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

rem If the game is already running on 5173, only open the browser.
call :port_in_use
if not errorlevel 1 (
  echo Aria's Color Garden is already running.
  start "" "%GAME_URL%"
  exit /b 0
)

echo Starting Aria's Color Garden...
start "Aria's Color Garden" cmd /k "cd /d ""%~dp0"" && title Aria's Color Garden && npm.cmd run dev"

echo Waiting for the garden to open...
set /a tries=0
:wait_loop
set /a tries+=1
if %tries% GTR 60 (
  echo.
  echo The game did not become ready in time.
  echo Check the "Aria's Color Garden" window for errors.
  echo.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $r = Invoke-WebRequest -UseBasicParsing -Uri '%GAME_URL%' -TimeoutSec 2; if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>nul
if errorlevel 1 (
  timeout /t 1 /nobreak >nul
  goto wait_loop
)

echo Opening %GAME_URL%
start "" "%GAME_URL%"
exit /b 0

:port_in_use
rem Returns 0 if something is LISTENING on PORT
netstat -ano | findstr /R /C:":%PORT% .*LISTENING" >nul 2>nul
exit /b %ERRORLEVEL%
