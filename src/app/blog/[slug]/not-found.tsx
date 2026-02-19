import Link from "next/link";
import styles from "@/app/blog/[slug]/not-found.module.css";

/**
 * Blog-specific 404 fallback with route-safe return to blog index.
 */
export default function BlogArticleNotFound() {
  return (
    <section className={styles.blogNotFound}>
      <h1 className={styles.blogNotFound__title}>Couldn&apos;t find the blog.</h1>
      <p className={styles.blogNotFound__body}>
        It may have moved, been unpublished, or the link may be outdated.
      </p>
      <Link className={styles.blogNotFound__button} href="/blog/">
        Back To Blog Feed
      </Link>
    </section>
  );
}
