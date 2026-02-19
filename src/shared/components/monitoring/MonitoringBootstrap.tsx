"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  trackMonitoringError,
  trackMonitoringTrace,
} from "@/shared/lib/engagement/monitoring";

/**
 * Lightweight client monitoring bootstrap (runtime errors + navigation traces).
 */
export default function MonitoringBootstrap() {
  const pathname = usePathname();
  const routeStartRef = useRef<number>(0);
  const initialNavigationTrackedRef = useRef(false);

  /**
   * Track initial navigation timing once per page load.
   */
  useEffect(() => {
    if (typeof window === "undefined") {
      return; // Skip browser APIs during SSR.
    }

    routeStartRef.current = performance.now(); // Seed route timing anchor for subsequent route-transition traces.

    if (initialNavigationTrackedRef.current) {
      return; // Guard against duplicate initial-navigation reports.
    }

    const [entry] = performance.getEntriesByType(
      "navigation",
    ) as PerformanceNavigationTiming[];

    if (!entry) {
      return; // Skip when navigation entries are unavailable.
    }

    initialNavigationTrackedRef.current = true;
    trackMonitoringTrace({
      type: "initial_navigation",
      pathname: window.location.pathname,
      durationMs: entry.duration,
      metadata: {
        ttfbMs: entry.responseStart,
        domInteractiveMs: entry.domInteractive,
        domCompleteMs: entry.domComplete,
      },
    }); // Capture first-load performance baseline.
  }, []);

  /**
   * Subscribe to global runtime error events.
   */
  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined; // Skip event listeners during SSR.
    }

    const handleError = (event: ErrorEvent) => {
      trackMonitoringError({
        type: "window_error",
        message: event.message || "Unknown window error",
        stack:
          event.error instanceof Error
            ? event.error.stack
            : typeof event.error === "string"
              ? event.error
              : undefined,
        pathname: window.location.pathname,
      }); // Capture uncaught runtime exceptions.
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason =
        event.reason instanceof Error
          ? event.reason
          : new Error(
              typeof event.reason === "string"
                ? event.reason
                : "Unhandled promise rejection",
            );

      trackMonitoringError({
        type: "unhandled_rejection",
        message: reason.message,
        stack: reason.stack,
        pathname: window.location.pathname,
      }); // Capture rejected async flows that were not handled.
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  /**
   * Run periodic uptime probes against a lightweight same-origin endpoint.
   */
  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const runProbe = async () => {
      const start = performance.now();
      let ok = false;

      try {
        const response = await fetch("/robots.txt", {
          method: "GET",
          cache: "no-store",
        });
        ok = response.ok;
      } catch {
        ok = false;
      }

      trackMonitoringTrace({
        type: "uptime_check",
        pathname: window.location.pathname,
        durationMs: performance.now() - start,
        metadata: { ok },
      }); // Emit periodic availability probes into observability traces.
    };

    void runProbe(); // Prime the first signal on bootstrap.
    const id = window.setInterval(() => {
      void runProbe();
    }, 60_000);

    return () => {
      window.clearInterval(id);
    };
  }, []);

  /**
   * Track App Router route-transition timing for client-side navigations.
   */
  useEffect(() => {
    if (!pathname || typeof window === "undefined") {
      return; // Skip during SSR and invalid path states.
    }

    if (!routeStartRef.current) {
      routeStartRef.current = performance.now(); // Seed when ref was cleared.
      return;
    }

    const now = performance.now();
    const durationMs = now - routeStartRef.current;
    routeStartRef.current = now; // Advance anchor for next transition.

    if (durationMs <= 0) {
      return; // Skip malformed timing samples.
    }

    trackMonitoringTrace({
      type: "route_transition",
      pathname,
      durationMs,
    }); // Capture transition duration between route renders.
  }, [pathname]);

  return null;
}
