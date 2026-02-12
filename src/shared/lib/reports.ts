export type ReportPayload = {
  productId: string;
  productSlug: string;
  reason: "inaccuracy" | "inappropriate" | "spam" | "other";
  details?: string;
  timestamp: string;
};

const REPORT_STORAGE_KEY = "window_shoppr_reports"; // Local storage key for reports.

/**
 * Persist a user report locally and broadcast for agent handling.
 */
export const submitReport = (payload: Omit<ReportPayload, "timestamp">) => {
  if (typeof window === "undefined") {
    return; // Skip storage access during SSR.
  }

  const report: ReportPayload = {
    ...payload,
    timestamp: new Date().toISOString(),
  };

  try {
    const raw = window.localStorage.getItem(REPORT_STORAGE_KEY) ?? "[]";
    const parsed = JSON.parse(raw) as ReportPayload[];
    const history = Array.isArray(parsed) ? parsed : [];
    window.localStorage.setItem(
      REPORT_STORAGE_KEY,
      JSON.stringify([...history, report].slice(-200)),
    );
  } catch {
    // Ignore storage errors to avoid blocking UI.
  }

  window.dispatchEvent(new CustomEvent("report:submit", { detail: report }));
};
