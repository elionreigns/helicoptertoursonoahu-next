import Link from "next/link";
import WhatsAppIcon from "./WhatsAppIcon";
import { WHATSAPP_CHAT_URL } from "@/lib/constants";

/** Fixed bubble bottom-left; Home button is bottom-right in layout. */
export default function WhatsAppFloat() {
  return (
    <div className="hidden sm:block fixed bottom-28 left-4 z-40 sm:left-6">
      <Link
        href={WHATSAPP_CHAT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#2A1240] text-[#F3D27A] ring-1 ring-[#F3D27A]/50 shadow-lg shadow-black/30 hover:bg-[#3B1A5C] transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#F3D27A] focus:ring-offset-2"
        title="WhatsApp us"
        aria-label="WhatsApp plus one eight zero eight three nine three zero one five three"
      >
        <WhatsAppIcon className="w-8 h-8" />
      </Link>
    </div>
  );
}
