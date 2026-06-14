import { BOOKING_APP_BASE_URL } from "./constants";

/** Final FareHarbor URL (affiliate ref preserved). Used only after /api/fareharbor-out redirect. */
export const FAREHARBOR_HONOLULU_HELICOPTER_TOURS =
  "https://fareharbor.com/embeds/book/honoluluhelicoptertours/?ref=asn-yourhawaiitours&schedule-uuid=3a6f0ed9-683a-4ee6-be4a-6aa0bab7ecb9&asn=yourhawaiitours&asn-ref=asn-yourhawaiitours&full-items=yes";

/** Use in href= so you get an email to internalAlert before redirect to FareHarbor. */
export function fareHarborTrackedOutboundUrl(source: string): string {
  const base = BOOKING_APP_BASE_URL.replace(/\/$/, "");
  return `${base}/api/fareharbor-out?src=${encodeURIComponent(source)}`;
}
