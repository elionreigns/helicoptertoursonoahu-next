import Link from "next/link";
import WhatsAppIcon from "./WhatsAppIcon";

const WHATSAPP_HREF = "https://wa.me/18083930153";

export default function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div
          className="rounded-2xl p-6 text-center text-white shadow-lg border border-white/20"
          style={{
            background: "linear-gradient(135deg, #075e54 0%, #128c7e 45%, #25d366 100%)",
          }}
        >
          <p className="text-base md:text-lg font-bold mb-4 leading-snug text-balance">
            Out of the Country? Get Ahold of us Via WhatsApp
          </p>
          <Link
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-[#075e54] font-bold text-sm md:text-base shadow-md hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#128c7e]"
            aria-label="Open WhatsApp chat, plus one eight zero eight three nine three zero one five three"
          >
            <WhatsAppIcon className="w-6 h-6 shrink-0" />
            <span>WhatsApp +1 808-393-0153</span>
          </Link>
        </div>
        <p className="text-center text-gray-500 text-sm mt-6">
          <Link href="https://www.helicoptertoursonoahu.com" className="text-blue-600 hover:underline">
            helicoptertoursonoahu.com
          </Link>
          {" · "}
          Booking on this site is hosted on Vercel and secured with industry-standard transport (HTTPS).
        </p>
      </div>
    </footer>
  );
}
