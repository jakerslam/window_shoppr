"use client";

import { useEffect, useRef, useState } from "react";
import { CATEGORY_LABELS, toCategorySlug } from "@/shared/lib/categories";
import styles from "@/features/profile/ProfileSettings.module.css";
import {
  DEFAULT_CONTENT_PREFERENCES,
  DEFAULT_SETTINGS,
  DEFAULT_SPEED_PREFERENCES,
  PROFILE_SETTINGS_STORAGE_KEY,
  SPEED_LIMITS,
  ContentPreferencesState,
  EmailFrequency,
  FeedSpeedPreferences,
  ProfileSettingsState,
  ThemePreference,
  readStoredProfileSettings,
} from "@/shared/lib/profile-settings";

const CONTENT_CATEGORY_OPTIONS = CATEGORY_LABELS.map((label) => ({
  label,
  slug: toCategorySlug(label),
}));

/**
 * Clamp numeric speed values to allowed settings ranges.
 */
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * Apply selected theme preference to the document root.
 */
const applyThemePreference = (themePreference: ThemePreference) => {
  if (typeof document === "undefined") {
    return; // Skip theme updates during SSR.
  }

  if (themePreference === "system") {
    delete document.documentElement.dataset.theme; // Revert to system theme when selected.
    return;
  }

  document.documentElement.dataset.theme = themePreference; // Force explicit light or dark theme.
};

/**
 * Profile settings panel for account, content, security, and theme preferences.
 */
