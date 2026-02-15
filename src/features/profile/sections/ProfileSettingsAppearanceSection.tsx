"use client";

import { ThemePreference } from "@/shared/lib/profile/profile-settings";
import styles from "@/features/profile/ProfileSettings.module.css";

/**
 * Appearance settings section (theme preference selection).
 */
export default function ProfileSettingsAppearanceSection({
  themePreference,
  onThemeChange,
}: {
  themePreference: ThemePreference;
  onThemeChange: (nextValue: ThemePreference) => void;
}) {
  return (
    <div className={styles.profileSettings__section}>
      <h3 className={styles.profileSettings__sectionTitle}>Appearance</h3>

      <div
        className={styles.profileSettings__themeRow}
        role="group"
        aria-label="Theme preference"
      >
        {(["system", "light", "dark"] as ThemePreference[]).map((option) => (
          <button
            key={option}
            className={`${styles.profileSettings__themeButton} ${
              themePreference === option
                ? styles["profileSettings__themeButton--active"]
                : ""
            }`}
            type="button"
            onClick={() => onThemeChange(option)} // Persist selected theme preference.
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

