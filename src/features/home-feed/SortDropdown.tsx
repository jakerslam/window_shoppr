"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import styles from "@/features/home-feed/HomeFeed.module.css";

/**
 * Sort options for the home feed dropdown.
 */
export type SortOption = "top-rated" | "newest" | "price-low" | "price-high";

/**
 * Sort dropdown option metadata.
 */
const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: "newest", label: "Newest" },
  { value: "top-rated", label: "Top rated" },
  { value: "price-low", label: "Price low to high" },
  { value: "price-high", label: "Price high to low" },
];

/**
 * Custom styled dropdown for sorting the feed.
 */
export default function SortDropdown({
  value,
  onChange,
}: {
  value: SortOption;
  onChange: (next: SortOption) => void;
}) {
  const menuId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  /**
   * Resolve the index of the currently selected option.
   */
  const selectedIndex = useMemo(() => {
    const currentIndex = SORT_OPTIONS.findIndex((option) => option.value === value);
    return currentIndex >= 0 ? currentIndex : 0; // Default to the first option.
  }, [value]);

  /**
   * Focus the highlighted option when the menu opens.
   */
  useEffect(() => {
    if (!isOpen) {
      return; // Skip when menu is closed.
    }

    optionRefs.current[highlightedIndex]?.focus(); // Focus the active option.
  }, [highlightedIndex, isOpen]);

  /**
   * Close the menu when clicking outside of the dropdown.
   */
  useEffect(() => {
    if (!isOpen) {
      return; // Skip event wiring when the menu is closed.
    }

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) {
        return; // Ignore clicks inside the dropdown.
      }
      setIsOpen(false); // Close on outside click.
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick); // Clean up listeners.
    };
  }, [isOpen]);

  /**
   * Toggle the dropdown open state.
   */
  const handleToggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        setHighlightedIndex(selectedIndex); // Align to the selected option when opening.
      }
      return next; // Update open state.
    });
  };

  /**
   * Apply a selection and close the menu.
   */
  const handleSelect = (next: SortOption) => {
    onChange(next); // Update the sort mode.
    setIsOpen(false); // Close the menu.
    buttonRef.current?.focus(); // Return focus to the trigger.
  };

  /**
   * Handle keyboard interactions on the trigger button.
   */
  const handleButtonKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true); // Open the menu.
      setHighlightedIndex(0); // Start at the first option.
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true); // Open the menu.
      setHighlightedIndex(SORT_OPTIONS.length - 1); // Jump to the last option.
      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false); // Close the menu.
    }
  };

  /**
   * Handle keyboard interactions for option buttons.
   */
  const handleOptionKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
    optionValue: SortOption,
  ) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % SORT_OPTIONS.length); // Move down.
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + SORT_OPTIONS.length) % SORT_OPTIONS.length); // Move up.
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleSelect(optionValue); // Confirm selection.
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false); // Close on escape.
      buttonRef.current?.focus(); // Return focus to trigger.
    }
  };

  /**
   * Resolve the label for the current selection.
   */
  const selectedLabel = useMemo(() => {
    return (
      SORT_OPTIONS.find((option) => option.value === value)?.label ?? "Sort"
    ); // Match the current value to a label.
  }, [value]);

  return (
    <div className={styles.homeFeed__dropdown} ref={menuRef}>
      {/* Trigger button for the dropdown menu. */}
      <button
        ref={buttonRef}
        className={`${styles.homeFeed__dropdownButton} ${
          isOpen ? styles["homeFeed__dropdownButton--open"] : ""
        }`}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={handleToggle} // Toggle the dropdown.
        onKeyDown={handleButtonKeyDown} // Handle keyboard toggles.
      >
        <span className={styles.homeFeed__dropdownLabel}>{selectedLabel}</span>
        <span className={styles.homeFeed__dropdownChevron} aria-hidden="true">
          ▾
        </span>
      </button>

      {/* Options menu. */}
      {isOpen ? (
        <div className={styles.homeFeed__dropdownMenu} role="listbox" id={menuId}>
          {SORT_OPTIONS.map((option, index) => {
            const isSelected = option.value === value;
            const isActive = index === highlightedIndex;

            return (
              <button
                key={option.value}
                ref={(node) => {
                  optionRefs.current[index] = node; // Store refs for focus control.
                }}
                className={`${styles.homeFeed__dropdownItem} ${
                  isSelected ? styles["homeFeed__dropdownItem--selected"] : ""
                } ${isActive ? styles["homeFeed__dropdownItem--active"] : ""}`}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(option.value)} // Select this option.
                onKeyDown={(event) =>
                  handleOptionKeyDown(event, index, option.value)
                } // Support keyboard navigation.
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
