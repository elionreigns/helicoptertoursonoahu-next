import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

/**
 * GET /api/health
 * Lightweight check for uptime monitors: env presence + one read on `bookings`.
 * Does not echo secrets.
 */
export async function GET() {
  const hasSupabaseUrl = Boolean(process.env.SUPABASE_URL?.trim());
  const hasServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());

  if (!hasSupabaseUrl || !hasServiceKey) {
    return NextResponse.json(
      {
        ok: false,
        supabase: 'misconfigured',
        hasSupabaseUrl,
        hasServiceKey,
      },
      { status: 503 }
    );
  }

  try {
    const { error } = await supabase.from('bookings').select('id').limit(1);
    if (error) {
      return NextResponse.json(
        {
          ok: false,
          supabase: 'query_failed',
          code: error.code,
          hint: error.hint ?? undefined,
        },
        { status: 503 }
      );
    }
    return NextResponse.json({
      ok: true,
      supabase: 'ok',
      hasSupabaseUrl,
      hasServiceKey,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown_error';
    return NextResponse.json({ ok: false, supabase: 'error', message }, { status: 503 });
  }
}
