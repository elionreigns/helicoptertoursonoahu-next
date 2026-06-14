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

  const supabaseHost = (() => {
    try {
      return new URL(process.env.SUPABASE_URL!.trim()).hostname;
    } catch {
      return undefined;
    }
  })();

  try {
    const { error } = await supabase.from('bookings').select('id').limit(1);
    if (error) {
      return NextResponse.json(
        {
          ok: false,
          supabase: 'query_failed',
          host: supabaseHost,
          code: error.code,
          message: error.message,
          hint: error.hint ?? undefined,
          action:
            error.message?.includes('fetch failed') || !error.code
              ? 'Supabase project may be paused or deleted — open Supabase dashboard and Restore project, or update SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in Vercel.'
              : undefined,
        },
        { status: 503 }
      );
    }
    return NextResponse.json({
      ok: true,
      supabase: 'ok',
      host: supabaseHost,
      hasSupabaseUrl,
      hasServiceKey,
      resend: Boolean(process.env.RESEND_API_KEY?.trim()),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown_error';
    return NextResponse.json(
      {
        ok: false,
        supabase: 'error',
        host: supabaseHost,
        message,
        action:
          message.includes('fetch failed')
            ? 'Supabase host unreachable — restore paused project at supabase.com/dashboard or replace env vars after creating a new project.'
            : undefined,
      },
      { status: 503 }
    );
  }
}
