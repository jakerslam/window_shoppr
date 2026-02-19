"use client";

import { useMemo, useState } from "react";
import { CATEGORY_TREE } from "@/shared/lib/catalog/categories";
import { submitDealSubmission } from "@/shared/lib/engagement/deal-submissions";
import SubmitDealFormFields from "@/features/deal-submission/SubmitDealFormFields";
import SubmitDealPreview from "@/features/deal-submission/SubmitDealPreview";
import {
  DEFAULT_SUBMIT_DEAL_STATE,
  SubmitDealState,
} from "@/features/deal-submission/submit-deal-form-types";
import styles from "@/features/deal-submission/SubmitDealForm.module.css";

/**
 * URL-first deal submission form for user-contributed links.
 */
export default function SubmitDealForm() {
  const [form, setForm] = useState<SubmitDealState>(DEFAULT_SUBMIT_DEAL_STATE);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const selectedSubCategories = useMemo(
    () =>
      CATEGORY_TREE.find((category) => category.label === form.category)
        ?.subCategories ?? [],
    [form.category],
  );

  const updateField = (field: keyof SubmitDealState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateBooleanField = (field: keyof SubmitDealState, value: boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * Attempt lightweight title/store prefill from the entered URL.
   */
  const handleUrlPrefill = () => {
    if (!form.url.trim()) {
      return;
    }

    try {
      const parsed = new URL(form.url.trim());
      const hostLabel = parsed.hostname
        .replace(/^www\./, "")
        .split(".")[0]
        .replace(/[-_]+/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
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
      }));
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
    setForm(DEFAULT_SUBMIT_DEAL_STATE);
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
        <SubmitDealFormFields
          form={form}
          isSubmitting={isSubmitting}
          isPreviewOpen={isPreviewOpen}
          statusMessage={statusMessage}
          selectedSubCategories={selectedSubCategories}
          onUrlBlur={handleUrlPrefill}
          onFieldChange={updateField}
          onBooleanChange={updateBooleanField}
          onTogglePreview={() => setIsPreviewOpen((prev) => !prev)}
        />
      </form>

      {isPreviewOpen ? <SubmitDealPreview form={form} /> : null}
    </section>
  );
}
