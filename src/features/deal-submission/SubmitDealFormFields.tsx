"use client";

import { CATEGORY_TREE } from "@/shared/lib/catalog/categories";
import { SubmitDealState } from "@/features/deal-submission/submit-deal-form-types";
import styles from "@/features/deal-submission/SubmitDealForm.module.css";

/**
 * Render the full submit-deal form fields and actions.
 */
export default function SubmitDealFormFields({
  form,
  isSubmitting,
  isPreviewOpen,
  statusMessage,
  selectedSubCategories,
  onUrlBlur,
  onFieldChange,
  onBooleanChange,
  onTogglePreview,
}: {
  form: SubmitDealState;
  isSubmitting: boolean;
  isPreviewOpen: boolean;
  statusMessage: string;
  selectedSubCategories: readonly string[];
  onUrlBlur: () => void;
  onFieldChange: (field: keyof SubmitDealState, value: string) => void;
  onBooleanChange: (field: keyof SubmitDealState, value: boolean) => void;
  onTogglePreview: () => void;
}) {
  return (
    <>
      <label className={styles.submitDeal__field}>
        Deal URL
        <input
          className={styles.submitDeal__input}
          type="url"
          value={form.url}
          onBlur={onUrlBlur}
          onChange={(event) => onFieldChange("url", event.target.value)}
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
          onChange={(event) => onFieldChange("title", event.target.value)}
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
            onChange={(event) => {
              onFieldChange("category", event.target.value);
              onFieldChange("subCategory", "");
            }}
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
            onChange={(event) => onFieldChange("subCategory", event.target.value)}
            disabled={selectedSubCategories.length === 0}
          >
            <option value="">Optional</option>
            {selectedSubCategories.map((subCategory) => (
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
            onChange={(event) => onFieldChange("salePrice", event.target.value)}
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
            onChange={(event) => onFieldChange("listPrice", event.target.value)}
            placeholder="Optional"
          />
        </label>

        <label className={styles.submitDeal__field}>
          Coupon code
          <input
            className={styles.submitDeal__input}
            type="text"
            value={form.couponCode}
            onChange={(event) => onFieldChange("couponCode", event.target.value)}
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
            onChange={(event) => onFieldChange("store", event.target.value)}
            placeholder="Optional"
          />
        </label>

        <label className={styles.submitDeal__field}>
          Brand
          <input
            className={styles.submitDeal__input}
            type="text"
            value={form.brand}
            onChange={(event) => onFieldChange("brand", event.target.value)}
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
          onChange={(event) => onFieldChange("notes", event.target.value)}
          placeholder="Optional context about why this is a good deal"
        />
      </label>

      <label className={styles.submitDeal__field}>
        Contact email (optional)
        <input
          className={styles.submitDeal__input}
          type="email"
          value={form.submitterEmail}
          onChange={(event) => onFieldChange("submitterEmail", event.target.value)}
          placeholder="you@example.com"
        />
      </label>

      <label className={styles.submitDeal__checkRow}>
        <input
          type="checkbox"
          checked={form.agreeIndependent}
          onChange={(event) => onBooleanChange("agreeIndependent", event.target.checked)}
        />
        I am not the seller and have no undisclosed affiliation with this listing.
      </label>

      <label className={styles.submitDeal__checkRow}>
        <input
          type="checkbox"
          checked={form.agreeAccuracy}
          onChange={(event) => onBooleanChange("agreeAccuracy", event.target.checked)}
        />
        This information is accurate to the best of my knowledge.
      </label>

      <div className={styles.submitDeal__actions}>
        <button
          className={styles.submitDeal__secondary}
          type="button"
          onClick={onTogglePreview}
        >
          {isPreviewOpen ? "Hide preview" : "Preview"}
        </button>
        <button className={styles.submitDeal__primary} type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit deal"}
        </button>
      </div>

      {statusMessage ? <p className={styles.submitDeal__status}>{statusMessage}</p> : null}
    </>
  );
}
