"use client";

import { toAssetPath } from "@/shared/lib/catalog/assets";
import { SITE_URL } from "@/shared/lib/platform/seo";
import ShareIcon from "@/shared/components/icons/ShareIcon";

const copyUrl = async (url: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
    return;
  }

  const hiddenInput = document.createElement("textarea");
  hiddenInput.value = url;
  hiddenInput.setAttribute("readonly", "");
  hiddenInput.style.position = "absolute";
  hiddenInput.style.left = "-9999px";
  document.body.appendChild(hiddenInput);
  hiddenInput.select();
  document.execCommand("copy");
  document.body.removeChild(hiddenInput);
};

export default function BlogShareButton({
  articleTitle,
  articleSlug,
  className,
}: {
  articleTitle: string;
  articleSlug: string;
  className: string;
}) {
  const handleShare = async () => {
    const shareUrl = `${SITE_URL}${toAssetPath(`/blog/${articleSlug}/`)}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: articleTitle,
          text: `Read: ${articleTitle}`,
          url: shareUrl,
        });
        return;
      }

      await copyUrl(shareUrl);
    } catch {
      // Ignore share cancellations and clipboard errors to keep the UI calm.
    }
  };

  return (
    <button
      className={className}
      type="button"
      aria-label="Share article"
      onClick={handleShare}
    >
      <ShareIcon />
      <span>Share</span>
    </button>
  );
}

