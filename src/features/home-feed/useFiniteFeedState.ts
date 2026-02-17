"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Product } from "@/shared/lib/catalog/types";
import { getFeedColumnCount } from "@/features/home-feed/column-layout";

/**
 * Finite-feed state for end-of-deck messaging and replay flow.
 */
export default function useFiniteFeedState({
  columnDecks,
  resetKey,
}: {
  columnDecks: Product[][];
  resetKey: string;
}) {
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === "undefined" ? 1280 : window.innerWidth,
  );
  const [replayCount, setReplayCount] = useState(0);
  const [completionState, setCompletionState] = useState<{
    deckSignature: string;
    indexes: number[];
  }>({
    deckSignature: "",
    indexes: [],
  });
  const [endZoneState, setEndZoneState] = useState<{
    deckSignature: string;
    indexes: number[];
  }>({
    deckSignature: "",
    indexes: [],
  });

  const visibleColumnCount = useMemo(
    () => getFeedColumnCount(viewportWidth),
    [viewportWidth],
  );
  const activeColumnIndexes = useMemo(
    () =>
      columnDecks
        .slice(0, visibleColumnCount)
        .map((deck, index) => (deck.length > 0 ? index : -1))
        .filter((index) => index >= 0),
    [columnDecks, visibleColumnCount],
  ); // Track only visible columns that actually render cards.
  const completedColumnIndexes =
    completionState.deckSignature === resetKey
      ? completionState.indexes
      : [];
  const endZoneColumnIndexes =
    endZoneState.deckSignature === resetKey ? endZoneState.indexes : [];
  const cycleToken = `${resetKey}:${replayCount}`;
  const isComplete =
    activeColumnIndexes.length > 0 &&
    activeColumnIndexes.every((index) => completedColumnIndexes.includes(index)); // Detect when the visible deck has been consumed.
  const hasAnyColumnEnteredEndZone = endZoneColumnIndexes.length > 0; // Show the end-of-feed bar when the first visible column enters the bottom bar zone.
  const isDeckEnded = isComplete;

  /**
   * Keep viewport width current for responsive visible-column logic.
   */
  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined; // Skip window listeners during SSR.
    }

    const syncViewportWidth = () => {
      setViewportWidth(window.innerWidth); // Capture latest viewport width.
    };

    window.addEventListener("resize", syncViewportWidth);

    return () => {
      window.removeEventListener("resize", syncViewportWidth);
    };
  }, []);

  /**
   * Track a visible column reaching the end of its deck.
   */
  /**
   * Track a visible column entering the end-of-feed bar zone.
   */
  const handleColumnEnterEndZone = useCallback((columnIndex: number) => {
    setEndZoneState((previous) => {
      const currentIndexes =
        previous.deckSignature === resetKey ? previous.indexes : [];

      if (currentIndexes.includes(columnIndex)) {
        return previous; // Avoid duplicate enter-end-zone entries.
      }

      return {
        deckSignature: resetKey,
        indexes: [...currentIndexes, columnIndex],
      };
    });
  }, [resetKey]);

  /**
   * Track a visible column reaching the end of its deck.
   */
  const handleColumnComplete = useCallback((columnIndex: number) => {
    setCompletionState((previous) => {
      const currentIndexes =
        previous.deckSignature === resetKey ? previous.indexes : [];

      if (currentIndexes.includes(columnIndex)) {
        return previous; // Avoid duplicate completion entries.
      }

      return {
        deckSignature: resetKey,
        indexes: [...currentIndexes, columnIndex],
      };
    });
  }, [resetKey]);

  /**
   * Replay the same deck from the beginning.
   */
  const handleReplayDeck = useCallback(() => {
    setEndZoneState({
      deckSignature: resetKey,
      indexes: [],
    }); // Clear end-zone state.
    setCompletionState({
      deckSignature: resetKey,
      indexes: [],
    }); // Clear completion state.
    setReplayCount((previous) => previous + 1); // Reset per-column completion guards.
  }, [resetKey]);

  return {
    isDeckEnded,
    hasAnyColumnEnteredEndZone,
    cycleToken,
    handleColumnEnterEndZone,
    handleColumnComplete,
    handleReplayDeck,
  };
}
