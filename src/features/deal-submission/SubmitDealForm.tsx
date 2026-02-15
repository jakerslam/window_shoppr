"use client";

import { useMemo, useState } from "react";
import { CATEGORY_TREE } from "@/shared/lib/catalog/categories";
import { submitDealSubmission } from "@/shared/lib/engagement/deal-submissions";
import styles from "@/features/deal-submission/SubmitDealForm.module.css";

type SubmitDealState = {
  url: string;
  title: string;
  category: string;
  subCategory: string;
  salePrice: string;
  listPrice: string;
  couponCode: string;
  store: string;
  brand: string;
  notes: string;
  submitterEmail: string;
  agreeIndependent: boolean;
  agreeAccuracy: boolean;
};

const DEFAULT_STATE: SubmitDealState = {
  url: "",
  title: "",
  category: "",
  subCategory: "",
  salePrice: "",
  listPrice: "",
  couponCode: "",
  store: "",
  brand: "",
  notes: "",
  submitterEmail: "",
  agreeIndependent: false,
  agreeAccuracy: false,
};

/**
 * URL-first deal submission form for user-contributed links.
 */
export default function SubmitDealForm() {
  const [form, setForm] = useState<SubmitDealState>(DEFAULT_STATE);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const selectedCategory = useMemo(
    () => CATEGORY_TREE.find((category) => category.label === form.category) ?? null,
    [form.category],
  );

  /**
   * Attempt lightweight title/store prefill from the entered URL.
   */
  const handleUrlPrefill = () => {
    if (!form.url.trim()) {
      return; // Skip prefill when URL is empty.
    }

    try {
      const parsed = new URL(form.url.trim());
      const hostLabel = parsed.hostname
        .replace(/^www\./, "")
        .split(".")[0]
        .replace(/[-_]+/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase()); // Convert hostname to readable store label.
      const pathLabel = parsed.pathname
        .split("/")
        .filter(Boolean)
        .pop()
        ?.replace(/[-_]+/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());

      setForm((prev) => ({
        ...prev,
        store: prev.store || hostLabel,
        title: prev.title || pathLabel || prev.title,
      })); // Fill missing fields only.
    } catch {
      // Ignore invalid URLs during prefill; validation happens on submit.
    }
  };

  /**
   * Submit the deal link into moderation + enrichment queue.
   */
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatusMessage("");

    const parseNumber = (value: string) => {
      const normalized = Number.parseFloat(value);
      return Number.isFinite(normalized) ? normalized : undefined;
    };

    const result = await submitDealSubmission({
      url: form.url,
      title: form.title,
      category: form.category,
      subCategory: form.subCategory || undefined,
      salePrice: parseNumber(form.salePrice),
      listPrice: parseNumber(form.listPrice),
      couponCode: form.couponCode || undefined,
      store: form.store || undefined,
      brand: form.brand || undefined,
      notes: form.notes || undefined,
      submitterEmail: form.submitterEmail || undefined,
      agreeIndependent: form.agreeIndependent,
      agreeAccuracy: form.agreeAccuracy,
    });

    if (!result.ok) {
      setStatusMessage(result.message);
      setIsSubmitting(false);
      return;
    }

    setStatusMessage(
      result.mode === "sql"
        ? `Submitted. Queue id: ${result.id}`
        : `Submitted locally. Queue id: ${result.id}`,
    );
    setForm(DEFAULT_STATE);
    setIsPreviewOpen(false);
    setIsSubmitting(false);
  };

  return (
    <section className={styles.submitDeal} aria-labelledby="submit-deal-title">
      <header className={styles.submitDeal__header}>
        <h1 id="submit-deal-title" className={styles.submitDeal__title}>
          Submit a Deal
        </h1>
        <p className={styles.submitDeal__subtitle}>
          Share a product link and we&apos;ll queue it for moderation and enrichment.
        </p>
      </header>

      <form className={styles.submitDeal__form} onSubmit={handleSubmit}>
        <label className={styles.submitDeal__field}>
          Deal URL
          <input
            className={styles.submitDeal__input}
            type="url"
            value={form.url}
            onBlur={handleUrlPrefill}
            onChange={(event) => setForm((prev) => ({ ...prev, url: event.target.value }))}
            placeholder="https://example.com/product"
            required
          />
        </label>

        <label className={styles.submitDeal__field}>
          Deal title
          <input
            className={styles.submitDeal__input}
            type="text"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Short product/deal title"
            required
          />
        </label>

        <div className={styles.submitDeal__grid}>
          <label className={styles.submitDeal__field}>
            Category
            <select
              className={styles.submitDeal__input}
              value={form.category}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  category: event.target.value,
                  subCategory: "",
                }))
              }
              required
            >
              <option value="">Select category</option>
              {CATEGORY_TREE.map((category) => (
                <option key={category.label} value={category.label}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.submitDeal__field}>
            Subcategory
            <select
              className={styles.submitDeal__input}
              value={form.subCategory}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, subCategory: event.target.value }))
              }
              disabled={!selectedCategory}
            >
              <option value="">Optional</option>
              {(selectedCategory?.subCategories ?? []).map((subCategory) => (
                <option key={subCategory} value={subCategory}>
                  {subCategory}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.submitDeal__field}>
            Sale price
            <input
              className={styles.submitDeal__input}
              type="number"
              step="0.01"
              min="0"
              value={form.salePrice}
              onChange={(event) => setForm((prev) => ({ ...prev, salePrice: event.target.value }))}
              placeholder="Optional"
            />
          </label>

          <label className={styles.submitDeal__field}>
            List price
            <input
              className={styles.submitDeal__input}
              type="number"
              step="0.01"
              min="0"
              value={form.listPrice}
              onChange={(event) => setForm((prev) => ({ ...prev, listPrice: event.target.value }))}
              placeholder="Optional"
            />
          </label>

          <label className={styles.submitDeal__field}>
            Coupon code
            <input
              className={styles.submitDeal__input}
              type="text"
              value={form.couponCode}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, couponCode: event.target.value }))
              }
              placeholder="Optional (e.g. SAVE10)"
            />
          </label>
        </div>

        <div className={styles.submitDeal__grid}>
          <label className={styles.submitDeal__field}>
            Store
            <input
              className={styles.submitDeal__input}
              type="text"
              value={form.store}
              onChange={(event) => setForm((prev) => ({ ...prev, store: event.target.value }))}
              placeholder="Optional"
            />
          </label>

          <label className={styles.submitDeal__field}>
            Brand
            <input
              className={styles.submitDeal__input}
              type="text"
              value={form.brand}
              onChange={(event) => setForm((prev) => ({ ...prev, brand: event.target.value }))}
              placeholder="Optional"
            />
          </label>
        </div>

        <label className={styles.submitDeal__field}>
          Notes
          <textarea
            className={styles.submitDeal__textarea}
            rows={4}
            value={form.notes}
            onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
            placeholder="Optional context about why this is a good deal"
          />
        </label>

        <label className={styles.submitDeal__field}>
          Contact email (optional)
          <input
            className={styles.submitDeal__input}
            type="email"
            value={form.submitterEmail}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, submitterEmail: event.target.value }))
            }
            placeholder="you@example.com"
          />
        </label>

        <label className={styles.submitDeal__checkRow}>
          <input
            type="checkbox"
            checked={form.agreeIndependent}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, agreeIndependent: event.target.checked }))
            }
          />
          I am not the seller and have no undisclosed affiliation with this listing.
        </label>

        <label className={styles.submitDeal__checkRow}>
          <input
            type="checkbox"
            checked={form.agreeAccuracy}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, agreeAccuracy: event.target.checked }))
            }
          />
          This information is accurate to the best of my knowledge.
        </label>

        <div className={styles.submitDeal__actions}>
          <button
            className={styles.submitDeal__secondary}
            type="button"
            onClick={() => setIsPreviewOpen((prev) => !prev)}
          >
            {isPreviewOpen ? "Hide preview" : "Preview"}
          </button>
          <button className={styles.submitDeal__primary} type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit deal"}
          </button>
        </div>

        {statusMessage ? <p className={styles.submitDeal__status}>{statusMessage}</p> : null}
      </form>

      {isPreviewOpen ? (
        <aside className={styles.submitDeal__preview}>
          <h2 className={styles.submitDeal__previewTitle}>Preview</h2>
          <p><strong>Title:</strong> {form.title || "—"}</p>
          <p><strong>URL:</strong> {form.url || "—"}</p>
          <p><strong>Category:</strong> {form.category || "—"}</p>
          <p><strong>Subcategory:</strong> {form.subCategory || "—"}</p>
          <p><strong>Price:</strong> {form.salePrice || "—"}</p>
          <p><strong>Coupon:</strong> {form.couponCode || "—"}</p>
        </aside>
      ) : null}
    </section>
  );
}
