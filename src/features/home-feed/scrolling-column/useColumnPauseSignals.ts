"use client";

import { useEffect } from "react";
import type { MutableRefObject } from "react";

/**
 * Wire external pause signals (modal visibility) into the motion engine.
 */
export default function useColumnPauseSignals({
  isModalOpen,
  isModalOpenRef,
  syncPauseState,
}: {
  isModalOpen: boolean;
  isModalOpenRef: MutableRefObject<boolean>;
  syncPauseState: () => void;
}) {
  useEffect(() => {
    isModalOpenRef.current = isModalOpen; // Keep modal state in sync.
    syncPauseState(); // Recompute pause behavior against hover/menu state.
  }, [isModalOpen, isModalOpenRef, syncPauseState]);
}
