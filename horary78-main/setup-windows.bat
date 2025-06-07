@echo off
echo Setting up Horary Astrology App for Windows...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo Python and Node.js found!
echo.

REM Setup backend
echo Setting up Python backend...
cd backend
if exist venv rmdir /s /q venv
python -m venv venv
call venv\Scripts\activate.bat
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install Python dependencies
    pause
    exit /b 1
)
echo Backend setup complete!
cd ..

REM Setup frontend
echo.
echo Setting up Node.js frontend...
cd frontend
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install Node.js dependencies
    pause
    exit /b 1
)
call npm run build
if errorlevel 1 (
    echo ERROR: Failed to build frontend
    pause
    exit /b 1
)
echo Frontend setup complete!

echo.
echo =================================
echo Setup complete! You can now run:
echo.
echo Development mode:
echo   npm run electron:dev
echo.
echo Production mode:
echo   npm run electron:prod
echo.
echo Build for distribution:
echo   npm run dist:win
echo =================================
pause