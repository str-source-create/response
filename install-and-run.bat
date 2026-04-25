@echo off
REM hostaway-neon-sync installer and runner for Windows
REM Usage: double-click this file in Explorer

where node >nul 2>nul
if errorlevel 1 (
  echo Error: Node.js is not installed. Please install Node.js 20+ and rerun this file.
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo Error: npm is not installed. Please install npm and rerun this file.
  exit /b 1
)

echo Installing project dependencies...
call npm install
if errorlevel 1 exit /b 1

if not exist .env (
  copy .env.example .env >nul
  echo Please fill .env then rerun
  exit /b 0
)

echo Running database migration...
call npm run db:migrate
if errorlevel 1 exit /b 1

echo Starting app in development mode...
echo App URL: http://localhost:3000
call npm run dev
