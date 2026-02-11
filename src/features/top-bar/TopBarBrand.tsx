"use client";

import Link from "next/link";
import styles from "@/features/top-bar/TopBar.module.css";

/**
 * Brand logo with optional redundant-navigation guard.
 */
export default function TopBarBrand({
  isOnAllCategories,
  onLogoClick,
}: {
  isOnAllCategories: boolean;
  onLogoClick?: () => void;
}) {
  /**
   * Prevent redundant navigation when already on the default feed.
   */
  const handleLogoClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (isOnAllCategories) {
      event.preventDefault(); // Skip navigation when already on the default feed.
    }
    onLogoClick?.(); // Allow parent to reset filters/search.
  };

  return (
    <div className={styles.topBar__brand}>
      <Link
        className={styles.topBar__logo}
        href="/"
        onClick={handleLogoClick} // Avoid redundant navigation on the default feed.
      >
        <span>Window</span>
        <span>Shoppr</span>
      </Link>
    </div>
  );
}
