import {
  getConversationById,
  getConversationMessages,
  getConversationsForListing,
  getListingsByName,
  getReservationById,
  getReservationsForListing,
} from "./hostaway.js";
import { upsertConversation, upsertMessage, upsertProperty, upsertReservation } from "./repository.js";

export async function syncByPropertyName(propertyName: string): Promise<{
  properties: number;
  reservations: number;
  conversations: number;
  messages: number;
}> {
  let reservationCount = 0;
  let conversationCount = 0;
  let messageCount = 0;

  const listings = await getListingsByName(propertyName);

  for (const listing of listings) {
    await upsertProperty(listing);
    const listingMapId = Number(listing.listingMapId ?? listing.id);
    const listingName = String(listing.name ?? listing.airbnbName ?? propertyName);

    const reservations = await getReservationsForListing(listingMapId);
    for (const reservation of reservations) {
      await upsertReservation(reservation, listingName);
      reservationCount += 1;
    }

    const conversations = await getConversationsForListing(listingMapId);
    for (const conversation of conversations) {
      await upsertConversation(conversation, listingName);
      conversationCount += 1;

      const conversationId = Number(conversation.id ?? conversation.conversationId);
      if (!Number.isFinite(conversationId)) continue;

      const messages = await getConversationMessages(conversationId);
      for (const message of messages) {
        await upsertMessage(message, conversationId);
        messageCount += 1;
      }
    }
  }

  return {
    properties: listings.length,
    reservations: reservationCount,
    conversations: conversationCount,
    messages: messageCount,
  };
}

export async function syncConversation(conversationId: number): Promise<void> {
  const conversation = await getConversationById(conversationId);
  if (!conversation) {
    throw new Error(`Conversation ${conversationId} not found.`);
  }

  await upsertConversation(conversation, null);
  const messages = await getConversationMessages(conversationId);

  for (const message of messages) {
    await upsertMessage(message, conversationId);
  }
}

export async function syncReservation(reservationId: number): Promise<void> {
  const reservation = await getReservationById(reservationId);
  if (!reservation) {
    throw new Error(`Reservation ${reservationId} not found.`);
  }

  await upsertReservation(reservation, null);

  const conversationId = Number(reservation.conversationId);
  if (Number.isFinite(conversationId)) {
    await syncConversation(conversationId);
  }
}
