"use client";

import { useEffect } from "react";
import { BlogArticle } from "@/shared/lib/blog/types";
import { trackBlogEvent } from "@/shared/lib/blog/analytics";
import styles from "@/app/blog/[slug]/page.module.css";

/**
 * Client article renderer with section layouts + analytics tracking.
 */
export default function BlogArticleClient({ article }: { article: BlogArticle }) {
  useEffect(() => {
    trackBlogEvent({
      type: "blog_article_open",
      slug: article.slug,
      timestamp: new Date().toISOString(),
      metadata: { category: article.category },
    });
  }, [article.category, article.slug]);

  return (
    <>
      <div className={styles.articlePage__tags} aria-label="Tags">
        {article.tags.map((tag) => (
          <span key={tag} className={styles.articlePage__tag}>
            {tag}
          </span>
        ))}
      </div>

      {article.sections.map((section, index) => (
        <section
          key={`${section.heading}-${index}`}
          className={styles.articlePage__section}
          data-kind={section.kind}
          data-layout={article.layoutVariant}
        >
          <h2 className={styles.articlePage__sectionTitle}>{section.heading}</h2>
          <p className={styles.articlePage__body}>{section.content}</p>
        </section>
      ))}
    </>
  );
}
