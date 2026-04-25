function buildHeaders(apiToken) {
  const headers = {
    Accept: 'application/json',
  };

  if (apiToken) {
    headers.Authorization = `Bearer ${apiToken}`;
  }

  return headers;
}

async function fetchCollection({ baseUrl, apiToken, path }) {
  const url = new URL(path, baseUrl).toString();
  const response = await fetch(url, {
    method: 'GET',
    headers: buildHeaders(apiToken),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Hostaway request failed (${response.status}) for ${path}: ${text.slice(0, 200)}`);
  }

  const payload = await response.json();

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload.result)) {
    return payload.result;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (Array.isArray(payload.items)) {
    return payload.items;
  }

  return [];
}

async function fetchHostawayData(options = {}) {
  const baseUrl = options.baseUrl || process.env.HOSTAWAY_BASE_URL || 'https://api.hostaway.com';
  const apiToken = options.apiToken || process.env.HOSTAWAY_API_TOKEN || '';
  const conversationsPath =
    options.conversationsPath || process.env.HOSTAWAY_CONVERSATIONS_PATH || '/v1/conversations';
  const messagesPath = options.messagesPath || process.env.HOSTAWAY_MESSAGES_PATH || '/v1/messages';

  const [conversations, messages] = await Promise.all([
    fetchCollection({ baseUrl, apiToken, path: conversationsPath }),
    fetchCollection({ baseUrl, apiToken, path: messagesPath }),
  ]);

  return {
    conversations,
    messages,
  };
}

module.exports = {
  fetchHostawayData,
};
