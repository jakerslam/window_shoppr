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
      {/* Search field wrapper. */}
      <div className={styles.topBar__searchField}>
        {/* Text input for query entry. */}
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

        {/* Submit button for keyboard-free search. */}
        <button
          className={styles.topBar__searchButton}
          type="button"
          onClick={onSearchSubmit} // Submit the current query.
          aria-label="Submit search"
        >
          🔍
        </button>
      </div>
    </div>
  );
}
