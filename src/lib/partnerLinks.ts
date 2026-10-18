import { BOOKING_APP_BASE_URL } from "./constants";

/** Final FareHarbor URL (affiliate ref preserved). Used only after /api/fareharbor-out redirect. */
export const FAREHARBOR_PRIVATE_OAHU_TOURS =
  "https://fareharbor.com/embeds/book/honoluluhelicoptertours/?ref=asn&asn=elion&asn-ref=asn&full-items=yes&flow=808102";

export const FAREHARBOR_PRIVATE_18 =
  "https://fareharbor.com/embeds/book/honoluluhelicoptertours/items/326050/?ref=asn&asn=elion&asn-ref=asn&full-items=yes&flow=808102";
export const FAREHARBOR_PRIVATE_30 =
  "https://fareharbor.com/embeds/book/honoluluhelicoptertours/items/326066/?ref=asn&asn=elion&asn-ref=asn&full-items=yes&flow=848443";
export const FAREHARBOR_PRIVATE_60 =
  "https://fareharbor.com/embeds/book/honoluluhelicoptertours/items/326071/?ref=asn&asn=elion&asn-ref=asn&full-items=yes&flow=848443";

/** @deprecated Compatibility alias for the existing tracked-redirect route. */
export const FAREHARBOR_HONOLULU_HELICOPTER_TOURS = FAREHARBOR_PRIVATE_OAHU_TOURS;

/** Tracked redirect (emails fareharborAlert then 302). Prefer direct URL + lightframe on marketing site. */
export function fareHarborTrackedOutboundUrl(source: string): string {
  const base = BOOKING_APP_BASE_URL.replace(/\/$/, "");
  return `${base}/api/fareharbor-out?src=${encodeURIComponent(source)}`;
}

/** Direct FareHarbor URL for lightframe / same-tab booking (matches timeforfunhawaii.com /live/). */
export function fareHarborDirectUrl(): string {
  return FAREHARBOR_PRIVATE_OAHU_TOURS;
}

/** All private flights (18/30/60) - same asn=elion flow. */
export const FAREHARBOR_PRIVATE_ALL = FAREHARBOR_PRIVATE_OAHU_TOURS;
