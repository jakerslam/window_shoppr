import Modal from "@/components/modal/Modal";
import SignupForm from "@/components/signup/SignupForm";
import styles from "@/app/@modal/(.)signup/page.module.css";

/**
 * Modal overlay for signup when navigating from a page.
 */
export default function SignupModal() {
  return (
    <Modal
      contentClassName={styles.signupModal}
      contentStyle={{ width: "min(420px, 92vw)" }}
    >
      {/* Modal-sized signup panel for quick access. */}
      <SignupForm
        subtitle="Create an account to save your favorites."
        switchLinkHref="/login"
        switchLinkLabel="Sign in"
        switchLabel="Already have an account?"
      />
    </Modal>
  );
}
