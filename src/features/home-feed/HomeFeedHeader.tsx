"use client";

import SortDropdown, { SortOption } from "@/features/home-feed/SortDropdown";
import styles from "@/features/home-feed/HomeFeed.module.css";

/**
 * Home feed header with the title and browse controls.
 */
export default function HomeFeedHeader({
  title,
  speedMode,
  sortOption,
  onOpenCategories,
  onToggleSpeedMode,
  onSortChange,
}: {
  title: string;
  speedMode: "cozy" | "quick";
  sortOption: SortOption;
  onOpenCategories: () => void;
  onToggleSpeedMode: () => void;
  onSortChange: (nextValue: SortOption) => void;
}) {
  return (
    <div className={styles.homeFeed__header}>
      {/* Title group (title only for now). */}
      <div className={styles.homeFeed__titleGroup}>
        <h1 className={styles.homeFeed__title}>{title}</h1>
      </div>

      {/* Browse controls (categories, speed, sort). */}
      <div className={styles.homeFeed__controls}>
        {/* Category shortcut for mobile browsing. */}
        <button
          className={styles.homeFeed__categoryTrigger}
          type="button"
          onClick={onOpenCategories} // Open mobile categories sheet.
          aria-label="Browse categories"
        >
          ☰ Categories
        </button>

        <button
          className={`${styles.homeFeed__speedToggle} ${
            speedMode === "quick" ? styles["homeFeed__speedToggle--quick"] : ""
          }`}
          type="button"
          onClick={onToggleSpeedMode} // Toggle between cozy and quick speeds.
          aria-pressed={speedMode === "quick"}
          aria-label={
            speedMode === "quick"
              ? "Switch to cozy scroll speed"
              : "Switch to quick scroll speed"
          }
        >
          <span className={styles.homeFeed__speedThumb} aria-hidden="true" />
          <span
            className={styles.homeFeed__speedIcon}
            data-side="left"
            aria-hidden="true"
          >
            🐢
          </span>
          <span
            className={styles.homeFeed__speedIcon}
            data-side="right"
            aria-hidden="true"
          >
            🐇
          </span>
        </button>

        {/* Styled sort dropdown. */}
        <SortDropdown value={sortOption} onChange={onSortChange} />
      </div>
    </div>
  );
}

