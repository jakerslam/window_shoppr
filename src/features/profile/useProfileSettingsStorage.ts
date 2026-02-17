"use client";
import { useEffect, useRef, useState } from "react";
import { ContentPreferencesState, DEFAULT_CONTENT_PREFERENCES, DEFAULT_SETTINGS, DEFAULT_SPEED_PREFERENCES, EmailFrequency, FeedSpeedPreferences, PROFILE_SETTINGS_STORAGE_KEY, ProfileSettingsState, SPEED_LIMITS, SPEED_PREFERENCES_VERSION, ThemePreference, readStoredProfileSettings } from "@/shared/lib/profile/profile-settings";
import { updateAccountProfile } from "@/shared/lib/platform/auth-service";
import { readAuthSession } from "@/shared/lib/platform/auth-session";
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
    return;
  }
  if (themePreference === "system") {
    delete document.documentElement.dataset.theme;
    return;
  }
  document.documentElement.dataset.theme = themePreference;
};

/**
 * Profile settings sources persisted via local storage.
 */
export default function useProfileSettingsStorage({ listNames }: { listNames: string[] }) {
  const hasMountedRef = useRef(false);
  const accountSyncTimeoutRef = useRef<number | null>(null);
  const [settings, setSettings] = useState<ProfileSettingsState>(
    () => readStoredProfileSettings()?.settings ?? DEFAULT_SETTINGS,
  );
  const [themePreference, setThemePreference] = useState<ThemePreference>(
    () => readStoredProfileSettings()?.themePreference ?? "system",
  );
  const [speedPreferences, setSpeedPreferences] = useState<FeedSpeedPreferences>(
    () => readStoredProfileSettings()?.speedPreferences ?? DEFAULT_SPEED_PREFERENCES,
  );
  const [contentPreferences, setContentPreferences] = useState<ContentPreferencesState>(
    () =>
      readStoredProfileSettings()?.contentPreferences ?? DEFAULT_CONTENT_PREFERENCES,
  );

  /**
   * Hydrate account fields from the active auth session when values are available.
   */
  useEffect(() => {
    const session = readAuthSession();
    if (!session) {
      return undefined;
    }

    if (typeof window === "undefined") {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setSettings((prev) => ({
        ...prev,
        displayName: prev.displayName || session.displayName || prev.displayName,
        marketingEmails:
          typeof session.marketingEmails === "boolean"
            ? session.marketingEmails
            : prev.marketingEmails,
      }));
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  /**
   * Clear the selected recommendation list if it no longer exists.
   */
  useEffect(() => {
    if (!contentPreferences.recommendationListName) {
      return undefined;
    }

    if (listNames.includes(contentPreferences.recommendationListName)) {
      return undefined;
    }

    if (typeof window === "undefined") {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setContentPreferences((prev) => ({
        ...prev,
        recommendationListName: null,
      }));
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [contentPreferences.recommendationListName, listNames]);

  /**
   * Persist settings and theme whenever values change after first render.
   */
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      applyThemePreference(themePreference);
      return;
    }

    window.localStorage.setItem(
      PROFILE_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        settings,
        themePreference,
        speedPreferences,
        speedPreferencesVersion: SPEED_PREFERENCES_VERSION,
        contentPreferences,
      }),
    );
    applyThemePreference(themePreference);
  }, [settings, themePreference, speedPreferences, contentPreferences]);

  /**
   * Sync account profile fields to auth service when signed in.
   */
  useEffect(() => {
    const session = readAuthSession();
    if (!session) {
      return undefined;
    }

    accountSyncTimeoutRef.current = window.setTimeout(() => {
      void updateAccountProfile({
        displayName: settings.displayName,
        marketingEmails: settings.marketingEmails,
      });
    }, 300);

    return () => {
      if (accountSyncTimeoutRef.current) {
        window.clearTimeout(accountSyncTimeoutRef.current);
        accountSyncTimeoutRef.current = null;
      }
    };
  }, [settings.displayName, settings.marketingEmails]);

  /**
   * Update display name preference.
   */
  const handleDisplayNameChange = (nextValue: string) => {
    setSettings((prev) => ({ ...prev, displayName: nextValue }));
  };

  /**
   * Toggle marketing email preference.
   */
  const handleMarketingEmailsToggle = (enabled: boolean) => {
    setSettings((prev) => ({ ...prev, marketingEmails: enabled }));
  };

  /**
   * Toggle sign-in alert preference.
   */
  const handleLoginAlertsToggle = (enabled: boolean) => {
    setSettings((prev) => ({ ...prev, loginAlerts: enabled }));
  };

  /**
   * Toggle two-factor auth stub preference.
   */
  const handleTwoFactorToggle = (enabled: boolean) => {
    setSettings((prev) => ({ ...prev, requireTwoFactor: enabled }));
  };

  /**
   * Update cozy speed while preserving the minimum gap below quick speed.
   */
  const handleCozySpeedChange = (nextValue: number) => {
    setSpeedPreferences((prev) => {
      const cozyScale = clamp(nextValue, SPEED_LIMITS.cozyMin, SPEED_LIMITS.cozyMax);
      const minQuick = Math.max(SPEED_LIMITS.quickMin, cozyScale + SPEED_LIMITS.minGap);
      const quickScale = clamp(
        prev.quickScale,
        Math.min(SPEED_LIMITS.quickMax, minQuick),
        SPEED_LIMITS.quickMax,
      );

      return { cozyScale, quickScale };
    });
  };

  /**
   * Update quick speed while preserving the minimum gap above cozy speed.
   */
  const handleQuickSpeedChange = (nextValue: number) => {
    setSpeedPreferences((prev) => {
      const quickScale = clamp(nextValue, SPEED_LIMITS.quickMin, SPEED_LIMITS.quickMax);
      const minQuick = Math.max(SPEED_LIMITS.quickMin, prev.cozyScale + SPEED_LIMITS.minGap);

      return {
        cozyScale: prev.cozyScale,
        quickScale: clamp(quickScale, Math.min(SPEED_LIMITS.quickMax, minQuick), SPEED_LIMITS.quickMax),
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
    }));
  };

  /**
   * Update marketing email frequency preference.
   */
  const handleEmailFrequencyChange = (nextFrequency: EmailFrequency) => {
    setContentPreferences((prev) => ({ ...prev, emailFrequency: nextFrequency }));
  };

  /**
   * Override preferred category slugs (used by the onboarding taste quiz).
   */
  const setPreferredCategorySlugs = (nextCategorySlugs: string[]) => {
    setContentPreferences((prev) => ({ ...prev, preferredCategorySlugs: nextCategorySlugs }));
  };

  /**
   * Reset content preferences to their defaults (privacy clear action).
   */
  const resetContentPreferences = () => {
    setContentPreferences(DEFAULT_CONTENT_PREFERENCES);
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
