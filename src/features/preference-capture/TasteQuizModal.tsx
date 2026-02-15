"use client";

import { useEffect, useMemo, useState } from "react";
import { CATEGORY_LABELS, toCategorySlug } from "@/shared/lib/categories";
import { PREFERENCE_QUESTION_BANK } from "@/shared/lib/preference-questions";
import styles from "@/features/preference-capture/TasteQuizModal.module.css";

const QUIZ_CONFIG = PREFERENCE_QUESTION_BANK.tasteQuiz; // Data-driven copy + selection caps.

/**
 * Replace simple {token} values in copy templates.
 */
const formatTemplate = (
  template: string,
  values: Record<string, string | number>,
) =>
  template.replace(/\{(\w+)\}/g, (match, token) =>
    Object.prototype.hasOwnProperty.call(values, token)
      ? String(values[token])
      : match,
  );

/**
 * Lightweight onboarding quiz that collects taste signals locally.
 */
export default function TasteQuizModal({
  isOpen,
  initialCategorySlugs,
  onApply,
  onClose,
}: {
  isOpen: boolean;
  initialCategorySlugs: string[];
  onApply: (nextCategorySlugs: string[], nextVibeTags: string[]) => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedCategorySlugs, setSelectedCategorySlugs] = useState<string[]>(
    [],
  );
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);

  const categoryOptions = useMemo(
    () =>
      CATEGORY_LABELS.map((label) => ({
        label,
        slug: toCategorySlug(label),
      })),
    [],
  );

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setStep(1); // Reset the quiz step each time the modal opens.
      setSelectedCategorySlugs(initialCategorySlugs); // Seed quiz selections from stored preferences.
      setSelectedVibes([]); // Reset vibes to keep the quiz lightweight.
    }, 0); // Defer state updates to avoid cascading render warnings.

    document.body.style.overflow = "hidden"; // Prevent background scroll while open.
    window.dispatchEvent(new CustomEvent("modal:toggle", { detail: { open: true } })); // Pause feed while open.

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose(); // Allow keyboard users to exit the quiz.
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(timeoutId); // Clean up deferred state updates when closing quickly.
      document.body.style.overflow = ""; // Restore background scroll.
      window.dispatchEvent(new CustomEvent("modal:toggle", { detail: { open: false } })); // Resume feed.
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [initialCategorySlugs, isOpen, onClose]);

  /**
   * Toggle a category preference chip selection.
   */
  const handleCategoryToggle = (categorySlug: string) => {
    setSelectedCategorySlugs((prev) => {
      const isSelected = prev.includes(categorySlug);

      if (isSelected) {
        return prev.filter((slug) => slug !== categorySlug); // Remove category selection.
      }

      if (prev.length >= QUIZ_CONFIG.maxCategories) {
        return prev; // Enforce a small cap to keep the quiz quick.
      }

      return [...prev, categorySlug]; // Add category selection.
    });
  };

  /**
   * Toggle a vibe tag selection for lightweight personalization.
   */
  const handleVibeToggle = (tagKey: string) => {
    setSelectedVibes((prev) => {
      const isSelected = prev.includes(tagKey);

      if (isSelected) {
        return prev.filter((entry) => entry !== tagKey); // Remove the vibe tag.
      }

      if (prev.length >= QUIZ_CONFIG.maxVibes) {
        return prev; // Keep vibe tags limited for a quick experience.
      }

      return [...prev, tagKey]; // Add vibe tag selection.
    });
  };

  /**
   * Apply quiz selections to the caller and close the modal.
   */
  const handleFinish = () => {
    onApply(selectedCategorySlugs, selectedVibes); // Persist taste selections to local storage.
    onClose(); // Close the modal after applying.
  };

  if (!isOpen) {
    return null; // Render nothing when the quiz is closed.
  }

  const stepMeta = formatTemplate(QUIZ_CONFIG.copy.stepMetaTemplate, {
    step,
    total: 2,
  }); // Build data-driven step meta copy.

  return (
    <div className={styles.tasteQuiz} role="dialog" aria-modal="true">
      <div
        className={styles.tasteQuiz__backdrop}
        onClick={onClose} // Allow click-away close for this optional quiz.
      />

      <div className={styles.tasteQuiz__card} onClick={(event) => event.stopPropagation()}>
        <header className={styles.tasteQuiz__header}>
          <div className={styles.tasteQuiz__titleGroup}>
            <div className={styles.tasteQuiz__stepMeta}>{stepMeta}</div>
            <h2 className={styles.tasteQuiz__title}>{QUIZ_CONFIG.copy.title}</h2>
            <p className={styles.tasteQuiz__subtitle}>{QUIZ_CONFIG.copy.subtitle}</p>
          </div>

          <button
            className={styles.tasteQuiz__close}
            type="button"
            onClick={onClose}
            aria-label="Close taste quiz"
          >
            ×
          </button>
        </header>

        {step === 1 ? (
          <>
            <h3 className={styles.tasteQuiz__sectionTitle}>
              {formatTemplate(QUIZ_CONFIG.copy.step1TitleTemplate, {
                maxCategories: QUIZ_CONFIG.maxCategories,
              })}
            </h3>
            <div className={styles.tasteQuiz__chipGrid}>
              {categoryOptions.map((option) => {
                const isSelected = selectedCategorySlugs.includes(option.slug);

                return (
                  <button
                    key={option.slug}
                    className={`${styles.tasteQuiz__chip} ${
                      isSelected ? styles["tasteQuiz__chip--active"] : ""
                    }`}
                    type="button"
                    onClick={() => handleCategoryToggle(option.slug)} // Toggle category selection.
                    aria-pressed={isSelected}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div className={styles.tasteQuiz__actions}>
              <button
                className={styles.tasteQuiz__button}
                type="button"
                onClick={onClose}
              >
                {QUIZ_CONFIG.copy.buttonNotNow}
              </button>
              <button
                className={`${styles.tasteQuiz__button} ${styles["tasteQuiz__button--primary"]}`}
                type="button"
                onClick={() => setStep(2)} // Advance to the vibe step.
              >
                {QUIZ_CONFIG.copy.buttonNext}
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className={styles.tasteQuiz__sectionTitle}>
              {formatTemplate(QUIZ_CONFIG.copy.step2TitleTemplate, {
                maxVibes: QUIZ_CONFIG.maxVibes,
              })}
            </h3>
            <div className={styles.tasteQuiz__chipGrid}>
              {QUIZ_CONFIG.vibeOptions.map((option) => {
                const isSelected = selectedVibes.includes(option.tagKey);

                return (
                  <button
                    key={option.tagKey}
                    className={`${styles.tasteQuiz__chip} ${
                      isSelected ? styles["tasteQuiz__chip--active"] : ""
                    }`}
                    type="button"
                    onClick={() => handleVibeToggle(option.tagKey)} // Toggle vibe selection.
                    aria-pressed={isSelected}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div className={styles.tasteQuiz__actions}>
              <button
                className={styles.tasteQuiz__button}
                type="button"
                onClick={() => setStep(1)} // Return to category step.
              >
                {QUIZ_CONFIG.copy.buttonBack}
              </button>
              <button
                className={`${styles.tasteQuiz__button} ${styles["tasteQuiz__button--primary"]}`}
                type="button"
                onClick={handleFinish} // Apply selected preferences.
              >
                {QUIZ_CONFIG.copy.buttonFinish}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
