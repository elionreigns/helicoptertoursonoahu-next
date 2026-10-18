import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Header from "@/components/Header";
import BookingChatbot from "@/components/BookingChatbot";
import JsonLd from "@/components/JsonLd";
import SiteFooter from "@/components/SiteFooter";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { StickyBookBar } from "@/components/BookingCTAs";
import { CUSTOMER_PHONE_DISPLAY } from "@/lib/constants";

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
    `Book private Oahu helicopter flights with live FareHarbor availability, or request a Blue Hawaiian shared flight. Call ${CUSTOMER_PHONE_DISPLAY}.`,
  keywords: [
    "helicopter tours on oahu",
    "oahu helicopter tours",
    "hawaii helicopter tours",
    "Blue Hawaiian Helicopters",
    "private helicopter flights Hawaii",
    "private helicopter tours Oahu",
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
      `Private Oahu helicopter flights with live FareHarbor booking, plus Blue Hawaiian shared-flight requests. Call ${CUSTOMER_PHONE_DISPLAY}.`,
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Helicopter Tours on Oahu" }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Helicopter Tours on Oahu | Book Oahu Helicopter Tours Online',
    description:
      `Private Oahu helicopter flights with live FareHarbor booking, plus Blue Hawaiian shared-flight requests. Call ${CUSTOMER_PHONE_DISPLAY}.`,
    images: [OG_IMAGE],
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
      <body className={`${inter.variable} font-sans antialiased bg-gradient-to-br from-blue-50 via-white to-orange-50 min-h-screen flex flex-col`}>
        <JsonLd />
        <Header />
        <div className="flex-1 flex flex-col">{children}</div>
        <SiteFooter />
        <WhatsAppFloat />
        <StickyBookBar />
        <BookingChatbot />
        <Script src="https://fareharbor.com/embeds/api/v1/?autolightframe=yes" strategy="afterInteractive" />
        {/* First-party, cookie-free visitor analytics (Zion Tracker, coralcrownsolutions.com/tracker). Opt out: ?zt_optout=1 */}
        <Script src="https://www.coralcrownsolutions.com/tracker/assets/zt.js" data-site="hto-booking" strategy="afterInteractive" />
        {/* GA4 (same property as main site) + cross-domain + private-flight click events */}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-1Q9R7TG1XN" strategy="afterInteractive" />
        <Script id="ga4-hto" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-1Q9R7TG1XN', { linker: { domains: ['helicoptertoursonoahu.com', 'www.helicoptertoursonoahu.com', 'booking.helicoptertoursonoahu.com', 'fareharbor.com'] } });
          document.addEventListener('click', function (e) {
            var a = e.target && e.target.closest && e.target.closest('a[href]');
            if (!a) return;
            var h = a.href || '', t = (a.textContent || '').trim().slice(0, 80);
            if (/fareharbor\\.com/i.test(h)) gtag('event', 'private_flight_click', { cta_text: t, cta_id: a.getAttribute('data-cta') || '', site: 'booking' });
            else if (/wa\\.me|whatsapp/i.test(h)) gtag('event', 'contact_click', { contact_method: 'whatsapp', site: 'booking' });
            else if (/^tel:/i.test(h)) gtag('event', 'contact_click', { contact_method: 'phone', site: 'booking' });
            else if (/\\/bookings$/.test(h)) gtag('event', 'booking_request_click', { cta_text: t, site: 'booking' });
          }, true);
        `}</Script>
        {/* Fixed Home Button - positioned above chatbot */}
        <div className="hidden sm:block fixed bottom-28 right-6 z-40">
          <Link
            href="https://helicoptertoursonoahu.com"
            aria-label="Home"
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
