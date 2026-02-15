"use client";

import styles from "@/features/profile/ProfileSettings.module.css";

/**
 * Security settings section (login alerts + 2FA stub).
 */
export default function ProfileSettingsSecuritySection({
  loginAlerts,
  requireTwoFactor,
  onLoginAlertsToggle,
  onTwoFactorToggle,
}: {
  loginAlerts: boolean;
  requireTwoFactor: boolean;
  onLoginAlertsToggle: (enabled: boolean) => void;
  onTwoFactorToggle: (enabled: boolean) => void;
}) {
  return (
    <div className={styles.profileSettings__section}>
      <h3 className={styles.profileSettings__sectionTitle}>Security</h3>

      <label className={styles.profileSettings__toggleRow}>
        <input
          className={styles.profileSettings__checkbox}
          type="checkbox"
          checked={loginAlerts}
          onChange={(event) => onLoginAlertsToggle(event.target.checked)} // Toggle sign-in alert preference.
        />
        <span>Notify me about new sign-ins</span>
      </label>

      <label className={styles.profileSettings__toggleRow}>
        <input
          className={styles.profileSettings__checkbox}
          type="checkbox"
          checked={requireTwoFactor}
          onChange={(event) => onTwoFactorToggle(event.target.checked)} // Toggle 2FA preference stub.
        />
        <span>Require two-factor verification (stub)</span>
      </label>
    </div>
  );
}

