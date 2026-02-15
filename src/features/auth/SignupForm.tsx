"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithProvider,
  signUpWithEmail,
} from "@/shared/lib/platform/auth-service";
import {
  resolvePostAuthRedirectPath,
  writeAuthRedirectPath,
} from "@/shared/lib/platform/auth-redirect";
import styles from "@/features/auth/SignupForm.module.css";

/**
 * Signup form UI with newsletter opt-in and auth stubs.
 */
export default function SignupForm({
  title = "Create your account",
  subtitle = "Build a cozy profile to personalize your window shopping.",
  switchLabel = "Already have an account?",
  switchLinkLabel = "Sign in",
  switchLinkHref = "/login",
}: {
  title?: string;
  subtitle?: string;
  switchLabel?: string;
  switchLinkLabel?: string;
  switchLinkHref?: string;
}) {
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState("");
  const [wantsNewsletter, setWantsNewsletter] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle signup submission through auth service wiring (API when configured, local fallback otherwise).
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent full page reload.
    setIsSubmitting(true); // Lock controls while auth request is in flight.
    const formData = new FormData(event.currentTarget);
    const nameValue = `${formData.get("name") ?? ""}`.trim();
    const emailValue = `${formData.get("email") ?? ""}`.trim();
    const passwordValue = `${formData.get("password") ?? ""}`;
    const confirmPasswordValue = `${formData.get("confirm-password") ?? ""}`;
    const nextParam =
      typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search).get("next");

    if (passwordValue !== confirmPasswordValue) {
      setStatusMessage("Passwords do not match."); // Guard against mismatched credentials.
      setIsSubmitting(false);
      return;
    }

    const result = await signUpWithEmail({
      email: emailValue,
      password: passwordValue,
      displayName: nameValue || undefined,
      marketingEmails: wantsNewsletter,
    }); // Attempt account creation against API, then fallback local account store.
    if (!result.ok) {
      setStatusMessage(result.message); // Surface auth failure reason.
      setIsSubmitting(false);
      return;
    }

    setStatusMessage(
      wantsNewsletter ? "Account created + newsletter opt-in saved." : "Account created.",
    ); // Confirm successful signup.
    const redirectPath = resolvePostAuthRedirectPath(nextParam, "/");
    router.push(redirectPath); // Return to the route the user was on before auth.
    setIsSubmitting(false);
  };

  // Handle social signup through auth service wiring.
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

    setStatusMessage(`${provider} signup complete.`); // Confirm successful provider signup.
    const redirectPath = resolvePostAuthRedirectPath(nextParam, "/");
    router.push(redirectPath); // Return users to their last route after social signup.
    setIsSubmitting(false);
  };

  return (
    <section className={styles.signupForm} aria-labelledby="signup-title">
      {/* Header block with title and helper copy. */}
      <header className={styles.signupForm__header}>
        <h1 id="signup-title" className={styles.signupForm__title}>
          {title}
        </h1>
        <p className={styles.signupForm__subtitle}>{subtitle}</p>
      </header>

      {/* Social signup placeholder actions. */}
      <div className={styles.signupForm__socialRow}>
        <button
          className={styles.signupForm__socialButton}
          type="button"
          disabled={isSubmitting}
          onClick={() => handleSocialLogin("Google")} // Trigger Google signup.
        >
          Continue with Google
        </button>
        <button
          className={styles.signupForm__socialButton}
          type="button"
          disabled={isSubmitting}
          onClick={() => handleSocialLogin("X")} // Trigger X signup.
        >
          Continue with X
        </button>
        <button
          className={styles.signupForm__socialButton}
          type="button"
          disabled={isSubmitting}
          onClick={() => handleSocialLogin("Meta")} // Trigger Meta signup.
        >
          Continue with Meta
        </button>
      </div>

      {/* Divider between social signup and form inputs. */}
      <div className={styles.signupForm__divider} aria-hidden="true">
        <span className={styles.signupForm__dividerLine} />
        <span className={styles.signupForm__dividerText}>or</span>
        <span className={styles.signupForm__dividerLine} />
      </div>

      {/* Main signup form inputs. */}
      <form className={styles.signupForm__form} onSubmit={handleSubmit}>
        {/* Name field input. */}
        <label className={styles.signupForm__field}>
          <span className={styles.signupForm__label}>Name</span>
          <input
            className={styles.signupForm__input}
            type="text"
            name="name"
            placeholder="Your name"
            autoComplete="name"
            disabled={isSubmitting}
          />
        </label>

        {/* Email field input. */}
        <label className={styles.signupForm__field}>
          <span className={styles.signupForm__label}>Email</span>
          <input
            className={styles.signupForm__input}
            type="email"
            name="email"
            placeholder="you@example.com"
            autoComplete="email"
            disabled={isSubmitting}
            required
          />
        </label>

        {/* Password field input. */}
        <label className={styles.signupForm__field}>
          <span className={styles.signupForm__label}>Password</span>
          <input
            className={styles.signupForm__input}
            type="password"
            name="password"
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={isSubmitting}
            required
          />
        </label>

        {/* Confirm password field input. */}
        <label className={styles.signupForm__field}>
          <span className={styles.signupForm__label}>Confirm password</span>
          <input
            className={styles.signupForm__input}
            type="password"
            name="confirm-password"
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={isSubmitting}
            required
          />
        </label>

        {/* Newsletter opt-in checkbox. */}
        <label className={styles.signupForm__checkboxRow}>
          <input
            className={styles.signupForm__checkbox}
            type="checkbox"
            checked={wantsNewsletter}
            disabled={isSubmitting}
            onChange={(event) => setWantsNewsletter(event.target.checked)} // Toggle newsletter opt-in.
          />
          <span className={styles.signupForm__checkboxLabel}>
            Send me the Window Shoppr newsletter.
          </span>
        </label>

        {/* Primary submit button. */}
        <button className={styles.signupForm__submit} type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create account"}
        </button>
      </form>

      {/* Status message for stubbed actions. */}
      {statusMessage ? (
        <p className={styles.signupForm__status} role="status">
          {statusMessage}
        </p>
      ) : null}

      {/* Switch back to login flow. */}
      <div className={styles.signupForm__switchRow}>
        <span className={styles.signupForm__switchText}>{switchLabel}</span>
        <Link
          className={styles.signupForm__switchLink}
          href={switchLinkHref}
          onClick={() => {
            const nextParam =
              typeof window === "undefined"
                ? null
                : new URLSearchParams(window.location.search).get("next");
            writeAuthRedirectPath(nextParam); // Persist target when switching back to login.
          }}
        >
          {switchLinkLabel}
        </Link>
      </div>
    </section>
  );
}
