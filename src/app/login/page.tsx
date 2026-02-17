import type { Metadata } from "next";
import { LoginForm } from "@/features/auth";
import { ProfileSettings } from "@/features/profile";
import styles from "@/app/login/page.module.css";

/**
 * Canonical metadata for this route.
 */
export const metadata: Metadata = {
  alternates: {
    canonical: "/login",
  },
};

/**
 * Login page route for full-page authentication flow.
 */
export default function LoginPage() {
  return (
    <div className={styles.loginPage}>
      {/* Two-panel auth and settings layout for profile management. */}
      <div className={styles.loginPage__layout}>
        <LoginForm />
        <ProfileSettings />
      </div>
    </div>
  );
}
