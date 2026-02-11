import SignupForm from "@/features/auth/SignupForm";
import styles from "@/app/signup/page.module.css";

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
