@echo off
title FraudShield AI - Backend Server
cd /d "%~dp0\backend"
echo ==============================================================================
echo  Starting FraudShield AI Backend API (FastAPI + Uvicorn)
echo ==============================================================================
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
