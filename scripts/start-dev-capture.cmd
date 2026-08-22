@echo off
cd /d Z:\
set CHOKIDAR_USEPOLLING=0
set VITE_CJS_IGNORE_WARNING=true
npx --yes vite --host 127.0.0.1 --port 5173 --strictPort --force
