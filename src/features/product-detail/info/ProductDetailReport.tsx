"use client";

import { useCallback, useState } from "react";
import { submitReport } from "@/shared/lib/reports";
import styles from "@/features/product-detail/ProductDetail.module.css";

/**
 * Inline report form stub for flagging inaccurate or inappropriate listings.
 */
export default function ProductDetailReport({
  productId,
  productSlug,
}: {
  productId: string;
  productSlug: string;
}) {
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<
    "inaccuracy" | "inappropriate" | "spam" | "other"
  >("inaccuracy");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitted, setReportSubmitted] = useState(false);

  /**
   * Toggle the inline report form.
   */
  const handleReportToggle = useCallback(() => {
    setIsReportOpen((prev) => !prev);
  }, []);

  /**
   * Submit a report stub for agent review.
   */
  const handleReportSubmit = useCallback(() => {
    submitReport({
      productId,
      productSlug,
      reason: reportReason,
      details: reportDetails.trim() || undefined,
    });

    setReportSubmitted(true);
    setIsReportOpen(false);
    setReportDetails("");
  }, [productId, productSlug, reportDetails, reportReason]);

  return (
    <>
      {reportSubmitted ? (
        <p className={styles.productDetail__reportThanks}>Thanks for the report.</p>
      ) : null}

      <div className={styles.productDetail__report}>
        <button
          className={styles.productDetail__reportToggle}
          type="button"
          onClick={handleReportToggle}
        >
          Report this listing
        </button>

        {isReportOpen ? (
          <div className={styles.productDetail__reportForm}>
            <label className={styles.productDetail__reportLabel}>
              Reason
              <select
                className={styles.productDetail__reportSelect}
                value={reportReason}
                onChange={(event) =>
                  setReportReason(event.target.value as typeof reportReason)
                }
              >
                <option value="inaccuracy">Inaccurate info</option>
                <option value="inappropriate">Inappropriate content</option>
                <option value="spam">Spam</option>
                <option value="other">Other</option>
              </select>
            </label>

            <label className={styles.productDetail__reportLabel}>
              Details (optional)
              <textarea
                className={styles.productDetail__reportInput}
                rows={3}
                value={reportDetails}
                onChange={(event) => setReportDetails(event.target.value)}
              />
            </label>

            <button
              className={styles.productDetail__reportSubmit}
              type="button"
              onClick={handleReportSubmit}
            >
              Submit report
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}

