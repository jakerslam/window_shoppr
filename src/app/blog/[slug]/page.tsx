import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogArticleBySlug, getBlogArticles } from "@/shared/lib/blog/data";
import { formatBlogPublishedDate } from "@/shared/lib/blog/format";
import { PUBLIC_ENV } from "@/shared/lib/platform/env";
import BlogShareButton from "@/app/blog/[slug]/BlogShareButton";
import BlogArticleClient from "@/app/blog/[slug]/BlogArticleClient";
import styles from "@/app/blog/[slug]/page.module.css";

/**
 * Generate static params for blog article fallback pages.
 */
export function generateStaticParams() {
  return getBlogArticles().map((article) => ({ slug: article.slug }));
}

/**
 * Generate canonical/SEO metadata for each blog article.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const { slug } = await Promise.resolve(params);
  const article = getBlogArticleBySlug(slug);
  if (!article) {
    return {};
  }

  const canonical = `${PUBLIC_ENV.siteUrl}/blog/${article.slug}/`;
  return {
    title: article.seoTitle,
    description: article.seoDescription,
    alternates: { canonical },
  };
}

/**
 * Blog article page with breadcrumbs, taxonomy, and canonical path.
 */
export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const { slug } = await Promise.resolve(params);
  const article = getBlogArticleBySlug(slug);
  if (!article) {
    notFound();
  }

  return (
    <article className={styles.articlePage}>
      <header className={styles.articlePage__header}>
        <div className={styles.articlePage__topRow}>
          <nav className={styles.articlePage__breadcrumbs} aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/blog/">Blog</Link>
            <span>/</span>
            <span>{article.category}</span>
          </nav>

          <BlogShareButton
            className={styles.articlePage__shareButton}
            articleTitle={article.title}
            articleSlug={article.slug}
          />
        </div>

        <h1 className={styles.articlePage__title}>{article.title}</h1>
        <p className={styles.articlePage__meta}>
          {article.category} · {formatBlogPublishedDate(article.publishedAt)}
        </p>
        <p className={styles.articlePage__disclosure}>
          Disclosure: This post contains affiliate links. If you buy through them, we may earn a
          commission at no extra cost to you.
        </p>
        <p className={styles.articlePage__dek}>{article.summary}</p>
      </header>

      <BlogArticleClient article={article} />
    </article>
  );
}
