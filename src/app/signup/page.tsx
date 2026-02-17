import type { Metadata } from "next";
import { SignupForm } from "@/features/auth";
import styles from "@/app/signup/page.module.css";

/**
 * Canonical metadata for this route.
 */
export const metadata: Metadata = {
  alternates: {
    canonical: "/signup",
  },
};

/**
 * Signup page route for full-page account creation.
 */
export default function SignupPage() {
  return (
    <div className={styles.signupPage}>
      {/* Centered signup form content. */}
      <SignupForm />
    </div>
  );
}
