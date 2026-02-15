"use client";

import { formatTemplate } from "@/features/preference-capture/taste-quiz/taste-quiz-utils";
import styles from "@/features/preference-capture/TasteQuizModal.module.css";

type CategoryOption = {
  label: string;
  slug: string;
};

/**
 * Step 1: Choose a few categories to bias initial recommendations.
 */
export default function TasteQuizStepCategories({
  categoryOptions,
  selectedCategorySlugs,
  maxCategories,
  stepTitleTemplate,
  notNowLabel,
  nextLabel,
  onToggleCategory,
  onNotNow,
  onNext,
}: {
  categoryOptions: CategoryOption[];
  selectedCategorySlugs: string[];
  maxCategories: number;
  stepTitleTemplate: string;
  notNowLabel: string;
  nextLabel: string;
  onToggleCategory: (categorySlug: string) => void;
  onNotNow: () => void;
  onNext: () => void;
}) {
  return (
    <>
      <h3 className={styles.tasteQuiz__sectionTitle}>
        {formatTemplate(stepTitleTemplate, {
          maxCategories,
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
              onClick={() => onToggleCategory(option.slug)} // Toggle category selection.
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
          onClick={onNotNow}
        >
          {notNowLabel}
        </button>
        <button
          className={`${styles.tasteQuiz__button} ${styles["tasteQuiz__button--primary"]}`}
          type="button"
          onClick={onNext} // Advance to the vibe step.
        >
          {nextLabel}
        </button>
      </div>
    </>
  );
}

