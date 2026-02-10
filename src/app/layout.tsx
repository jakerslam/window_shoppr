import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import TopBar from "@/components/top-bar/TopBar";
import CategoryFilterProvider from "@/components/category-filter/CategoryFilterProvider";
import Footer from "@/components/footer/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Window Shoppr",
  description: "A window-shopping deal destination.",
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
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <div className="site-shell">
          {/* Shared filters for navigation + feed. */}
          <CategoryFilterProvider>
            {/* Top navigation for all pages. */}
            <TopBar />

            {/* Main content area for route content. */}
            <main className="site-shell__content">{children}</main>
          </CategoryFilterProvider>

          {/* Footer stub for future links and info. */}
          <Footer />
        </div>

        {/* Modal slot for intercepting routes. */}
        {modal}
      </body>
    </html>
  );
}
