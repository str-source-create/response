import { pool } from "../db/client";

export type HostawayToken = {
  provider: string;
  accessToken: string;
  expiresAt: Date;
};

export async function getToken(provider = "hostaway"): Promise<HostawayToken | null> {
  const result = await pool.query(
    `SELECT provider, access_token, expires_at FROM hostaway_tokens WHERE provider = $1`,
    [provider]
  );

  if (result.rowCount === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    provider: row.provider,
    accessToken: row.access_token,
    expiresAt: new Date(row.expires_at)
  };
}

export async function upsertToken(token: HostawayToken): Promise<void> {
  await pool.query(
    `
      INSERT INTO hostaway_tokens (provider, access_token, expires_at, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (provider)
      DO UPDATE SET access_token = EXCLUDED.access_token, expires_at = EXCLUDED.expires_at, updated_at = NOW()
    `,
    [token.provider, token.accessToken, token.expiresAt]
  );
}

export async function upsertProperty(payload: any): Promise<void> {
  const listingId = Number(payload.id ?? payload.listingMapId);
  if (!Number.isFinite(listingId)) return;

  await pool.query(
    `
      INSERT INTO properties (listing_id, name, city, country, status, raw_payload, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())
      ON CONFLICT (listing_id)
      DO UPDATE SET
        name = EXCLUDED.name,
        city = EXCLUDED.city,
        country = EXCLUDED.country,
        status = EXCLUDED.status,
        raw_payload = EXCLUDED.raw_payload,
        updated_at = NOW()
    `,
    [
      listingId,
      String(payload.name ?? payload.internalName ?? `Listing ${listingId}`),
      payload.city ?? null,
      payload.country ?? null,
      payload.status ?? null,
      JSON.stringify(payload)
    ]
  );
}

export async function upsertReservation(payload: any): Promise<void> {
  const reservationId = Number(payload.id ?? payload.reservationId);
  if (!Number.isFinite(reservationId)) return;

  const listingIdRaw = payload.listingMapId ?? payload.listingId ?? payload.propertyId;
  const listingId = Number.isFinite(Number(listingIdRaw)) ? Number(listingIdRaw) : null;

  await pool.query(
    `
      INSERT INTO reservations (reservation_id, listing_id, guest_name, status, check_in, check_out, raw_payload, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, NOW())
      ON CONFLICT (reservation_id)
      DO UPDATE SET
        listing_id = EXCLUDED.listing_id,
        guest_name = EXCLUDED.guest_name,
        status = EXCLUDED.status,
        check_in = EXCLUDED.check_in,
        check_out = EXCLUDED.check_out,
        raw_payload = EXCLUDED.raw_payload,
        updated_at = NOW()
    `,
    [
      reservationId,
      listingId,
      payload.guestName ?? payload.guest?.name ?? null,
      payload.status ?? null,
      payload.arrivalDate ?? payload.checkInDate ?? null,
      payload.departureDate ?? payload.checkOutDate ?? null,
      JSON.stringify(payload)
    ]
  );
}

export async function upsertConversation(payload: any): Promise<void> {
  const conversationId = Number(payload.id ?? payload.conversationId);
  if (!Number.isFinite(conversationId)) return;

  const reservationId = Number(payload.reservationId ?? payload.reservation?.id);
  const listingId = Number(payload.listingMapId ?? payload.listingId ?? payload.listing?.id);

  await pool.query(
    `
      INSERT INTO conversations (
        conversation_id, reservation_id, listing_id, guest_name, status, last_message_at, raw_payload, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, NOW())
      ON CONFLICT (conversation_id)
      DO UPDATE SET
        reservation_id = EXCLUDED.reservation_id,
        listing_id = EXCLUDED.listing_id,
        guest_name = EXCLUDED.guest_name,
        status = EXCLUDED.status,
        last_message_at = EXCLUDED.last_message_at,
        raw_payload = EXCLUDED.raw_payload,
        updated_at = NOW()
    `,
    [
      conversationId,
      Number.isFinite(reservationId) ? reservationId : null,
      Number.isFinite(listingId) ? listingId : null,
      payload.guestName ?? payload.guest?.name ?? null,
      payload.status ?? null,
      payload.lastMessageTime ?? payload.updatedAt ?? null,
      JSON.stringify(payload)
    ]
  );
}

export async function upsertConversationMessage(payload: any, conversationIdOverride?: number): Promise<void> {
  const messageId = Number(payload.id ?? payload.messageId);
  if (!Number.isFinite(messageId)) return;

  const conversationId = Number(
    conversationIdOverride ?? payload.conversationId ?? payload.conversation?.id
  );

  if (!Number.isFinite(conversationId)) return;

  await pool.query(
    `
      INSERT INTO conversation_messages (
        message_id, conversation_id, sender_type, body, sent_at, raw_payload, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())
      ON CONFLICT (message_id)
      DO UPDATE SET
        conversation_id = EXCLUDED.conversation_id,
        sender_type = EXCLUDED.sender_type,
        body = EXCLUDED.body,
        sent_at = EXCLUDED.sent_at,
        raw_payload = EXCLUDED.raw_payload,
        updated_at = NOW()
    `,
    [
      messageId,
      conversationId,
      payload.senderType ?? payload.authorType ?? null,
      payload.body ?? payload.message ?? null,
      payload.createdAt ?? payload.sentAt ?? null,
      JSON.stringify(payload)
    ]
  );
}

export async function queryRows(sql: string): Promise<any[]> {
  const result = await pool.query(sql);
  return result.rows;
}
