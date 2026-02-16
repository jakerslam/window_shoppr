"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/shared/lib/catalog/types";
import { FALLBACK_PRODUCTS } from "@/shared/lib/catalog/products";
import { ALL_LIST_LABEL, DEFAULT_WISHLIST_NAME } from "@/features/wishlist/wishlist-constants";
import { useWishlist } from "@/features/wishlist/wishlist";
import {
  readWishlistSearchQuery,
  WISHLIST_SEARCH_EVENT,
  WISHLIST_SEARCH_STORAGE_KEY,
  writeWishlistSearchQuery,
} from "@/features/wishlist/lib/wishlist-search";
import WishlistHeader from "@/features/wishlist/wishlist-page/WishlistHeader";
import WishlistGrid from "@/features/wishlist/wishlist-page/WishlistGrid";
import WishlistEmpty from "@/features/wishlist/wishlist-page/WishlistEmpty";
import styles from "@/features/wishlist/WishlistPage.module.css";

/**
 * Static product catalog fallback for wishlist rendering.
 */
const ALL_PRODUCTS = FALLBACK_PRODUCTS; // Use JSON fallback until SQL wiring.

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
  const {
    listNames,
    listSummaries,
    isSaved,
    isSavedInList,
    saveToList,
    deleteList,
  } = useWishlist();
  const [activeList, setActiveList] = useState(ALL_LIST_LABEL);
  const [searchQuery, setSearchQuery] = useState(() => readWishlistSearchQuery());
  const [removedItems, setRemovedItems] = useState<RemovedItem[]>([]);
  const [isListManagerOpen, setIsListManagerOpen] = useState(false);

  const productLookup = useMemo(
    () =>
      new Map(
        ALL_PRODUCTS.map((product, index) => [product.id, { product, order: index }]),
      ),
    [],
  ); // Cache product ordering for ghost placeholders.

  const displayLists = useMemo(
    () => [ALL_LIST_LABEL, ...listNames],
    [listNames],
  ); // Include the All filter at the top.

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredProducts = useMemo(() => {
    if (activeList === ALL_LIST_LABEL) {
      return ALL_PRODUCTS.filter((product) => isSaved(product.id));
    }

    return ALL_PRODUCTS.filter((product) =>
      isSavedInList(product.id, activeList),
    );
  }, [activeList, isSaved, isSavedInList]);
  const searchFilteredProducts = useMemo(() => {
    if (!normalizedSearchQuery) {
      return filteredProducts; // Keep default list filtering when search is empty.
    }

    return filteredProducts.filter((product) => {
      const haystack = [
        product.name,
        product.category,
        product.subCategory,
        ...(product.tags ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearchQuery); // Match products by basic keyword search.
    });
  }, [filteredProducts, normalizedSearchQuery]);

  const activeGhosts = useMemo(() => {
    if (normalizedSearchQuery) {
      return [] as RemovedItem[]; // Hide undo ghosts while search filtering is active.
    }

    return removedItems.filter((entry) => {
      if (entry.listName !== activeList) {
        return false; // Only show ghosts for the current filter.
      }

      if (entry.listName === ALL_LIST_LABEL) {
        return !isSaved(entry.productId); // Keep ghost until re-saved.
      }

      return !isSavedInList(entry.productId, entry.listName); // Keep ghost until re-added.
    });
  }, [activeList, isSaved, isSavedInList, normalizedSearchQuery, removedItems]);

  const combinedItems = useMemo(() => {
    const productItems = searchFilteredProducts.map((product) => ({
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
  }, [activeGhosts, productLookup, searchFilteredProducts]);

  const hasItems = combinedItems.length > 0; // Determine whether to show empty state.

  /**
   * Keep wishlist search query synced across header + mobile overlay + tabs.
   */
  useEffect(() => {
    const syncSearch = () => {
      setSearchQuery(readWishlistSearchQuery()); // Pull latest persisted wishlist search query.
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === WISHLIST_SEARCH_STORAGE_KEY) {
        syncSearch(); // Sync cross-tab search query updates.
      }
    };

    window.addEventListener(WISHLIST_SEARCH_EVENT, syncSearch);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(WISHLIST_SEARCH_EVENT, syncSearch);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const isAllList = activeList === ALL_LIST_LABEL; // Track if the all-list filter is active.
  const emptyTitle = isAllList
    ? "Your wishlist is empty."
    : `No saves in ${activeList} yet.`; // Tailor empty state headline to the active filter.
  const emptyMessage = isAllList
    ? "Start saving the finds you love most."
    : "Try another list or save a new find."; // Tailor empty state helper copy.
  const emptyCtaLabel = isAllList ? "← Feed" : "View all lists"; // Provide a clear action label.

  const handleOpen = (slug: string) => {
    router.push(`/product/${slug}/`); // Route to the full product detail page (static export friendly).
  };

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

  const handleUndo = useCallback(
    (entry: { productId: string; listName: string }) => {
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

  /**
   * Delete a selected custom list from the manager modal.
   */
  const handleDeleteListFromManager = useCallback(
    (listName: string) => {
      if (listName === DEFAULT_WISHLIST_NAME) {
        return; // Protect default list from deletion.
      }

      const shouldDelete = window.confirm(
        `Delete "${listName}"? Items only in this list will be unsaved.`,
      );
      if (!shouldDelete) {
        return; // Keep list when deletion is canceled.
      }

      deleteList(listName); // Remove list and related memberships.
      setRemovedItems((prev) =>
        prev.filter((entry) => entry.listName !== listName),
      ); // Drop stale ghost entries linked to deleted list.
      if (activeList === listName) {
        setActiveList(ALL_LIST_LABEL); // Return to all-list view if active list was deleted.
      }
    },
    [activeList, deleteList],
  );

  return (
    <section className={styles.wishlistPage}>
      <WishlistHeader
        listNames={displayLists}
        activeList={activeList}
        onListChange={setActiveList}
        searchQuery={searchQuery}
        onSearchChange={writeWishlistSearchQuery}
        onManageLists={() => setIsListManagerOpen(true)}
      />

      {hasItems ? (
        <WishlistGrid
          items={combinedItems}
          activeList={activeList}
          onOpen={handleOpen}
          onListRemoval={handleListRemoval}
          onUndo={handleUndo}
        />
      ) : (
        <WishlistEmpty
          title={emptyTitle}
          message={emptyMessage}
          ctaLabel={emptyCtaLabel}
          ctaHref={isAllList ? "/" : undefined}
          onCtaClick={isAllList ? undefined : () => setActiveList(ALL_LIST_LABEL)}
        />
      )}

      {/* Wishlist list manager modal for view/delete actions from page context. */}
      {isListManagerOpen ? (
        <div
          className={styles.wishlistPage__managerBackdrop}
          role="presentation"
          onClick={() => setIsListManagerOpen(false)} // Close on backdrop click.
        >
          <section
            className={styles.wishlistPage__manager}
            role="dialog"
            aria-modal="true"
            aria-labelledby="wishlist-page-manager-title"
            onClick={(event) => event.stopPropagation()} // Keep clicks inside modal.
          >
            <header className={styles.wishlistPage__managerHeader}>
              <h2
                id="wishlist-page-manager-title"
                className={styles.wishlistPage__managerTitle}
              >
                Manage lists
              </h2>
              <button
                className={styles.wishlistPage__managerClose}
                type="button"
                onClick={() => setIsListManagerOpen(false)} // Close manager modal.
                aria-label="Close list manager"
              >
                ✕
              </button>
            </header>

            <div className={styles.wishlistPage__managerList}>
              {listSummaries.map((list) => (
                <div key={list.name} className={styles.wishlistPage__managerItem}>
                  <div className={styles.wishlistPage__managerMeta}>
                    <span className={styles.wishlistPage__managerName}>{list.name}</span>
                    <span className={styles.wishlistPage__managerCount}>
                      {list.count} item{list.count === 1 ? "" : "s"}
                    </span>
                  </div>

                  {list.isDefault ? (
                    <span className={styles.wishlistPage__managerTag}>Default</span>
                  ) : (
                    <button
                      className={styles.wishlistPage__managerDelete}
                      type="button"
                      onClick={() => handleDeleteListFromManager(list.name)} // Delete selected custom list.
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              className={styles.wishlistPage__managerDone}
              type="button"
              onClick={() => setIsListManagerOpen(false)} // Close manager modal.
            >
              Done
            </button>
          </section>
        </div>
      ) : null}
    </section>
  );
}
