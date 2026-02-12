"use client";

import Link from "next/link";
import { useState } from "react";
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
  const [statusMessage, setStatusMessage] = useState("");
  const [wantsNewsletter, setWantsNewsletter] = useState(true);

  // Handle signup submission with a stub response.
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent full page reload.
    setStatusMessage(
      wantsNewsletter
        ? "Signup stub: newsletter opt-in captured."
        : "Signup stub: connect auth provider.",
    ); // Placeholder for signup wiring.
  };

  // Handle social signup stubs for future provider wiring.
  const handleSocialLogin = (provider: string) => {
    setStatusMessage(`${provider} signup stub: connect provider.`); // Placeholder for social auth.
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
          onClick={() => handleSocialLogin("Google")} // Trigger Google stub.
        >
          Continue with Google
        </button>
        <button
          className={styles.signupForm__socialButton}
          type="button"
          onClick={() => handleSocialLogin("X")} // Trigger X stub.
        >
          Continue with X
        </button>
        <button
          className={styles.signupForm__socialButton}
          type="button"
          onClick={() => handleSocialLogin("Meta")} // Trigger Meta stub.
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
            required
          />
        </label>

        {/* Newsletter opt-in checkbox. */}
        <label className={styles.signupForm__checkboxRow}>
          <input
            className={styles.signupForm__checkbox}
            type="checkbox"
            checked={wantsNewsletter}
            onChange={(event) => setWantsNewsletter(event.target.checked)} // Toggle newsletter opt-in.
          />
          <span className={styles.signupForm__checkboxLabel}>
            Send me the Window Shoppr newsletter.
          </span>
        </label>

        {/* Primary submit button. */}
        <button className={styles.signupForm__submit} type="submit">
          Create account
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
        <Link className={styles.signupForm__switchLink} href={switchLinkHref}>
          {switchLinkLabel}
        </Link>
      </div>
    </section>
  );
}
