@echo off
setlocal enabledelayedexpansion

:: Ensure we are in the script's directory
cd /d "%~dp0"

echo ==========================================
echo    School Scheduler - Dependency Setup
echo ==========================================
echo.

:: 1. Check for Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Please install Python to continue.
    pause
    exit /b 1
)
echo [OK] Python found.

:: 2. Check for Node.js / NPM
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js/NPM not found. Please install Node.js to continue.
    pause
    exit /b 1
)
echo [OK] Node.js/NPM found.
echo.

:: 3. Setup Backend
echo [1/2] Setting up Backend dependencies...
cd backend
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)
echo Activating virtual environment and installing packages...
call venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
cd ..
echo.

:: 4. Setup Frontend
echo [2/2] Setting up Frontend dependencies...
cd frontend
echo Installing npm packages (this may take a while)...
call npm install
cd ..
echo.

echo ==========================================
echo    Setup Complete!
echo    To start the app, run start.bat
echo ==========================================
pause
