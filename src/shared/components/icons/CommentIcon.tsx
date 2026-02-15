import type { SVGProps } from "react";

/**
 * Compact comment bubble icon for social counters.
 */
export default function CommentIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M20 11.8a7.8 7.8 0 0 1-7.8 7.8H8.4L4 22v-4a7.8 7.8 0 1 1 16-6.2z" />
    </svg>
  );
}
