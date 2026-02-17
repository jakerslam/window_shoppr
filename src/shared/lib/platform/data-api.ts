import { PUBLIC_ENV } from "@/shared/lib/platform/env";

type DataApiSuccess<T> = {
  ok: true;
  data: T;
};

type DataApiFailure = {
  ok: false;
  message: string;
  status?: number;
};

export type DataApiResult<T> = DataApiSuccess<T> | DataApiFailure;

type DataApiEnvelope<T> = {
  ok?: boolean;
  data?: T;
  message?: string;
};

type RequestDataApiCacheConfig = {
  cache?: RequestCache;
  next?: {
    revalidate?: number;
    tags?: string[];
  };
};

/**
 * Resolve the configured data API base URL.
 */
export const getDataApiBaseUrl = () => PUBLIC_ENV.dataApiUrl.replace(/\/+$/, "");

/**
 * Call the external data API when configured and return normalized results.
 */
export const requestDataApi = async <T>({
  path,
  method = "GET",
  body,
  cacheConfig,
}: {
  path: string;
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: Record<string, unknown>;
  cacheConfig?: RequestDataApiCacheConfig;
}): Promise<DataApiResult<T> | null> => {
  const baseUrl = getDataApiBaseUrl();
  if (!baseUrl) {
    return null; // Skip remote calls when data API is not configured.
  }

  try {
    const requestInit: RequestInit & {
      next?: { revalidate?: number; tags?: string[] };
    } = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: cacheConfig?.cache ?? "no-store",
      next: cacheConfig?.next,
    };
    const response = await fetch(`${baseUrl}${path}`, requestInit);

    const parsed = (await response.json().catch(() => undefined)) as
      | DataApiEnvelope<T>
      | T
      | undefined;
    const envelope =
      parsed && typeof parsed === "object" && "ok" in parsed
        ? (parsed as DataApiEnvelope<T>)
        : undefined;

    if (!response.ok || envelope?.ok === false) {
      return {
        ok: false,
        message: envelope?.message || "Data API request failed.",
        status: response.status,
      };
    }

    return {
      ok: true,
      data: envelope?.data ?? (parsed as T),
    };
  } catch {
    return null; // Treat network failures like unavailable API and let callers fallback.
  }
};
