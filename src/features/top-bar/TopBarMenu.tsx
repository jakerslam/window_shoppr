"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getAvailableCategories } from "@/shared/lib/catalog/categories";
import { getProductCatalog } from "@/shared/lib/catalog/products";
import { useCategoryFilter } from "@/features/category-filter";
import TopBarCategoriesMenuList from "@/features/top-bar/menu/TopBarCategoriesMenuList";
import styles from "@/features/top-bar/TopBar.module.css";

/**
 * Categories dropdown menu with hoverable submenus.
 */
export default function TopBarMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const firstItemRef = useRef<HTMLButtonElement | null>(null);
  const availableCategories = getAvailableCategories(
    getProductCatalog(),
  ); // Filter category list based on available products.

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
    setOpenCategory(null); // Reset submenus on open.
  };

  /**
   * Close the categories menu and clear submenu hover state.
   */
  const handleMenuClose = () => {
    setIsMenuOpen(false); // Close the categories menu.
    setOpenCategory(null); // Reset submenus on close.
  };

  /**
   * Open a subcategory list for a hovered category.
   */
  const handleSubMenuOpen = (categorySlug: string, hasSubCategories: boolean) => {
    if (!hasSubCategories) {
      return; // Skip categories without submenus.
    }
    setOpenCategory(categorySlug); // Show submenu for this category.
  };

  /**
   * Close any open subcategory list.
   */
  const handleSubMenuClose = () => {
    setOpenCategory(null); // Hide any open submenu.
  };

  /**
   * Reset filters back to the full catalog view.
   */
  const handleSelectAll = () => {
    clearFilters(); // Reset filters.
    setIsMenuOpen(false); // Close menu after selection.
    handleSubMenuClose(); // Ensure submenu is closed after selection.
    if (pathname !== "/") {
      router.push("/"); // Return to the full feed when leaving another route.
    }
  };

  /**
   * Select a top-level category and return to the feed when needed.
   */
  const handleSelectCategory = (categorySlug: string) => {
    setCategory(categorySlug); // Filter by category.
    setIsMenuOpen(false); // Close menu after selection.
    handleSubMenuClose(); // Ensure submenu is closed after selection.
    router.push(`/c/${categorySlug}/`); // Navigate to the canonical category page.
  };

  /**
   * Select a subcategory and return to the feed when needed.
   */
  const handleSelectSubCategory = (categorySlug: string, subSlug: string) => {
    setSubCategory(categorySlug, subSlug); // Filter by subcategory.
    setIsMenuOpen(false); // Close menu after selection.
    handleSubMenuClose(); // Ensure submenu is closed after selection.
    router.push(`/c/${categorySlug}/${subSlug}/`); // Navigate to the canonical subcategory page.
  };

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
      setOpenCategory(null); // Reset submenu after focus leaves.
    }
  };

  const handleMenuFocus = (event: React.FocusEvent<HTMLDivElement>) => {
    if (triggerRef.current && (event.target as HTMLElement) === triggerRef.current) {
      handleMenuOpen(); // Only open on trigger focus for keyboard users.
    }
  };

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      handleMenuClose(); // Close menu from inside.
      setOpenCategory(null); // Reset submenu after escape.
      triggerRef.current?.focus(); // Return focus to trigger.
    }
  };

  return (
    <div
      className={styles.topBar__categories}
      onMouseEnter={handleMenuOpen}
      onMouseLeave={() => {
        handleMenuClose(); // Close when leaving the trigger region.
        setOpenCategory(null); // Reset submenu on leave.
      }}
      onFocus={handleMenuFocus}
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
        onMouseLeave={handleSubMenuClose}
      >
        <TopBarCategoriesMenuList
          availableCategories={availableCategories}
          selectedCategory={selectedCategory}
          selectedSubCategory={selectedSubCategory}
          openCategory={openCategory}
          firstItemRef={firstItemRef}
          onSelectAll={handleSelectAll}
          onSelectCategory={handleSelectCategory}
          onSelectSubCategory={handleSelectSubCategory}
          onSubMenuOpen={handleSubMenuOpen}
          onSubMenuClose={handleSubMenuClose}
        />
      </div>
    </div>
  );
}
