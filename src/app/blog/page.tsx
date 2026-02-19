import Link from "next/link";
import { getBlogArticles } from "@/shared/lib/blog/data";
import styles from "@/app/blog/page.module.css";

export const metadata = {
  title: "Blog | Window Shoppr",
  description: "Helpful buying guides, trend-driven picks, and product deep dives.",
};

/**
 * Blog index page with local-first article fallback.
 */
export default function BlogIndexPage() {
  const articles = getBlogArticles();

  return (
    <section className={styles.blogPage}>
      <h1 className={styles.blogPage__title}>Window Shoppr Blog</h1>
      <p className={styles.blogPage__subtitle}>
        Helpful guides and trend-driven picks connected to products you can shop.
      </p>

      <ul className={styles.blogPage__list}>
        {articles.map((article) => (
          <li key={article.id} className={styles.blogPage__card}>
            <Link className={styles.blogPage__link} href={`/blog/${article.slug}/`}>
              {article.title}
            </Link>
            <p className={styles.blogPage__meta}>
              {article.category} · {new Date(article.publishedAt).toLocaleDateString()}
            </p>
            <p className={styles.blogPage__meta}>{article.summary}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
