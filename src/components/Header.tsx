'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo and Home Link */}
          <Link
            href="https://helicoptertoursonoahu.com"
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center space-x-2">
              <svg
                className="w-8 h-8 md:w-10 md:h-10 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
              <span className="text-lg md:text-xl font-bold text-gray-900">
                Helicopter Tours
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="https://helicoptertoursonoahu.com"
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
            >
              Home
            </Link>
            <Link
              href="/bookings"
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
            >
              Book Now
            </Link>
            <a
              href="tel:+17073812583"
              className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>(707) 381-2583</span>
            </a>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
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
          <div className="md:hidden border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-3">
              <Link
                href="https://helicoptertoursonoahu.com"
                className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/bookings"
                className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Book Now
              </Link>
              <a
                href="tel:+17073812583"
                className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>(707) 381-2583</span>
              </a>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
