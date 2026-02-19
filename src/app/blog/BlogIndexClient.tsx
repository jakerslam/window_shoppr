"use client";

import { useMemo } from "react";
import Link from "next/link";
import { BlogArticle } from "@/shared/lib/blog/types";
import { rankBlogArticlesForUser } from "@/shared/lib/blog/ranking";
import { formatBlogPublishedDate } from "@/shared/lib/blog/format";
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

  const featuredArticle = rankedArticles[0] ?? null;
  const remainingArticles = rankedArticles.slice(1);

  return (
    <div className={styles.blogPage__layout}>
      {featuredArticle ? (
        <section className={styles.blogPage__featured} aria-label="Featured article">
          <p className={styles.blogPage__kicker}>
            {featuredArticle.category} · {formatBlogPublishedDate(featuredArticle.publishedAt)}
          </p>
          <Link
            className={styles.blogPage__featuredLink}
            href={`/blog/${featuredArticle.slug}/`}
          >
            {featuredArticle.title}
          </Link>
          <p className={styles.blogPage__featuredSummary}>{featuredArticle.summary}</p>
        </section>
      ) : null}

      <ul className={styles.blogPage__list} aria-label="Latest articles">
        {remainingArticles.map((article) => (
          <li key={article.id} className={styles.blogPage__card}>
            <p className={styles.blogPage__kicker}>
              {article.category} · {formatBlogPublishedDate(article.publishedAt)}
            </p>
            <Link className={styles.blogPage__link} href={`/blog/${article.slug}/`}>
              {article.title}
            </Link>
            <p className={styles.blogPage__meta}>{article.summary}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
