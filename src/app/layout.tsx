import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Header from "@/components/Header";
import BookingChatbot from "@/components/BookingChatbot";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Helicopter Tours on Oahu - Book Now",
  description:
    "Book your Oahu helicopter tour with Blue Hawaiian & Rainbow Helicopters. Safe, scenic, personalized experiences. Compare operators and book online.",
  openGraph: {
    title: "Helicopter Tours on Oahu - Book Now",
    description:
      "Book your Oahu helicopter tour with Blue Hawaiian & Rainbow Helicopters. Safe, scenic, personalized experiences.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Helicopter Tours on Oahu - Book Now",
    description: "Book your Oahu helicopter tour with Blue Hawaiian & Rainbow Helicopters.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-gradient-to-br from-blue-50 via-white to-orange-50`}>
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
