"use client";

import Link from "next/link";
import styles from "@/features/wishlist/WishlistPage.module.css";

/**
 * Wishlist page header with title and list filtering controls.
 */
export default function WishlistHeader({
  listNames,
  activeList,
  onListChange,
  searchQuery,
  onSearchChange,
  onManageLists,
}: {
  listNames: string[];
  activeList: string;
  onListChange: (nextList: string) => void;
  searchQuery: string;
  onSearchChange: (nextSearch: string) => void;
  onManageLists: () => void;
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
          <input
            className={styles.wishlistPage__searchInput}
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search wishlist"
            aria-label="Search wishlist products"
          />

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

          <button
            className={styles.wishlistPage__manageList}
            type="button"
            onClick={onManageLists}
          >
            Manage list
          </button>
        </div>
      </div>
    </header>
  );
}
