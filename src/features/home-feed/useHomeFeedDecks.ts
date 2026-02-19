"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Product } from "@/shared/lib/catalog/types";
import useFiniteFeedState from "@/features/home-feed/useFiniteFeedState";

const INITIAL_COLUMN_BATCH_SIZE = 3;
const REFILL_BATCH_SIZE = 2;

const buildInitialDeckState = (
  products: Product[],
  columnCount: number,
  cardsPerColumn: number,
) => {
  const decks: Product[][] = Array.from({ length: columnCount }, () => []);
  if (products.length === 0 || columnCount === 0) {
    return { decks, remaining: [] };
  }

  const perColumn =
    cardsPerColumn > 0 ? cardsPerColumn : INITIAL_COLUMN_BATCH_SIZE;
  const initialDealCount = Math.min(products.length, columnCount * perColumn);

  for (let index = 0; index < initialDealCount; index += 1) {
    decks[index % columnCount].push(products[index]);
  }

  const remaining = products.slice(initialDealCount);
  return { decks, remaining };
};

/**
 * Manage feed decks, refill behavior, and finite-end transitions.
 */
export default function useHomeFeedDecks({
  feedProducts,
  columnCount,
}: {
  feedProducts: Product[];
  columnCount: number;
}) {
  const columnsRef = useRef<HTMLDivElement | null>(null);
  const [cardsPerColumn, setCardsPerColumn] = useState(5);
  const initialDeckState = useMemo(
    () => buildInitialDeckState(feedProducts, columnCount, cardsPerColumn),
    [feedProducts, columnCount, cardsPerColumn],
  );
  const feedResetKey = useMemo(
    () =>
      `${columnCount}:${cardsPerColumn}:${feedProducts
        .map((product) => product.id)
        .join("|")}`,
    [cardsPerColumn, columnCount, feedProducts],
  );
  const [deckState, setDeckState] = useState<{
    resetKey: string;
    decks: Product[][];
    remaining: Product[];
  }>(() => ({
    resetKey: feedResetKey,
    ...initialDeckState,
  }));
  const columnDecks =
    deckState.resetKey === feedResetKey ? deckState.decks : initialDeckState.decks;
  const columnDecksRef = useRef<Product[][]>(columnDecks);
  const deckStateRef = useRef(deckState);

  /**
   * Re-measure how many cards fit within each column plus one buffer.
   */
  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const measure = () => {
      const columnNode = columnsRef.current;
      const cardNode = columnNode?.querySelector('[data-card="product-card"]');

      if (!columnNode || !cardNode) {
        return;
      }

      const columnHeight = columnNode.getBoundingClientRect().height;
      const cardHeight = cardNode.getBoundingClientRect().height;
      if (columnHeight <= 0 || cardHeight <= 0) {
        return;
      }

      const visibleCards = Math.max(1, Math.floor(columnHeight / cardHeight));
      const targetCards = visibleCards + 1;
      setCardsPerColumn((prev) => (prev === targetCards ? prev : targetCards));
    };

    const id = window.requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => {
      window.cancelAnimationFrame(id);
      window.removeEventListener("resize", measure);
    };
  }, [feedProducts.length, columnCount]);

  /**
   * Keep runtime deck refs in sync with rendered decks.
   */
  useEffect(() => {
    columnDecksRef.current = columnDecks;
    deckStateRef.current = deckState;
  }, [columnDecks, deckState]);

  /**
   * Re-sync deck state whenever feed composition or breakpoint changes.
   */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDeckState((previous) => {
      if (previous.resetKey === feedResetKey) {
        return previous;
      }

      return {
        resetKey: feedResetKey,
        ...initialDeckState,
      };
    });
  }, [feedResetKey, initialDeckState]);

  const {
    isDeckEnded,
    hasAnyColumnEnteredEndZone,
    cycleToken,
    handleColumnEnterEndZone,
    handleColumnComplete,
    handleReplayDeck,
  } = useFiniteFeedState({ columnDecks, resetKey: feedResetKey });

  /**
   * Deal the next set of cards from remaining into a single column deck.
   */
  const dealNextCards = useCallback(
    (columnIndex: number, count: number) => {
      if (isDeckEnded) {
        return 0;
      }

      const current = deckStateRef.current;
      if (columnIndex >= current.decks.length) {
        return 0;
      }

      const dealCount = Math.max(0, Math.min(count, current.remaining.length));
      if (dealCount === 0) {
        return 0;
      }

      const nextCards = current.remaining.slice(0, dealCount);
      const rest = current.remaining.slice(dealCount);
      const nextDecks = current.decks.map((deck, index) =>
        index === columnIndex ? [...deck, ...nextCards] : deck,
      );
      const nextState = {
        resetKey: current.resetKey,
        decks: nextDecks,
        remaining: rest,
      };

      deckStateRef.current = nextState;
      setDeckState(nextState);
      return dealCount;
    },
    [isDeckEnded],
  );

  const handleDeckApproachingEnd = useCallback(
    (columnIndex: number) => {
      if (columnIndex >= columnDecksRef.current.length) {
        return;
      }
      dealNextCards(columnIndex, REFILL_BATCH_SIZE);
    },
    [dealNextCards],
  );

  /**
   * Continue this column only by dealing from the remaining pool.
   */
  const handleDeckExhausted = useCallback(
    (columnIndex: number) => {
      if (isDeckEnded) {
        return false;
      }
      return dealNextCards(columnIndex, REFILL_BATCH_SIZE) > 0;
    },
    [isDeckEnded, dealNextCards],
  );

  /**
   * Replay from initial deck distribution for the current query.
   */
  const handleReplayFeed = useCallback(() => {
    const resetState = {
      resetKey: feedResetKey,
      ...initialDeckState,
    };
    setDeckState(resetState);
    handleReplayDeck();
  }, [feedResetKey, handleReplayDeck, initialDeckState]);

  return {
    columnsRef,
    columnDecks,
    isDeckEnded,
    hasAnyColumnEnteredEndZone,
    cycleToken,
    handleColumnEnterEndZone,
    handleColumnComplete,
    handleDeckApproachingEnd,
    handleDeckExhausted,
    handleReplayFeed,
  };
}
