"use client";

import { useEffect, useState } from "react";
import { requestAuthSessionFromApi } from "@/shared/lib/platform/auth/api";
import {
  AUTH_SESSION_STORAGE_KEY,
  AuthSession,
  clearAuthSession,
  readAuthSession,
  touchAuthSessionActivity,
} from "@/shared/lib/platform/auth-session";
import { PUBLIC_ENV } from "@/shared/lib/platform/env";

/**
 * Subscribe to auth-session changes from local storage and in-tab events.
 */
export default function useAuthSessionState() {
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    const syncSession = () => {
      setSession(readAuthSession()); // Keep React state aligned with local auth persistence.
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === AUTH_SESSION_STORAGE_KEY) {
        syncSession(); // Sync across tabs on auth storage changes.
      }
    };

    syncSession(); // Hydrate once on mount.
    if (PUBLIC_ENV.deployTarget === "runtime" && PUBLIC_ENV.authApiUrl.trim()) {
      void requestAuthSessionFromApi().then((result) => {
        if (result?.ok) {
          syncSession(); // Refresh from backend-backed session payload.
          return;
        }

        if (result && !result.ok) {
          clearAuthSession(); // Clear stale local session when backend says unauthenticated.
          syncSession();
        }
      });
    }

    window.addEventListener("auth:session", syncSession);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("auth:session", syncSession);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  /**
   * Keep idle timeout accurate by touching session state on user activity.
   */
  useEffect(() => {
    if (!session) {
      return; // Skip activity tracking when signed out.
    }

    let timeoutId: number | null = null;
    const scheduleTouch = () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }

      timeoutId = window.setTimeout(() => {
        touchAuthSessionActivity(); // Refresh session activity after quiet period.
      }, 20_000);
    };

    const handleActivity = () => {
      scheduleTouch(); // Coalesce frequent activity into sparse writes.
    };

    window.addEventListener("pointerdown", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("scroll", handleActivity, { passive: true });
    scheduleTouch();

    return () => {
      window.removeEventListener("pointerdown", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("scroll", handleActivity);
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [session]);

  return session;
}
