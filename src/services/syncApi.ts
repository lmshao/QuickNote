import { getApiBaseUrl } from "./authApi";

export interface SyncPushNote {
  id: string;
  content: string;
  color: string;
  pinned: boolean;
  updated_at: number;
  deleted: boolean;
}

interface ApiErrorPayload {
  error?: { code?: string; message?: string };
}

export interface SyncPullNote {
  id: string;
  content: string;
  color: string;
  pinned: boolean;
  version: number;
  created_at: number;
  updated_at: number;
  deleted: boolean;
}

interface PushResult {
  ok: boolean;
  processed: number;
  /** IDs of notes skipped by server (server had a newer version) */
  skipped: string[];
}

interface PullResult {
  notes: SyncPullNote[];
  serverTime: number;
  hasMore: boolean;
}

async function requestJson<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
  const hasJsonBody = typeof init?.body === "string" && init.body.length > 0;
  if (hasJsonBody) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      ...headers,
      ...(init?.headers ?? {}),
    },
  });

  const data = (await response.json().catch(() => ({}))) as T & ApiErrorPayload;
  if (!response.ok) {
    const message = data?.error?.message || `Sync request failed: ${response.status}`;
    throw new Error(message);
  }
  return data;
}

/**
 * 推送本地变更到服务端
 */
export async function pushNotes(token: string, notes: SyncPushNote[]): Promise<PushResult> {
  return requestJson<PushResult>("/sync/push", token, {
    method: "POST",
    body: JSON.stringify({ notes }),
  });
}

/**
 * 拉取远端变更
 */
export async function pullNotes(
  token: string,
  since: number,
  limit = 200,
): Promise<PullResult> {
  const params = new URLSearchParams({ since: String(since), limit: String(limit) });
  return requestJson<PullResult>(`/sync/pull?${params.toString()}`, token);
}
