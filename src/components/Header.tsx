'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CUSTOMER_PHONE_DISPLAY, CUSTOMER_PHONE_TEL, WHATSAPP_CHAT_URL } from '@/lib/constants';
import WhatsAppIcon from './WhatsAppIcon';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-[#0B1F33] shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo and Home Link */}
          <Link
            href="https://helicoptertoursonoahu.com"
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center space-x-2">
              <img
                src="https://www.helicoptertoursonoahu.com/video/helicopter-tours-motion.gif"
                alt=""
                width={560}
                height={192}
                className="h-8 w-auto max-w-[90px] object-contain md:h-10 md:max-w-[110px]"
              />
              <span className="text-lg md:text-xl font-semibold text-white">
                Helicopter Tours
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="https://helicoptertoursonoahu.com"
              className="text-white/80 hover:text-white transition-colors font-medium"
            >
              Home
            </Link>
            <Link
              href="/private-helicopter-flights-hawaii"
              className="text-white/80 hover:text-white transition-colors font-medium"
            >
              Private Flights
            </Link>
            <Link
              href="/bookings"
              className="text-white/80 hover:text-white transition-colors font-medium"
            >
              Book Now
            </Link>
            <a
              href={CUSTOMER_PHONE_TEL}
              className="flex items-center space-x-2 text-sm text-white/90 hover:text-white font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>{CUSTOMER_PHONE_DISPLAY}</span>
            </a>
            <a
              href={WHATSAPP_CHAT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-3 py-1.5 text-sm font-semibold text-[#0B1F33] hover:bg-[#3BE07A] transition-colors"
              title="WhatsApp"
              aria-label="WhatsApp"
            >
              <WhatsAppIcon className="w-4 h-4" />
              <span className="hidden lg:inline">WhatsApp</span>
            </a>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-3 rounded-md text-white hover:bg-white/10 transition-colors"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/15 py-4">
            <nav className="flex flex-col space-y-3">
              <Link
                href="https://helicoptertoursonoahu.com"
                className="px-4 py-2 text-white/90 hover:bg-white/10 rounded-md transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/private-helicopter-flights-hawaii"
                className="px-4 py-2 text-white/90 hover:bg-white/10 rounded-md transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Private Flights
              </Link>
              <Link
                href="/bookings"
                className="px-4 py-2 text-white/90 hover:bg-white/10 rounded-md transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Book Now
              </Link>
              <a
                href={CUSTOMER_PHONE_TEL}
                className="px-4 py-2 text-white/90 hover:bg-white/10 rounded-md font-medium flex items-center space-x-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>{CUSTOMER_PHONE_DISPLAY}</span>
              </a>
              <a
                href={WHATSAPP_CHAT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mx-4 inline-flex w-fit items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 font-semibold text-[#0B1F33] hover:bg-[#3BE07A]"
                onClick={() => setMobileMenuOpen(false)}
              >
                <WhatsAppIcon className="w-5 h-5" />
                <span>WhatsApp</span>
              </a>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
