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
      <path d="M6.2 17.2c-1.3-1.2-2.2-2.9-2.2-4.8 0-3.9 3.6-7.1 8-7.1s8 3.2 8 7.1-3.6 7.1-8 7.1c-1.1 0-2.1-.2-3.1-.5L5.6 20l.6-2.8z" />
      <circle cx="9.2" cy="12.4" r="0.9" />
      <circle cx="12" cy="12.4" r="0.9" />
      <circle cx="14.8" cy="12.4" r="0.9" />
    </svg>
  );
}
