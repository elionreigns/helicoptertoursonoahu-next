import { FAREHARBOR_HONOLULU_HELICOPTER_TOURS } from "@/lib/partnerLinks";

type Props = {
  /** Slightly tighter vertical rhythm on /bookings */
  className?: string;
};

/**
 * Static partner CTA: Honolulu Helicopter Tours (FareHarbor).
 * Placed above Blue Hawaiian flows — matches marketing site index.php section #honolulu-helicopter-tours.
 */
export default function HonoluluPartnerCard({ className = "" }: Props) {
  return (
    <section
      id="honolulu-helicopter-tours"
      className={`bg-sky-50/80 border-y border-sky-200/50 py-10 md:py-12 ${className}`.trim()}
    >
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-2">
          We also work with these guys
        </h2>
        <p className="text-center text-gray-600 mb-6 text-balance max-w-2xl mx-auto">
          Another trusted Oʻahu operator—scenic and doors-off flights from Honolulu. Their live calendar and
          checkout run on FareHarbor (opens in a new tab).
        </p>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden flex flex-col md:flex-row">
          <div
            className="h-48 md:min-h-[220px] md:w-2/5 bg-cover bg-center shrink-0"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1509214281919-f7f6541be7ef?w=1000&q=85&auto=format&fit=crop)",
            }}
            role="img"
            aria-label="Helicopter view over Honolulu"
          />
          <div className="p-6 md:p-7 flex flex-col justify-center">
            <h3 className="text-xl font-bold text-blue-800 mb-2">Honolulu Helicopter Tours</h3>
            <p className="text-gray-700 text-sm md:text-base leading-relaxed mb-4">
              Diamond Head, windward coasts, waterfalls, and the skyline. Use their FareHarbor page to see open
              times and complete booking—separate from the Blue Hawaiian flow below.
            </p>
            <a
              href={FAREHARBOR_HONOLULU_HELICOPTER_TOURS}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-gradient-to-r from-blue-600 to-indigo-800 text-white font-bold px-5 py-3 text-sm shadow-md hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <span aria-hidden>🎫</span> Book Honolulu Helicopter Tours
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
