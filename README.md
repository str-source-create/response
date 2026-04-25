# hostaway-neon-sync

Production-ready local Node.js + TypeScript tool that syncs Hostaway data into Neon Postgres and exports CSV files.

## Features

- Manual sync by:
  - Property name (listing-first)
  - Reservation ID
  - Conversation ID
- Upsert latest values only (no snapshot history)
- Raw Hostaway payload stored as JSON for compatibility fallback
- CSV export endpoints for properties, reservations, conversations, and messages
- Single-page local UI (no login/auth)
- Bearer token flow (`/v1/accessTokens`) with DB token cache and retry on auth failure

## Stack

- Node.js 20+
- TypeScript
- Express
- `pg` (PostgreSQL)
- `dotenv` + `zod` env validation
- `csv-stringify/sync`
- `tsx`

## API Routes

- `GET /health`
- `POST /sync/property` body: `{ "propertyName": "..." }`
- `POST /sync/reservation/:reservationId`
- `POST /sync/conversation/:conversationId`
- `GET /export/properties.csv`
- `GET /export/reservations.csv`
- `GET /export/conversations.csv`
- `GET /export/messages.csv`
- `GET /` (local UI)

## Database tables

Migration creates:

- `hostaway_tokens`
- `properties`
- `reservations`
- `conversations`
- `conversation_messages`

With primary keys, unique constraints, and lookup indexes for common sync/export queries.

## Setup (manual)

1. Install Node.js 20+
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create env file:
   ```bash
   cp .env.example .env
   ```
4. Fill `.env` with Neon + Hostaway credentials
5. Run migration:
   ```bash
   npm run db:migrate
   ```
6. Start dev server:
   ```bash
   npm run dev
   ```
7. Open `http://localhost:3000`

## One-click installer files

- `install-and-run.sh` (macOS/Linux)
- `install-and-run.bat` (Windows)

They do the following:

1. Check Node/npm is installed
2. Run `npm install`
3. If `.env` does not exist, copy `.env.example` to `.env` and print: `Please fill .env then rerun`
4. Run `npm run db:migrate`
5. Run `npm run dev`
6. Print app URL: `http://localhost:3000`

## Scripts

- `npm run dev` - run local TS server via tsx
- `npm run build` - compile TS to `dist/`
- `npm run start` - run compiled server
- `npm run check` - TypeScript type-check
- `npm run db:migrate` - run DB migration

## Exact run instructions for non-technical users

### Windows

1. Open this folder in File Explorer.
2. Double-click `install-and-run.bat`.
3. If prompted with `Please fill .env then rerun`, open `.env`, fill values, save, then double-click `install-and-run.bat` again.
4. Use the app at: `http://localhost:3000`

### macOS / Linux

1. Open Terminal in this folder.
2. Run:
   ```bash
   bash install-and-run.sh
   ```
3. If prompted with `Please fill .env then rerun`, open `.env`, fill values, save, and run the script again.
4. Use the app at: `http://localhost:3000`
