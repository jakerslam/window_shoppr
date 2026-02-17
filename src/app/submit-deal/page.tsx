import type { Metadata } from "next";
import { SubmitDealForm } from "@/features/deal-submission";
import styles from "@/app/submit-deal/page.module.css";

/**
 * Canonical metadata for the deal submission route.
 */
export const metadata: Metadata = {
  title: "Submit Deal",
  alternates: {
    canonical: "/submit-deal",
  },
};

/**
 * Route entry for user-submitted deal links.
 */
export default function SubmitDealPage() {
  return (
    <div className={styles.submitDealPage}>
      <SubmitDealForm />
    </div>
  );
}
