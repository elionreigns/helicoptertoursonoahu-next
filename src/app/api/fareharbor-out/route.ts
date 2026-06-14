import { NextRequest, NextResponse } from 'next/server';
import { FAREHARBOR_HONOLULU_HELICOPTER_TOURS } from '@/lib/partnerLinks';
import { sendFareHarborClickAlert } from '@/lib/email';

/**
 * Tracked outbound link for Honolulu Helicopter Tours (FareHarbor).
 * Emails internal alert, then redirects so affiliate ref params stay on FareHarbor.
 */
export async function GET(request: NextRequest) {
  const src = request.nextUrl.searchParams.get('src')?.trim() || 'unknown';
  const referrer = request.headers.get('referer') || '';
  const userAgent = request.headers.get('user-agent') || '';

  void sendFareHarborClickAlert({ source: src, referrer, userAgent }).catch((err) => {
    console.error('FareHarbor click alert failed:', err);
  });

  return NextResponse.redirect(FAREHARBOR_HONOLULU_HELICOPTER_TOURS, 302);
}
