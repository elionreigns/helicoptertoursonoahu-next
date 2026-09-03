import { NextResponse } from 'next/server';

/** Short, spoken-friendly path for private-flight referrals. */
export function GET(request: Request) {
  return NextResponse.redirect(new URL('/private', request.url), 307);
}
