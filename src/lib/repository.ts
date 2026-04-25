import { pool } from "../db/client.js";

type AnyRecord = Record<string, unknown>;

function asNumber(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return null;
}

export async function upsertProperty(listing: AnyRecord): Promise<void> {
  const listingMapId = asNumber(listing.listingMapId ?? listing.id);
  if (!listingMapId) return;

  const name = String(listing.name ?? listing.airbnbName ?? `Property-${listingMapId}`);
  const externalListingId = listing.externalListingId ? String(listing.externalListingId) : null;

  await pool.query(
    `INSERT INTO properties (listing_map_id, name, external_listing_id, raw_data, updated_at)
     VALUES ($1, $2, $3, $4::jsonb, NOW())
     ON CONFLICT (listing_map_id)
     DO UPDATE SET name = EXCLUDED.name,
                   external_listing_id = EXCLUDED.external_listing_id,
                   raw_data = EXCLUDED.raw_data,
                   updated_at = NOW()`,
    [listingMapId, name, externalListingId, JSON.stringify(listing)],
  );
}

export async function upsertReservation(
  reservation: AnyRecord,
  propertyNameFallback: string | null,
): Promise<void> {
  const reservationId = asNumber(reservation.id ?? reservation.reservationId);
  if (!reservationId) return;

  const listingMapId = asNumber(reservation.listingMapId);
  const propertyName =
    String(reservation.listingName ?? reservation.propertyName ?? propertyNameFallback ?? "") || null;

  await pool.query(
    `INSERT INTO reservations (
      reservation_id, listing_map_id, property_name, conversation_id,
      status, guest_name, arrival_date, departure_date, raw_data, updated_at
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,NOW())
    ON CONFLICT (reservation_id)
    DO UPDATE SET listing_map_id = EXCLUDED.listing_map_id,
                  property_name = EXCLUDED.property_name,
                  conversation_id = EXCLUDED.conversation_id,
                  status = EXCLUDED.status,
                  guest_name = EXCLUDED.guest_name,
                  arrival_date = EXCLUDED.arrival_date,
                  departure_date = EXCLUDED.departure_date,
                  raw_data = EXCLUDED.raw_data,
                  updated_at = NOW()`,
    [
      reservationId,
      listingMapId,
      propertyName,
      asNumber(reservation.conversationId),
      reservation.status ? String(reservation.status) : null,
      reservation.guestName ? String(reservation.guestName) : null,
      reservation.arrivalDate ? String(reservation.arrivalDate) : null,
      reservation.departureDate ? String(reservation.departureDate) : null,
      JSON.stringify(reservation),
    ],
  );
}

export async function upsertConversation(
  conversation: AnyRecord,
  propertyNameFallback: string | null,
): Promise<void> {
  const conversationId = asNumber(conversation.id ?? conversation.conversationId);
  if (!conversationId) return;

  const propertyName =
    String(conversation.listingName ?? conversation.propertyName ?? propertyNameFallback ?? "") || null;

  await pool.query(
    `INSERT INTO conversations (
      conversation_id, listing_map_id, property_name, reservation_id,
      subject, channel, raw_data, updated_at
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,NOW())
    ON CONFLICT (conversation_id)
    DO UPDATE SET listing_map_id = EXCLUDED.listing_map_id,
                  property_name = EXCLUDED.property_name,
                  reservation_id = EXCLUDED.reservation_id,
                  subject = EXCLUDED.subject,
                  channel = EXCLUDED.channel,
                  raw_data = EXCLUDED.raw_data,
                  updated_at = NOW()`,
    [
      conversationId,
      asNumber(conversation.listingMapId),
      propertyName,
      asNumber(conversation.reservationId),
      conversation.subject ? String(conversation.subject) : null,
      conversation.channel ? String(conversation.channel) : null,
      JSON.stringify(conversation),
    ],
  );
}

export async function upsertMessage(message: AnyRecord, conversationIdFallback: number): Promise<void> {
  const messageId = asNumber(message.id ?? message.messageId);
  if (!messageId) return;

  await pool.query(
    `INSERT INTO conversation_messages (
      message_id, conversation_id, sent_at, sender_type, body, raw_data, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6::jsonb,NOW())
    ON CONFLICT (message_id)
    DO UPDATE SET conversation_id = EXCLUDED.conversation_id,
                  sent_at = EXCLUDED.sent_at,
                  sender_type = EXCLUDED.sender_type,
                  body = EXCLUDED.body,
                  raw_data = EXCLUDED.raw_data,
                  updated_at = NOW()`,
    [
      messageId,
      asNumber(message.conversationId) ?? conversationIdFallback,
      message.sentDate || message.createdOn ? String(message.sentDate ?? message.createdOn) : null,
      message.senderType ? String(message.senderType) : null,
      message.body ? String(message.body) : null,
      JSON.stringify(message),
    ],
  );
}
