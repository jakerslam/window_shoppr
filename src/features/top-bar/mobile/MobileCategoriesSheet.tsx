"use client";

import { toCategorySlug } from "@/shared/lib/catalog/categories";
import styles from "@/features/top-bar/TopBar.module.css";

type AvailableCategory = {
  label: string;
  subCategories: string[];
};

/**
 * Slide-up category browser used by the mobile bottom nav.
 */
export default function MobileCategoriesSheet({
  isOpen,
  availableCategories,
  openCategory,
  onClose,
  onClearAll,
  onCategorySelect,
  onSubCategorySelect,
}: {
  isOpen: boolean;
  availableCategories: AvailableCategory[];
  openCategory: string | null;
  onClose: () => void;
  onClearAll: () => void;
  onCategorySelect: (categorySlug: string, hasSubCategories: boolean) => void;
  onSubCategorySelect: (categorySlug: string, subCategorySlug: string) => void;
}) {
  if (!isOpen) {
    return null; // Render nothing when the sheet is closed.
  }

  return (
    <div
      className={styles.mobileNav__overlay}
      onClick={onClose} // Close the sheet when tapping the backdrop.
    >
      {/* Sheet container that stops click-away propagation. */}
      <div
        className={styles.mobileNav__sheet}
        onClick={(event) => event.stopPropagation()} // Keep taps inside the sheet.
      >
        {/* Sheet header with title + close action. */}
        <div className={styles.mobileNav__sheetHeader}>
          <span>Browse Categories</span>
          <button
            className={styles.mobileNav__sheetClose}
            type="button"
            onClick={onClose} // Close the sheet explicitly.
            aria-label="Close categories"
          >
            ✕
          </button>
        </div>

        {/* All categories option. */}
        <button
          className={styles.mobileNav__sheetItem}
          type="button"
          onClick={onClearAll} // Reset all filters to show everything.
        >
          All Categories
        </button>

        {/* Category list with expandable subcategories. */}
        {availableCategories.map((category) => {
          const categorySlug = toCategorySlug(category.label);
          const hasSubCategories = category.subCategories.length > 0;
          const isExpanded = openCategory === categorySlug;

          return (
            <div key={category.label} className={styles.mobileNav__sheetGroup}>
              <button
                className={styles.mobileNav__sheetItem}
                type="button"
                onClick={() => onCategorySelect(categorySlug, hasSubCategories)} // Select or expand the category.
              >
                <span>{category.label}</span>
                {hasSubCategories ? (
                  <span className={styles.mobileNav__sheetCaret} aria-hidden="true">
                    {isExpanded ? "–" : "+"}
                  </span>
                ) : null}
              </button>

              {hasSubCategories && isExpanded ? (
                <div className={styles.mobileNav__sheetSubList}>
                  {category.subCategories.map((subCategory) => (
                    <button
                      key={subCategory}
                      className={styles.mobileNav__sheetSubItem}
                      type="button"
                      onClick={() =>
                        onSubCategorySelect(
                          categorySlug,
                          toCategorySlug(subCategory),
                        )
                      } // Select a subcategory filter.
                    >
                      {subCategory}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

