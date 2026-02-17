export type FeatureFlagKey =
  | "feedSponsoredCards"
  | "nativeShareFallback"
  | "wishlistManageLists";

export type FeatureFlagsState = Record<FeatureFlagKey, boolean>;

export const FEATURE_FLAGS_STORAGE_KEY = "window_shoppr_feature_flags"; // Local override key for safe rollout testing.
export const FEATURE_FLAGS_EVENT = "window_shoppr_feature_flags:update"; // In-tab event for override updates.

const DEFAULT_FEATURE_FLAGS: FeatureFlagsState = {
  feedSponsoredCards: true,
  nativeShareFallback: true,
  wishlistManageLists: true,
}; // Default production-safe behavior.

const FLAG_ALIASES: Record<string, FeatureFlagKey> = {
  feed_sponsored_cards: "feedSponsoredCards",
  feedSponsoredCards: "feedSponsoredCards",
  native_share_fallback: "nativeShareFallback",
  nativeShareFallback: "nativeShareFallback",
  wishlist_manage_lists: "wishlistManageLists",
  wishlistManageLists: "wishlistManageLists",
}; // Support snake_case and camelCase tokens in env/local overrides.

/**
 * Convert common string representations into booleans.
 */
const toBoolean = (rawValue: string) => {
  const value = rawValue.trim().toLowerCase();
  if (["1", "true", "on", "enabled", "yes"].includes(value)) {
    return true;
  }

  if (["0", "false", "off", "disabled", "no"].includes(value)) {
    return false;
  }

  return undefined;
};

/**
 * Parse a compact flags string into a typed partial state object.
 */
const parseFlagsString = (rawValue: string | undefined) => {
  if (!rawValue) {
    return {} as Partial<FeatureFlagsState>;
  }

  return rawValue
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean)
    .reduce<Partial<FeatureFlagsState>>((accumulator, token) => {
      const [rawKey, rawFlagValue = "true"] = token.split("=");
      const normalizedKey = FLAG_ALIASES[rawKey?.trim()];
      const parsedValue = toBoolean(rawFlagValue);

      if (!normalizedKey || parsedValue === undefined) {
        return accumulator; // Ignore unknown keys and malformed values.
      }

      return {
        ...accumulator,
        [normalizedKey]: parsedValue,
      };
    }, {});
};

/**
 * Parse a local-storage override payload into a typed partial state object.
 */
const parseStorageOverrides = (rawValue: string | null) => {
  if (!rawValue) {
    return {} as Partial<FeatureFlagsState>;
  }

  try {
    const parsed = JSON.parse(rawValue) as Record<string, unknown>;
    return Object.entries(parsed).reduce<Partial<FeatureFlagsState>>(
      (accumulator, [rawKey, rawValueEntry]) => {
        const normalizedKey = FLAG_ALIASES[rawKey];
        if (!normalizedKey || typeof rawValueEntry !== "boolean") {
          return accumulator; // Ignore unknown keys and non-boolean values.
        }

        return {
          ...accumulator,
          [normalizedKey]: rawValueEntry,
        };
      },
      {},
    );
  } catch {
    return {} as Partial<FeatureFlagsState>; // Ignore malformed JSON overrides.
  }
};

/**
 * Resolve env-provided flag overrides.
 */
const readEnvOverrides = () =>
  parseFlagsString(process.env.NEXT_PUBLIC_FEATURE_FLAGS); // Parse comma-delimited env flag overrides.

/**
 * Build baseline flags from defaults plus env overrides.
 */
export const getBaseFeatureFlags = (): FeatureFlagsState => ({
  ...DEFAULT_FEATURE_FLAGS,
  ...readEnvOverrides(),
});

/**
 * Read client-side local overrides.
 */
export const getClientFeatureFlagOverrides = (): Partial<FeatureFlagsState> => {
  if (typeof window === "undefined") {
    return {}; // Skip storage access during SSR.
  }

  return parseStorageOverrides(
    window.localStorage.getItem(FEATURE_FLAGS_STORAGE_KEY),
  );
};

/**
 * Resolve final feature flags for the current runtime.
 */
export const getResolvedFeatureFlags = (): FeatureFlagsState => ({
  ...getBaseFeatureFlags(),
  ...getClientFeatureFlagOverrides(),
});

/**
 * Persist local feature-flag overrides for testing safe UI experiments.
 */
export const setFeatureFlagOverrides = (
  overrides: Partial<FeatureFlagsState>,
) => {
  if (typeof window === "undefined") {
    return; // Skip storage writes during SSR.
  }

  window.localStorage.setItem(
    FEATURE_FLAGS_STORAGE_KEY,
    JSON.stringify(overrides),
  ); // Persist local flag overrides.
  window.dispatchEvent(new CustomEvent(FEATURE_FLAGS_EVENT)); // Notify same-tab subscribers.
};

