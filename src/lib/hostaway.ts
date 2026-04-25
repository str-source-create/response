import { config } from "../config";
import { getToken, upsertToken } from "./repository";

type JsonObject = Record<string, any>;

function extractDataArray(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

export class HostawayClient {
  private cachedToken: string | null = null;

  async getAccessToken(forceRefresh = false): Promise<string> {
    if (!forceRefresh && this.cachedToken) {
      return this.cachedToken;
    }

    if (!forceRefresh) {
      const tokenRow = await getToken();
      const nowWithSkew = Date.now() + 30_000;
      if (tokenRow && tokenRow.expiresAt.getTime() > nowWithSkew) {
        this.cachedToken = tokenRow.accessToken;
        return tokenRow.accessToken;
      }
    }

    const token = await this.refreshAccessToken();
    this.cachedToken = token;
    return token;
  }

  async refreshAccessToken(): Promise<string> {
    const url = `${config.HOSTAWAY_BASE_URL}${config.HOSTAWAY_TOKEN_PATH}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: config.HOSTAWAY_CLIENT_ID,
        client_secret: config.HOSTAWAY_CLIENT_SECRET
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to get Hostaway token (${response.status}): ${text}`);
    }

    const payload = await response.json();
    const accessToken = payload.access_token ?? payload.token;

    if (!accessToken) {
      throw new Error("Hostaway token response missing access token");
    }

    const expiresInSec = Number(payload.expires_in ?? payload.expiresIn ?? 3600);
    const expiresAt = new Date(Date.now() + Math.max(60, expiresInSec) * 1000);

    await upsertToken({
      provider: "hostaway",
      accessToken,
      expiresAt
    });

    return accessToken;
  }

  async request(path: string, init?: RequestInit, retryAuth = true): Promise<JsonObject> {
    const accessToken = await this.getAccessToken();
    const url = `${config.HOSTAWAY_BASE_URL}${path}`;

    const response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        ...(init?.headers ?? {})
      }
    });

    if ((response.status === 401 || response.status === 403) && retryAuth) {
      await this.getAccessToken(true);
      return this.request(path, init, false);
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Hostaway request failed (${response.status}) for ${path}: ${text}`);
    }

    return (await response.json()) as JsonObject;
  }

  async getListings(): Promise<any[]> {
    const payload = await this.request(config.HOSTAWAY_LISTINGS_PATH);
    return extractDataArray(payload);
  }

  async getReservationById(reservationId: string): Promise<any | null> {
    const payload = await this.request(`${config.HOSTAWAY_RESERVATIONS_PATH}/${encodeURIComponent(reservationId)}`);
    const list = extractDataArray(payload);
    if (list.length > 0) return list[0];
    return payload?.result ?? payload?.data ?? payload ?? null;
  }

  async getReservationsByListing(listingId: number): Promise<any[]> {
    const query = new URLSearchParams({ listingMapId: String(listingId), limit: "500" }).toString();
    const payload = await this.request(`${config.HOSTAWAY_RESERVATIONS_PATH}?${query}`);
    return extractDataArray(payload);
  }

  async getConversationById(conversationId: string): Promise<any | null> {
    const payload = await this.request(`${config.HOSTAWAY_CONVERSATIONS_PATH}/${encodeURIComponent(conversationId)}`);
    const list = extractDataArray(payload);
    if (list.length > 0) return list[0];
    return payload?.result ?? payload?.data ?? payload ?? null;
  }

  async getConversations(params: Record<string, string>): Promise<any[]> {
    const query = new URLSearchParams(params).toString();
    const payload = await this.request(`${config.HOSTAWAY_CONVERSATIONS_PATH}?${query}`);
    return extractDataArray(payload);
  }

  async getMessagesByConversation(conversationId: number): Promise<any[]> {
    const query = new URLSearchParams({ conversationId: String(conversationId), limit: "1000" }).toString();
    const payload = await this.request(`${config.HOSTAWAY_MESSAGES_PATH}?${query}`);
    return extractDataArray(payload);
  }
}
