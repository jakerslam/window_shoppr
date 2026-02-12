import Modal from "@/shared/components/modal/Modal";
import LoginForm from "@/features/auth/LoginForm";
import styles from "@/app/@modal/(.)login/page.module.css";

/**
 * Modal overlay for login when navigating from a page.
 */
export default function LoginModal() {
  return (
    <Modal
      contentClassName={styles.loginModal}
      contentStyle={{ width: "min(420px, 92vw)" }}
    >
      <LoginForm
        subtitle="Sign in to save your finds."
        switchLinkHref="/signup"
        switchLinkLabel="Create account"
        switchLabel="New here?"
      />
    </Modal>
  );
}
