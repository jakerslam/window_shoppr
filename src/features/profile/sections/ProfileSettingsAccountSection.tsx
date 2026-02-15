"use client";

import {
  SPEED_LIMITS,
  FeedSpeedPreferences,
  ProfileSettingsState,
} from "@/shared/lib/profile-settings";
import styles from "@/features/profile/ProfileSettings.module.css";

/**
 * Account settings section (display name, marketing emails, feed speed).
 */
export default function ProfileSettingsAccountSection({
  settings,
  speedPreferences,
  onDisplayNameChange,
  onMarketingEmailsToggle,
  onCozySpeedChange,
  onQuickSpeedChange,
}: {
  settings: ProfileSettingsState;
  speedPreferences: FeedSpeedPreferences;
  onDisplayNameChange: (nextValue: string) => void;
  onMarketingEmailsToggle: (enabled: boolean) => void;
  onCozySpeedChange: (nextValue: number) => void;
  onQuickSpeedChange: (nextValue: number) => void;
}) {
  return (
    <div className={styles.profileSettings__section}>
      <h3 className={styles.profileSettings__sectionTitle}>Account</h3>

      <label className={styles.profileSettings__field}>
        <span className={styles.profileSettings__label}>Display name</span>
        <input
          className={styles.profileSettings__input}
          type="text"
          value={settings.displayName}
          onChange={(event) => onDisplayNameChange(event.target.value)} // Update display name preference.
          placeholder="How your profile should appear"
        />
      </label>

      <label className={styles.profileSettings__toggleRow}>
        <input
          className={styles.profileSettings__checkbox}
          type="checkbox"
          checked={settings.marketingEmails}
          onChange={(event) => onMarketingEmailsToggle(event.target.checked)} // Toggle marketing email preference.
        />
        <span>Receive weekly deal emails</span>
      </label>

      {/* Feed speed settings consumed by the home speed toggle. */}
      <div className={styles.profileSettings__speedGrid}>
        <label className={styles.profileSettings__field}>
          <span className={styles.profileSettings__label}>Cozy speed (slow mode)</span>
          <input
            className={styles.profileSettings__input}
            type="number"
            min={SPEED_LIMITS.cozyMin}
            max={SPEED_LIMITS.cozyMax}
            step="0.01"
            value={speedPreferences.cozyScale.toFixed(2)}
            onChange={(event) =>
              onCozySpeedChange(Number.parseFloat(event.target.value || "0"))
            } // Update cozy speed multiplier.
          />
        </label>

        <label className={styles.profileSettings__field}>
          <span className={styles.profileSettings__label}>Quick speed (fast mode)</span>
          <input
            className={styles.profileSettings__input}
            type="number"
            min={SPEED_LIMITS.quickMin}
            max={SPEED_LIMITS.quickMax}
            step="0.01"
            value={speedPreferences.quickScale.toFixed(2)}
            onChange={(event) =>
              onQuickSpeedChange(Number.parseFloat(event.target.value || "0"))
            } // Update quick speed multiplier.
          />
        </label>
      </div>

      <p className={styles.profileSettings__hint}>
        Lower numbers scroll faster. Quick stays faster than cozy.
      </p>
    </div>
  );
}

