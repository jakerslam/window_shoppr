"use client";

import { useEffect } from "react";
import { pruneExpiredGovernanceData } from "@/shared/lib/platform/data-governance";

/**
 * Run lightweight retention cleanup on app bootstrap.
 */
export default function DataGovernanceBootstrap() {
  useEffect(() => {
    pruneExpiredGovernanceData();
  }, []);

  return null;
}
