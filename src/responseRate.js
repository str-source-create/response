function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function toMs(value) {
  const timestamp = value ? new Date(value).getTime() : NaN;
  return Number.isFinite(timestamp) ? timestamp : null;
}

function normalizeRole(message) {
  const role = (
    message.senderRole ||
    message.senderType ||
    message.creatorType ||
    message.userType ||
    message.fromType ||
    ''
  )
    .toString()
    .toLowerCase();

  if (['guest', 'customer', 'traveler'].includes(role)) {
    return 'guest';
  }

  if (['host', 'manager', 'admin', 'staff'].includes(role)) {
    return 'host';
  }

  return 'unknown';
}

function getGuestId(message, conversation) {
  return (
    message.guestId ||
    message.guest_id ||
    conversation?.guestId ||
    conversation?.guest_id ||
    conversation?.reservation?.guestId ||
    conversation?.reservation?.guest_id ||
    message.fromUserId ||
    null
  );
}

function buildConversationMap(conversations) {
  const map = new Map();

  for (const conversation of asArray(conversations)) {
    const conversationId = conversation.id || conversation.conversationId || conversation.conversation_id;
    if (!conversationId) {
      continue;
    }

    map.set(conversationId, conversation);
  }

  return map;
}

function calculateGuestResponseRates(conversations, messages) {
  const conversationMap = buildConversationMap(conversations);
  const byConversation = new Map();

  for (const message of asArray(messages)) {
    const conversationId = message.conversationId || message.conversation_id || message.threadId || message.thread_id;
    if (!conversationId) {
      continue;
    }

    const createdAtMs = toMs(message.createdAt || message.created_at || message.sentAt || message.sent_at);
    if (!createdAtMs) {
      continue;
    }

    if (!byConversation.has(conversationId)) {
      byConversation.set(conversationId, []);
    }

    byConversation.get(conversationId).push({
      conversationId,
      createdAtMs,
      role: normalizeRole(message),
      guestId: getGuestId(message, conversationMap.get(conversationId)),
    });
  }

  const stats = new Map();

  for (const conversationMessages of byConversation.values()) {
    conversationMessages.sort((a, b) => a.createdAtMs - b.createdAtMs);

    for (let i = 0; i < conversationMessages.length; i += 1) {
      const message = conversationMessages[i];
      if (message.role !== 'guest' || !message.guestId) {
        continue;
      }

      let responded = false;
      for (let j = i + 1; j < conversationMessages.length; j += 1) {
        if (conversationMessages[j].role === 'host') {
          responded = true;
          break;
        }
      }

      const current = stats.get(message.guestId) || {
        guestId: message.guestId,
        guestMessages: 0,
        respondedMessages: 0,
      };

      current.guestMessages += 1;
      if (responded) {
        current.respondedMessages += 1;
      }

      stats.set(message.guestId, current);
    }
  }

  return Array.from(stats.values())
    .map((entry) => ({
      ...entry,
      responseRate:
        entry.guestMessages === 0
          ? 0
          : Number((entry.respondedMessages / entry.guestMessages).toFixed(4)),
    }))
    .sort((a, b) => a.guestId.toString().localeCompare(b.guestId.toString()));
}

module.exports = {
  calculateGuestResponseRates,
};
