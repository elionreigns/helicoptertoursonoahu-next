import Link from "next/link";
import WhatsAppIcon from "./WhatsAppIcon";

const WHATSAPP_HREF = "https://wa.me/18083930153";

/** Fixed bubble bottom-left; Home button is bottom-right in layout. */
export default function WhatsAppFloat() {
  return (
    <div className="fixed bottom-28 left-4 z-40 sm:left-6">
      <Link
        href={WHATSAPP_HREF}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-lg shadow-green-500/40 hover:bg-[#20bd5a] transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#25d366] focus:ring-offset-2"
        title="WhatsApp us"
        aria-label="WhatsApp plus one eight zero eight three nine three zero one five three"
      >
        <WhatsAppIcon className="w-8 h-8" />
      </Link>
    </div>
  );
}
