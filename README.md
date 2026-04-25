# response

Hostaway response-rate app.

## What it does

- Pulls conversations and messages from Hostaway PMS
- Calculates response rate by guest
- Exposes live HTTP endpoints:
  - `GET /health`
  - `GET /api/guest-response-rates`

## Configuration

Set environment variables:

- `HOSTAWAY_BASE_URL` (default: `https://api.hostaway.com`)
- `HOSTAWAY_API_TOKEN` (required for authenticated Hostaway APIs)
- `HOSTAWAY_CONVERSATIONS_PATH` (default: `/v1/conversations`)
- `HOSTAWAY_MESSAGES_PATH` (default: `/v1/messages`)
- `PORT` (default: `3000`)

## Run locally

```bash
npm install
npm start
```

## Test

```bash
npm test
```

## Deploy on a VPS

1. Install Node.js 18+ on the VPS.
2. Copy the project to the VPS.
3. Set the environment variables above.
4. Run:

```bash
npm install --omit=dev
npm start
```

For production, run behind a process manager (e.g., systemd/pm2) and reverse proxy (e.g., Nginx).
