"use client";

import { Product } from "@/lib/types";
import ProductCard from "@/components/product-card/ProductCard";
import styles from "@/components/wishlist/WishlistPage.module.css";

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
            activeListName={activeList}
            onListRemoval={onListRemoval}
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
