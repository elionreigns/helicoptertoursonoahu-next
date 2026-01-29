import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Header from "@/components/Header";
import BookingChatbot from "@/components/BookingChatbot";
import JsonLd from "@/components/JsonLd";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const SITE_URL = "https://booking.helicoptertoursonoahu.com";
const OG_IMAGE = "https://www.helicoptertoursonoahu.com/images/helicoptertours-bluehawaiian.webp";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Helicopter Tours on Oahu | Book Oahu Helicopter Tours Online",
    template: "%s | Helicopter Tours on Oahu",
  },
  description:
    "Book helicopter tours on Oahu with Blue Hawaiian & Rainbow Helicopters. Compare Oahu helicopter tours, prices & doors-off options. Safe, scenic Hawaii helicopter tours—book online or call (707) 381-2583.",
  keywords: [
    "helicopter tours on oahu",
    "oahu helicopter tours",
    "hawaii helicopter tours",
    "Blue Hawaiian Helicopters",
    "Rainbow Helicopters",
    "Oahu helicopter tour booking",
    "helicopter tour Oahu",
  ],
  authors: [{ name: "Helicopter Tours on Oahu", url: "https://www.helicoptertoursonoahu.com" }],
  creator: "Helicopter Tours on Oahu",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Helicopter Tours on Oahu",
    title: "Helicopter Tours on Oahu | Book Oahu Helicopter Tours Online",
    description:
      "Book helicopter tours on Oahu with Blue Hawaiian & Rainbow Helicopters. Compare Oahu helicopter tours and book online. Safe, scenic Hawaii helicopter tours.",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Helicopter Tours on Oahu" }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: { canonical: SITE_URL },
  // Google Search Console: set GOOGLE_SITE_VERIFICATION in Vercel to your verification code (content value only)
  ...(process.env.GOOGLE_SITE_VERIFICATION && {
    verification: { google: process.env.GOOGLE_SITE_VERIFICATION },
  }),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-gradient-to-br from-blue-50 via-white to-orange-50`}>
        <JsonLd />
        <Header />
        {children}
        <BookingChatbot />
        {/* Fixed Home Button - positioned above chatbot */}
        <div className="fixed bottom-28 right-6 z-40">
          <Link
            href="https://helicoptertoursonoahu.com"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center space-x-2 font-semibold"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="hidden sm:inline">Home</span>
          </Link>
        </div>
      </body>
    </html>
  );
}
