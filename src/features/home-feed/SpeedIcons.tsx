import type { SVGProps } from "react";

type SpeedIconProps = SVGProps<SVGSVGElement>;

/**
 * Filled turtle silhouette for cozy mode.
 */
export function TurtleSpeedIcon(props: SpeedIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <ellipse cx="11.5" cy="13.5" rx="6.5" ry="4.6" />
      <circle cx="18.8" cy="13.4" r="1.4" />
      <rect x="7.1" y="17.3" width="2.2" height="1.8" rx="0.4" />
      <rect x="10.4" y="17.3" width="2.2" height="1.8" rx="0.4" />
      <rect x="13.7" y="17.3" width="2.2" height="1.8" rx="0.4" />
      <path d="M9.2 9.8a2.9 2.9 0 0 1 5.8 0v0.9H9.2Z" />
    </svg>
  );
}

/**
 * Filled rabbit silhouette for quick mode.
 */
export function RabbitSpeedIcon(props: SpeedIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <ellipse cx="12.7" cy="15.2" rx="5.2" ry="3.9" />
      <circle cx="8.6" cy="13.3" r="2.3" />
      <ellipse cx="8.2" cy="8.1" rx="1.2" ry="3.2" transform="rotate(-18 8.2 8.1)" />
      <ellipse cx="10.8" cy="7.7" rx="1.2" ry="3.2" transform="rotate(10 10.8 7.7)" />
      <circle cx="18.4" cy="14.9" r="1.5" />
      <rect x="11.1" y="18.2" width="1.9" height="1.4" rx="0.3" />
      <rect x="14.1" y="18.2" width="1.9" height="1.4" rx="0.3" />
    </svg>
  );
}
