@echo off
setlocal
cd /d "%~dp0"
echo Starting Vite dev server on http://127.0.0.1:4173
npm.cmd run dev -- --host 127.0.0.1 --port 4173
