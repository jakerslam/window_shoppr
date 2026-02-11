import LoginForm from "@/features/auth/LoginForm";
import styles from "@/app/login/page.module.css";

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
