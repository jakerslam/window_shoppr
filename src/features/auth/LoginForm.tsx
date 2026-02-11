"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "@/features/auth/LoginForm.module.css";

/**
 * Login form UI with stub handlers for future auth wiring.
 */
export default function LoginForm({
  title = "Welcome back",
  subtitle = "Sign in to save your finds and pick up where you left off.",
  switchLabel = "New here?",
  switchLinkLabel = "Create account",
  switchLinkHref = "/signup",
}: {
  title?: string;
  subtitle?: string;
  switchLabel?: string;
  switchLinkLabel?: string;
  switchLinkHref?: string;
}) {
  const [statusMessage, setStatusMessage] = useState("");

  // Handle login submission with a stub response.
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent full page reload.
    setStatusMessage("Login stub: connect auth provider."); // Placeholder for auth wiring.
  };

  // Handle forgotten password with a stub response.
  const handleForgotPassword = () => {
    setStatusMessage("Password reset stub: connect email flow."); // Placeholder for reset flow.
  };

  // Handle social login stubs for future provider wiring.
  const handleSocialLogin = (provider: string) => {
    setStatusMessage(`${provider} login stub: connect provider.`); // Placeholder for social auth.
  };

  return (
    <section className={styles.loginForm} aria-labelledby="login-title">
      {/* Header block with title and helper copy. */}
      <header className={styles.loginForm__header}>
        <h1 id="login-title" className={styles.loginForm__title}>
          {title}
        </h1>
        <p className={styles.loginForm__subtitle}>{subtitle}</p>
      </header>

      {/* Social login placeholder actions. */}
      <div className={styles.loginForm__socialRow}>
        <button
          className={styles.loginForm__socialButton}
          type="button"
          onClick={() => handleSocialLogin("Google")} // Trigger Google stub.
        >
          Continue with Google
        </button>
        <button
          className={styles.loginForm__socialButton}
          type="button"
          onClick={() => handleSocialLogin("X")} // Trigger X stub.
        >
          Continue with X
        </button>
        <button
          className={styles.loginForm__socialButton}
          type="button"
          onClick={() => handleSocialLogin("Meta")} // Trigger Meta stub.
        >
          Continue with Meta
        </button>
      </div>

      {/* Divider between social login and email form. */}
      <div className={styles.loginForm__divider} aria-hidden="true">
        <span className={styles.loginForm__dividerLine} />
        <span className={styles.loginForm__dividerText}>or</span>
        <span className={styles.loginForm__dividerLine} />
      </div>

      {/* Main login form inputs. */}
      <form className={styles.loginForm__form} onSubmit={handleSubmit}>
        {/* Email field input. */}
        <label className={styles.loginForm__field}>
          <span className={styles.loginForm__label}>Email</span>
          <input
            className={styles.loginForm__input}
            type="email"
            name="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </label>

        {/* Password field input. */}
        <label className={styles.loginForm__field}>
          <span className={styles.loginForm__label}>Password</span>
          <input
            className={styles.loginForm__input}
            type="password"
            name="password"
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
        </label>

        {/* Forgot password action row. */}
        <div className={styles.loginForm__helperRow}>
          <button
            className={styles.loginForm__linkButton}
            type="button"
            onClick={handleForgotPassword} // Trigger reset stub.
          >
            Forgot password?
          </button>
        </div>

        {/* Primary submit button. */}
        <button className={styles.loginForm__submit} type="submit">
          Sign in
        </button>
      </form>

      {/* Status message for stubbed actions. */}
      {statusMessage ? (
        <p className={styles.loginForm__status} role="status">
          {statusMessage}
        </p>
      ) : null}

      {/* Switch to account creation flow. */}
      <div className={styles.loginForm__switchRow}>
        <span className={styles.loginForm__switchText}>{switchLabel}</span>
        <Link className={styles.loginForm__switchLink} href={switchLinkHref}>
          {switchLinkLabel}
        </Link>
      </div>
    </section>
  );
}
