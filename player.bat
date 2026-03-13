@echo off
rem Live TV Player Activation Script for Windows
rem This script activates the virtual environment and starts the application

echo 🔧 Activating Live TV Player...
echo ================================

rem Check if virtual environment exists
if not exist venv (
    echo ❌ Virtual environment not found!
    echo Please run 'setup_venv.bat' first to set up the environment.
    pause
    exit /b 1
)

rem Activate virtual environment
echo ✅ Activating virtual environment...
call venv\Scripts\activate

echo 🚀 Starting Live TV Player...
echo.
echo 📡 Server will be available at: http://localhost:7734
echo 🛑 Press Ctrl+C to stop the server
echo.
echo ================================

rem Start the application
python run.py
pause
