@echo off
title PayGuard Backend (FastAPI)
echo ========================================================
echo Starting PayGuard Backend Server (FastAPI + Uvicorn)...
echo Port: 8000 | Host: 127.0.0.1
echo API Documentation: http://127.0.0.1:8000/docs
echo ========================================================
cd /d "%~dp0backend"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
