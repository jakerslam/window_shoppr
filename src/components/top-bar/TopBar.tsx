import Link from "next/link";
import styles from "@/components/top-bar/TopBar.module.css";

/**
 * Top navigation bar with branding, categories, search, and login placeholder.
 */
export default function TopBar() {
  const categories = [
    "Home & Kitchen",
    "Tech",
    "Health & Fitness",
    "Beauty & Personal Care",
    "Outdoors & Sports",
    "Pets",
  ];

  return (
    <header className={styles.topBar}>
      {/* Brand block for identity and home navigation. */}
      <div className={styles.topBar__brand}>
        <Link className={styles.topBar__logo} href="/">
          Window Shoppr
        </Link>
      </div>

      {/* Category navigation for discovery. */}
      <nav className={styles.topBar__nav} aria-label="Categories">
        {categories.map((category) => (
          <Link
            key={category}
            className={styles.topBar__navLink}
            href={`/category/${encodeURIComponent(category.toLowerCase())}`}
          >
            {category}
          </Link>
        ))}
      </nav>

      {/* Search input for client-side filtering later. */}
      <div className={styles.topBar__search}>
        <input
          className={styles.topBar__searchInput}
          type="search"
          placeholder="Search window finds"
          aria-label="Search products"
        />
      </div>

      {/* Action area for login placeholder. */}
      <div className={styles.topBar__actions}>
        <button className={styles.topBar__login} type="button">
          Login
        </button>
      </div>
    </header>
  );
}
