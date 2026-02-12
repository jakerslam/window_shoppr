import Link from "next/link";
import styles from "@/app/not-found.module.css";

/**
 * Friendly 404 page for missing routes or products.
 */
export default function NotFound() {
  return (
    <div className={styles.notFound}>
      {/* Primary heading for missing content. */}
      <h1 className={styles.notFound__title}>We couldn’t find that window.</h1>

      {/* Supporting copy for navigation. */}
      <p className={styles.notFound__text}>
        That page is missing or has moved. Head back to the feed and keep browsing.
      </p>

      {/* Call to action back to the feed. */}
      <Link className={styles.notFound__action} href="/">
        ← Back to feed
      </Link>
    </div>
  );
}
