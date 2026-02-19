"use client";

import { useMemo } from "react";
import Link from "next/link";
import { BlogArticle } from "@/shared/lib/blog/types";
import { rankBlogArticlesForUser } from "@/shared/lib/blog/ranking";
import styles from "@/app/blog/page.module.css";

/**
 * Client-side ranking layer for blog index personalization.
 */
export default function BlogIndexClient({
  articles,
}: {
  articles: BlogArticle[];
}) {
  const rankedArticles = useMemo(
    () => rankBlogArticlesForUser(articles),
    [articles],
  );

  return (
    <ul className={styles.blogPage__list}>
      {rankedArticles.map((article) => (
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
  );
}
