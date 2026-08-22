@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

set "PORT=5173"
set "KILLED="

for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":%PORT% .*LISTENING"') do (
  echo !KILLED! | findstr /C:"[%%P]" >nul 2>nul
  if errorlevel 1 (
    if not "%%P"=="0" (
      echo Closing Aria's Color Garden ^(PID %%P^)...
      taskkill /PID %%P /T /F >nul 2>nul
      set "KILLED=!KILLED![%%P]"
    )
  )
)

echo Aria's Color Garden is closed.
exit /b 0
