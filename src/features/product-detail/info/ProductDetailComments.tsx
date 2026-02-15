"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  getCommentsByProductId,
  ProductComment,
  submitComment,
} from "@/shared/lib/engagement/comments";
import { readAuthSession } from "@/shared/lib/platform/auth-session";
import styles from "@/features/product-detail/ProductDetail.module.css";

const MIN_COMMENT_LENGTH = 3; // Avoid submitting empty or low-signal comments.
const MAX_RENDERED_COMMENTS = 25; // Keep the UI compact and fast.

/**
 * Product page community notes with local-first persistence and moderation hooks.
 */
export default function ProductDetailComments({
  productId,
  productSlug,
}: {
  productId: string;
  productSlug: string;
}) {
  const [commentsVersion, setCommentsVersion] = useState(0);
  const [author, setAuthor] = useState("");
  const [body, setBody] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  void commentsVersion; // Rerender trigger for comment refresh events.
  const comments = isAuthenticated
    ? getCommentsByProductId(productId).slice(0, MAX_RENDERED_COMMENTS)
    : []; // Read visible comments from local storage when auth/session state changes.

  /**
   * Keep comment gating in sync with the current auth session stub.
   */
  useEffect(() => {
    const syncAuthState = () => {
      setIsAuthenticated(Boolean(readAuthSession())); // Gate comments behind auth.
    };

    syncAuthState(); // Initialize from storage.

    const handleSessionUpdate = () => {
      syncAuthState(); // React immediately when auth session changes in this tab.
    };

    const handleStorageUpdate = (event: StorageEvent) => {
      if (event.key === "window_shoppr_auth_session") {
        syncAuthState(); // Sync when auth state changes in another tab.
      }
    };

    window.addEventListener("auth:session", handleSessionUpdate);
    window.addEventListener("storage", handleStorageUpdate);

    return () => {
      window.removeEventListener("auth:session", handleSessionUpdate);
      window.removeEventListener("storage", handleStorageUpdate);
    };
  }, []);

  /**
   * Subscribe to cross-component comment events for live updates.
   */
  useEffect(() => {
    const handleCommentSubmit = (event: Event) => {
      const customEvent = event as CustomEvent<ProductComment>;
      const incoming = customEvent.detail;

      if (!incoming || incoming.productId !== productId) {
        return; // Ignore comments for other products.
      }

      setCommentsVersion((prev) => prev + 1); // Refresh comments from storage when a new product note arrives.
    };

    window.addEventListener("comment:submit", handleCommentSubmit);

    return () => {
      window.removeEventListener("comment:submit", handleCommentSubmit);
    };
  }, [productId]);

  const commentsLabel = useMemo(() => {
    if (comments.length === 0) {
      return "No community notes yet.";
    }

    return `${comments.length} community note${comments.length === 1 ? "" : "s"}`;
  }, [comments.length]);

  /**
   * Submit a new comment with basic validation and local persistence.
   */
  const handleSubmit = useCallback(() => {
    if (!isAuthenticated) {
      setErrorMessage("Please sign in to post a note.");
      return;
    }

    const trimmedBody = body.trim();

    if (trimmedBody.length < MIN_COMMENT_LENGTH) {
      setErrorMessage("Please add at least 3 characters.");
      setIsSubmitted(false);
      return;
    }

    submitComment({
      productId,
      productSlug,
      author,
      body: trimmedBody,
    });

    setCommentsVersion((prev) => prev + 1); // Refresh comments from storage after local submit.
    setBody("");
    setErrorMessage("");
    setIsSubmitted(true);
  }, [author, body, isAuthenticated, productId, productSlug]);

  if (!isAuthenticated) {
    return (
      <section className={styles.productDetail__comments}>
        <div className={styles.productDetail__commentsHeader}>
          <h2 className={styles.productDetail__commentsTitle}>Community notes</h2>
        </div>
        <p className={styles.productDetail__commentsHint}>
          Sign in to view and post notes on this product.
        </p>
        <Link className={styles.productDetail__commentLogin} href="/login">
          Sign in to comment
        </Link>
      </section>
    );
  }

  return (
    <section className={styles.productDetail__comments}>
      <div className={styles.productDetail__commentsHeader}>
        <h2 className={styles.productDetail__commentsTitle}>Community notes</h2>
        <p className={styles.productDetail__commentsHint}>{commentsLabel}</p>
      </div>

      <div className={styles.productDetail__commentForm}>
        <label className={styles.productDetail__reportLabel}>
          Name (optional)
          <input
            className={styles.productDetail__commentInput}
            type="text"
            maxLength={40}
            value={author}
            onChange={(event) => setAuthor(event.target.value)}
            placeholder="Anonymous"
          />
        </label>

        <label className={styles.productDetail__reportLabel}>
          Add a note
          <textarea
            className={styles.productDetail__commentTextarea}
            rows={3}
            maxLength={500}
            value={body}
            onChange={(event) => {
              setBody(event.target.value);
              if (errorMessage) {
                setErrorMessage(""); // Clear validation message while user edits.
              }
            }}
            placeholder="Share your experience with this product..."
          />
        </label>

        {errorMessage ? (
          <p className={styles.productDetail__commentError}>{errorMessage}</p>
        ) : null}
        {isSubmitted ? (
          <p className={styles.productDetail__commentSuccess}>Note posted.</p>
        ) : null}

        <button
          className={styles.productDetail__commentSubmit}
          type="button"
          onClick={handleSubmit}
        >
          Post note
        </button>
      </div>

      {comments.length > 0 ? (
        <ul className={styles.productDetail__commentList}>
          {comments.map((comment) => (
            <li key={comment.id} className={styles.productDetail__commentItem}>
              <div className={styles.productDetail__commentMeta}>
                <span className={styles.productDetail__commentAuthor}>
                  {comment.author}
                </span>
                <time className={styles.productDetail__commentDate}>
                  {new Date(comment.createdAt).toLocaleDateString()}
                </time>
              </div>
              <p className={styles.productDetail__commentBody}>{comment.body}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