export default function ProfileSettings() {
  const hasMountedRef = useRef(false);
  const [settings, setSettings] = useState<ProfileSettingsState>(
    () => readStoredProfileSettings()?.settings ?? DEFAULT_SETTINGS,
  ); // Initialize account/security settings from local storage once.
  const [themePreference, setThemePreference] = useState<ThemePreference>(
    () => readStoredProfileSettings()?.themePreference ?? "system",
  ); // Initialize theme preference from local storage once.
  const [speedPreferences, setSpeedPreferences] = useState<FeedSpeedPreferences>(
    () => readStoredProfileSettings()?.speedPreferences ?? DEFAULT_SPEED_PREFERENCES,
  ); // Initialize feed speed preferences from local storage once.
  const [contentPreferences, setContentPreferences] =
    useState<ContentPreferencesState>(
      () =>
        readStoredProfileSettings()?.contentPreferences ??
        DEFAULT_CONTENT_PREFERENCES,
    ); // Initialize content preferences from local storage once.

  /**
   * Persist settings and theme whenever values change after first render.
   */
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true; // Skip first write and only apply theme.
      applyThemePreference(themePreference); // Apply initial theme immediately.
      return;
    }

    window.localStorage.setItem(
      PROFILE_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        settings,
        themePreference,
        speedPreferences,
        contentPreferences,
      }),
    ); // Persist latest profile + speed + content preferences.
    applyThemePreference(themePreference); // Keep theme synced with selected preference.
  }, [settings, themePreference, speedPreferences, contentPreferences]);

  /**
   * Update cozy speed while preserving the minimum gap above quick speed.
   */
  const handleCozySpeedChange = (nextValue: number) => {
    setSpeedPreferences((prev) => {
      const cozyScale = clamp(
        nextValue,
        SPEED_LIMITS.cozyMin,
        SPEED_LIMITS.cozyMax,
      );
      const maxQuick = Math.min(
        SPEED_LIMITS.quickMax,
        cozyScale - SPEED_LIMITS.minGap,
      );
      const quickScale = clamp(
        prev.quickScale,
        SPEED_LIMITS.quickMin,
        Math.max(SPEED_LIMITS.quickMin, maxQuick),
      );

      return {
        cozyScale,
        quickScale,
      };
    });
  };

  /**
   * Update quick speed while preserving the minimum gap below cozy speed.
   */
  const handleQuickSpeedChange = (nextValue: number) => {
    setSpeedPreferences((prev) => {
      const quickScale = clamp(
        nextValue,
        SPEED_LIMITS.quickMin,
        SPEED_LIMITS.quickMax,
      );
      const maxQuick = Math.min(quickScale, prev.cozyScale - SPEED_LIMITS.minGap);

      return {
        cozyScale: prev.cozyScale,
        quickScale: clamp(maxQuick, SPEED_LIMITS.quickMin, SPEED_LIMITS.quickMax),
      };
    });
  };

  /**
   * Toggle a preferred category chip for content personalization.
   */
  const handleCategoryToggle = (categorySlug: string) => {
    setContentPreferences((prev) => {
      const hasCategory = prev.preferredCategorySlugs.includes(categorySlug);

      return {
        ...prev,
        preferredCategorySlugs: hasCategory
          ? prev.preferredCategorySlugs.filter((slug) => slug !== categorySlug)
          : [...prev.preferredCategorySlugs, categorySlug],
      };
    });
  };

  /**
   * Update marketing email frequency preference.
   */
  const handleEmailFrequencyChange = (nextFrequency: EmailFrequency) => {
    setContentPreferences((prev) => ({
      ...prev,
      emailFrequency: nextFrequency,
    }));
  };

  return (
    <section
      className={styles.profileSettings}
      aria-labelledby="profile-settings-title"
    >
      {/* Panel heading and helper text. */}
      <header className={styles.profileSettings__header}>
        <h2 id="profile-settings-title" className={styles.profileSettings__title}>
          Profile Settings
        </h2>
        <p className={styles.profileSettings__subtitle}>
          Account + security preferences are saved on this device.
        </p>
      </header>

      {/* Account preferences section. */}
      <div className={styles.profileSettings__section}>
        <h3 className={styles.profileSettings__sectionTitle}>Account</h3>

        <label className={styles.profileSettings__field}>
          <span className={styles.profileSettings__label}>Display name</span>
          <input
            className={styles.profileSettings__input}
            type="text"
            value={settings.displayName}
            onChange={(event) =>
              setSettings((prev) => ({ ...prev, displayName: event.target.value }))
            } // Update display name preference.
            placeholder="How your profile should appear"
          />
        </label>

        <label className={styles.profileSettings__toggleRow}>
          <input
            className={styles.profileSettings__checkbox}
            type="checkbox"
            checked={settings.marketingEmails}
            onChange={(event) =>
              setSettings((prev) => ({
                ...prev,
                marketingEmails: event.target.checked,
              }))
            } // Toggle marketing email preference.
          />
          <span>Receive weekly deal emails</span>
        </label>

        {/* Feed speed settings consumed by the home speed toggle. */}
        <div className={styles.profileSettings__speedGrid}>
          <label className={styles.profileSettings__field}>
            <span className={styles.profileSettings__label}>Cozy speed (slow mode)</span>
            <input
              className={styles.profileSettings__input}
              type="number"
              min={SPEED_LIMITS.cozyMin}
              max={SPEED_LIMITS.cozyMax}
              step="0.01"
              value={speedPreferences.cozyScale.toFixed(2)}
              onChange={(event) =>
                handleCozySpeedChange(Number.parseFloat(event.target.value || "0"))
              } // Update cozy speed multiplier.
            />
          </label>

          <label className={styles.profileSettings__field}>
            <span className={styles.profileSettings__label}>Quick speed (fast mode)</span>
            <input
              className={styles.profileSettings__input}
              type="number"
              min={SPEED_LIMITS.quickMin}
              max={SPEED_LIMITS.quickMax}
              step="0.01"
              value={speedPreferences.quickScale.toFixed(2)}
              onChange={(event) =>
                handleQuickSpeedChange(Number.parseFloat(event.target.value || "0"))
              } // Update quick speed multiplier.
            />
          </label>
        </div>

        <p className={styles.profileSettings__hint}>
          Lower numbers scroll faster. Quick stays faster than cozy.
        </p>
      </div>

      {/* Content preferences section for category taste and cadence. */}
      <div className={styles.profileSettings__section}>
        <h3 className={styles.profileSettings__sectionTitle}>Content</h3>

        <div className={styles.profileSettings__chipGrid}>
          {CONTENT_CATEGORY_OPTIONS.map((option) => {
            const isSelected = contentPreferences.preferredCategorySlugs.includes(
              option.slug,
            );

            return (
              <button
                key={option.slug}
                className={`${styles.profileSettings__chip} ${
                  isSelected ? styles["profileSettings__chip--active"] : ""
                }`}
                type="button"
                onClick={() => handleCategoryToggle(option.slug)} // Toggle category taste preference.
                aria-pressed={isSelected}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <label className={styles.profileSettings__field}>
          <span className={styles.profileSettings__label}>Email frequency</span>
          <select
            className={styles.profileSettings__select}
            value={contentPreferences.emailFrequency}
            onChange={(event) =>
              handleEmailFrequencyChange(event.target.value as EmailFrequency)
            } // Update content email frequency preference.
          >
            <option value="weekly">Weekly</option>
            <option value="twice-weekly">Twice Weekly</option>
            <option value="daily">Daily</option>
          </select>
        </label>
      </div>

      {/* Security preferences section. */}
      <div className={styles.profileSettings__section}>
        <h3 className={styles.profileSettings__sectionTitle}>Security</h3>

        <label className={styles.profileSettings__toggleRow}>
          <input
            className={styles.profileSettings__checkbox}
            type="checkbox"
            checked={settings.loginAlerts}
            onChange={(event) =>
              setSettings((prev) => ({ ...prev, loginAlerts: event.target.checked }))
            } // Toggle sign-in alert preference.
          />
          <span>Notify me about new sign-ins</span>
        </label>

        <label className={styles.profileSettings__toggleRow}>
          <input
            className={styles.profileSettings__checkbox}
            type="checkbox"
            checked={settings.requireTwoFactor}
            onChange={(event) =>
              setSettings((prev) => ({
                ...prev,
                requireTwoFactor: event.target.checked,
              }))
            } // Toggle 2FA preference stub.
          />
          <span>Require two-factor verification (stub)</span>
        </label>
      </div>

      {/* Theme preference section. */}
      <div className={styles.profileSettings__section}>
        <h3 className={styles.profileSettings__sectionTitle}>Appearance</h3>

        <div
          className={styles.profileSettings__themeRow}
          role="group"
          aria-label="Theme preference"
        >
          {(["system", "light", "dark"] as ThemePreference[]).map((option) => (
            <button
              key={option}
              className={`${styles.profileSettings__themeButton} ${
                themePreference === option
                  ? styles["profileSettings__themeButton--active"]
                  : ""
              }`}
              type="button"
              onClick={() => setThemePreference(option)} // Set theme preference and persist.
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Autosave helper note. */}
      <p className={styles.profileSettings__status} role="status">
        Saved automatically
      </p>
    </section>
  );
}
