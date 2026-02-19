"use client";

import { SubmitDealState } from "@/features/deal-submission/submit-deal-form-types";
import styles from "@/features/deal-submission/SubmitDealForm.module.css";

/**
 * Render a compact preview of the current deal submission payload.
 */
export default function SubmitDealPreview({ form }: { form: SubmitDealState }) {
  return (
    <aside className={styles.submitDeal__preview}>
      <h2 className={styles.submitDeal__previewTitle}>Preview</h2>
      <p><strong>Title:</strong> {form.title || "—"}</p>
      <p><strong>URL:</strong> {form.url || "—"}</p>
      <p><strong>Category:</strong> {form.category || "—"}</p>
      <p><strong>Subcategory:</strong> {form.subCategory || "—"}</p>
      <p><strong>Price:</strong> {form.salePrice || "—"}</p>
      <p><strong>Coupon:</strong> {form.couponCode || "—"}</p>
    </aside>
  );
}
