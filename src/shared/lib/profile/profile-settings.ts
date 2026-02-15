import { CATEGORY_LABELS, toCategorySlug } from "@/shared/lib/catalog/categories";

export type ThemePreference = "system" | "light" | "dark";

export type FeedSpeedPreferences = {
  cozyScale: number;
  quickScale: number;
};

export type EmailFrequency = "weekly" | "twice-weekly" | "daily";

export type ContentPreferencesState = {
  preferredCategorySlugs: string[];
  emailFrequency: EmailFrequency;
  recommendationListName: string | null;
};

export type ProfileSettingsState = {
  displayName: string;
  marketingEmails: boolean;
  loginAlerts: boolean;
  requireTwoFactor: boolean;
};

export type StoredProfileSettings = {
  settings: ProfileSettingsState;
  themePreference: ThemePreference;
  speedPreferences: FeedSpeedPreferences;
  contentPreferences: ContentPreferencesState;
};

export const PROFILE_SETTINGS_STORAGE_KEY = "window-shoppr-profile-settings";

export const DEFAULT_SETTINGS: ProfileSettingsState = {
  displayName: "",
  marketingEmails: true,
  loginAlerts: true,
  requireTwoFactor: false,
};

export const DEFAULT_CONTENT_PREFERENCES: ContentPreferencesState = {
  preferredCategorySlugs: [],
  emailFrequency: "weekly",
  recommendationListName: null,
};

export const SPEED_LIMITS = {
  cozyMin: 0.7,
  cozyMax: 1.4,
  quickMin: 0.35,
  quickMax: 1.2,
  minGap: 0.05,
} as const;

export const DEFAULT_SPEED_PREFERENCES: FeedSpeedPreferences = {
  cozyScale: 1,
  quickScale: 0.52,
};

const AVAILABLE_CATEGORY_SLUGS = new Set(
  CATEGORY_LABELS.map((label) => toCategorySlug(label)),
);

/**
 * Clamp numeric values to an allowed speed range.
 */
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * Normalize persisted speed preferences and enforce quick < cozy.
 */
const normalizeSpeedPreferences = (rawValue: unknown): FeedSpeedPreferences => {
  const candidate =
    typeof rawValue === "object" && rawValue !== null
      ? (rawValue as Partial<FeedSpeedPreferences>)
      : undefined;

  const cozyScale = clamp(
    typeof candidate?.cozyScale === "number"
      ? candidate.cozyScale
      : DEFAULT_SPEED_PREFERENCES.cozyScale,
    SPEED_LIMITS.cozyMin,
    SPEED_LIMITS.cozyMax,
  );

  const maxQuick = Math.min(SPEED_LIMITS.quickMax, cozyScale - SPEED_LIMITS.minGap);
  const quickUpperBound = Math.max(SPEED_LIMITS.quickMin, maxQuick);

  const quickScale = clamp(
    typeof candidate?.quickScale === "number"
      ? candidate.quickScale
      : DEFAULT_SPEED_PREFERENCES.quickScale,
    SPEED_LIMITS.quickMin,
    quickUpperBound,
  );

  return {
    cozyScale,
    quickScale,
  };
};

/**
 * Normalize persisted content preferences to current category config.
 */
const normalizeContentPreferences = (rawValue: unknown): ContentPreferencesState => {
  const candidate =
    typeof rawValue === "object" && rawValue !== null
      ? (rawValue as Partial<ContentPreferencesState>)
      : undefined;

  const rawSlugs = Array.isArray(candidate?.preferredCategorySlugs)
    ? candidate.preferredCategorySlugs.filter(
        (value): value is string => typeof value === "string",
      )
    : DEFAULT_CONTENT_PREFERENCES.preferredCategorySlugs;

  const preferredCategorySlugs = Array.from(new Set(rawSlugs)).filter((slug) =>
    AVAILABLE_CATEGORY_SLUGS.has(slug),
  );

  const emailFrequency: EmailFrequency =
    candidate?.emailFrequency === "weekly" ||
    candidate?.emailFrequency === "twice-weekly" ||
    candidate?.emailFrequency === "daily"
      ? candidate.emailFrequency
      : DEFAULT_CONTENT_PREFERENCES.emailFrequency;

  return {
    preferredCategorySlugs,
    emailFrequency,
    recommendationListName:
      typeof candidate?.recommendationListName === "string"
        ? candidate.recommendationListName
        : DEFAULT_CONTENT_PREFERENCES.recommendationListName,
  };
};

/**
 * Parse a local-storage payload into normalized profile settings.
 */
export const parseStoredProfileSettings = (
  rawValue: string | null,
): StoredProfileSettings | null => {
  if (!rawValue) {
    return null; // Skip parsing when no saved settings exist.
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<StoredProfileSettings>;

    if (!parsed.settings) {
      return null; // Guard against malformed payloads.
    }

    const themePreference =
      parsed.themePreference === "light" ||
      parsed.themePreference === "dark" ||
      parsed.themePreference === "system"
        ? parsed.themePreference
        : "system";

    return {
      settings: {
        displayName:
          typeof parsed.settings.displayName === "string"
            ? parsed.settings.displayName
            : DEFAULT_SETTINGS.displayName,
        marketingEmails:
          typeof parsed.settings.marketingEmails === "boolean"
            ? parsed.settings.marketingEmails
            : DEFAULT_SETTINGS.marketingEmails,
        loginAlerts:
          typeof parsed.settings.loginAlerts === "boolean"
            ? parsed.settings.loginAlerts
            : DEFAULT_SETTINGS.loginAlerts,
        requireTwoFactor:
          typeof parsed.settings.requireTwoFactor === "boolean"
            ? parsed.settings.requireTwoFactor
            : DEFAULT_SETTINGS.requireTwoFactor,
      },
      themePreference,
      speedPreferences: normalizeSpeedPreferences(parsed.speedPreferences),
      contentPreferences: normalizeContentPreferences(parsed.contentPreferences),
    };
  } catch {
    return null; // Ignore invalid JSON and fall back to defaults.
  }
};

/**
 * Read and parse profile settings from local storage on the client.
 */
export const readStoredProfileSettings = (): StoredProfileSettings | null => {
  if (typeof window === "undefined") {
    return null; // Skip local storage access during SSR.
  }

  return parseStoredProfileSettings(
    window.localStorage.getItem(PROFILE_SETTINGS_STORAGE_KEY),
  ); // Read and validate persisted profile settings.
};
