import type { AuthProviders, AuthUser } from "../types";

const API_BASE_URL_STORAGE_KEY = "quicknote.api.baseUrl";
const DEFAULT_API_BASE_URL = "http://124.220.8.160:6968/api/v1";

let runtimeApiBaseUrl = loadInitialApiBaseUrl();

interface ApiErrorPayload {
  error?: {
    code?: string;
    message?: string;
  };
}

interface AuthResult {
  token: string;
  user: AuthUser;
}

export interface RegisterPayload {
  username: string;
  password: string;
  email?: string;
  phone?: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface UsernameAvailability {
  available: boolean;
  reason?: string;
}

interface HealthResponse {
  status: string;
  version?: string;
  time?: string;
}

function loadInitialApiBaseUrl(): string {
  const raw = localStorage.getItem(API_BASE_URL_STORAGE_KEY);
  if (!raw) return DEFAULT_API_BASE_URL;
  try {
    return normalizeApiBaseUrl(raw);
  } catch {
    return DEFAULT_API_BASE_URL;
  }
}

function normalizeApiBaseUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("API base URL cannot be empty");
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("API base URL is invalid");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("API base URL must start with http:// or https://");
  }

  let normalized = trimmed.replace(/\/$/, "");
  const path = url.pathname.replace(/\/$/, "");
  if (path === "" || path === "/") {
    normalized = `${normalized}/api/v1`;
  }
  return normalized;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  const hasJsonBody = typeof init?.body === "string" && init.body.length > 0;
  if (hasJsonBody) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${runtimeApiBaseUrl}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      ...headers,
      ...(init?.headers ?? {}),
    },
  });

  const data = (await response.json().catch(() => ({}))) as T & ApiErrorPayload;
  if (!response.ok) {
    const message = data?.error?.message || `Request failed: ${response.status}`;
    throw new Error(message);
  }
  return data;
}

export function getApiBaseUrl(): string {
  return runtimeApiBaseUrl;
}

export function getDefaultApiBaseUrl(): string {
  return DEFAULT_API_BASE_URL;
}

export function setApiBaseUrl(nextUrl: string): string {
  const normalized = normalizeApiBaseUrl(nextUrl);
  runtimeApiBaseUrl = normalized;
  localStorage.setItem(API_BASE_URL_STORAGE_KEY, normalized);
  return normalized;
}

export function resetApiBaseUrl(): string {
  runtimeApiBaseUrl = DEFAULT_API_BASE_URL;
  localStorage.removeItem(API_BASE_URL_STORAGE_KEY);
  return runtimeApiBaseUrl;
}

export async function probeApiBaseUrl(input: string): Promise<{
  normalized: string;
  message: string;
}> {
  const normalized = normalizeApiBaseUrl(input);
  let response: Response;

  try {
    response = await fetch(`${normalized}/health`);
  } catch {
    throw new Error("Cannot reach server. Please check network and URL.");
  }

  if (!response.ok) {
    throw new Error(`Health check failed with HTTP ${response.status}`);
  }

  const payload = (await response.json().catch(() => null)) as HealthResponse | null;
  if (!payload || payload.status !== "ok") {
    throw new Error("Health check response is invalid.");
  }

  const version = payload.version ? ` (v${payload.version})` : "";
  return {
    normalized,
    message: `Connected${version}`,
  };
}

export async function fetchAuthProviders(): Promise<AuthProviders> {
  return requestJson<AuthProviders>("/auth/providers");
}

export async function checkUsernameAvailability(username: string): Promise<UsernameAvailability> {
  return requestJson<UsernameAvailability>(
    `/auth/username/available?username=${encodeURIComponent(username)}&_t=${Date.now()}`,
  );
}

export async function registerLocal(payload: RegisterPayload): Promise<AuthResult> {
  return requestJson<AuthResult>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function loginLocal(payload: LoginPayload): Promise<AuthResult> {
  return requestJson<AuthResult>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
