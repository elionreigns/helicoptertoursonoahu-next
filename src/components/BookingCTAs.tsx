'use client';

import { useEffect, useState } from 'react';
import {
  FAREHARBOR_PRIVATE_18,
  FAREHARBOR_PRIVATE_30,
  FAREHARBOR_PRIVATE_60,
  FAREHARBOR_PRIVATE_ALL,
} from '@/lib/partnerLinks';

type Tour = { id: string; minutes: number; name: string; href: string; blurb: string; badge?: string };

export const TOURS: Tour[] = [
  { id: '326050', minutes: 18, name: '18-Min Private Flight', href: FAREHARBOR_PRIVATE_18, blurb: 'Waikiki, Diamond Head & Honolulu skyline. Perfect first flight.' },
  { id: '326066', minutes: 30, name: '30-Min Private Flight', href: FAREHARBOR_PRIVATE_30, blurb: 'More coastline, more views. The sweet spot for couples & families.', badge: 'Most popular' },
  { id: '326071', minutes: 60, name: '60-Min Private Flight', href: FAREHARBOR_PRIVATE_60, blurb: 'The full Oahu experience. Mountains, waterfalls & coastlines.' },
];

declare global {
  interface Window { gtag?: (...args: unknown[]) => void }
}

export function trackBook(tour: Tour | null, cta: string) {
  const item = tour
    ? { item_id: tour.id, item_name: tour.name, item_category: 'private_helicopter', affiliation: 'asn=elion' }
    : { item_id: 'private_all', item_name: 'Private Flights (all)', item_category: 'private_helicopter', affiliation: 'asn=elion' };
  window.gtag?.('event', 'select_item', { item_list_id: 'private_tours', item_list_name: 'Private Oahu Flights', items: [item], cta_id: cta });
  window.gtag?.('event', 'begin_checkout', { currency: 'USD', items: [item], cta_id: cta });
}

/** Shows a "Opening secure booking…" toast while FareHarbor lightframe loads. */
function showLoading() {
  window.dispatchEvent(new CustomEvent('hto-booking-opening'));
}

export function BookButton({ tour, cta, children, className = '', variant = 'gold' }: {
  tour: Tour | null; cta: string; children: React.ReactNode; className?: string; variant?: 'gold' | 'ghost';
}) {
  const base =
    variant === 'gold'
      ? 'hto-book-btn bg-gradient-to-b from-[#F3D27A] to-[#D4A537] text-[#2A1240] shadow-[0_8px_24px_-6px_rgba(212,165,55,0.65)] hover:from-[#FFE08F] hover:to-[#E0B347] hover:shadow-[0_12px_30px_-6px_rgba(212,165,55,0.85)]'
      : 'border-2 border-[#F3D27A]/70 text-white bg-white/5 hover:bg-white/15 hover:border-[#F3D27A]';
  return (
    <a
      href={tour ? tour.href : FAREHARBOR_PRIVATE_ALL}
      data-cta={cta}
      onClick={() => { trackBook(tour, cta); showLoading(); }}
      className={`fareharbor-lightframe group relative inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full px-7 py-3.5 text-base font-extrabold tracking-wide transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#F3D27A]/60 ${base} ${className}`}
    >
      {children}
      <svg className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
      </svg>
    </a>
  );
}

export function TrustLine({ dark = true }: { dark?: boolean }) {
  const c = dark ? 'text-white/80' : 'text-[#3B2A52]';
  return (
    <p className={`mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm ${c}`}>
      <span>🔒 Secure checkout by FareHarbor</span>
      <span>✓ Your party flies alone</span>
      <span>✓ Live dates & prices</span>
    </p>
  );
}

export function TourCards() {
  return (
    <section id="tours" className="bg-gradient-to-b from-[#1A0B2E] to-[#2A1240] py-14 md:py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-10">
          <p className="text-[#F3D27A] font-semibold uppercase tracking-[0.2em] text-xs mb-2">Private flights from Honolulu</p>
          <h2 className="text-3xl md:text-4xl font-bold !text-white">Choose your flight</h2>
          <p className="mt-3 text-white/75 max-w-2xl mx-auto">Tap a flight to see live availability and pricing. Booking opens right here, no leaving the site.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {TOURS.map((t) => (
            <div
              key={t.id}
              className={`relative flex flex-col rounded-2xl border p-6 md:p-7 transition-all duration-300 hover:-translate-y-1 ${t.badge ? 'border-[#F3D27A] bg-white/10 shadow-[0_20px_50px_-15px_rgba(243,210,122,0.45)]' : 'border-white/15 bg-white/5 hover:border-[#F3D27A]/60 hover:bg-white/10'}`}
            >
              {t.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#F3D27A] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#2A1240]">{t.badge}</span>
              )}
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-[#F3D27A]">{t.minutes}</span>
                <span className="text-lg font-semibold text-white/90">minutes</span>
              </div>
              <h3 className="mt-2 text-xl font-bold !text-white">{t.name}</h3>
              <p className="mt-2 flex-1 text-white/75">{t.blurb}</p>
              <ul className="mt-4 space-y-1 text-sm text-white/80">
                <li>✓ Private: just your group</li>
                <li>✓ Departs Honolulu (HNL)</li>
              </ul>
              <BookButton tour={t} cta={`card-${t.minutes}`} className="mt-6 w-full">Book {t.minutes}-Min Flight</BookButton>
            </div>
          ))}
        </div>
        <TrustLine />
      </div>
    </section>
  );
}

/** Sticky bottom bar on mobile + loading toast for all FareHarbor opens. */
export function StickyBookBar() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 320);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    const onOpen = () => { setLoading(true); window.setTimeout(() => setLoading(false), 4000); };
    window.addEventListener('hto-booking-opening', onOpen);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('hto-booking-opening', onOpen); };
  }, []);
  return (
    <>
      {loading && (
        <div role="status" className="fixed top-24 left-1/2 z-[60] -translate-x-1/2 flex items-center gap-3 rounded-full bg-[#2A1240] px-5 py-3 text-sm font-semibold text-white shadow-2xl ring-1 ring-[#F3D27A]/60">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#F3D27A] border-t-transparent" aria-hidden />
          Opening secure booking calendar…
        </div>
      )}
      <div className={`md:hidden fixed inset-x-0 bottom-0 z-50 border-t border-[#F3D27A]/30 bg-[#1A0B2E]/95 backdrop-blur px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] transition-transform duration-300 ${show ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="flex items-center gap-3">
          <div className="flex-1 leading-tight">
            <p className="text-sm font-bold text-white">Private Oahu flights</p>
            <p className="text-xs text-white/70">18 · 30 · 60 min · live prices</p>
          </div>
          <BookButton tour={null} cta="sticky-mobile" className="!min-h-[48px] !px-5 !py-3 text-sm">Book Now</BookButton>
        </div>
      </div>
    </>
  );
}
