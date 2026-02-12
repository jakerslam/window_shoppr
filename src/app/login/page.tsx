import type { Metadata } from "next";
import LoginForm from "@/features/auth/LoginForm";
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
      {/* Centered login form content. */}
      <LoginForm />
    </div>
  );
}
