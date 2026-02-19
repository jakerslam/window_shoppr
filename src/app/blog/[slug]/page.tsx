import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogArticleBySlug, getBlogArticles } from "@/shared/lib/blog/data";
import { PUBLIC_ENV } from "@/shared/lib/platform/env";
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
export function generateMetadata({ params }: { params: { slug: string } }) {
  const article = getBlogArticleBySlug(params.slug);
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
export default function BlogArticlePage({ params }: { params: { slug: string } }) {
  const article = getBlogArticleBySlug(params.slug);
  if (!article) {
    notFound();
  }

  return (
    <article className={styles.articlePage}>
      <nav className={styles.articlePage__breadcrumbs} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/blog/">Blog</Link>
        <span>/</span>
        <span>{article.category}</span>
      </nav>

      <h1 className={styles.articlePage__title}>{article.title}</h1>
      <p className={styles.articlePage__meta}>
        {article.category} · {new Date(article.publishedAt).toLocaleDateString()}
      </p>
      <p className={styles.articlePage__body}>{article.summary}</p>

      <BlogArticleClient article={article} />
    </article>
  );
}
