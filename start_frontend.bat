@echo off
title FraudShield AI - Frontend Dashboard
cd /d "%~dp0\frontend"
echo ==============================================================================
echo  Starting FraudShield AI Frontend (Vite + React)
echo ==============================================================================
call npm.cmd run dev
pause
