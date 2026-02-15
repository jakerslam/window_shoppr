"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmail,
  signInWithProvider,
} from "@/shared/lib/platform/auth-service";
import {
  resolvePostAuthRedirectPath,
  writeAuthRedirectPath,
} from "@/shared/lib/platform/auth-redirect";
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
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle login submission through auth service wiring (API when configured, local fallback otherwise).
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent full page reload.
    setIsSubmitting(true); // Lock controls while auth request is in flight.
    const formData = new FormData(event.currentTarget);
    const emailValue = `${formData.get("email") ?? ""}`.trim();
    const passwordValue = `${formData.get("password") ?? ""}`;
    const nextParam =
      typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search).get("next");

    const result = await signInWithEmail({
      email: emailValue,
      password: passwordValue,
    }); // Attempt auth against API, then fallback local account store.

    if (!result.ok) {
      setStatusMessage(result.message); // Surface auth failure reason.
      setIsSubmitting(false);
      return;
    }

    setStatusMessage("Signed in."); // Confirm successful sign-in.
    const redirectPath = resolvePostAuthRedirectPath(nextParam, "/");
    router.push(redirectPath); // Return to the route the user was on before auth.
    setIsSubmitting(false);
  };

  // Handle forgotten password with a stub response.
  const handleForgotPassword = () => {
    setStatusMessage("Password reset stub: connect email flow."); // Placeholder for reset flow.
  };

  // Handle social login through auth service wiring.
  const handleSocialLogin = async (provider: string) => {
    setIsSubmitting(true); // Lock controls while provider auth is in flight.
    const normalizedProvider =
      provider === "Google"
        ? "google"
        : provider === "X"
          ? "x"
          : "meta";
    const nextParam =
      typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search).get("next");

    const result = await signInWithProvider({ provider: normalizedProvider }); // Attempt provider auth against API with local fallback.
    if (!result.ok) {
      setStatusMessage(result.message); // Surface auth failure reason.
      setIsSubmitting(false);
      return;
    }

    setStatusMessage(`${provider} sign-in complete.`); // Confirm successful provider sign-in.
    const redirectPath = resolvePostAuthRedirectPath(nextParam, "/");
    router.push(redirectPath); // Return users to their last route after social login.
    setIsSubmitting(false);
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
          disabled={isSubmitting}
          onClick={() => handleSocialLogin("Google")} // Trigger Google sign-in.
        >
          Continue with Google
        </button>
        <button
          className={styles.loginForm__socialButton}
          type="button"
          disabled={isSubmitting}
          onClick={() => handleSocialLogin("X")} // Trigger X sign-in.
        >
          Continue with X
        </button>
        <button
          className={styles.loginForm__socialButton}
          type="button"
          disabled={isSubmitting}
          onClick={() => handleSocialLogin("Meta")} // Trigger Meta sign-in.
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
            disabled={isSubmitting}
            onClick={handleForgotPassword} // Trigger reset stub.
          >
            Forgot password?
          </button>
        </div>

        {/* Primary submit button. */}
        <button className={styles.loginForm__submit} type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
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
        <Link
          className={styles.loginForm__switchLink}
          href={switchLinkHref}
          onClick={() => {
            const nextParam =
              typeof window === "undefined"
                ? null
                : new URLSearchParams(window.location.search).get("next");
            writeAuthRedirectPath(nextParam); // Persist target when switching to signup.
          }}
        >
          {switchLinkLabel}
        </Link>
      </div>
    </section>
  );
}
