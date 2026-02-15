"use client";

import { RefObject } from "react";
import styles from "@/features/top-bar/TopBar.module.css";
import { SearchIcon } from "@/features/top-bar/NavIcons";

/**
 * Mobile search bar overlay that floats above the bottom nav.
 */
export default function MobileSearchOverlay({
  isOpen,
  searchQuery,
  placeholder = "Search window finds",
  ariaLabel = "Search products",
  onChange,
  onSubmit,
  onClose,
  inputRef,
}: {
  isOpen: boolean;
  searchQuery: string;
  placeholder?: string;
  ariaLabel?: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  onClose: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
}) {
  if (!isOpen) {
    return null; // Render nothing when the overlay is closed.
  }

  return (
    <div
      className={styles.mobileSearch__overlay}
      onClick={onClose} // Close search when tapping away.
    >
      <div
        className={`${styles.mobileSearch__bar} ${styles["mobileSearch__bar--open"]}`}
        onClick={(event) => event.stopPropagation()} // Keep taps inside the bar.
      >
        <input
          ref={inputRef}
          className={styles.mobileSearch__input}
          type="search"
          placeholder={placeholder}
          aria-label={ariaLabel}
          value={searchQuery}
          onChange={onChange} // Update search query.
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSubmit(); // Submit on Enter.
            }
          }}
        />
        <button
          className={styles.mobileSearch__button}
          type="button"
          onClick={onSubmit} // Submit the current search.
          aria-label="Submit search"
        >
          <SearchIcon className={styles.topBar__searchIcon} />
        </button>
      </div>
    </div>
  );
}
