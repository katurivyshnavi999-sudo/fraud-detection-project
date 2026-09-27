@echo off
title FraudShield AI - Launcher
echo ==============================================================================
echo  Launching FraudShield AI (Full-Stack System)
echo ==============================================================================
echo 1. Launching FastAPI Backend on http://127.0.0.1:8000 ...
start "FraudShield Backend" cmd /c "start_backend.bat"

timeout /t 3 /nobreak >nul

echo 2. Launching React Frontend on http://localhost:5173 ...
start "FraudShield Frontend" cmd /c "start_frontend.bat"

echo ==============================================================================
echo  Both services launched in separate windows!
echo  Backend:  http://127.0.0.1:8000/docs
echo  Frontend: http://localhost:5173
echo ==============================================================================
