import { requestDataApi } from "@/shared/lib/platform/data-api";
import { consumeRateLimit } from "@/shared/lib/platform/rate-limit";

const EMAIL_CAPTURE_QUEUE_STORAGE_KEY = "windowShopprEmailCaptureQueue"; // Local fallback queue for deferred SQL submission.

type EmailCaptureRecord = {
  id: string;
  email: string;
  submittedAt: string;
  source: "modal";
};

/**
 * Append an email-capture record to the local fallback queue.
 */
const queueEmailCaptureRecord = (record: EmailCaptureRecord) => {
  if (typeof window === "undefined") {
    return; // Skip queue writes during SSR.
  }

  try {
    const raw = window.localStorage.getItem(EMAIL_CAPTURE_QUEUE_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    const existingQueue = Array.isArray(parsed) ? parsed : [];
    const nextQueue = [...existingQueue, record].slice(-300); // Keep a bounded local queue.
    window.localStorage.setItem(
      EMAIL_CAPTURE_QUEUE_STORAGE_KEY,
      JSON.stringify(nextQueue),
    );
  } catch {
    // Ignore storage failures to avoid blocking email capture UX.
  }
};

/**
 * Submit email capture to SQL-backed API with local queue fallback.
 */
export const submitEmailCapture = async (email: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  const rateLimitResult = consumeRateLimit({
    action: "email_capture_write",
    windowMs: 1000 * 60 * 10,
    maxRequests: 4,
    cooldownMs: 1000 * 60 * 5,
    idempotencyKey: normalizedEmail,
  });
  if (!rateLimitResult.ok) {
    return {
      ok: false,
      statusCode: rateLimitResult.statusCode,
      message: rateLimitResult.message,
      retryAfterMs: rateLimitResult.retryAfterMs,
    } as const;
  }

  const record: EmailCaptureRecord = {
    id: `ecs_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    email: normalizedEmail,
    submittedAt: new Date().toISOString(),
    source: "modal",
  }; // Build a stable submission payload for SQL or queue fallback.

  const response = await requestDataApi<{ id?: string }>({
    path: "/data/email-captures",
    method: "POST",
    body: {
      email: normalizedEmail,
      source: record.source,
      submittedAt: record.submittedAt,
    },
  }); // Attempt SQL-backed persistence first.

  if (!response) {
    queueEmailCaptureRecord(record); // Queue locally when API is unavailable.
    return { ok: true, mode: "queued_local" } as const;
  }

  if (!response.ok) {
    return { ok: false, message: response.message } as const;
  }

  return { ok: true, mode: "sql", id: response.data.id ?? record.id } as const;
};
