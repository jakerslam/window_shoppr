import type { SVGProps } from "react";

/**
 * Friendly, Instagram-style rounded comment icon for social counters.
 */
export default function CommentIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.95"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M12 5.3c-4.8 0-8.7 3-8.7 6.8 0 2.2 1.3 4.1 3.3 5.3l-.9 3.3 3.8-2c.8.2 1.6.3 2.5.3 4.8 0 8.7-3 8.7-6.8s-3.9-6.9-8.7-6.9Z" />
    </svg>
  );
}
