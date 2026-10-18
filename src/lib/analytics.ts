'use client';

declare global {
  interface Window { gtag?: (...args: unknown[]) => void; }
}

/** Send only non-identifying booking funnel data to the shared GA4 property. */
export function trackBookingEvent(name: string, params: Record<string, string | number | boolean> = {}) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', name, params);
  }
}
