import styles from "@/components/footer/Footer.module.css";

/**
 * Footer placeholder for future links and site info.
 */
export default function Footer() {
  return (
    <footer className={styles.siteFooter}>
      {/* Footer content stub for future expansion. */}
      <div className={styles.siteFooter__inner}>
        <span className={styles.siteFooter__brand}>Window Shoppr</span>
        <span className={styles.siteFooter__note}>More footer links coming soon.</span>
      </div>
    </footer>
  );
}
