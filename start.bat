@echo off
echo ==============================
echo  Starting School Scheduler
echo ==============================

REM --- BACKEND ---
echo Starting backend...
cd backend
call venv\Scripts\activate
start cmd /k uvicorn main:app --reload
cd ..

REM --- FRONTEND ---
echo Starting frontend...
cd frontend
start cmd /k npm run dev
cd ..

echo ==============================
echo  DONE. Servers are running
echo ==============================
pause
