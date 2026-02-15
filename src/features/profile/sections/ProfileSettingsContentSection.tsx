"use client";

import { CATEGORY_LABELS, toCategorySlug } from "@/shared/lib/categories";
import { ContentPreferencesState, EmailFrequency } from "@/shared/lib/profile-settings";
import styles from "@/features/profile/ProfileSettings.module.css";

const CONTENT_CATEGORY_OPTIONS = CATEGORY_LABELS.map((label) => ({
  label,
  slug: toCategorySlug(label),
}));

/**
 * Content settings section (taste quiz, category taste, list-based recommendations).
 */
export default function ProfileSettingsContentSection({
  listNames,
  contentPreferences,
  personalizationEnabled,
  onTasteQuizOpen,
  onCategoryToggle,
  onRecommendationListChange,
  onEmailFrequencyChange,
  onPersonalizationToggle,
  onClearPersonalization,
}: {
  listNames: string[];
  contentPreferences: ContentPreferencesState;
  personalizationEnabled: boolean;
  onTasteQuizOpen: () => void;
  onCategoryToggle: (categorySlug: string) => void;
  onRecommendationListChange: (nextValue: string) => void;
  onEmailFrequencyChange: (nextFrequency: EmailFrequency) => void;
  onPersonalizationToggle: (enabled: boolean) => void;
  onClearPersonalization: () => void;
}) {
  return (
    <div className={styles.profileSettings__section}>
      <h3 className={styles.profileSettings__sectionTitle}>Content</h3>

      <div className={styles.profileSettings__actions}>
        <button
          className={styles.profileSettings__actionButton}
          type="button"
          onClick={onTasteQuizOpen} // Open the optional onboarding taste quiz.
        >
          Take the taste quiz
        </button>
      </div>

      <div className={styles.profileSettings__chipGrid}>
        {CONTENT_CATEGORY_OPTIONS.map((option) => {
          const isSelected = contentPreferences.preferredCategorySlugs.includes(option.slug);

          return (
            <button
              key={option.slug}
              className={`${styles.profileSettings__chip} ${
                isSelected ? styles["profileSettings__chip--active"] : ""
              }`}
              type="button"
              onClick={() => onCategoryToggle(option.slug)} // Toggle category taste preference.
              aria-pressed={isSelected}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <label className={styles.profileSettings__field}>
        <span className={styles.profileSettings__label}>Recommend based on a list</span>
        <select
          className={styles.profileSettings__select}
          value={contentPreferences.recommendationListName ?? ""}
          onChange={(event) => onRecommendationListChange(event.target.value)} // Update list-based recommendation selection.
        >
          <option value="">None</option>
          {listNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>

      <p className={styles.profileSettings__hint}>
        Picks on the home feed will lean toward items similar to what you save in that list.
      </p>

      <label className={styles.profileSettings__field}>
        <span className={styles.profileSettings__label}>Email frequency</span>
        <select
          className={styles.profileSettings__select}
          value={contentPreferences.emailFrequency}
          onChange={(event) =>
            onEmailFrequencyChange(event.target.value as EmailFrequency)
          } // Update content email frequency preference.
        >
          <option value="weekly">Weekly</option>
          <option value="twice-weekly">Twice Weekly</option>
          <option value="daily">Daily</option>
        </select>
      </label>

      <label className={styles.profileSettings__toggleRow}>
        <input
          className={styles.profileSettings__checkbox}
          type="checkbox"
          checked={personalizationEnabled}
          onChange={(event) => onPersonalizationToggle(event.target.checked)} // Toggle personalization enablement.
        />
        <span>Personalize my feed (local-only)</span>
      </label>

      <div className={styles.profileSettings__actions}>
        <button
          className={styles.profileSettings__dangerButton}
          type="button"
          onClick={onClearPersonalization} // Clear taste profile and recently viewed data.
        >
          Clear personalization data
        </button>
      </div>
    </div>
  );
}

