"use client";

import TasteQuizModal from "@/features/preference-capture/TasteQuizModal";
import ProfileSettingsAccountSection from "@/features/profile/sections/ProfileSettingsAccountSection";
import ProfileSettingsAppearanceSection from "@/features/profile/sections/ProfileSettingsAppearanceSection";
import ProfileSettingsContentSection from "@/features/profile/sections/ProfileSettingsContentSection";
import ProfileSettingsRewardsSection from "@/features/profile/sections/ProfileSettingsRewardsSection";
import ProfileSettingsSecuritySection from "@/features/profile/sections/ProfileSettingsSecuritySection";
import useProfileSettingsState from "@/features/profile/useProfileSettingsState";
import styles from "@/features/profile/ProfileSettings.module.css";
import { useWishlist } from "@/features/wishlist/wishlist";
import useAuthSessionState from "@/shared/lib/platform/useAuthSessionState";

/**
 * Profile settings panel for account, content, security, and theme preferences.
 */
export default function ProfileSettings() {
  const session = useAuthSessionState();
  const { listNames } = useWishlist(); // Wishlist list labels used for list-based recommendations.
  const {
    settings,
    themePreference,
    speedPreferences,
    contentPreferences,
    tasteProfile,
    isTasteQuizOpen,
    setIsTasteQuizOpen,
    setThemePreference,
    handleDisplayNameChange,
    handleMarketingEmailsToggle,
    handleLoginAlertsToggle,
    handleTwoFactorToggle,
    handleCozySpeedChange,
    handleQuickSpeedChange,
    handleCategoryToggle,
    handleRecommendationListChange,
    handleEmailFrequencyChange,
    handlePersonalizationToggle,
    handleClearPersonalization,
    handleTasteQuizApply,
  } = useProfileSettingsState({ listNames }); // Centralize profile settings state + persistence.

  if (!session) {
    return (
      <section className={styles.profileSettings} aria-labelledby="profile-settings-title">
        <header className={styles.profileSettings__header}>
          <h2 id="profile-settings-title" className={styles.profileSettings__title}>
            Profile Settings
          </h2>
          <p className={styles.profileSettings__subtitle}>
            Sign in to unlock account, preferences, and security controls.
          </p>
        </header>

        <div className={styles.profileSettings__section}>
          <h3 className={styles.profileSettings__sectionTitle}>Locked</h3>
          <p className={styles.profileSettings__hint}>
            Create an account or sign in to manage profile settings.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className={styles.profileSettings}
      aria-labelledby="profile-settings-title"
    >
      {/* Panel heading and helper text. */}
      <header className={styles.profileSettings__header}>
        <h2 id="profile-settings-title" className={styles.profileSettings__title}>
          Profile Settings
        </h2>
        <p className={styles.profileSettings__subtitle}>
          Account + security preferences are saved locally and synced when signed in.
        </p>
      </header>

      <ProfileSettingsAccountSection
        settings={settings}
        speedPreferences={speedPreferences}
        onDisplayNameChange={handleDisplayNameChange} // Update display name preference.
        onMarketingEmailsToggle={handleMarketingEmailsToggle} // Toggle marketing email preference.
        onCozySpeedChange={handleCozySpeedChange} // Update cozy speed multiplier.
        onQuickSpeedChange={handleQuickSpeedChange} // Update quick speed multiplier.
      />

      <ProfileSettingsRewardsSection />

      <ProfileSettingsContentSection
        listNames={listNames}
        contentPreferences={contentPreferences}
        personalizationEnabled={tasteProfile.personalizationEnabled}
        onTasteQuizOpen={() => setIsTasteQuizOpen(true)} // Open the optional onboarding taste quiz.
        onCategoryToggle={handleCategoryToggle} // Toggle category taste preference.
        onRecommendationListChange={handleRecommendationListChange} // Update list-based recommendation selection.
        onEmailFrequencyChange={handleEmailFrequencyChange} // Update email cadence preference.
        onPersonalizationToggle={handlePersonalizationToggle} // Toggle personalization enablement.
        onClearPersonalization={handleClearPersonalization} // Clear local-first personalization state.
      />

      <ProfileSettingsSecuritySection
        loginAlerts={settings.loginAlerts}
        requireTwoFactor={settings.requireTwoFactor}
        onLoginAlertsToggle={handleLoginAlertsToggle} // Toggle sign-in alert preference.
        onTwoFactorToggle={handleTwoFactorToggle} // Toggle 2FA preference stub.
      />

      <ProfileSettingsAppearanceSection
        themePreference={themePreference}
        onThemeChange={setThemePreference} // Persist theme preference.
      />

      {/* Autosave helper note. */}
      <p className={styles.profileSettings__status} role="status">
        Saved automatically
      </p>

      <TasteQuizModal
        isOpen={isTasteQuizOpen}
        initialCategorySlugs={contentPreferences.preferredCategorySlugs}
        onApply={handleTasteQuizApply} // Persist quiz results into local preferences.
        onClose={() => setIsTasteQuizOpen(false)} // Close the quiz modal.
      />
    </section>
  );
}
