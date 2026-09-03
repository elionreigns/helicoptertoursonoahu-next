import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Payment Responsibility',
  description: 'Terms for Helicopter Tours on Oahu booking requests and private-flight reservations.',
  alternates: { canonical: '/terms' },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <main className="flex-1 bg-slate-50 py-12 text-slate-900 sm:py-16">
      <article className="mx-auto max-w-3xl rounded-2xl bg-white px-6 py-10 shadow-sm sm:px-10">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">Helicopter Tours on Oahu</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Terms &amp; payment responsibility</h1>
        <p className="mt-6 leading-8 text-slate-700">This site helps guests find private helicopter flights and submit Blue Hawaiian shared-flight requests. A submitted shared-flight request is not a confirmed reservation.</p>
        <h2 className="mt-10 text-2xl font-extrabold">Private flight reservations</h2>
        <p className="mt-4 leading-8 text-slate-700">Private Honolulu Heli flight reservations, availability, checkout, payment processing, confirmation, and applicable operator terms are handled by the helicopter operator and its FareHarbor booking flow. The operator&apos;s current booking terms and checkout information apply to those reservations.</p>
        <h2 className="mt-10 text-2xl font-extrabold">Blue Hawaiian requests</h2>
        <p className="mt-4 leading-8 text-slate-700">Blue Hawaiian shared-flight forms are requests for follow-up. Availability, final itinerary, pricing, confirmation, and payment instructions are provided by the applicable helicopter company or its authorized booking flow before a reservation is confirmed.</p>
        <h2 className="mt-10 text-2xl font-extrabold">No card details through this site or assistant</h2>
        <p className="mt-4 leading-8 text-slate-700">Do not send card numbers, CVC/CVV codes, expiration dates, billing addresses, or bank information through the site chat or phone assistant. Use the operator&apos;s approved checkout process for private flights. For a Blue Hawaiian request, wait for the appropriate follow-up and payment instructions.</p>
        <h2 className="mt-10 text-2xl font-extrabold">Operator terms</h2>
        <p className="mt-4 leading-8 text-slate-700">Weather, route, flight duration, seating, safety requirements, cancellation policies, and other operating conditions are determined by the helicopter operator. Please review the operator&apos;s current terms before completing a reservation.</p>
      </article>
    </main>
  );
}
