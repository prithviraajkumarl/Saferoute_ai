# SafeRoute AI - Development Launcher
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  SAFEROUTE AI - TACTICAL DISASTER RESILIENCE HUD" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 1. Start Backend in separate window or job
Write-Host "[1/2] Launching FastAPI Backend on http://127.0.0.1:8000 ..." -ForegroundColor Green
Start-Process -FilePath "c:\Aa1 iitdmk\backend\venv\Scripts\python.exe" -ArgumentList "-m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload" -WorkingDirectory "c:\Aa1 iitdmk\backend"

# 2. Start Frontend
Write-Host "[2/2] Launching React Vite Frontend on http://localhost:5173 ..." -ForegroundColor Green
Set-Location "c:\Aa1 iitdmk\frontend"
npm run dev
