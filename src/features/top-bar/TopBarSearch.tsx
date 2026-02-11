"use client";

import styles from "@/features/top-bar/TopBar.module.css";

/**
 * Search input for filtering the feed.
 */
export default function TopBarSearch({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
}: {
  searchQuery: string;
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchSubmit: () => void;
}) {
  return (
    <div className={styles.topBar__search}>
      <div className={styles.topBar__searchField}>
        <input
          className={styles.topBar__searchInput}
          type="search"
          placeholder="Search window finds"
          aria-label="Search products"
          value={searchQuery}
          onChange={onSearchChange}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSearchSubmit(); // Navigate to feed on enter.
            }
          }}
        />

        <button
          className={styles.topBar__searchButton}
          type="button"
          onClick={onSearchSubmit}
          aria-label="Submit search"
        >
          🔍
        </button>
      </div>
    </div>
  );
}
