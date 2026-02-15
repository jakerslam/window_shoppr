"use client";

import { Product } from "@/shared/lib/catalog/types";
import ProductCard from "@/shared/components/product-card/ProductCard";
import WishlistSaveButton from "@/features/wishlist/WishlistSaveButton";
import styles from "@/features/wishlist/WishlistPage.module.css";

/**
 * Grid of wishlist items with ghost placeholders.
 */
export default function WishlistGrid({
  items,
  activeList,
  onOpen,
  onListRemoval,
  onUndo,
}: {
  items: Array<
    | {
        type: "product";
        product: Product;
      }
    | {
        type: "ghost";
        entry: {
          productId: string;
          listName: string;
        };
      }
  >;
  activeList: string;
  onOpen: (slug: string) => void;
  onListRemoval: (productId: string, listName: string) => void;
  onUndo: (entry: { productId: string; listName: string }) => void;
}) {
  return (
    <div className={styles.wishlistPage__grid}>
      {items.map((item) =>
        item.type === "product" ? (
          <ProductCard
            key={item.product.id}
            product={item.product}
            onOpen={() => onOpen(item.product.slug)}
            variant="compact"
            renderSaveButton={({
              buttonClassName,
              savedClassName,
              wrapperClassName,
            }) => (
              <WishlistSaveButton
                productId={item.product.id}
                buttonClassName={buttonClassName} // Match compact card styling.
                savedClassName={savedClassName} // Apply saved-state styling.
                wrapperClassName={wrapperClassName} // Preserve compact layout spacing.
                activeListName={activeList}
                onListRemoval={onListRemoval}
              />
            )}
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
              onClick={() => onUndo(item.entry)}
            >
              Click to undo
            </button>
          </div>
        ),
      )}
    </div>
  );
}
