import type { SVGProps } from "react";

/**
 * Friendly rounded comment icon for social counters.
 */
export default function CommentIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M7.4 6.7h9.2c2.4 0 4.4 2 4.4 4.4v4c0 2.4-2 4.4-4.4 4.4h-6.7l-3.6 2.8.9-2.8h-.2c-2.4 0-4.4-2-4.4-4.4v-4c0-2.4 2-4.4 4.4-4.4Z" />
      <path d="M8.8 12.9h6.4" />
    </svg>
  );
}
