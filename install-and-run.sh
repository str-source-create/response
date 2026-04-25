#!/usr/bin/env bash

# hostaway-neon-sync installer and runner for macOS/Linux
# Usage: double-click in file manager (if executable) OR run: bash install-and-run.sh

set -e

if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js is not installed. Please install Node.js 20+ and rerun this script."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is not installed. Please install npm and rerun this script."
  exit 1
fi

echo "Installing project dependencies..."
npm install

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Please fill .env then rerun"
  exit 0
fi

echo "Running database migration..."
npm run db:migrate

echo "Starting app in development mode..."
echo "App URL: http://localhost:3000"
npm run dev
