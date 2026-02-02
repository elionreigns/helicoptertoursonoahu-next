import { NextRequest, NextResponse } from 'next/server';
import { supabase, getBookingByRefCode } from '@/lib/supabaseClient';
import { decryptPayload } from '@/lib/securePayment';
import { VENDOR_PASSWORDS } from '@/lib/constants';

const OPERATOR_VIEW_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * POST /api/operator-view-payment
 * Body: { refCode: "HTO-XXXXXX", password: "..." }
 * Operator (Rainbow or Blue Hawaiian) enters confirmation number + vendor password on
 * booking.helicoptertoursonoahu.com/reservations. Payment details are viewable for 5 minutes
 * then the record is destroyed. If they need it again they must contact the customer.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const refCode = (body.refCode as string)?.trim().toUpperCase();
    const password = (body.password as string)?.trim();
    if (!refCode || !/^HTO-[A-Z0-9]{6}$/.test(refCode)) {
      return NextResponse.json({ success: false, error: 'Invalid confirmation number' }, { status: 400 });
    }
    if (!password) {
      return NextResponse.json({ success: false, error: 'Vendor password required' }, { status: 400 });
    }

    const { data: booking, error: bookingError } = await getBookingByRefCode(refCode);
    if (bookingError || !booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    const operatorName = (booking.operator_name ?? '').toLowerCase();
    const isRainbow = operatorName.includes('rainbow');
    const isBlueHawaiian = operatorName.includes('blue') || operatorName.includes('hawaiian');
    const expectedPassword = isRainbow
      ? VENDOR_PASSWORDS.rainbow
      : isBlueHawaiian
        ? VENDOR_PASSWORDS.blueHawaiian
        : null;
    if (!expectedPassword || password !== expectedPassword) {
      return NextResponse.json({ success: false, error: 'Invalid confirmation number or vendor password' }, { status: 401 });
    }

    // Cleanup: delete rows viewed by operator more than 5 minutes ago (operator_viewed_at < cutoff implies not null)
    const cutoff = new Date(Date.now() - OPERATOR_VIEW_TTL_MS).toISOString();
    await supabase
      .from('secure_payments')
      .delete()
      .eq('ref_code', refCode)
      .lt('operator_viewed_at', cutoff);

    const { data: row, error: rowError } = await supabase
      .from('secure_payments')
      .select('id, encrypted_payload, operator_viewed_at')
      .eq('ref_code', refCode)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (rowError || !row) {
      return NextResponse.json({
        success: false,
        error: 'No payment details on file for this booking, or they were already viewed and destroyed after 5 minutes. If you need them again, contact the customer directly.',
      }, { status: 404 });
    }

    const r = row as { id: string; encrypted_payload: string; operator_viewed_at: string | null };
    const viewedAt = r.operator_viewed_at;
    const viewedAtMs = viewedAt ? new Date(viewedAt).getTime() : 0;
    if (viewedAt && Date.now() - viewedAtMs > OPERATOR_VIEW_TTL_MS) {
      await supabase.from('secure_payments').delete().eq('id', r.id);
      return NextResponse.json({
        success: false,
        error: 'Payment details were viewable for 5 minutes and have been destroyed. Contact the customer if you need them again.',
      }, { status: 410 });
    }

    // Mark as viewed now if first time
    if (!viewedAt) {
      await supabase
        .from('secure_payments')
        .update({ operator_viewed_at: new Date().toISOString() } as never)
        .eq('id', r.id);
    }

    const payload = decryptPayload(r.encrypted_payload);
    const maskCard = (num: string) =>
      num.length < 8 ? num : num.slice(0, 4) + ' **** **** ' + num.slice(-4);

    return NextResponse.json({
      success: true,
      refCode,
      message: 'Payment details are viewable for 5 minutes from now, then they will be permanently destroyed. If you need them again, contact the customer.',
      payment: {
        card_name: payload.card_name || '',
        card_number: payload.card_number || '',
        card_number_masked: maskCard(payload.card_number || ''),
        card_expiry: payload.card_expiry || '',
        card_cvc: payload.card_cvc || '',
        billing_address: payload.billing_address || '',
        billing_zip: payload.billing_zip || '',
      },
      destroyAt: new Date(Date.now() + OPERATOR_VIEW_TTL_MS).toISOString(),
    });
  } catch (err) {
    console.error('Operator view payment error:', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
