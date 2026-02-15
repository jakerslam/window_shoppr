"use client";

import { useEffect, useState } from "react";
import {
  AUTH_SESSION_STORAGE_KEY,
  AuthSession,
  readAuthSession,
} from "@/shared/lib/platform/auth-session";

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
    window.addEventListener("auth:session", syncSession);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("auth:session", syncSession);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return session;
}
