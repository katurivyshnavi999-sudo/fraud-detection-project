@echo off
title PayGuard Full Stack Launcher
echo ===================================================================
echo PayGuard - Graph-Enhanced Adaptive Hybrid Learning
echo Launching Complete System (Backend + Frontend)...
echo ===================================================================
echo.
echo [1/3] Launching FastAPI Backend on http://127.0.0.1:8000 ...
start "PayGuard Backend" cmd /k "cd /d "%~dp0backend" && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/3] Launching React Vite Frontend on http://localhost:5173 ...
start "PayGuard Frontend" cmd /k "cd /d "%~dp0frontend" && npm.cmd run dev"

echo [3/3] Waiting for servers to initialize...
timeout /t 3 /nobreak >nul

echo Opening browser at http://localhost:5173 ...
start http://localhost:5173

echo.
echo ===================================================================
echo System successfully initiated.
echo Keep both terminal windows running while operating PayGuard.
echo Press any key to exit this launcher window.
echo ===================================================================
pause
