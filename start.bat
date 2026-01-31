@echo off
echo ==============================
echo  Starting School Scheduler
echo ==============================

REM --- BACKEND ---
echo Starting backend...
cd /d "%~dp0backend"
call venv\Scripts\activate
start cmd /k "venv\Scripts\python.exe -m uvicorn main:app --reload"

REM --- FRONTEND ---
echo Starting frontend...
cd /d "%~dp0frontend"
start cmd /k npm run dev
cd ..

echo ==============================
echo  DONE. Servers are running
echo ==============================
pause
