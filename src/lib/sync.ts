import { HostawayClient } from "./hostaway";
import {
  upsertConversation,
  upsertConversationMessage,
  upsertProperty,
  upsertReservation
} from "./repository";

export type SyncSummary = {
  properties: number;
  reservations: number;
  conversations: number;
  messages: number;
  details: string[];
};

const hostaway = new HostawayClient();

function newSummary(): SyncSummary {
  return {
    properties: 0,
    reservations: 0,
    conversations: 0,
    messages: 0,
    details: []
  };
}

async function syncMessagesForConversation(conversationId: number): Promise<number> {
  const messages = await hostaway.getMessagesByConversation(conversationId);
  for (const message of messages) {
    await upsertConversationMessage(message, conversationId);
  }
  return messages.length;
}

export async function syncByPropertyName(propertyName: string): Promise<SyncSummary> {
  const summary = newSummary();
  const normalizedName = propertyName.trim().toLowerCase();
  if (!normalizedName) {
    throw new Error("propertyName is required");
  }

  const listings = await hostaway.getListings();
  const matches = listings.filter((listing) => {
    const name = String(listing.name ?? listing.internalName ?? "").toLowerCase();
    return name.includes(normalizedName);
  });

  if (matches.length === 0) {
    summary.details.push(`No listing found for property name containing \"${propertyName}\".`);
    return summary;
  }

  for (const listing of matches) {
    await upsertProperty(listing);
    summary.properties += 1;

    const listingId = Number(listing.id ?? listing.listingMapId);
    if (!Number.isFinite(listingId)) {
      summary.details.push(`Skipped listing with missing id for ${listing.name ?? "unknown"}`);
      continue;
    }

    const reservations = await hostaway.getReservationsByListing(listingId);
    for (const reservation of reservations) {
      await upsertReservation(reservation);
      summary.reservations += 1;

      const reservationId = String(reservation.id ?? reservation.reservationId ?? "");
      if (!reservationId) continue;

      const conversations = await hostaway.getConversations({ reservationId, limit: "200" });
      for (const conversation of conversations) {
        await upsertConversation(conversation);
        summary.conversations += 1;

        const conversationId = Number(conversation.id ?? conversation.conversationId);
        if (Number.isFinite(conversationId)) {
          summary.messages += await syncMessagesForConversation(conversationId);
        }
      }
    }
  }

  summary.details.push(`Matched ${matches.length} listing(s) for property name \"${propertyName}\".`);
  return summary;
}

export async function syncByReservationId(reservationId: string): Promise<SyncSummary> {
  const summary = newSummary();
  if (!reservationId) throw new Error("reservationId is required");

  const reservation = await hostaway.getReservationById(reservationId);
  if (!reservation) {
    summary.details.push(`Reservation ${reservationId} not found.`);
    return summary;
  }

  await upsertReservation(reservation);
  summary.reservations += 1;

  const listingId = Number(reservation.listingMapId ?? reservation.listingId ?? reservation.propertyId);
  if (Number.isFinite(listingId)) {
    const listings = await hostaway.getListings();
    const listing = listings.find((item) => Number(item.id ?? item.listingMapId) === listingId);
    if (listing) {
      await upsertProperty(listing);
      summary.properties += 1;
    }
  }

  const conversations = await hostaway.getConversations({ reservationId: String(reservationId), limit: "200" });
  for (const conversation of conversations) {
    await upsertConversation(conversation);
    summary.conversations += 1;

    const conversationId = Number(conversation.id ?? conversation.conversationId);
    if (Number.isFinite(conversationId)) {
      summary.messages += await syncMessagesForConversation(conversationId);
    }
  }

  summary.details.push(`Synced reservation ${reservationId}.`);
  return summary;
}

export async function syncByConversationId(conversationId: string): Promise<SyncSummary> {
  const summary = newSummary();
  if (!conversationId) throw new Error("conversationId is required");

  const conversation = await hostaway.getConversationById(conversationId);
  if (!conversation) {
    summary.details.push(`Conversation ${conversationId} not found.`);
    return summary;
  }

  await upsertConversation(conversation);
  summary.conversations += 1;

  const reservationId = String(conversation.reservationId ?? "");
  if (reservationId) {
    const reservation = await hostaway.getReservationById(reservationId);
    if (reservation) {
      await upsertReservation(reservation);
      summary.reservations += 1;

      const listingId = Number(reservation.listingMapId ?? reservation.listingId ?? reservation.propertyId);
      if (Number.isFinite(listingId)) {
        const listings = await hostaway.getListings();
        const listing = listings.find((item) => Number(item.id ?? item.listingMapId) === listingId);
        if (listing) {
          await upsertProperty(listing);
          summary.properties += 1;
        }
      }
    }
  }

  const numericConversationId = Number(conversation.id ?? conversation.conversationId ?? conversationId);
  if (Number.isFinite(numericConversationId)) {
    summary.messages += await syncMessagesForConversation(numericConversationId);
  }

  summary.details.push(`Synced conversation ${conversationId}.`);
  return summary;
}
