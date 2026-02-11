"use client";

import Link from "next/link";
import styles from "@/components/top-bar/TopBar.module.css";

/**
 * Right-side action buttons for wishlist and login.
 */
export default function TopBarActions() {
  return (
    <div className={styles.topBar__actions}>
      <Link className={styles.topBar__actionButton} href="/wishlist">
        Wishlist
      </Link>
      <Link className={styles.topBar__actionButton} href="/login">
        Login
      </Link>
    </div>
  );
}
