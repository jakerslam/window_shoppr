"use client";

import { formatTemplate } from "@/features/preference-capture/taste-quiz/taste-quiz-utils";
import styles from "@/features/preference-capture/TasteQuizModal.module.css";

type VibeOption = {
  tagKey: string;
  label: string;
};

/**
 * Step 2: Pick a few vibe tags to keep the feed feeling personalized.
 */
export default function TasteQuizStepVibes({
  vibeOptions,
  selectedVibes,
  maxVibes,
  stepTitleTemplate,
  backLabel,
  finishLabel,
  onToggleVibe,
  onBack,
  onFinish,
}: {
  vibeOptions: VibeOption[];
  selectedVibes: string[];
  maxVibes: number;
  stepTitleTemplate: string;
  backLabel: string;
  finishLabel: string;
  onToggleVibe: (tagKey: string) => void;
  onBack: () => void;
  onFinish: () => void;
}) {
  return (
    <>
      <h3 className={styles.tasteQuiz__sectionTitle}>
        {formatTemplate(stepTitleTemplate, {
          maxVibes,
        })}
      </h3>
      <div className={styles.tasteQuiz__chipGrid}>
        {vibeOptions.map((option) => {
          const isSelected = selectedVibes.includes(option.tagKey);

          return (
            <button
              key={option.tagKey}
              className={`${styles.tasteQuiz__chip} ${
                isSelected ? styles["tasteQuiz__chip--active"] : ""
              }`}
              type="button"
              onClick={() => onToggleVibe(option.tagKey)} // Toggle vibe selection.
              aria-pressed={isSelected}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className={styles.tasteQuiz__actions}>
        <button className={styles.tasteQuiz__button} type="button" onClick={onBack}>
          {backLabel}
        </button>
        <button
          className={`${styles.tasteQuiz__button} ${styles["tasteQuiz__button--primary"]}`}
          type="button"
          onClick={onFinish} // Apply selected preferences.
        >
          {finishLabel}
        </button>
      </div>
    </>
  );
}

