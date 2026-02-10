"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import productsJson from "@/data/products.json";
import { Product } from "@/lib/types";
import { DEFAULT_WISHLIST_NAME, useWishlist } from "@/lib/wishlist";
import ProductCard from "@/components/product-card/ProductCard";
import styles from "@/components/wishlist/WishlistPage.module.css";

/**
 * Static product catalog fallback for wishlist rendering.
 */
const ALL_PRODUCTS = productsJson as Product[]; // Use JSON fallback until SQL wiring.

/**
 * Label for showing items from every list.
 */
const ALL_LIST_LABEL = "All"; // Filter label for all lists.

/**
 * Local ghost item metadata for temporary undo actions.
 */
type RemovedItem = {
  productId: string;
  listName: string;
  product: Product;
  order: number;
};

/**
 * Wishlist page showing saved products in a denser grid.
 */
export default function WishlistPage() {
  const router = useRouter();
  const { listNames, isSaved, isSavedInList, saveToList } = useWishlist(); // Pull wishlist state from storage.
  const [activeList, setActiveList] = useState(ALL_LIST_LABEL);
  const [removedItems, setRemovedItems] = useState<RemovedItem[]>([]);

  const productLookup = useMemo(
    () =>
      new Map(
        ALL_PRODUCTS.map((product, index) => [product.id, { product, order: index }]),
      ),
    [],
  ); // Cache product ordering for ghost placeholders.

  const filteredProducts = useMemo(() => {
    if (activeList === ALL_LIST_LABEL) {
      return ALL_PRODUCTS.filter((product) => isSaved(product.id)); // Show anything saved to any list.
    }

    return ALL_PRODUCTS.filter((product) =>
      isSavedInList(product.id, activeList),
    ); // Filter to the active list.
  }, [activeList, isSaved, isSavedInList]);

  const activeGhosts = useMemo(() => {
    return removedItems.filter((entry) => {
      if (entry.listName !== activeList) {
        return false; // Only show ghosts for the current filter.
      }

      if (entry.listName === ALL_LIST_LABEL) {
        return !isSaved(entry.productId); // Keep ghost until re-saved.
      }

      return !isSavedInList(entry.productId, entry.listName); // Keep ghost until re-added.
    });
  }, [activeList, isSaved, isSavedInList, removedItems]);

  const combinedItems = useMemo(() => {
    const productItems = filteredProducts.map((product) => ({
      type: "product" as const,
      order: productLookup.get(product.id)?.order ?? 0,
      product,
    }));
    const ghostItems = activeGhosts.map((entry) => ({
      type: "ghost" as const,
      order: entry.order,
      entry,
    }));

    return [...productItems, ...ghostItems].sort((a, b) => a.order - b.order);
  }, [activeGhosts, filteredProducts, productLookup]);

  const hasItems = combinedItems.length > 0; // Determine whether to show empty state.

  // Navigate to the product detail view when a card is opened.
  const handleOpen = (slug: string) => {
    router.push(`/product/${slug}`); // Route to the full product detail page.
  };

  // Register a ghost item when it is removed from a list in this view.
  const handleListRemoval = useCallback(
    (productId: string, listName: string) => {
      const lookup = productLookup.get(productId);

      if (!lookup) {
        return; // Skip ghost when product metadata is missing.
      }

      setRemovedItems((prev) => {
        const alreadyTracked = prev.some(
          (entry) => entry.productId === productId && entry.listName === listName,
        );

        if (alreadyTracked) {
          return prev; // Avoid duplicating ghost entries.
        }

        return [
          ...prev,
          {
            productId,
            listName,
            product: lookup.product,
            order: lookup.order,
          },
        ];
      });
    },
    [productLookup],
  );

  // Undo a removal by re-saving the item into the previous list.
  const handleUndo = useCallback(
    (entry: RemovedItem) => {
      const targetList =
        entry.listName === ALL_LIST_LABEL
          ? DEFAULT_WISHLIST_NAME
          : entry.listName; // Restore to default list for "All" removals.

      saveToList(entry.productId, targetList); // Re-save the item to its list.
      setRemovedItems((prev) =>
        prev.filter(
          (item) =>
            !(item.productId === entry.productId && item.listName === entry.listName),
        ),
      );
    },
    [saveToList],
  );

  return (
    <section className={styles.wishlistPage}>
      {/* Header section with title and quick navigation. */}
      <header className={styles.wishlistPage__header}>
        {/* Title group describing the wishlist view. */}
        <div className={styles.wishlistPage__titleGroup}>
          <h1 className={styles.wishlistPage__title}>Your Wishlist</h1>
          <p className={styles.wishlistPage__subtitle}>
            Saved finds for quick, cozy browsing.
          </p>
        </div>

        {/* Action row with navigation and list filtering. */}
        <div className={styles.wishlistPage__actions}>
          <Link className={styles.wishlistPage__browse} href="/">
            &larr; Feed
          </Link>

          <div className={styles.wishlistPage__filters}>
            <select
              className={styles.wishlistPage__filterSelect}
              value={activeList}
              onChange={(event) => setActiveList(event.target.value)} // Switch list filter.
              aria-label="Filter wishlist by list"
            >
              <option value={ALL_LIST_LABEL}>{ALL_LIST_LABEL}</option>
              {listNames.map((listName) => (
                <option key={listName} value={listName}>
                  {listName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Wishlist grid when items are saved. */}
      {hasItems ? (
        <div className={styles.wishlistPage__grid}>
          {combinedItems.map((item) =>
            item.type === "product" ? (
              <ProductCard
                key={item.product.id}
                product={item.product}
                onOpen={() => handleOpen(item.product.slug)}
                variant="compact"
                activeListName={activeList}
                onListRemoval={handleListRemoval}
              />
            ) : (
              <div
                key={`ghost-${item.entry.productId}-${item.entry.listName}`}
                className={styles.wishlistPage__ghostCard}
              >
                <span className={styles.wishlistPage__ghostTitle}>
                  Removed from {item.entry.listName}
                </span>
                <button
                  className={styles.wishlistPage__ghostAction}
                  type="button"
                  onClick={() => handleUndo(item.entry)} // Restore the removed item.
                >
                  Click to undo
                </button>
              </div>
            ),
          )}
        </div>
      ) : (
        <div className={styles.wishlistPage__empty}>
          <p className={styles.wishlistPage__emptyText}>
            Your wishlist is empty. Start saving the finds you love most.
          </p>
          <Link className={styles.wishlistPage__emptyCta} href="/">
            &larr; Feed
          </Link>
        </div>
      )}
    </section>
  );
}
