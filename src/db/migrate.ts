import { pool } from "./client.js";

const sql = `
CREATE TABLE IF NOT EXISTS hostaway_tokens (
  id INTEGER PRIMARY KEY DEFAULT 1,
  access_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (id = 1)
);

CREATE TABLE IF NOT EXISTS properties (
  listing_map_id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  external_listing_id TEXT,
  raw_data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reservations (
  reservation_id BIGINT PRIMARY KEY,
  listing_map_id BIGINT,
  property_name TEXT,
  conversation_id BIGINT,
  status TEXT,
  guest_name TEXT,
  arrival_date DATE,
  departure_date DATE,
  raw_data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reservations_listing_map_id ON reservations (listing_map_id);
CREATE INDEX IF NOT EXISTS idx_reservations_property_name ON reservations (property_name);

CREATE TABLE IF NOT EXISTS conversations (
  conversation_id BIGINT PRIMARY KEY,
  listing_map_id BIGINT,
  property_name TEXT,
  reservation_id BIGINT,
  subject TEXT,
  channel TEXT,
  raw_data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_listing_map_id ON conversations (listing_map_id);
CREATE INDEX IF NOT EXISTS idx_conversations_property_name ON conversations (property_name);

CREATE TABLE IF NOT EXISTS conversation_messages (
  message_id BIGINT PRIMARY KEY,
  conversation_id BIGINT NOT NULL,
  sent_at TIMESTAMPTZ,
  sender_type TEXT,
  body TEXT,
  raw_data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON conversation_messages (conversation_id);
`;

async function run(): Promise<void> {
  try {
    await pool.query(sql);
    console.log("Migrations completed.");
  } finally {
    await pool.end();
  }
}

run().catch((error) => {
  console.error("Migration failed", error);
  process.exit(1);
});
