@echo off
echo Starting School Scheduler...

:: Start Backend in a new window
echo Starting Backend (Python 3.12)...
start "School Scheduler - Backend" cmd /k "cd /d %~dp0backend && py -3.12 -m uvicorn main:app --reload --host 0.0.0.0"

:: Start Frontend in a new window
echo Starting Frontend (Vite)...
start "School Scheduler - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev -- --host"

echo Servers are starting in separate windows.
pause
