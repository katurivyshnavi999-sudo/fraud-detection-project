@echo off
title PayGuard Frontend (Vite + React)
echo ========================================================
echo Starting PayGuard Frontend Development Server...
echo URL: http://localhost:5173
echo ========================================================
cd /d "%~dp0frontend"
call npm.cmd run dev
pause
