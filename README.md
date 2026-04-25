# Hostaway → Neon Collector (Property-first sync)

This project is a local Node.js + TypeScript server that:

- Authenticates with Hostaway using bearer token generation (`/v1/accessTokens`),
- Pulls data by **property name**, **reservation ID**, or **conversation ID**,
- Stores the latest copy of records in **Neon Postgres**,
- Lets you export separate CSV files.

## Why this design

You asked to collect all conversation/reservation data under listings (property-first structure).
So the sync flow is:

1. Fetch listings,
2. Filter listings by property name,
3. For each listing, fetch reservations + conversations,
4. For each conversation, fetch messages,
5. Upsert latest version into Neon.

## Hostaway API references used

- Main docs: <https://api.hostaway.com/documentation>
- Token generation: `POST /v1/accessTokens`
- Recommended token reuse (store token and refresh when invalid/expired)
- Listings/reservations/conversations resources with `includeResources=1`

## Prerequisites

- Node 20+
- Neon Postgres database URL
- Hostaway account ID + API key

## Setup

```bash
npm install
cp .env.example .env
# fill env values
npm run db:migrate
npm run dev
```

Server default URL: `http://localhost:3000`

Open this URL in browser to use the local single-page UI for sync + CSV download.

## Local UI

The root route (`/`) serves a single-page local UI that supports:

- Sync by property name
- Sync by reservation ID
- Sync by conversation ID
- One-click CSV downloads

## Sync endpoints (manual trigger only)

### 1) Sync by property name

```bash
curl -X POST http://localhost:3000/sync/property \
  -H 'Content-Type: application/json' \
  -d '{"propertyName": "Beach Villa"}'
```

### 2) Sync by reservation ID

```bash
curl -X POST http://localhost:3000/sync/reservation/123456
```

### 3) Sync by conversation ID

```bash
curl -X POST http://localhost:3000/sync/conversation/987654
```

## CSV downloads

Separate CSV endpoints:

- `GET /export/properties.csv`
- `GET /export/reservations.csv`
- `GET /export/conversations.csv`
- `GET /export/messages.csv`

Examples:

```bash
curl -L http://localhost:3000/export/properties.csv -o properties.csv
curl -L http://localhost:3000/export/reservations.csv -o reservations.csv
curl -L http://localhost:3000/export/conversations.csv -o conversations.csv
curl -L http://localhost:3000/export/messages.csv -o messages.csv
```

## Data model summary

- `properties` (listing map id + name + raw JSON)
- `reservations` (reservation id + listing/property relation + raw JSON)
- `conversations` (conversation id + listing/property relation + raw JSON)
- `conversation_messages` (message id + conversation id + raw JSON)
- `hostaway_tokens` (cached bearer token)

All sync paths are **upsert latest** behavior.

## Notes

- Some Hostaway tenants can have slightly different field names. This implementation stores raw JSON for safety and reporting fallback.
- If your Hostaway account uses different endpoint paths, change them in `.env`.
