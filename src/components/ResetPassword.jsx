import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Eye, EyeOff, Lock, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";

/**
 * ResetPassword — handles the full Supabase password-recovery flow.
 *
 * Supabase sends the user to /reset-password with one of:
 *   PKCE flow : ?code=<code>
 *   Implicit  : #access_token=...&type=recovery
 *   OTP link  : ?token=...&type=recovery
 *
 * Props:
 *   onBackToLogin – callback to return to the main app / sign-in screen
 */
export default function ResetPassword({ onBackToLogin }) {
  const [status, setStatus] = useState("loading"); // loading | ready | success | expired | error
  const [errorMsg, setErrorMsg] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState("");

  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    let unsubscribeFn = null;
    let timeoutId = null;

    async function init() {
      // 1. Check for existing session (PKCE already exchanged)
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setStatus("ready");
          return;
        }
      } catch { /* fall through */ }

      // 2. Implicit flow: #access_token=...&type=recovery
      const hash = window.location.hash;
      const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
      const hashType = hashParams.get("type");
      const hashAccessToken = hashParams.get("access_token");
      const hashRefreshToken = hashParams.get("refresh_token");

      if (hashType === "recovery" && hashAccessToken) {
        try {
          const { error } = await supabase.auth.setSession({
            access_token: hashAccessToken,
            refresh_token: hashRefreshToken || ""
          });
          if (error) {
            setStatus("expired");
            setErrorMsg(error.message || "Recovery session is invalid or has expired.");
          } else {
            setStatus("ready");
          }
        } catch (err) {
          setStatus("expired");
          setErrorMsg(err.message || "Could not establish recovery session.");
        }
        return;
      }

      // 3. OTP token: ?token=...&type=recovery
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      const type = params.get("type");
      const code = params.get("code");

      if (type === "recovery" && token) {
        try {
          const { error } = await supabase.auth.verifyOtp({ token_hash: token, type: "recovery" });
          if (error) {
            setStatus("expired");
            setErrorMsg(error.message || "Recovery link is invalid or has expired.");
          } else {
            setStatus("ready");
          }
        } catch (err) {
          setStatus("expired");
          setErrorMsg(err.message || "Could not verify recovery token.");
        }
        return;
      }

      // 4. PKCE code — supabase-js exchanges it and fires PASSWORD_RECOVERY
      if (!code) {
        setStatus("expired");
        setErrorMsg("No password recovery token found. The link may already have been used or has expired.");
        return;
      }

      // Subscribe; supabase-js will exchange the code and emit PASSWORD_RECOVERY or SIGNED_IN
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          setStatus("ready");
        } else if (event === "SIGNED_IN" && session) {
          // Some supabase-js versions emit SIGNED_IN for PKCE recovery
          setStatus("ready");
        } else if (event === "SIGNED_OUT") {
          if (status === "loading") {
            setStatus("expired");
            setErrorMsg("Recovery session expired. Please request a new reset link.");
          }
        }
      });
      unsubscribeFn = data.subscription.unsubscribe;

      // Safety timeout — if no event fires within 8s, show expired UI
      timeoutId = setTimeout(() => {
        setStatus(prev => {
          if (prev === "loading") {
            setErrorMsg("The recovery link has expired or was already used. Please request a new link.");
            return "expired";
          }
          return prev;
        });
      }, 8000);
    }

    init();

    return () => {
      if (unsubscribeFn) unsubscribeFn();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (e) => {
    e.preventDefault();
    setFieldError("");

    if (newPassword.length < 8) {
      setFieldError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setFieldError("Passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setFieldError(error.message || "Failed to update password. The session may have expired.");
      } else {
        setStatus("success");
        // Sign out so the user confirms new credentials work via explicit login
        await supabase.auth.signOut();
      }
    } catch (err) {
      setFieldError(err.message || "An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail.trim()) {
      setResendMsg({ type: "error", text: "Please enter your email address." });
      return;
    }
    setResending(true);
    setResendMsg({ type: "", text: "" });
    try {
      const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(resendEmail.trim(), {
        redirectTo: `${appUrl}/reset-password`
      });
      if (error) {
        setResendMsg({ type: "error", text: error.message || "Could not send reset email." });
      } else {
        setResendMsg({
          type: "success",
          text: `A new reset link has been sent to ${resendEmail}. Check your inbox.`
        });
      }
    } catch (err) {
      setResendMsg({ type: "error", text: err.message || "Unexpected error." });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="reset-password-page">
      <div className="reset-password-card">

        {/* Brand */}
        <div className="reset-brand">
          <img src="/images/dj-samizen.png" alt="Dj Samizen" className="reset-logo" />
          <h1 className="reset-brand-name">DJ SAMIZEN</h1>
        </div>

        {/* Loading */}
        {status === "loading" && (
          <div className="reset-status-block">
            <div className="reset-spinner" />
            <p className="reset-status-text">Verifying your recovery link&hellip;</p>
          </div>
        )}

        {/* Ready — set new password */}
        {status === "ready" && (
          <>
            <div className="reset-header">
              <Lock size={28} className="reset-icon" />
              <h2 className="reset-title">Set New Password</h2>
              <p className="reset-sub">
                Choose a strong password for your administrator account.
              </p>
            </div>

            <form onSubmit={handleSave} className="reset-form" noValidate>
              <div className="reset-field">
                <label htmlFor="rp-new" className="reset-label">New Password</label>
                <div className="password-input-wrap">
                  <input
                    id="rp-new"
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="reset-input"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(v => !v)}
                    className="password-toggle-btn"
                    aria-label={showNew ? "Hide password" : "Show password"}
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="reset-field">
                <label htmlFor="rp-confirm" className="reset-label">Confirm New Password</label>
                <div className="password-input-wrap">
                  <input
                    id="rp-confirm"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="reset-input"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    className="password-toggle-btn"
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {newPassword.length > 0 && newPassword.length < 8 && (
                <p className="reset-hint">Password too short ({newPassword.length}/8 characters).</p>
              )}
              {newPassword.length >= 8 && confirmPassword.length > 0 && newPassword !== confirmPassword && (
                <p className="reset-hint reset-hint-error">Passwords do not match.</p>
              )}
              {newPassword.length >= 8 && confirmPassword.length >= 8 && newPassword === confirmPassword && (
                <p className="reset-hint reset-hint-ok">Passwords match.</p>
              )}

              {fieldError && (
                <div className="reset-error">
                  <AlertTriangle size={15} />
                  <span>{fieldError}</span>
                </div>
              )}

              <button type="submit" disabled={saving} className="btn btn-primary btn-full reset-submit">
                {saving
                  ? <><RefreshCw size={16} className="spin-icon" /><span>Saving password&hellip;</span></>
                  : <span>Save New Password</span>
                }
              </button>
            </form>
          </>
        )}

        {/* Success */}
        {status === "success" && (
          <div className="reset-success-block">
            <CheckCircle size={52} className="reset-success-icon" />
            <h2 className="reset-title">Password Updated!</h2>
            <p className="reset-sub">
              Your new password has been saved. Sign in to the admin portal with your updated credentials.
            </p>
            <button onClick={onBackToLogin} className="btn btn-primary btn-full" style={{ marginTop: "1.5rem" }}>
              Go to Admin Sign In
            </button>
          </div>
        )}

        {/* Expired / Error */}
        {(status === "expired" || status === "error") && (
          <div className="reset-expired-block">
            <AlertTriangle size={48} className="reset-expired-icon" />
            <h2 className="reset-title">Link Invalid or Expired</h2>
            <p className="reset-sub">{errorMsg || "This recovery link is no longer valid."}</p>

            <div className="reset-resend-section">
              <p className="reset-resend-label">Request a fresh reset link:</p>
              <form onSubmit={handleResend} className="reset-resend-form">
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="josephngotho988@gmail.com"
                  className="reset-input"
                  autoComplete="email"
                  required
                />
                {resendMsg.text && (
                  <p className={`reset-resend-msg ${resendMsg.type}`}>{resendMsg.text}</p>
                )}
                <button
                  type="submit"
                  disabled={resending}
                  className="btn btn-primary btn-full"
                  style={{ marginTop: "0.75rem" }}
                >
                  {resending ? "Sending..." : "Send New Reset Link"}
                </button>
              </form>
            </div>

            <button onClick={onBackToLogin} className="btn btn-outline btn-full" style={{ marginTop: "0.75rem" }}>
              Back to Website
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
