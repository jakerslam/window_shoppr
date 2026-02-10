import HomeFeed from "@/components/home-feed/HomeFeed";
import { fetchProducts } from "@/lib/data";
import styles from "@/app/page.module.css";

/**
 * Home page that loads product data and renders the feed.
 */
export default async function HomePage() {
  const products = await fetchProducts(); // Load products with SQL fallback.

  return (
    <div className={styles.homePage}>
      {/* Feed section for browsing products. */}
      <HomeFeed products={products} />
    </div>
  );
}
