import { FAREHARBOR_HONOLULU_HELICOPTER_TOURS } from "@/lib/partnerLinks";

type Props = {
  /** Slightly tighter vertical rhythm on /bookings */
  className?: string;
};

/**
 * Partner spotlight: Honolulu Helicopter Tours (FareHarbor live calendar).
 * Copy + visual weight aligned with helicoptertoursonoahu.com index.php #honolulu-helicopter-tours.
 */
export default function HonoluluPartnerCard({ className = "" }: Props) {
  return (
    <section
      id="honolulu-helicopter-tours"
      className={`relative overflow-hidden border-y border-amber-200/60 bg-gradient-to-b from-sky-100/90 via-amber-50/50 to-white py-12 md:py-16 ${className}`.trim()}
    >
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange-300/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-sky-400/20 blur-3xl"
        aria-hidden
      />
      <div className="container relative mx-auto max-w-5xl px-4">
        <p className="mb-1 text-center text-xs font-extrabold uppercase tracking-[0.22em] text-sky-800">
          Partner spotlight
        </p>
        <h2 className="mx-auto mb-2 max-w-3xl text-center text-2xl font-black leading-tight text-slate-900 md:text-4xl md:leading-tight">
          Same sky. Two doors in.
          <span className="mt-1 block text-xl font-bold text-orange-600 md:text-2xl">
            This one opens onto{" "}
            <span className="text-sky-900 underline decoration-orange-400 decoration-2 underline-offset-4">
              FareHarbor
            </span>{" "}
            — live rotor times.
          </span>
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-center text-balance text-base text-slate-600 md:text-lg">
          <strong className="text-slate-800">Honolulu Helicopter Tours</strong> keeps shared Oʻahu scenic flights on a{" "}
          <strong className="text-slate-800">wide-open calendar</strong>: see what&apos;s flying, lock the seats, checkout
          like a headline show — <em className="text-slate-700">instant confirmation</em> while you&apos;re still
          daydreaming about Diamond Head from 1,000 feet.
        </p>

        <div className="overflow-hidden rounded-3xl border-2 border-amber-300/70 bg-gradient-to-br from-amber-50/90 via-sky-50/80 to-white shadow-[0_24px_60px_-12px_rgba(13,71,161,0.2)] ring-1 ring-white/80 md:flex md:min-h-[280px]">
          <div
            className="relative min-h-[220px] flex-[1.05] bg-cover bg-center md:min-h-[300px]"
            style={{
              backgroundImage:
                "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,20,60,0.55) 100%), url(https://images.unsplash.com/photo-1509214281919-f7f6541be7ef?w=1200&q=85&auto=format&fit=crop)",
            }}
            role="img"
            aria-label="Helicopter aerial view over Honolulu"
          >
            <div className="absolute bottom-3 left-3 right-3 rounded-xl bg-slate-950/75 px-3 py-2.5 text-sm font-semibold leading-snug text-white backdrop-blur-sm md:bottom-4 md:left-4 md:right-4 md:px-4">
              Diamond Head • Windward ridges • City–coast panorama — shared cabin, big windows, camera-ready.
            </div>
          </div>

          <div className="flex flex-[1.1] flex-col justify-center bg-white/55 px-5 py-7 backdrop-blur-sm md:px-8 md:py-8">
            <span className="mb-2 inline-flex w-fit items-center rounded-full border border-sky-800/25 bg-gradient-to-r from-amber-200 to-yellow-200 px-3 py-1 text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-sky-950">
              Live Aloha calendar
            </span>
            <h3 className="text-2xl font-black tracking-tight text-sky-950 md:text-3xl">Honolulu Helicopter Tours</h3>
            <p className="mt-1 text-base font-semibold text-slate-700">The &ldquo;I can&apos;t wait till Monday&rdquo; button lives here.</p>

            <div className="my-3 flex flex-wrap gap-2" aria-label="Tour length options">
              {["~18 min sprint", "~30 min classic", "~60 min epic"].map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-sky-400/40 bg-white px-3 py-1 text-xs font-bold text-sky-900 shadow-sm"
                >
                  {label}
                </span>
              ))}
            </div>

            <p className="text-sm leading-relaxed text-slate-700 md:text-base">
              Ballpark <strong>from ~$244 / person (30 min)</strong> toward <strong>~$356+ / person (60 min)</strong> when
              those longer minutes are listed — party size and season move the numbers on their grid.{" "}
              <strong>Always confirm on FareHarbor</strong> before you brag to the group chat.
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Separate from the Blue Hawaiian request flow — this is{" "}
              <strong className="text-slate-800">self-serve, real-time, checkout tonight</strong> energy.
            </p>

            <a
              href={FAREHARBOR_HONOLULU_HELICOPTER_TOURS}
              target="_blank"
              rel="noopener noreferrer"
              className="hto-fh-cta-animate mt-5 inline-flex w-full max-w-md items-center justify-center gap-2 rounded-2xl border-2 border-white/40 bg-gradient-to-r from-orange-500 via-orange-600 to-sky-800 px-5 py-4 text-center text-base font-extrabold text-white shadow-[0_14px_40px_rgba(255,109,0,0.35),0_8px_24px_rgba(21,101,192,0.35)] transition hover:-translate-y-0.5 hover:brightness-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300 md:text-lg"
              aria-label="Open FareHarbor to book Honolulu Helicopter Tours with live availability"
            >
              <span aria-hidden>🎟️</span> Claim my seats on FareHarbor
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
