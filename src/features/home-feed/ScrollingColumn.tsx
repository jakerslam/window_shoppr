"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { Product } from "@/shared/lib/catalog/types";
import ProductCard from "@/shared/components/product-card/ProductCard";
import WishlistSaveButton from "@/features/wishlist/WishlistSaveButton";
import useColumnMotion from "@/features/home-feed/scrolling-column/useColumnMotion";
import styles from "@/features/home-feed/HomeFeed.module.css";

/**
 * Render props for the wishlist save button.
 */
type SaveButtonRenderProps = {
  buttonClassName: string;
  savedClassName: string;
  wrapperClassName: string;
};

/**
 * Create a named renderer to satisfy display-name linting.
 */
const createSaveRenderer = (productId: string) =>
  function SaveButtonRenderer({
    buttonClassName,
    savedClassName,
    wrapperClassName,
  }: SaveButtonRenderProps) {
    return (
      <WishlistSaveButton
        productId={productId}
        buttonClassName={buttonClassName} // Match card button styling.
        savedClassName={savedClassName} // Apply saved-state styling.
        wrapperClassName={wrapperClassName} // Preserve card layout spacing.
        enableListMenu={false} // Keep feed interactions simple: click-to-save only.
      />
    );
  };

/**
 * Scrolling column of product cards with hover pause + manual scroll assist.
 */
export default function ScrollingColumn({
  columnIndex,
  deck,
  duration,
  onOpen,
  isModalOpen,
  isFeedEnded,
  cycleToken,
  onColumnComplete,
}: {
  columnIndex: number;
  deck: Product[];
  duration: number;
  onOpen: (product: Product) => () => void;
  isModalOpen: boolean;
  isFeedEnded: boolean;
  cycleToken: string;
  onColumnComplete: (columnIndex: number) => void;
}) {
  const loopedDeck = useMemo(() => [...deck, ...deck], [deck]);
  const deckSignature = useMemo(
    () => deck.map((product) => product.id).join("|"),
    [deck],
  ); // Track meaningful deck changes, not array identity churn.
  const hasReportedCompletion = useRef(false);

  /**
   * Reset one-loop completion reporting whenever the cycle token changes.
   */
  useEffect(() => {
    hasReportedCompletion.current = false; // Allow one completion callback for each deck cycle.
  }, [cycleToken, deckSignature]);

  /**
   * Notify the feed when this visible column completes one full loop.
   */
  const handleForwardLoop = useCallback(() => {
    if (hasReportedCompletion.current) {
      return; // Report one completion per cycle to avoid duplicate end-state updates.
    }

    hasReportedCompletion.current = true;
    onColumnComplete(columnIndex);
  }, [columnIndex, onColumnComplete]);

  // Memoize open handlers so cards do not receive new callbacks on every render.
  const openHandlers = useMemo(
    () => loopedDeck.map((product) => onOpen(product)),
    [loopedDeck, onOpen],
  );

  // Memoize save button renderers to avoid recreating per-card callbacks.
  const saveButtonRenderers = useMemo(
    () => loopedDeck.map((product) => createSaveRenderer(product.id)),
    [loopedDeck],
  );

  const {
    columnRef,
    trackRef,
    handleMouseEnter,
    handleMouseLeave,
    handlePointerDown,
    handlePointerMove,
    endPointerGesture,
  } = useColumnMotion({
    duration,
    deckSignature,
    deckLength: deck.length,
    isModalOpen,
    isFeedEnded,
    onForwardLoop: handleForwardLoop,
  });

  if (deck.length === 0) {
    return null; // Skip empty columns when there are no cards.
  }

  return (
    <div
      ref={columnRef}
      className={styles.homeFeed__column}
      onMouseEnter={handleMouseEnter} // Pause when hovering the column.
      onMouseLeave={handleMouseLeave} // Resume when leaving the column.
      onPointerDown={handlePointerDown} // Start touch drag gesture tracking.
      onPointerMove={handlePointerMove} // Update position during touch drags.
      onPointerUp={endPointerGesture} // End touch gesture on release.
      onPointerCancel={endPointerGesture} // End touch gesture on cancellation.
    >
      <div ref={trackRef} className={styles.homeFeed__columnTrack}>
        {loopedDeck.map((product, index) => (
          <ProductCard
            key={`${product.id}-${index}`}
            product={product}
            onOpen={openHandlers[index]} // Open modal/full page on click.
            renderSaveButton={saveButtonRenderers[index]} // Reuse memoized save button renderers.
          />
        ))}
      </div>
    </div>
  );
}
