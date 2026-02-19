import BlogIndexClient from "@/app/blog/BlogIndexClient";
import { getBlogCatalog } from "@/shared/lib/blog/cms";
import styles from "@/app/blog/page.module.css";

export const metadata = {
  title: "Blog | Window Shoppr",
  description: "Helpful buying guides, trend-driven picks, and product deep dives.",
};

/**
 * Blog index page with local-first article fallback.
 */
export default async function BlogIndexPage() {
  const { items: articles } = await getBlogCatalog();

  return (
    <section className={styles.blogPage}>
      <h1 className={styles.blogPage__title}>Window Shoppr Blog</h1>
      <p className={styles.blogPage__subtitle}>
        Helpful guides and trend-driven picks connected to products you can shop.
      </p>

      <BlogIndexClient articles={articles} />
    </section>
  );
}
