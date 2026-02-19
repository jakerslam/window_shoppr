"use client";

import { ReactNode, useEffect } from "react";
import { BlogArticle } from "@/shared/lib/blog/types";
import { trackBlogEvent } from "@/shared/lib/blog/analytics";
import styles from "@/app/blog/[slug]/page.module.css";

const renderInlineMarkdown = (value: string): ReactNode[] => {
  const parts: ReactNode[] = [];
  const pattern = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
  let lastIndex = 0;
  let match = pattern.exec(value);

  while (match) {
    const [fullMatch, label, href] = match;
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      parts.push(value.slice(lastIndex, matchIndex));
    }
    parts.push(
      <a
        key={`${href}-${matchIndex}`}
        className={styles.articlePage__inlineLink}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {label}
      </a>,
    );
    lastIndex = matchIndex + fullMatch.length;
    match = pattern.exec(value);
  }

  if (lastIndex < value.length) {
    parts.push(value.slice(lastIndex));
  }

  return parts;
};

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
              {renderInlineMarkdown(line.replace(/^\d+\.\s|^-\s/, ""))}
            </li>
          ))}
        </ul>
      );
    }

    return (
      <p key={`p-${blockIndex}`} className={styles.articlePage__paragraph}>
        {renderInlineMarkdown(lines.join(" "))}
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
    <div className={styles.articlePage__content}>
      <div className={styles.articlePage__main}>
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
            {renderContentBlock(section.content)}
          </section>
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
    </div>
  );
}
