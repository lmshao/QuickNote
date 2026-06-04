import { useCallback, useEffect, useState } from "react";
import type { AuthProviders, AuthUser } from "../types";
import {
  checkUsernameAvailability,
  fetchAuthProviders,
  getDefaultApiBaseUrl,
  getApiBaseUrl,
  loginLocal,
  probeApiBaseUrl,
  resetApiBaseUrl,
  registerLocal,
  setApiBaseUrl,
} from "../services/authApi";

const TOKEN_STORAGE_KEY = "quicknote.auth.token";
const USER_STORAGE_KEY = "quicknote.auth.user";

export interface RegisterInput {
  username: string;
  password: string;
  email?: string;
  phone?: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface ApiProbeResult {
  ok: boolean;
  message: string;
  normalized?: string;
}

function readStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [providers, setProviders] = useState<AuthProviders | null>(null);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiBaseUrl, setApiBaseUrlState] = useState(() => getApiBaseUrl());

  const persistAuth = useCallback((nextToken: string, nextUser: AuthUser) => {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
  }, []);

  const clearAuth = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  }, []);

  const refreshProviders = useCallback(async () => {
    setProvidersLoading(true);
    try {
      const result = await fetchAuthProviders();
      setProviders(result);
      setError(null);
    } catch (err) {
      setProviders({ local: true, wechat: false });
      const message = err instanceof Error ? err.message : "Failed to load auth providers";
      setError(message);
    } finally {
      setProvidersLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshProviders();
  }, [refreshProviders]);

  const login = useCallback(
    async (input: LoginInput): Promise<boolean> => {
      setSubmitting(true);
      setError(null);
      try {
        const result = await loginLocal(input);
        persistAuth(result.token, result.user);
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Login failed";
        setError(message);
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [persistAuth],
  );

  const register = useCallback(
    async (input: RegisterInput): Promise<boolean> => {
      setSubmitting(true);
      setError(null);
      try {
        const usernameCheck = await checkUsernameAvailability(input.username);
        if (!usernameCheck.available) {
          setError(
            usernameCheck.reason === "invalid_format"
              ? "Username format is invalid"
              : "Username is already taken. Please choose another one.",
          );
          return false;
        }

        const result = await registerLocal(input);
        persistAuth(result.token, result.user);
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Registration failed";
        setError(message);
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [persistAuth],
  );

  const logout = useCallback(() => {
    clearAuth();
    setError(null);
  }, [clearAuth]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const updateApiBaseUrl = useCallback(
    async (nextUrl: string): Promise<boolean> => {
      try {
        const normalized = setApiBaseUrl(nextUrl);
        setApiBaseUrlState(normalized);
        setError(null);
        await refreshProviders();
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update API base URL";
        setError(message);
        return false;
      }
    },
    [refreshProviders],
  );

  const useDefaultApiBaseUrl = useCallback(async (): Promise<void> => {
    const normalized = resetApiBaseUrl();
    setApiBaseUrlState(normalized);
    await refreshProviders();
  }, [refreshProviders]);

  const testApiBaseUrl = useCallback(async (targetUrl: string): Promise<ApiProbeResult> => {
    try {
      const result = await probeApiBaseUrl(targetUrl);
      return {
        ok: true,
        message: result.message,
        normalized: result.normalized,
      };
    } catch (err) {
      return {
        ok: false,
        message: err instanceof Error ? err.message : "Connectivity test failed",
      };
    }
  }, []);

  return {
    user,
    token,
    providers,
    providersLoading,
    submitting,
    error,
    apiBaseUrl,
    defaultApiBaseUrl: getDefaultApiBaseUrl(),
    isAuthenticated: Boolean(token && user),
    login,
    register,
    logout,
    clearError,
    refreshProviders,
    updateApiBaseUrl,
    useDefaultApiBaseUrl,
    testApiBaseUrl,
  };
}
