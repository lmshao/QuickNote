import { useEffect, useMemo, useState } from "react";
import type { AuthProviders } from "../types";
import "./AuthModal.css";

type AuthMode = "login" | "register";

interface AuthModalProps {
  open: boolean;
  providers: AuthProviders | null;
  providersLoading: boolean;
  submitting: boolean;
  error: string | null;
  apiBaseUrl: string;
  defaultApiBaseUrl: string;
  currentUsername: string | null;
  onClose: () => void;
  onLogin: (input: { username: string; password: string }) => Promise<boolean>;
  onRegister: (input: {
    username: string;
    password: string;
    email?: string;
    phone?: string;
  }) => Promise<boolean>;
  onLogout: () => void;
  onUpdateApiBaseUrl: (nextUrl: string) => Promise<boolean>;
  onUseDefaultApiBaseUrl: () => Promise<void>;
  onTestApiBaseUrl: (targetUrl: string) => Promise<{ ok: boolean; message: string; normalized?: string }>;
  onClearError: () => void;
}

export default function AuthModal({
  open,
  providers,
  providersLoading,
  submitting,
  error,
  apiBaseUrl,
  defaultApiBaseUrl,
  currentUsername,
  onClose,
  onLogin,
  onRegister,
  onLogout,
  onUpdateApiBaseUrl,
  onUseDefaultApiBaseUrl,
  onTestApiBaseUrl,
  onClearError,
}: AuthModalProps) {
  const isAuthenticated = Boolean(currentUsername);
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [apiBaseInput, setApiBaseInput] = useState(apiBaseUrl);
  const [updatingApi, setUpdatingApi] = useState(false);
  const [testingApi, setTestingApi] = useState(false);
  const [apiStatus, setApiStatus] = useState<"idle" | "checking" | "ok" | "error">("idle");
  const [apiStatusMessage, setApiStatusMessage] = useState("");

  useEffect(() => {
    if (!open) return;
    onClearError();
    setMode("login");
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    setEmail("");
    setPhone("");
    setApiBaseInput(apiBaseUrl);
    setApiStatus("idle");
    setApiStatusMessage("");
  }, [open, onClearError]);

  const canUseLocal = useMemo(() => providers?.local ?? true, [providers]);
  const canUseWechat = useMemo(() => providers?.wechat ?? false, [providers]);
  const passwordMismatch = mode === "register" && confirmPassword.length > 0 && password !== confirmPassword;

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    const success =
      mode === "login"
        ? await onLogin({ username: username.trim(), password })
        : await onRegister({
            username: username.trim(),
            password,
            email: email.trim() || undefined,
            phone: phone.trim() || undefined,
          });

    if (success) onClose();
  };

  const handleSaveApiBase = async () => {
    setUpdatingApi(true);
    const success = await onUpdateApiBaseUrl(apiBaseInput);
    if (success) {
      setApiBaseInput(apiBaseInput.trim());
    }
    setUpdatingApi(false);
  };

  const handleUseDefaultApi = async () => {
    setUpdatingApi(true);
    await onUseDefaultApiBaseUrl();
    setApiBaseInput(defaultApiBaseUrl);
    setApiStatus("idle");
    setApiStatusMessage("");
    setUpdatingApi(false);
  };

  const handleTestApi = async () => {
    setTestingApi(true);
    setApiStatus("checking");
    setApiStatusMessage("Checking connectivity...");
    const result = await onTestApiBaseUrl(apiBaseInput);
    if (result.ok) {
      if (result.normalized) setApiBaseInput(result.normalized);
      setApiStatus("ok");
      setApiStatusMessage(result.message);
    } else {
      setApiStatus("error");
      setApiStatusMessage(result.message);
    }
    setTestingApi(false);
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-header">
          <h3>Account</h3>
          <button className="auth-modal-close" onClick={onClose} title="Close">
            ×
          </button>
        </div>

        {isAuthenticated ? (
          <div className="auth-profile">
            <div className="auth-profile-row">
              <span className="auth-profile-label">Signed in as</span>
              <strong className="auth-profile-name">{currentUsername}</strong>
            </div>
            <button
              className="auth-submit auth-logout-btn"
              type="button"
              onClick={() => {
                onLogout();
                onClose();
              }}
            >
              Logout
            </button>
          </div>
        ) : (
          <>
            <div className="auth-modal-subtitle">Server API Base URL</div>
            <div className="auth-api-config">
              <input
                className="auth-api-input"
                value={apiBaseInput}
                onChange={(e) => setApiBaseInput(e.target.value)}
                placeholder={defaultApiBaseUrl}
              />
              <button
                className="auth-api-btn"
                type="button"
                onClick={handleTestApi}
                disabled={updatingApi || testingApi}
              >
                Test
              </button>
              <button
                className="auth-api-btn"
                type="button"
                onClick={handleSaveApiBase}
                disabled={updatingApi || testingApi}
              >
                Save
              </button>
              <button
                className="auth-api-btn secondary"
                type="button"
                onClick={handleUseDefaultApi}
                disabled={updatingApi || testingApi}
              >
                Default
              </button>
            </div>
            <div className="auth-api-current">
              Current: <code>{apiBaseUrl}</code>
            </div>
            {apiStatus !== "idle" && (
              <div className={`auth-api-status ${apiStatus}`}>
                {apiStatusMessage}
              </div>
            )}

            <div className="auth-modal-tabs">
              <button
                className={`auth-tab ${mode === "login" ? "active" : ""}`}
                type="button"
                onClick={() => {
                  onClearError();
                  setMode("login");
                }}
              >
                Login
              </button>
              <button
                className={`auth-tab ${mode === "register" ? "active" : ""}`}
                type="button"
                onClick={() => {
                  onClearError();
                  setMode("register");
                }}
              >
                Register
              </button>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              {mode === "register" && error && error.toLowerCase().includes("username") && (
                <div className="auth-field-error">
                  <strong>Username unavailable.</strong> Please choose another username.
                </div>
              )}

              <label>
                Username
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="letters, digits, .-_"
                  maxLength={20}
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
              </label>

              {mode === "register" && (
                <>
                  <label>
                    Confirm Password
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                    />
                  </label>
                  {passwordMismatch && (
                    <p className="auth-error">Passwords do not match.</p>
                  )}
                  <label>
                    Email (optional)
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                    />
                  </label>
                  <label>
                    Phone (optional)
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 555 123 4567"
                    />
                  </label>
                </>
              )}

              {providersLoading && <p className="auth-hint">Loading auth providers...</p>}
              {!providersLoading && !canUseLocal && (
                <p className="auth-error">Local account login is disabled on server.</p>
              )}
              {!providersLoading && canUseWechat && (
                <p className="auth-hint">WeChat login is available on server.</p>
              )}

              {error && <p className="auth-error">{error}</p>}

              <button
                className="auth-submit"
                type="submit"
                disabled={
                  submitting ||
                  !canUseLocal ||
                  !username.trim() ||
                  password.length < 8 ||
                  passwordMismatch
                }
              >
                {submitting ? "Please wait..." : mode === "login" ? "Login" : "Register"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
