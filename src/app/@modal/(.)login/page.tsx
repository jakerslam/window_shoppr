import Modal from "@/components/modal/Modal";
import LoginForm from "@/components/login/LoginForm";
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
      {/* Modal-sized login panel for quick access. */}
      <LoginForm
        subtitle="Sign in to save your finds."
        switchLinkHref="/signup"
        switchLinkLabel="Create account"
        switchLabel="New here?"
      />
    </Modal>
  );
}
