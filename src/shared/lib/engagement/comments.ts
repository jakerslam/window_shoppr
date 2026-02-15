export type ProductComment = {
  id: string;
  productId: string;
  productSlug: string;
  author: string;
  body: string;
  createdAt: string;
  moderationState: "visible";
};

type CommentPayload = {
  productId: string;
  productSlug: string;
  author: string;
  body: string;
};

const COMMENT_STORAGE_KEY = "window_shoppr_product_comments"; // Local storage key for community comments.
const MAX_COMMENT_HISTORY = 600; // Keep a bounded local history per browser.

/**
 * Read all stored comments from local storage.
 */
const readCommentHistory = (): ProductComment[] => {
  if (typeof window === "undefined") {
    return []; // Skip storage reads during SSR.
  }

  try {
    const raw = window.localStorage.getItem(COMMENT_STORAGE_KEY) ?? "[]";
    const parsed = JSON.parse(raw) as ProductComment[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return []; // Fall back when local storage is unavailable or malformed.
  }
};

/**
 * Persist comments to local storage.
 */
const writeCommentHistory = (comments: ProductComment[]) => {
  if (typeof window === "undefined") {
    return; // Skip storage writes during SSR.
  }

  try {
    window.localStorage.setItem(COMMENT_STORAGE_KEY, JSON.stringify(comments));
  } catch {
    // Ignore write errors to avoid breaking product UI.
  }
};

/**
 * Get visible comments for a single product.
 */
export const getCommentsByProductId = (productId: string) =>
  readCommentHistory()
    .filter(
      (comment) =>
        comment.productId === productId &&
        comment.moderationState === "visible",
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)); // Newest first for recency.

/**
 * Submit a local-first product comment and broadcast an agent-friendly event.
 */
export const submitComment = ({
  productId,
  productSlug,
  author,
  body,
}: CommentPayload): ProductComment => {
  const comment: ProductComment = {
    id: `comment-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    productId,
    productSlug,
    author: author.trim() || "Anonymous",
    body: body.trim(),
    createdAt: new Date().toISOString(),
    moderationState: "visible",
  }; // Use a lightweight local id until backend persistence is available.

  const nextHistory = [...readCommentHistory(), comment].slice(
    -MAX_COMMENT_HISTORY,
  );
  writeCommentHistory(nextHistory);

  window.dispatchEvent(new CustomEvent("comment:submit", { detail: comment })); // Hook for future moderation queue ingestion.

  return comment;
};

