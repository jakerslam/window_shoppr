"use client";

import { useEffect } from "react";
import { BlogArticle } from "@/shared/lib/blog/types";
import { trackBlogEvent } from "@/shared/lib/blog/analytics";
import styles from "@/app/blog/[slug]/page.module.css";

const renderContentBlock = (content: string) =>
  content.split("\n\n").map((block, blockIndex) => {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    if (lines.length === 0) {
      return null;
    }

    if (lines.every((line) => /^\d+\.\s/.test(line) || /^-\s/.test(line))) {
      return (
        <ul key={`list-${blockIndex}`} className={styles.articlePage__list}>
          {lines.map((line) => (
            <li key={line} className={styles.articlePage__listItem}>
              {line.replace(/^\d+\.\s|^-\s/, "")}
            </li>
          ))}
        </ul>
      );
    }

    return (
      <p key={`p-${blockIndex}`} className={styles.articlePage__paragraph}>
        {lines.join(" ")}
      </p>
    );
  });

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

      <aside className={styles.articlePage__affiliateRail}>
        <h2 className={styles.articlePage__affiliateTitle}>Top picks from this post</h2>
        <ul className={styles.articlePage__affiliateList}>
          {article.affiliateLinks.map((link) => (
            <li key={link.href}>
              <a
                className={styles.articlePage__affiliateLink}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </aside>

      {article.sections.map((section, index) => (
        <section
          key={`${section.heading}-${index}`}
          className={styles.articlePage__section}
          data-kind={section.kind}
          data-layout={article.layoutVariant}
        >
          <h2 className={styles.articlePage__sectionTitle}>{section.heading}</h2>
          {renderContentBlock(section.content)}
        </section>
      ))}
    </>
  );
}
