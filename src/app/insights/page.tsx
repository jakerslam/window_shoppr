import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/shared/lib/catalog/types";
import { INSIGHT_TEMPLATES } from "@/data/insight-templates";
import { buildIntentProductList } from "@/features/insights/insight-utils";
import { fetchProducts } from "@/shared/lib/catalog/data";
import styles from "@/app/insights/page.module.css";

export const metadata: Metadata = {
  title: "Insights | Window Shoppr",
  description:
    "AI-curated articles that match intent with curated picks, spotlighting products beside actionable FAQ guidance.",
};

export default async function InsightsPage() {
  const products = await fetchProducts();
  const enrichedInsights = INSIGHT_TEMPLATES.map((template) => ({
    ...template,
    recommendations: buildIntentProductList(template, products),
  }));

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: enrichedInsights.flatMap((template) =>
      template.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    ),
  };

  const InsightProductTile = ({ product }: { product: Product }) => (
    <article className={styles.insightProductTile}>
      <Link href={`/product/${product.slug}`} className={styles.insightProductTile__media}>
        <Image
          src={product.images[0]}
          alt={product.name}
          width={360}
          height={360}
          sizes="(max-width: 640px) 100vw, 140px"
          unoptimized
        />
      </Link>
      <Link href={`/product/${product.slug}`} className={styles.insightProductTile__name}>
        {product.name}
      </Link>
      <div className={styles.insightProductTile__meta}>
        <span>{product.retailer ?? "Window Shoppr"}</span>
        <span className={styles.insightProductTile__price}>${product.price.toFixed(2)}</span>
      </div>
    </article>
  );

  return (
    <main className={styles.insightsPage}>
      <header className={styles.insightsPage__heading}>
        <p className={styles.insightsPage__subtitle}>Window Shoppr Insights</p>
        <h1 className={styles.insightsPage__headingTitle}>Guides grounded in intent</h1>
        <p className={styles.insightsPage__subtitle}>
          Each pillar template pairs an intent prompt with curated picks, so you can shop the vibe
          rather than dig for deals.
        </p>
        <Link className="button button--primary" href="/submit-deal">
          Submit your own find
        </Link>
      </header>

      {enrichedInsights.map((insight) => (
        <section id={insight.slug} key={insight.slug} className={styles.insightCard}>
          <div className={styles.insightCard__hero}>
            <span className={styles.insightCard__pillar}>{insight.pillar}</span>
            <h2 className={styles.insightCard__title}>{insight.title}</h2>
            <p className={styles.insightCard__summary}>{insight.summary}</p>
            <p className={styles.insightCard__heroLine}>{insight.heroLine}</p>
            <p className={styles.insightCard__prompt}>{insight.prompt}</p>
          </div>

          <div className={styles.insightCard__products}>
            <div className={styles.insightCard__productGrid}>
              {insight.recommendations.map((product) => (
                <InsightProductTile key={product.id} product={product} />
              ))}
            </div>
            <Link href={`#${insight.slug}`}>
              Read the full guide for {insight.pillar.toLowerCase()}
            </Link>
          </div>

          <div className={styles.insightCard__faq}>
            <p className={styles.insightCard__faqTitle}>FAQ</p>
            {insight.faqs.map((faq) => (
              <div key={faq.question} className={styles.insightCard__faqItem}>
                <p className={styles.insightCard__faqQuestion}>{faq.question}</p>
                <p className={styles.insightCard__faqAnswer}>{faq.answer}</p>
              </div>
            ))}
            <script type="application/ld+json" className={styles.insightCard__faqSchema}>
              {JSON.stringify(faqSchema)}
            </script>
          </div>
        </section>
      ))}
    </main>
  );
}
