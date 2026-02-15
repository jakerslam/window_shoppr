"use client";

import type { RefObject } from "react";
import { toCategorySlug } from "@/shared/lib/categories";
import styles from "@/features/top-bar/TopBar.module.css";

type AvailableCategory = {
  label: string;
  subCategories: string[];
};

/**
 * Render the categories + subcategories menu list inside the top bar dropdown.
 */
export default function TopBarCategoriesMenuList({
  availableCategories,
  selectedCategory,
  selectedSubCategory,
  openCategory,
  firstItemRef,
  onSelectAll,
  onSelectCategory,
  onSelectSubCategory,
  onSubMenuOpen,
  onSubMenuClose,
}: {
  availableCategories: AvailableCategory[];
  selectedCategory: string | null;
  selectedSubCategory: string | null;
  openCategory: string | null;
  firstItemRef: RefObject<HTMLButtonElement | null>;
  onSelectAll: () => void;
  onSelectCategory: (categorySlug: string) => void;
  onSelectSubCategory: (categorySlug: string, subCategorySlug: string) => void;
  onSubMenuOpen: (categorySlug: string, hasSubCategories: boolean) => void;
  onSubMenuClose: () => void;
}) {
  return (
    <>
      <button
        ref={firstItemRef}
        className={`${styles.topBar__menuItem} ${
          !selectedCategory ? styles["topBar__menuItem--active"] : ""
        }`}
        type="button"
        role="menuitem"
        onClick={onSelectAll}
      >
        All Categories
      </button>

      {availableCategories.map((category) => {
        const categorySlug = toCategorySlug(category.label); // Normalize category slug.
        const isActive = selectedCategory === categorySlug; // Track active category.

        return (
          <div key={category.label} className={styles.topBar__menuGroup}>
            <button
              className={`${styles.topBar__menuItem} ${
                isActive && !selectedSubCategory
                  ? styles["topBar__menuItem--active"]
                  : ""
              }`}
              type="button"
              role="menuitem"
              onMouseEnter={() =>
                onSubMenuOpen(categorySlug, category.subCategories.length > 0)
              }
              onMouseMove={() =>
                onSubMenuOpen(categorySlug, category.subCategories.length > 0)
              }
              onClick={() => onSelectCategory(categorySlug)}
            >
              {category.label}
            </button>

            {category.subCategories.length > 0 ? (
              <div
                className={styles.topBar__subMenu}
                style={{
                  display: openCategory === categorySlug ? "flex" : "none",
                }}
                role="menu"
                aria-label="Subcategories"
                onMouseLeave={onSubMenuClose}
              >
                {category.subCategories.map((subCategory) => {
                  const subSlug = toCategorySlug(subCategory); // Normalize subcategory slug.
                  const isSubActive =
                    isActive && selectedSubCategory === subSlug; // Track active subcategory.

                  return (
                    <button
                      key={subCategory}
                      className={`${styles.topBar__subMenuItem} ${
                        isSubActive
                          ? styles["topBar__subMenuItem--active"]
                          : ""
                      }`}
                      type="button"
                      role="menuitem"
                      onClick={() => onSelectSubCategory(categorySlug, subSlug)}
                    >
                      {subCategory}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </>
  );
}

