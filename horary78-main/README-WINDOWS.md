# Horary Astrology App - Windows Setup Guide

## Prerequisites

1. **Python 3.8+**: Download from [python.org](https://python.org)
   - ✅ Make sure to check "Add Python to PATH" during installation
   
2. **Node.js 16+**: Download from [nodejs.org](https://nodejs.org)
   - ✅ The installer will automatically add Node.js to PATH

## Quick Setup

### Option 1: Automated Setup (Recommended)
Run the setup script as Administrator:

```cmd
# Using Command Prompt
setup-windows.bat

# OR using PowerShell (may need execution policy change)
PowerShell -ExecutionPolicy Bypass -File setup-windows.ps1
```

### Option 2: Manual Setup

1. **Setup Backend**:
```cmd
cd backend
python -m venv venv
venv\Scripts\activate.bat
pip install -r requirements.txt
cd ..
```

2. **Setup Frontend**:
```cmd
cd frontend
npm install
npm run build
```

## Running the App

### Development Mode (Flask + React)
```cmd
cd frontend
npm run electron:dev
```
- Uses Flask development server
- Hot reload for backend changes
- Built React frontend

### Production Mode (Gunicorn + React)
```cmd
cd frontend
npm run electron:prod
```
- Uses Gunicorn production server
- Optimized for performance
- Built React frontend

### Full Development (Vite + Flask)
```cmd
cd frontend
npm run electron:fulldev
```
- Uses Vite dev server for frontend
- Flask development server for backend
- Hot reload for both frontend and backend

## Building for Distribution

### Windows Executable
```cmd
cd frontend
npm run dist:win
```
Creates: `frontend/release/win-unpacked/`

### Windows Store Package
```cmd
cd frontend
npm run dist:appx
```
Creates: `frontend/release/*.appx`

## Troubleshooting

### "Python not found"
- Reinstall Python with "Add to PATH" checked
- Or manually add Python to your PATH environment variable

### "Node not found" 
- Reinstall Node.js from nodejs.org
- Restart Command Prompt/PowerShell after installation

### "npm command not found"
- Node.js installation includes npm
- Restart your terminal and try again

### Backend fails to start
- Check that Python virtual environment was created properly
- Ensure all pip packages installed without errors
- Run `venv\Scripts\python.exe app.py` manually to test

### Frontend shows blank page
- Run `npm run build` to rebuild frontend
- Check browser console for JavaScript errors
- Ensure backend is running on port 5000

### Vite build parse error
- If you see a message like `Parse error @:1:1` during `npm run build`, remove the
  `node_modules` folder and run `npm install` again. This refreshes all
  dependencies and usually resolves the issue.

### Port 5000 already in use
- Close any other applications using port 5000
- Or kill existing Python processes: `taskkill /f /im python.exe`

## File Structure
```
C:\horary78-main\
├── backend\                 # Python Flask API
│   ├── venv\               # Python virtual environment
│   ├── app.py              # Main Flask application
│   └── requirements.txt    # Python dependencies
├── frontend\               # React + Electron
│   ├── dist\              # Built React files
│   ├── src\               # React source code
│   ├── electron.js        # Electron main process
│   └── package.json       # Node.js dependencies
└── setup-windows.bat      # Automated setup script
```