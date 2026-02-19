export type WindowPointsAction =
  | "product_view"
  | "wishlist_save"
  | "affiliate_click"
  | "deal_submission";

export type WindowPointsState = {
  totalPoints: number;
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: string | null;
  actionCounts: Record<WindowPointsAction, number>;
  awardedKeys: string[];
  updatedAt: string;
};

const WINDOW_POINTS_STORAGE_KEY = "window_shoppr_window_points"; // Local storage key for gamification progress.
const WINDOW_POINTS_EVENT = "window-points:update"; // Broadcast event for cross-component UI refresh.
const MAX_AWARDED_KEYS = 600; // Cap dedupe keys to avoid unbounded local storage growth.
const ACTION_POINT_MAP: Record<WindowPointsAction, number> = {
  product_view: 1,
  wishlist_save: 6,
  affiliate_click: 10,
  deal_submission: 20,
}; // Point values per qualifying action.

/**
 * Create a date key in UTC (`YYYY-MM-DD`) for streak calculations.
 */
const toDayKey = (value: Date = new Date()) => value.toISOString().slice(0, 10);

/**
 * Get yesterday's day key from a UTC day key.
 */
const getPreviousDayKey = (dayKey: string) => {
  const baseDate = new Date(`${dayKey}T00:00:00.000Z`);
  baseDate.setUTCDate(baseDate.getUTCDate() - 1);
  return toDayKey(baseDate);
};

/**
 * Build the default points state.
 */
const createDefaultWindowPointsState = (): WindowPointsState => ({
  totalPoints: 0,
  currentStreak: 0,
  bestStreak: 0,
  lastActiveDate: null,
  actionCounts: {
    product_view: 0,
    wishlist_save: 0,
    affiliate_click: 0,
    deal_submission: 0,
  },
  awardedKeys: [],
  updatedAt: new Date(0).toISOString(),
});

/**
 * Parse a stored points payload safely.
 */
const parseWindowPointsState = (raw: string): WindowPointsState => {
  const defaultState = createDefaultWindowPointsState();

  try {
    const parsed = JSON.parse(raw) as Partial<WindowPointsState>;
    const parsedActionCounts = (parsed.actionCounts ??
      {}) as Partial<Record<WindowPointsAction, unknown>>;
    const awardedKeys = Array.isArray(parsed.awardedKeys)
      ? parsed.awardedKeys.filter((key): key is string => typeof key === "string")
      : [];

    return {
      totalPoints:
        typeof parsed.totalPoints === "number" && parsed.totalPoints > 0
          ? Math.round(parsed.totalPoints)
          : 0,
      currentStreak:
        typeof parsed.currentStreak === "number" && parsed.currentStreak > 0
          ? Math.round(parsed.currentStreak)
          : 0,
      bestStreak:
        typeof parsed.bestStreak === "number" && parsed.bestStreak > 0
          ? Math.round(parsed.bestStreak)
          : 0,
      lastActiveDate:
        typeof parsed.lastActiveDate === "string" && parsed.lastActiveDate
          ? parsed.lastActiveDate
          : null,
      actionCounts: {
        product_view:
          typeof parsedActionCounts.product_view === "number" &&
          parsedActionCounts.product_view > 0
            ? Math.round(parsedActionCounts.product_view)
            : 0,
        wishlist_save:
          typeof parsedActionCounts.wishlist_save === "number" &&
          parsedActionCounts.wishlist_save > 0
            ? Math.round(parsedActionCounts.wishlist_save)
            : 0,
        affiliate_click:
          typeof parsedActionCounts.affiliate_click === "number" &&
          parsedActionCounts.affiliate_click > 0
            ? Math.round(parsedActionCounts.affiliate_click)
            : 0,
        deal_submission:
          typeof parsedActionCounts.deal_submission === "number" &&
          parsedActionCounts.deal_submission > 0
            ? Math.round(parsedActionCounts.deal_submission)
            : 0,
      },
      awardedKeys: awardedKeys.slice(-MAX_AWARDED_KEYS),
      updatedAt:
        typeof parsed.updatedAt === "string" && parsed.updatedAt
          ? parsed.updatedAt
          : defaultState.updatedAt,
    };
  } catch {
    return defaultState;
  }
};

/**
 * Read points + streak state from local storage.
 */
export const readWindowPointsState = (): WindowPointsState => {
  if (typeof window === "undefined") {
    return createDefaultWindowPointsState(); // Return safe defaults during SSR.
  }

  try {
    const raw = window.localStorage.getItem(WINDOW_POINTS_STORAGE_KEY);
    if (!raw) {
      return createDefaultWindowPointsState(); // Start empty when no state exists.
    }

    return parseWindowPointsState(raw);
  } catch {
    return createDefaultWindowPointsState();
  }
};

/**
 * Persist points + streak state and notify listeners.
 */
const writeWindowPointsState = (state: WindowPointsState) => {
  if (typeof window === "undefined") {
    return; // Skip writes during SSR.
  }

  try {
    window.localStorage.setItem(WINDOW_POINTS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage failures to avoid blocking core user flows.
  }

  const dispatchUpdate = () => {
    window.dispatchEvent(new CustomEvent(WINDOW_POINTS_EVENT, { detail: state }));
  }; // Notify listeners after the current call stack to avoid render-phase setState warnings.

  if (typeof window.queueMicrotask === "function") {
    window.queueMicrotask(dispatchUpdate); // Prefer microtask scheduling for minimal UI lag.
    return;
  }

  window.setTimeout(dispatchUpdate, 0); // Fallback for older browsers without queueMicrotask.
};

/**
 * Grant points for a qualifying action and maintain the streak state.
 */
export const awardWindowPoints = ({
  action,
  uniqueKey,
}: {
  action: WindowPointsAction;
  uniqueKey?: string;
}) => {
  const currentState = readWindowPointsState();

  if (uniqueKey && currentState.awardedKeys.includes(uniqueKey)) {
    return currentState; // Skip duplicate awards for the same key.
  }

  const today = toDayKey();
  const yesterday = getPreviousDayKey(today);
  const nextStreak =
    currentState.lastActiveDate === today
      ? currentState.currentStreak
      : currentState.lastActiveDate === yesterday
        ? currentState.currentStreak + 1
        : 1; // Reset streak when users miss at least one day.
  const nextState: WindowPointsState = {
    ...currentState,
    totalPoints: currentState.totalPoints + ACTION_POINT_MAP[action],
    currentStreak: nextStreak,
    bestStreak: Math.max(currentState.bestStreak, nextStreak),
    lastActiveDate: today,
    actionCounts: {
      ...currentState.actionCounts,
      [action]: currentState.actionCounts[action] + 1,
    },
    awardedKeys: uniqueKey
      ? [...currentState.awardedKeys, uniqueKey].slice(-MAX_AWARDED_KEYS)
      : currentState.awardedKeys,
    updatedAt: new Date().toISOString(),
  };

  writeWindowPointsState(nextState);
  return nextState;
};

/**
 * Redemption stub hook for later rewards backend integration.
 */
export const requestPointsRedemption = () => {
  const snapshot = readWindowPointsState();
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("window-points:redeem-request", { detail: snapshot }),
    ); // Stub event for future redemption queue wiring.
  }

  return {
    accepted: false,
    message: "Redemption is coming soon.",
  };
};

/**
 * Build a daily dedupe key for actions that should only score once per day.
 */
export const buildDailyWindowPointsKey = (prefix: string) =>
  `${prefix}:${toDayKey()}`;
