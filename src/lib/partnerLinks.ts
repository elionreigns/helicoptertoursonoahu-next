import { BOOKING_APP_BASE_URL } from "./constants";

/**
 * FareHarbor private-flight contract links. Keep the affiliate parameters
 * exactly as supplied by Honolulu Helicopter Tours.
 */
export const FAREHARBOR_PRIVATE_ALL =
  "https://fareharbor.com/embeds/book/honoluluhelicoptertours/?ref=asn&asn=elion&asn-ref=asn&full-items=yes&flow=808102";
export const FAREHARBOR_PRIVATE_18 =
  "https://fareharbor.com/embeds/book/honoluluhelicoptertours/items/326050/?ref=asn&asn=elion&asn-ref=asn&full-items=yes&flow=808102";
export const FAREHARBOR_PRIVATE_30 =
  "https://fareharbor.com/embeds/book/honoluluhelicoptertours/items/326066/?ref=asn&asn=elion&asn-ref=asn&full-items=yes&flow=848443";
export const FAREHARBOR_PRIVATE_60 =
  "https://fareharbor.com/embeds/book/honoluluhelicoptertours/items/326071/?ref=asn&asn=elion&asn-ref=asn&full-items=yes&flow=848443";

/** @deprecated Use FAREHARBOR_PRIVATE_ALL for the private-flight modal. */
export const FAREHARBOR_HONOLULU_HELICOPTER_TOURS = FAREHARBOR_PRIVATE_ALL;

/** Tracked redirect (emails fareharborAlert then 302). Prefer direct URL + lightframe on marketing site. */
export function fareHarborTrackedOutboundUrl(source: string): string {
  const base = BOOKING_APP_BASE_URL.replace(/\/$/, "");
  return `${base}/api/fareharbor-out?src=${encodeURIComponent(source)}`;
}

/** Direct FareHarbor URL for lightframe / same-tab booking (matches timeforfunhawaii.com /live/). */
export function fareHarborDirectUrl(): string {
  return FAREHARBOR_PRIVATE_ALL;
}
