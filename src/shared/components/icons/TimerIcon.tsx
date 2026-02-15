import type { SVGProps } from "react";

/**
 * Clock icon used for active deal countdown labels.
 */
export default function TimerIcon(props: SVGProps<SVGSVGElement>) {
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
      <circle cx="12" cy="12" r="8.25" />
      <path d="M12 7.6v4.7l3 1.9" />
    </svg>
  );
}
