"use client";

import { ReactNode, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BlogArticle } from "@/shared/lib/blog/types";
import { trackBlogEvent } from "@/shared/lib/blog/analytics";
import { requestDataApi } from "@/shared/lib/platform/data-api";
import { PUBLIC_ENV } from "@/shared/lib/platform/env";
import { ProductSchema } from "@/shared/lib/catalog/schema";
import { Product } from "@/shared/lib/catalog/types";
import { ProductDetail } from "@/features/product-detail";
import LoadingSpinner from "@/shared/components/loading/LoadingSpinner";
import Modal from "@/shared/components/modal/Modal";
import EyeIcon from "@/shared/components/icons/EyeIcon";
import styles from "@/app/blog/[slug]/page.module.css";

const PREVIEW_TIMEOUT_MS = 7000; // Prevent preview modals from getting stuck indefinitely on slow/offline API calls.

/**
 * Render markdown-style inline links into React nodes.
 */
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

/**
 * Render paragraph/list blocks from section content.
 */
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previewSlug = searchParams.get("product"); // Query param used to open in-article product previews.
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [previewState, setPreviewState] = useState<"idle" | "loading" | "error">(
    "idle",
  );
  const previewEnabled =
    PUBLIC_ENV.deployTarget === "runtime" && Boolean(PUBLIC_ENV.dataApiUrl); // Only enable modal previews when a runtime Data API is configured.

  useEffect(() => {
    trackBlogEvent({
      type: "blog_article_open",
      slug: article.slug,
      timestamp: new Date().toISOString(),
      metadata: { category: article.category },
    });
  }, [article.category, article.slug]);

  /**
   * Fetch product details for the current preview slug.
   */
  useEffect(() => {
    if (!previewEnabled || !previewSlug) {
      const timeoutId = window.setTimeout(() => {
        setPreviewProduct(null); // Clear state when preview is closed or disabled.
        setPreviewState("idle"); // Reset loading state.
      }, 0);

      return () => {
        window.clearTimeout(timeoutId); // Clean up deferred state reset.
      };
    }

    let cancelled = false;
    const abortController = new AbortController();
    const inlinePreview =
      article.affiliateLinks.find((link) => link.productSlug === previewSlug)
        ?.productPreview ?? null; // Use inline preview data while API fetches (or when API is unreachable).
    const loadingTimeoutId = window.setTimeout(() => {
      if (inlinePreview) {
        setPreviewProduct(inlinePreview); // Show inline preview instantly when available.
        setPreviewState("idle"); // Avoid spinner when a preview is already available.
        return;
      }

      setPreviewProduct(null); // Clear previous product before fetching new preview.
      setPreviewState("loading"); // Show spinner while fetching.
    }, 0);
    const requestTimeoutId = window.setTimeout(() => {
      abortController.abort(); // Force-close hanging requests so the UI can recover.
    }, PREVIEW_TIMEOUT_MS);

    (async () => {
      const response = await requestDataApi<unknown>({
        path: `/data/products/${encodeURIComponent(previewSlug)}`,
        method: "GET",
        signal: abortController.signal,
      }); // Load one product by slug for the preview modal.

      if (cancelled) {
        return; // Ignore late responses after closing.
      }

      if (!response || !response.ok) {
        if (!inlinePreview) {
          setPreviewProduct(null);
          setPreviewState("error");
        } else {
          setPreviewState("idle"); // Keep inline preview visible when API fetch fails.
        }
        return;
      }

      const raw = (response.data as { product?: unknown })?.product ?? response.data; // Support enveloped and direct payloads.
      try {
        const validated = ProductSchema.parse(raw); // Validate payload before rendering.
        setPreviewProduct(validated);
        setPreviewState("idle");
      } catch {
        if (!inlinePreview) {
          setPreviewProduct(null);
          setPreviewState("error");
        } else {
          setPreviewState("idle"); // Keep inline preview visible when validation fails.
        }
      }
    })();

    return () => {
      cancelled = true; // Prevent state updates after unmount or slug changes.
      abortController.abort(); // Cancel in-flight preview requests when navigating away.
      window.clearTimeout(loadingTimeoutId); // Clean up deferred loading-state updates.
      window.clearTimeout(requestTimeoutId); // Clean up forced-timeout timer.
    };
  }, [article.affiliateLinks, previewEnabled, previewSlug]);

  /**
   * Open a product preview modal in-place by setting the product query param.
   */
  const handlePreviewOpen = useCallback(
    (productSlug: string) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set("product", productSlug); // Store preview slug in the URL for shareable modals.
      router.push(`${pathname}?${nextParams.toString()}`); // Navigate without leaving the article route.
    },
    [pathname, router, searchParams],
  );

  /**
   * Build product page href for static-export fallbacks.
   */
  const buildProductHref = useCallback(
    (productSlug: string) => `/product/${productSlug}/`,
    [],
  );

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
              <div className={styles.articlePage__affiliateRow}>
                <a
                  className={styles.articlePage__affiliateLink}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.label}
                </a>

                {link.productSlug ? (
                  previewEnabled ? (
                    <button
                      className={styles.articlePage__previewButton}
                      type="button"
                      aria-label={`Preview ${link.label}`}
                      onClick={() => handlePreviewOpen(link.productSlug!)} // Open the in-article preview modal.
                      title="Preview"
                    >
                      <EyeIcon />
                    </button>
                  ) : (
                    <Link
                      className={styles.articlePage__previewButton}
                      href={buildProductHref(link.productSlug)}
                      aria-label={`Preview ${link.label}`}
                      title="Preview"
                    >
                      <EyeIcon />
                    </Link>
                  )
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </aside>

      {previewEnabled && previewSlug ? (
        <Modal contentClassName={styles.articlePage__previewModal}>
          {previewState === "loading" && !previewProduct ? (
            <div className={styles.articlePage__previewLoading}>
              <LoadingSpinner label="Loading preview…" size={34} />
            </div>
          ) : previewProduct ? (
            <ProductDetail product={previewProduct} inModal origin="blog" />
          ) : (
            <div className={styles.articlePage__previewError}>
              <h2 className={styles.articlePage__previewErrorTitle}>
                Preview unavailable.
              </h2>
              <p className={styles.articlePage__previewErrorText}>
                We could not load this product preview right now.
              </p>
              <div className={styles.articlePage__previewErrorActions}>
                <button
                  className={styles.articlePage__previewErrorAction}
                  type="button"
                  onClick={() => router.back()} // Close the preview modal by removing query param.
                >
                  ← Back to article
                </button>
                <Link
                  className={styles.articlePage__previewErrorAction}
                  href={buildProductHref(previewSlug)}
                >
                  Open product page
                </Link>
              </div>
            </div>
          )}
        </Modal>
      ) : null}
    </div>
  );
}
