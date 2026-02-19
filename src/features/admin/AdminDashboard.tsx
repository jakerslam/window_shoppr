"use client";

import useAuthSessionState from "@/shared/lib/platform/useAuthSessionState";
import styles from "@/app/insights/page.module.css";

/**
 * Admin operations dashboard stub gated by admin role.
 */
export default function AdminDashboard() {
  const session = useAuthSessionState();
  const isAdmin = Boolean(session?.roles.includes("admin"));

  if (!isAdmin) {
    return (
      <section className={styles.insightsPage}>
        <h1 className={styles.insightsPage__title}>Admin Dashboard</h1>
        <p className={styles.insightsPage__subtitle}>
          Unauthorized. Admin role required.
        </p>
      </section>
    );
  }

  return (
    <section className={styles.insightsPage}>
      <h1 className={styles.insightsPage__title}>Admin Dashboard</h1>
      <p className={styles.insightsPage__subtitle}>
        Queue health, violation monitoring, and analytics stubs.
      </p>
    </section>
  );
}
