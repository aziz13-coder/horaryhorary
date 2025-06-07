Write-Host "Setting up Horary Astrology App for Windows..." -ForegroundColor Green
Write-Host ""

# Check if Python is installed
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Found: $pythonVersion" -ForegroundColor Blue
} catch {
    Write-Host "ERROR: Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python 3.8+ from https://python.org" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if Node.js is installed
try {
    $nodeVersion = node --version 2>&1
    Write-Host "Found Node.js: $nodeVersion" -ForegroundColor Blue
} catch {
    Write-Host "ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Setup backend
Write-Host "Setting up Python backend..." -ForegroundColor Yellow
Set-Location backend
if (Test-Path "venv") {
    Remove-Item -Recurse -Force venv
}
python -m venv venv
& "venv\Scripts\Activate.ps1"
pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install Python dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "Backend setup complete!" -ForegroundColor Green
Set-Location ..

# Setup frontend
Write-Host ""
Write-Host "Setting up Node.js frontend..." -ForegroundColor Yellow
Set-Location frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install Node.js dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to build frontend" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "Frontend setup complete!" -ForegroundColor Green

Write-Host ""
Write-Host "=================================" -ForegroundColor Green
Write-Host "Setup complete! You can now run:" -ForegroundColor Green
Write-Host ""
Write-Host "Development mode:" -ForegroundColor Cyan
Write-Host "  npm run electron:dev" -ForegroundColor White
Write-Host ""
Write-Host "Production mode:" -ForegroundColor Cyan
Write-Host "  npm run electron:prod" -ForegroundColor White
Write-Host ""
Write-Host "Build for distribution:" -ForegroundColor Cyan
Write-Host "  npm run dist:win" -ForegroundColor White
Write-Host "=================================" -ForegroundColor Green
Read-Host "Press Enter to exit"