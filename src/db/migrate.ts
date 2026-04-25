import { pool } from "./client";

async function migrate(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(`
      CREATE TABLE IF NOT EXISTS hostaway_tokens (
        provider TEXT PRIMARY KEY,
        access_token TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS properties (
        id BIGSERIAL PRIMARY KEY,
        listing_id BIGINT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        city TEXT,
        country TEXT,
        status TEXT,
        raw_payload JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS reservations (
        reservation_id BIGINT PRIMARY KEY,
        listing_id BIGINT,
        guest_name TEXT,
        status TEXT,
        check_in DATE,
        check_out DATE,
        raw_payload JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        conversation_id BIGINT PRIMARY KEY,
        reservation_id BIGINT,
        listing_id BIGINT,
        guest_name TEXT,
        status TEXT,
        last_message_at TIMESTAMPTZ,
        raw_payload JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS conversation_messages (
        message_id BIGINT PRIMARY KEY,
        conversation_id BIGINT NOT NULL,
        sender_type TEXT,
        body TEXT,
        sent_at TIMESTAMPTZ,
        raw_payload JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_properties_name_lower ON properties (LOWER(name));`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_reservations_listing_id ON reservations (listing_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_conversations_listing_id ON conversations (listing_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_conversations_reservation_id ON conversations (reservation_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON conversation_messages (conversation_id);`);

    await client.query("COMMIT");
    console.log("Database migration completed.");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Migration failed", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

void migrate();
