"use client";

import Link from "next/link";
import styles from "@/components/wishlist/WishlistPage.module.css";

/**
 * Wishlist page header with title and list filtering controls.
 */
export default function WishlistHeader({
  listNames,
  activeList,
  onListChange,
}: {
  listNames: string[];
  activeList: string;
  onListChange: (nextList: string) => void;
}) {
  return (
    <header className={styles.wishlistPage__header}>
      <div className={styles.wishlistPage__titleGroup}>
        <h1 className={styles.wishlistPage__title}>Your Wishlist</h1>
        <p className={styles.wishlistPage__subtitle}>
          Saved finds for quick, cozy browsing.
        </p>
      </div>

      <div className={styles.wishlistPage__actions}>
        <Link className={styles.wishlistPage__browse} href="/">
          &larr; Feed
        </Link>

        <div className={styles.wishlistPage__filters}>
          <select
            className={styles.wishlistPage__filterSelect}
            value={activeList}
            onChange={(event) => onListChange(event.target.value)}
            aria-label="Filter wishlist by list"
          >
            {listNames.map((listName) => (
              <option key={listName} value={listName}>
                {listName}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
