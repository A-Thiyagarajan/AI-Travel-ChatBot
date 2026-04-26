@echo off
title AI Travel Planner - Starting...
echo.
echo ==============================================
echo         AI TRAVEL PLANNER - LAUNCHER
echo ==============================================
echo.

python --version >nul 2>&1
if errorlevel 1 (
    echo Python is not installed or not in PATH.
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

echo Python found.
echo.

if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo Failed to create virtual environment.
        pause
        exit /b 1
    )
    echo Virtual environment created.
) else (
    echo Virtual environment exists.
)
echo.

echo Activating virtual environment...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo Failed to activate virtual environment.
    pause
    exit /b 1
)
echo Virtual environment activated.
echo.

echo Installing dependencies...
python -m pip install -r requirements.txt
if errorlevel 1 (
    echo Failed to install dependencies.
    pause
    exit /b 1
)
echo Dependencies ready.
echo.

echo Starting AI Travel Planner...
echo Your browser will open automatically.
echo Press CTRL+C to stop the server.
echo.

python app.py

echo.
echo Server stopped.
pause
