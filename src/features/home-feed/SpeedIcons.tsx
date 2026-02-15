import type { SVGProps } from "react";

type SpeedIconProps = SVGProps<SVGSVGElement>;

/**
 * Monochrome turtle icon for cozy speed mode.
 */
export function TurtleSpeedIcon(props: SpeedIconProps) {
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
      <path d="M8 10.5h7.5c2.1 0 3.8 1.7 3.8 3.8S17.6 18 15.5 18H8.2c-2.9 0-5.2-2.1-5.2-4.7s2.3-4.8 5-4.8z" />
      <path d="M17.8 12.2h1.8a1.4 1.4 0 0 1 0 2.8h-1.3" />
      <path d="M7 18v1.3M11 18v1.3M14.8 18v1.3" />
      <path d="M8.2 10.5V9.2a2.4 2.4 0 0 1 2.4-2.4h2.1a2.4 2.4 0 0 1 2.4 2.4v1.3" />
    </svg>
  );
}

/**
 * Monochrome rabbit icon for quick speed mode.
 */
export function RabbitSpeedIcon(props: SpeedIconProps) {
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
      <path d="M8.6 10.6V6.2a1.4 1.4 0 0 1 2.8 0v3.1" />
      <path d="M12.1 10.2V5.4a1.4 1.4 0 0 1 2.8 0v4.1" />
      <path d="M7 17.6h6.8c2 0 3.6-1.5 3.6-3.4S15.8 11 13.8 11H9.9C8.3 11 7 12.2 7 13.8v3.8z" />
      <path d="M5.4 14.2c0 1.7-1.1 2.8-2.4 2.8" />
      <path d="M10.8 17.6v1.3M14.2 17.6v1.3" />
    </svg>
  );
}
