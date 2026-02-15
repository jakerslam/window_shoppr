"use client";

/* eslint-disable @next/next/no-img-element */
import { useMemo, useState } from "react";
import WishlistSaveButton from "@/features/wishlist/WishlistSaveButton";
import { toAssetPath } from "@/shared/lib/catalog/assets";
import useThumbnailRail from "@/features/product-detail/media-gallery/useThumbnailRail";
import styles from "@/features/product-detail/ProductDetail.module.css";

/**
 * Gallery item shape for images and optional video.
 */
type GalleryItem = {
  type: "image" | "video";
  src: string;
};

/**
 * Normalize a YouTube URL into an embed URL when possible.
 */
const getVideoEmbedUrl = (videoUrl: string) => {
  if (videoUrl.includes("youtube.com/watch?v=")) {
    const id = videoUrl.split("watch?v=")[1]?.split("&")[0];
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }

  if (videoUrl.includes("youtu.be/")) {
    const id = videoUrl.split("youtu.be/")[1]?.split("?")[0];
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }

  return null;
};

const PLACEHOLDER_IMAGE = toAssetPath("/images/product-placeholder.svg");

/**
 * Product media gallery with image thumbnails and optional video support.
 */
export default function ProductMediaGallery({
  productId,
  images,
  videoUrl,
  name,
}: {
  productId: string;
  images: string[];
  videoUrl?: string;
  name: string;
}) {
  const galleryItems = useMemo(() => {
    const baseImages =
      images.length > 0 ? images : ["/images/product-placeholder.svg"]; // Keep all provided media items for overflow navigation.
    const items: GalleryItem[] = baseImages.map((src) => ({
      type: "image",
      src,
    }));

    if (videoUrl) {
      items.push({ type: "video", src: videoUrl });
    }

    return items;
  }, [images, videoUrl]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const safeSelectedIndex = Math.min(
    selectedIndex,
    Math.max(galleryItems.length - 1, 0),
  ); // Keep selected index in bounds.
  const {
    thumbsRef,
    scrollAxis,
    canScrollBackward,
    canScrollForward,
    shouldShowThumbNav,
    updateThumbScrollState,
    handleThumbNav,
    setThumbButtonRef,
  } = useThumbnailRail({
    itemCount: galleryItems.length,
    selectedIndex: safeSelectedIndex,
  }); // Manage overflow state + arrow/swipe nav for the thumbnail rail.
  const activeItem = galleryItems[safeSelectedIndex]; // Use the selected index for display.
  const embedUrl =
    activeItem?.type === "video" ? getVideoEmbedUrl(activeItem.src) : null; // Use embed if supported.

  return (
    <div className={styles.productDetail__gallery}>
      {/* Thumbnail rail with overflow arrows and touch-scroll support. */}
      <div className={styles.productDetail__thumbRail}>
        <button
          className={`${styles.productDetail__thumbNav} ${
            !shouldShowThumbNav ? styles["productDetail__thumbNav--hidden"] : ""
          }`}
          type="button"
          onClick={() => handleThumbNav("backward")} // Scroll toward the start of the rail.
          disabled={!canScrollBackward}
          aria-label="Scroll thumbnails backward"
        >
          {scrollAxis === "x" ? "◀" : "▲"}
        </button>

        <div
          ref={thumbsRef}
          className={styles.productDetail__thumbs}
          onScroll={updateThumbScrollState} // Sync arrow enabled states while users swipe/scroll.
        >
          {galleryItems.map((item, index) => (
            <button
              key={`${item.type}-${item.src}-${index}`}
              ref={(node) => setThumbButtonRef(index, node)}
              className={`${styles.productDetail__thumb} ${
                index === safeSelectedIndex
                  ? styles["productDetail__thumb--active"]
                  : ""
              }`}
              type="button"
              onClick={() => setSelectedIndex(index)} // Persist the selected media.
              onMouseEnter={() => setSelectedIndex(index)} // Select on hover.
              aria-label={`View ${item.type} ${index + 1}`}
            >
              {item.type === "video" ? (
                <span className={styles.productDetail__thumbLabel}>Video</span>
              ) : (
                <img
                  className={styles.productDetail__thumbImage}
                  src={toAssetPath(item.src)}
                  alt={name}
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.src = PLACEHOLDER_IMAGE; // Fall back when remote images fail.
                  }}
                />
              )}
            </button>
          ))}
        </div>

        <button
          className={`${styles.productDetail__thumbNav} ${
            !shouldShowThumbNav ? styles["productDetail__thumbNav--hidden"] : ""
          }`}
          type="button"
          onClick={() => handleThumbNav("forward")} // Scroll toward the end of the rail.
          disabled={!canScrollForward}
          aria-label="Scroll thumbnails forward"
        >
          {scrollAxis === "x" ? "▶" : "▼"}
        </button>
      </div>

      {/* Main media frame for image or video. */}
      <div className={styles.productDetail__mainImage}>
        {/* Save button pinned to the media frame. */}
        <WishlistSaveButton
          productId={productId}
          buttonClassName={styles.productDetail__save}
          savedClassName={styles["productDetail__save--saved"]}
          wrapperClassName={styles.productDetail__saveWrap}
        />

        {activeItem?.type === "video" ? (
          embedUrl ? (
            <iframe
              className={styles.productDetail__video}
              src={embedUrl}
              title={`${name} video`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              className={styles.productDetail__video}
              src={activeItem.src}
              controls
            />
          )
        ) : (
          <img
            className={styles.productDetail__mainImageMedia}
            src={toAssetPath(activeItem?.src ?? "/images/product-placeholder.svg")}
            alt={name}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.src = PLACEHOLDER_IMAGE; // Fall back when remote images fail.
            }}
          />
        )}
      </div>
    </div>
  );
}
