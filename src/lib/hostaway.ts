import { env } from "../config.js";
import { pool } from "../db/client.js";

type HostawayResponse<T> = {
  status: string;
  result: T | T[];
  page?: number;
  totalPages?: number;
};

type AnyRecord = Record<string, unknown>;

function buildUrl(path: string, query: Record<string, string | number | undefined>): string {
  const trimmedBase = env.HOSTAWAY_BASE_URL.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${trimmedBase}${normalizedPath}`);

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

async function getStoredToken(): Promise<{ accessToken: string; expiresAt: Date } | null> {
  const { rows } = await pool.query(
    "SELECT access_token, expires_at FROM hostaway_tokens WHERE id = 1 LIMIT 1",
  );

  if (rows.length === 0) {
    return null;
  }

  return { accessToken: rows[0].access_token, expiresAt: new Date(rows[0].expires_at) };
}

async function storeToken(accessToken: string, expiresAt: Date): Promise<void> {
  await pool.query(
    `INSERT INTO hostaway_tokens (id, access_token, expires_at, updated_at)
     VALUES (1, $1, $2, NOW())
     ON CONFLICT (id)
     DO UPDATE SET access_token = EXCLUDED.access_token,
                   expires_at = EXCLUDED.expires_at,
                   updated_at = NOW()`,
    [accessToken, expiresAt],
  );
}

async function issueAccessToken(): Promise<string> {
  const endpoint = buildUrl("/accessTokens", {});
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      accountId: env.HOSTAWAY_ACCOUNT_ID,
      apiKey: env.HOSTAWAY_API_KEY,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to issue Hostaway token (${response.status}): ${body}`);
  }

  const payload = (await response.json()) as HostawayResponse<AnyRecord>;
  const tokenResult = (Array.isArray(payload.result) ? payload.result[0] : payload.result) ?? {};
  const accessToken = String(tokenResult.accessToken ?? tokenResult.token ?? "");
  if (!accessToken) {
    throw new Error("Hostaway token response did not include accessToken.");
  }

  const expiresAtRaw = tokenResult.expiresAt ?? tokenResult.expiredAt ?? null;
  const expiresAt =
    typeof expiresAtRaw === "string"
      ? new Date(expiresAtRaw)
      : new Date(Date.now() + 1000 * 60 * 60 * 24 * 30 * 23);

  await storeToken(accessToken, expiresAt);
  return accessToken;
}

export async function getAccessToken(): Promise<string> {
  const current = await getStoredToken();
  if (current && current.expiresAt.getTime() > Date.now() + 60_000) {
    return current.accessToken;
  }

  return issueAccessToken();
}

async function hostawayFetch<T>(
  path: string,
  query: Record<string, string | number | undefined> = {},
): Promise<T[]> {
  const url = buildUrl(path, query);
  let token = await getAccessToken();

  const callApi = async (): Promise<Response> =>
    fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

  let response = await callApi();
  if (response.status === 403) {
    token = await issueAccessToken();
    response = await callApi();
  }

  if (!response.ok) {
    throw new Error(`Hostaway request failed (${response.status}) for ${url}`);
  }

  const payload = (await response.json()) as HostawayResponse<T>;
  return Array.isArray(payload.result) ? payload.result : [payload.result];
}

async function hostawayFetchOne<T>(
  path: string,
  query: Record<string, string | number | undefined> = {},
): Promise<T | null> {
  const rows = await hostawayFetch<T>(path, query);
  return rows[0] ?? null;
}

export async function getListingsByName(propertyName: string): Promise<AnyRecord[]> {
  const listings = await hostawayFetch<AnyRecord>(env.HOSTAWAY_LISTINGS_PATH, {
    includeResources: 1,
    limit: 100,
  });

  const query = propertyName.trim().toLowerCase();
  return listings.filter((listing) => {
    const name = String(listing.name ?? listing.airbnbName ?? "").toLowerCase();
    return name.includes(query);
  });
}

export async function getReservationsForListing(listingMapId: number): Promise<AnyRecord[]> {
  return hostawayFetch<AnyRecord>(env.HOSTAWAY_RESERVATIONS_PATH, {
    includeResources: 1,
    listingMapId,
    limit: 100,
  });
}

export async function getReservationById(reservationId: number): Promise<AnyRecord | null> {
  return hostawayFetchOne<AnyRecord>(`${env.HOSTAWAY_RESERVATIONS_PATH}/${reservationId}`, {
    includeResources: 1,
  });
}

export async function getConversationById(conversationId: number): Promise<AnyRecord | null> {
  return hostawayFetchOne<AnyRecord>(`${env.HOSTAWAY_CONVERSATIONS_PATH}/${conversationId}`, {
    includeResources: 1,
  });
}

export async function getConversationsForListing(listingMapId: number): Promise<AnyRecord[]> {
  return hostawayFetch<AnyRecord>(env.HOSTAWAY_CONVERSATIONS_PATH, {
    listingMapId,
    includeResources: 1,
    limit: 100,
  });
}

export async function getConversationMessages(conversationId: number): Promise<AnyRecord[]> {
  const template = env.HOSTAWAY_CONVERSATION_MESSAGES_TEMPLATE;
  const path = template.replace("{conversationId}", String(conversationId));
  return hostawayFetch<AnyRecord>(path, { limit: 100 });
}
