import type { SVGProps } from "react";

/**
 * Paper-airplane share icon used across card and product-detail actions.
 */
export default function ShareIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="M21 3L10.8 13.2" />
      <path d="M21 3L14.8 21L10.8 13.2L3 9.2L21 3Z" />
    </svg>
  );
}
