@echo off
cd /d "%~dp0"
if not exist node_modules call npm install
if errorlevel 1 exit /b 1
echo Mo http://127.0.0.1:5173/ trong trinh duyet.
call npm run dev -- --port 5173 --strictPort --open
pause
