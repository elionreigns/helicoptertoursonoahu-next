import { NextResponse } from 'next/server';

/** Short, spoken-friendly path for private-flight referrals. */
export function GET(request: Request) {
  return NextResponse.redirect(new URL('/private-helicopter-flights-hawaii', request.url), 307);
}
