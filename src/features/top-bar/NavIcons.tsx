import type { SVGProps } from "react";

/**
 * Shared SVG icon props for top and mobile navigation controls.
 */
type NavIconProps = SVGProps<SVGSVGElement>;

/**
 * Search icon used in desktop and mobile search controls.
 */
export function SearchIcon(props: NavIconProps) {
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
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20L16.5 16.5" />
    </svg>
  );
}

/**
 * Home icon for the mobile feed destination.
 */
export function HomeIcon(props: NavIconProps) {
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
      <path d="M3.5 10.2L12 3.8L20.5 10.2" />
      <path d="M6.8 9.8V20H17.2V9.8" />
    </svg>
  );
}

/**
 * Star outline icon for wishlist destination.
 */
export function StarIcon(props: NavIconProps) {
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
      <path d="M12 3.8L14.6 9.1L20.5 9.9L16.2 14.1L17.3 20L12 17.2L6.7 20L7.8 14.1L3.5 9.9L9.4 9.1L12 3.8Z" />
    </svg>
  );
}

/**
 * User/profile icon for account destination.
 */
export function UserIcon(props: NavIconProps) {
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
      <circle cx="12" cy="8.5" r="3.7" />
      <path d="M5.2 19.2C6.2 16.3 8.8 14.8 12 14.8C15.2 14.8 17.8 16.3 18.8 19.2" />
    </svg>
  );
}

/**
 * Bell icon for notifications trigger.
 */
export function BellIcon(props: NavIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M18 16.75V11.5c0-2.97-1.64-5.45-4.5-6.16V4.75a1.5 1.5 0 0 0-3 0v.59C7.64 6.05 6 8.53 6 11.5v5.25l-1.75 1.75a.75.75 0 0 0 .53 1.28h14.44a.75.75 0 0 0 .53-1.28L18 16.75Z" />
      <path d="M12 22a2.75 2.75 0 0 0 2.67-2H9.33A2.75 2.75 0 0 0 12 22Z" />
    </svg>
  );
}

/**
 * Plus icon for quick actions like submit-deal.
 */
export function PlusIcon(props: NavIconProps) {
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
      <path d="M12 5.5V18.5" />
      <path d="M5.5 12H18.5" />
    </svg>
  );
}
