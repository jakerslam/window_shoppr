"use client";
import { useEffect, useRef, useState } from "react";
import { ContentPreferencesState, DEFAULT_CONTENT_PREFERENCES, DEFAULT_SETTINGS, DEFAULT_SPEED_PREFERENCES, EmailFrequency, FeedSpeedPreferences, PROFILE_SETTINGS_STORAGE_KEY, ProfileSettingsState, SPEED_LIMITS, ThemePreference, readStoredProfileSettings } from "@/shared/lib/profile/profile-settings";
/**
 * Clamp numeric values to allowed settings ranges.
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
 * Profile settings sources persisted via local storage.
 */
export default function useProfileSettingsStorage({ listNames }: { listNames: string[] }) {
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
  const [contentPreferences, setContentPreferences] = useState<ContentPreferencesState>(
    () =>
      readStoredProfileSettings()?.contentPreferences ?? DEFAULT_CONTENT_PREFERENCES,
  ); // Initialize content preferences from local storage once.

  /**
   * Clear the selected recommendation list if it no longer exists.
   */
  useEffect(() => {
    if (!contentPreferences.recommendationListName) {
      return undefined; // Skip validation when no list is selected.
    }

    if (listNames.includes(contentPreferences.recommendationListName)) {
      return undefined; // Keep selection when the list still exists.
    }

    if (typeof window === "undefined") {
      return undefined; // Skip deferred state updates during SSR.
    }

    const timeoutId = window.setTimeout(() => {
      setContentPreferences((prev) => ({
        ...prev,
        recommendationListName: null,
      })); // Reset missing list preference to avoid stale personalization.
    }, 0); // Defer to avoid render-phase lint warnings.

    return () => {
      window.clearTimeout(timeoutId); // Clean up deferred reset when list names change quickly.
    };
  }, [contentPreferences.recommendationListName, listNames]);

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
   * Update display name preference.
   */
  const handleDisplayNameChange = (nextValue: string) => {
    setSettings((prev) => ({ ...prev, displayName: nextValue })); // Persist display name in local state.
  };

  /**
   * Toggle marketing email preference.
   */
  const handleMarketingEmailsToggle = (enabled: boolean) => {
    setSettings((prev) => ({ ...prev, marketingEmails: enabled })); // Persist marketing email flag.
  };

  /**
   * Toggle sign-in alert preference.
   */
  const handleLoginAlertsToggle = (enabled: boolean) => {
    setSettings((prev) => ({ ...prev, loginAlerts: enabled })); // Persist sign-in alert flag.
  };

  /**
   * Toggle two-factor auth stub preference.
   */
  const handleTwoFactorToggle = (enabled: boolean) => {
    setSettings((prev) => ({ ...prev, requireTwoFactor: enabled })); // Persist 2FA stub flag.
  };

  /**
   * Update cozy speed while preserving the minimum gap above quick speed.
   */
  const handleCozySpeedChange = (nextValue: number) => {
    setSpeedPreferences((prev) => {
      const cozyScale = clamp(nextValue, SPEED_LIMITS.cozyMin, SPEED_LIMITS.cozyMax);
      const maxQuick = Math.min(SPEED_LIMITS.quickMax, cozyScale - SPEED_LIMITS.minGap);
      const quickScale = clamp(
        prev.quickScale,
        SPEED_LIMITS.quickMin,
        Math.max(SPEED_LIMITS.quickMin, maxQuick),
      );

      return { cozyScale, quickScale };
    });
  };

  /**
   * Update quick speed while preserving the minimum gap below cozy speed.
   */
  const handleQuickSpeedChange = (nextValue: number) => {
    setSpeedPreferences((prev) => {
      const quickScale = clamp(nextValue, SPEED_LIMITS.quickMin, SPEED_LIMITS.quickMax);
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
   * Choose a wishlist list to bias feed recommendations.
   */
  const handleRecommendationListChange = (nextValue: string) => {
    setContentPreferences((prev) => ({
      ...prev,
      recommendationListName: nextValue ? nextValue : null,
    })); // Persist list selection (or clear when "None" is chosen).
  };

  /**
   * Update marketing email frequency preference.
   */
  const handleEmailFrequencyChange = (nextFrequency: EmailFrequency) => {
    setContentPreferences((prev) => ({ ...prev, emailFrequency: nextFrequency })); // Persist email cadence preference.
  };

  /**
   * Override preferred category slugs (used by the onboarding taste quiz).
   */
  const setPreferredCategorySlugs = (nextCategorySlugs: string[]) => {
    setContentPreferences((prev) => ({ ...prev, preferredCategorySlugs: nextCategorySlugs })); // Persist category taste selections.
  };

  /**
   * Reset content preferences to their defaults (privacy clear action).
   */
  const resetContentPreferences = () => {
    setContentPreferences(DEFAULT_CONTENT_PREFERENCES); // Restore defaults for content preferences.
  };

  return {
    settings,
    themePreference,
    speedPreferences,
    contentPreferences,
    setThemePreference,
    handleDisplayNameChange,
    handleMarketingEmailsToggle,
    handleLoginAlertsToggle,
    handleTwoFactorToggle,
    handleCozySpeedChange,
    handleQuickSpeedChange,
    handleCategoryToggle,
    handleRecommendationListChange,
    handleEmailFrequencyChange,
    setPreferredCategorySlugs,
    resetContentPreferences,
  };
}
