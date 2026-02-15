"use client";

import { useCallback, useMemo, useState } from "react";
import { CATEGORY_LABELS, toCategorySlug } from "@/shared/lib/catalog/categories";
import { PREFERENCE_QUESTION_BANK } from "@/shared/lib/profile/preference-questions";
import useTasteQuizModalLifecycle from "@/features/preference-capture/useTasteQuizModalLifecycle";
import { formatTemplate } from "@/features/preference-capture/taste-quiz/taste-quiz-utils";
import TasteQuizStepCategories from "@/features/preference-capture/taste-quiz/TasteQuizStepCategories";
import TasteQuizStepVibes from "@/features/preference-capture/taste-quiz/TasteQuizStepVibes";
import styles from "@/features/preference-capture/TasteQuizModal.module.css";

const QUIZ_CONFIG = PREFERENCE_QUESTION_BANK.tasteQuiz; // Data-driven copy + selection caps.

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

  /**
   * Reset the quiz state each time the modal opens.
   */
  const resetQuizState = useCallback(() => {
    setStep(1); // Reset the quiz step each time the modal opens.
    setSelectedCategorySlugs(initialCategorySlugs); // Seed quiz selections from stored preferences.
    setSelectedVibes([]); // Reset vibes to keep the quiz lightweight.
  }, [initialCategorySlugs]);

  useTasteQuizModalLifecycle({
    isOpen,
    onReset: resetQuizState,
    onClose,
  }); // Handle scroll locking + escape close + feed pause events.

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
          <TasteQuizStepCategories
            categoryOptions={categoryOptions}
            selectedCategorySlugs={selectedCategorySlugs}
            maxCategories={QUIZ_CONFIG.maxCategories}
            stepTitleTemplate={QUIZ_CONFIG.copy.step1TitleTemplate}
            notNowLabel={QUIZ_CONFIG.copy.buttonNotNow}
            nextLabel={QUIZ_CONFIG.copy.buttonNext}
            onToggleCategory={handleCategoryToggle}
            onNotNow={onClose}
            onNext={() => setStep(2)}
          />
        ) : (
          <TasteQuizStepVibes
            vibeOptions={QUIZ_CONFIG.vibeOptions}
            selectedVibes={selectedVibes}
            maxVibes={QUIZ_CONFIG.maxVibes}
            stepTitleTemplate={QUIZ_CONFIG.copy.step2TitleTemplate}
            backLabel={QUIZ_CONFIG.copy.buttonBack}
            finishLabel={QUIZ_CONFIG.copy.buttonFinish}
            onToggleVibe={handleVibeToggle}
            onBack={() => setStep(1)}
            onFinish={handleFinish}
          />
        )}
      </div>
    </div>
  );
}
