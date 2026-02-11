"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CATEGORY_TREE, toCategorySlug } from "@/lib/categories";
import { useCategoryFilter } from "@/components/category-filter/CategoryFilterProvider";
import styles from "@/components/top-bar/TopBar.module.css";

/**
 * Categories dropdown menu with hoverable submenus.
 */
export default function TopBarMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const firstItemRef = useRef<HTMLButtonElement | null>(null);
  const {
    selectedCategory,
    selectedSubCategory,
    clearFilters,
    setCategory,
    setSubCategory,
  } = useCategoryFilter();

  /**
   * Open the categories menu and reset hover state.
   */
  const handleMenuOpen = () => {
    setIsMenuOpen(true); // Open the categories menu.
    setHoveredCategory(null); // Reset submenu hover on open.
  };

  /**
   * Close the categories menu and clear submenu hover state.
   */
  const handleMenuClose = () => {
    setIsMenuOpen(false); // Close the categories menu.
    setHoveredCategory(null); // Clear submenu hover state.
  };

  /**
   * Track which category group is hovered for submenu visibility.
   */
  const handleMenuHover = (categorySlug: string | null) => {
    setHoveredCategory(categorySlug); // Update hovered category state.
  };

  useEffect(() => {
    if (!isMenuOpen) {
      setHoveredCategory(null); // Reset submenu state whenever the menu closes.
    }
  }, [isMenuOpen]);

  const handleTriggerKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsMenuOpen((prev) => !prev); // Toggle on keyboard activation.
      if (!isMenuOpen) {
        window.setTimeout(() => firstItemRef.current?.focus(), 0); // Focus first item.
      }
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      handleMenuOpen(); // Open menu on arrow down.
      window.setTimeout(() => firstItemRef.current?.focus(), 0); // Focus first item.
    }

    if (event.key === "Escape") {
      handleMenuClose(); // Close menu on escape.
      triggerRef.current?.focus(); // Return focus to trigger.
    }
  };

  const handleMenuBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      handleMenuClose(); // Close menu when focus leaves the menu.
    }
  };

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      handleMenuClose(); // Close menu from inside.
      triggerRef.current?.focus(); // Return focus to trigger.
    }
  };

  return (
    <div
      className={styles.topBar__categories}
      onMouseEnter={handleMenuOpen}
      onMouseLeave={handleMenuClose}
      onFocus={handleMenuOpen}
      onBlur={handleMenuBlur}
      onKeyDown={handleMenuKeyDown}
    >
      <button
        ref={triggerRef}
        className={styles.topBar__categoriesTrigger}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
        aria-controls="topbar-categories-menu"
        onClick={() => setIsMenuOpen((prev) => !prev)}
        onKeyDown={handleTriggerKeyDown}
      >
        Categories
      </button>

      <div
        id="topbar-categories-menu"
        className={`${styles.topBar__menu} ${isMenuOpen ? styles["topBar__menu--open"] : ""}`}
        role="menu"
        aria-label="Product categories"
      >
        <button
          ref={firstItemRef}
          className={`${styles.topBar__menuItem} ${
            !selectedCategory ? styles["topBar__menuItem--active"] : ""
          }`}
          type="button"
          role="menuitem"
          onClick={() => {
            clearFilters(); // Reset filters.
            setIsMenuOpen(false); // Close menu after selection.
            setHoveredCategory(null); // Reset submenu hover state.
            if (pathname !== "/") {
              router.push("/"); // Return to feed for category filtering.
            }
          }}
        >
          All Categories
        </button>

        {CATEGORY_TREE.map((category) => {
          const categorySlug = toCategorySlug(category.label); // Normalize category slug.
          const isActive = selectedCategory === categorySlug; // Track active category.

          return (
            <div
              key={category.label}
              className={styles.topBar__menuGroup}
              onMouseEnter={() => handleMenuHover(categorySlug)} // Reveal submenu on hover.
              onMouseLeave={() => handleMenuHover(null)} // Hide submenu when leaving the group.
            >
              <button
                className={`${styles.topBar__menuItem} ${
                  isActive && !selectedSubCategory
                    ? styles["topBar__menuItem--active"]
                    : ""
                }`}
                type="button"
                role="menuitem"
                onClick={() => {
                  setCategory(categorySlug); // Filter by category.
                  setIsMenuOpen(false); // Close menu after selection.
                  setHoveredCategory(null); // Reset submenu hover state.
                  if (pathname !== "/") {
                    router.push("/"); // Return to feed for category filtering.
                  }
                }}
              >
                {category.label}
              </button>

              {category.subCategories.length > 0 ? (
                <div
                  className={`${styles.topBar__subMenu} ${
                    isMenuOpen && hoveredCategory === categorySlug
                      ? styles["topBar__subMenu--open"]
                      : ""
                  }`}
                  role="menu"
                  aria-label="Subcategories"
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
                        onClick={() => {
                          setSubCategory(categorySlug, subSlug); // Filter by subcategory.
                          setIsMenuOpen(false); // Close menu after selection.
                          setHoveredCategory(null); // Reset submenu hover state.
                          if (pathname !== "/") {
                            router.push("/"); // Return to feed for subcategory filtering.
                          }
                        }}
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
      </div>
    </div>
  );
}
