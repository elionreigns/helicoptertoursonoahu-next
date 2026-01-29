import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { decryptPayload } from '@/lib/securePayment';

/**
 * GET /api/operator-payment?ref=HTO-XXXXXX&token=one-time-token
 * Operator views payment details once. After viewing, record is marked consumed.
 * Never log card data.
 */
export async function GET(request: NextRequest) {
  try {
    const ref = request.nextUrl.searchParams.get('ref');
    const token = request.nextUrl.searchParams.get('token');
    if (!ref || !token) {
      return new NextResponse('Missing ref or token', { status: 400 });
    }

    const { data: row, error } = await supabase
      .from('secure_payments')
      .select('id, encrypted_payload, consumed_at')
      .eq('ref_code', ref)
      .eq('operator_token', token)
      .single();

    if (error || !row) {
      return new NextResponse('Invalid or expired link', { status: 404 });
    }

    const consumedAt = (row as { consumed_at?: string }).consumed_at;
    if (consumedAt) {
      return new NextResponse(
        '<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem;"><p>This link has already been used. Payment details were viewed once and are no longer available.</p></body></html>',
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    const encrypted = (row as { encrypted_payload: string }).encrypted_payload;
    const payload = decryptPayload(encrypted);

    await supabase
      .from('secure_payments')
      .update({ consumed_at: new Date().toISOString() })
      .eq('ref_code', ref)
      .eq('operator_token', token);

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Payment details – ${ref}</title></head>
<body style="font-family:sans-serif;padding:2rem;max-width:600px;">
  <h1>Payment details – ${ref}</h1>
  <p><strong>View once.</strong> This page will not be available again.</p>
  <ul style="line-height:1.8;">
    <li><strong>Name on card:</strong> ${escapeHtml(payload.card_name || '')}</li>
    <li><strong>Card number:</strong> ${escapeHtml(maskCard(payload.card_number || ''))}</li>
    <li><strong>Expiry:</strong> ${escapeHtml(payload.card_expiry || '')}</li>
    <li><strong>CVC:</strong> ${escapeHtml(payload.card_cvc || '')}</li>
    <li><strong>Billing address:</strong> ${escapeHtml(payload.billing_address || '')}</li>
    <li><strong>ZIP:</strong> ${escapeHtml(payload.billing_zip || '')}</li>
  </ul>
  <p style="color:#666;font-size:0.9em;">Full number for processing: ${escapeHtml(payload.card_number || '')}</p>
  <p style="margin-top:2rem;color:#999;">Link consumed. Do not share this page.</p>
</body>
</html>`;

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
  } catch (err) {
    console.error('Operator payment view error:', err);
    return new NextResponse('Error loading payment details', { status: 500 });
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function maskCard(num: string): string {
  if (num.length < 8) return num;
  return num.slice(0, 4) + ' **** **** ' + num.slice(-4);
}
