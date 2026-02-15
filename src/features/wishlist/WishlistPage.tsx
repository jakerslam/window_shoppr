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
  const { listNames, isSaved, isSavedInList, saveToList } = useWishlist();
  const [activeList, setActiveList] = useState(ALL_LIST_LABEL);
  const [searchQuery, setSearchQuery] = useState(() => readWishlistSearchQuery());
  const [removedItems, setRemovedItems] = useState<RemovedItem[]>([]);

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

  return (
    <section className={styles.wishlistPage}>
      <WishlistHeader
        listNames={displayLists}
        activeList={activeList}
        onListChange={setActiveList}
        searchQuery={searchQuery}
        onSearchChange={writeWishlistSearchQuery}
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
    </section>
  );
}
