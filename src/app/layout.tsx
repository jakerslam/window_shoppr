import type { Metadata } from "next";
import { Cormorant, Geist, Geist_Mono } from "next/font/google";
import TopBar from "@/features/top-bar/TopBar";
import MobileBottomNav from "@/features/top-bar/MobileBottomNav";
import CategoryFilterProvider from "@/features/category-filter/CategoryFilterProvider";
import Footer from "@/shared/components/footer/Footer";
import EmailCaptureModal from "@/features/email-capture/EmailCaptureModal";
import { SITE_URL } from "@/shared/lib/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorant = Cormorant({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

/**
 * Default marketing description used in metadata and previews.
 */
const siteDescription =
  "Window Shoppr is a cozy window-shopping destination for trending finds and real deals."; // Shared meta description.

/**
 * Base site URL used to build absolute metadata links.
 */
const siteUrl = new URL(SITE_URL); // Normalize the metadata base URL.

/**
 * Placeholder Open Graph image until branded assets are added.
 */
const siteOgImage = "/window.svg"; // Fallback OG image in /public.

/**
 * Global metadata defaults for the entire site.
 */
export const metadata: Metadata = {
  metadataBase: siteUrl, // Base for absolute URL resolution.
  title: {
    default: "Window Shoppr", // Default document title.
    template: "%s | Window Shoppr", // Template for nested page titles.
  },
  description: siteDescription, // Shared SEO description.
  applicationName: "Window Shoppr", // App name for installable contexts.
  alternates: {
    canonical: "/", // Canonical path for the homepage.
  },
  openGraph: {
    title: "Window Shoppr", // Open Graph title.
    description: siteDescription, // Open Graph description.
    url: SITE_URL, // Open Graph canonical URL.
    siteName: "Window Shoppr", // Open Graph site name.
    type: "website", // Open Graph type for the homepage.
    locale: "en_US", // Locale for Open Graph previews.
    images: [
      {
        url: siteOgImage, // Open Graph image URL.
        alt: "Window Shoppr", // Open Graph image alt text.
      },
    ],
  },
  twitter: {
    card: "summary_large_image", // Twitter card layout.
    title: "Window Shoppr", // Twitter title.
    description: siteDescription, // Twitter description.
    images: [siteOgImage], // Twitter preview image.
  },
  robots: {
    index: true, // Allow indexing.
    follow: true, // Allow link following.
  },
};

/**
 * Root layout that wraps every page with global navigation and footer.
 */
export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Page body with shared global layout. */}
      <body className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable}`}>
        <div className="site-shell">
          {/* Shared filters for navigation + feed. */}
          <CategoryFilterProvider>
            {/* Top navigation for all pages. */}
            <TopBar />

            {/* Main content area for route content. */}
            <main className="site-shell__content">{children}</main>

            {/* Mobile-only bottom navigation for quick access. */}
            <MobileBottomNav />

            {/* Delayed email capture prompt. */}
            <EmailCaptureModal />

            {/* Modal slot for intercepting routes. */}
            {modal}
          </CategoryFilterProvider>

          {/* Footer stub for future links and info. */}
          <Footer />
        </div>
      </body>
    </html>
  );
}
