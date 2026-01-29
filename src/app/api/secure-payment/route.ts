import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase, getBookingByRefCode, updateBooking } from '@/lib/supabaseClient';
import { verifyCustomerToken, encryptPayload } from '@/lib/securePayment';

const securePaymentSchema = z.object({
  refCode: z.string().regex(/^HTO-[A-Z0-9]{6}$/),
  token: z.string().min(1),
  card_name: z.string().min(1),
  card_number: z.string().min(13).max(19),
  card_expiry: z.string().min(4).max(5),
  card_cvc: z.string().min(3).max(4),
  billing_address: z.string().optional(),
  billing_zip: z.string().optional(),
});

/**
 * POST /api/secure-payment
 * Customer submits full card details via secure link. We encrypt and store; never log or email.
 * Requires secure_payments table in Supabase (run supabase-secure-payments.sql).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = securePaymentSchema.parse(body);

    if (!verifyCustomerToken(validated.refCode, validated.token)) {
      return NextResponse.json({ success: false, error: 'Invalid or expired link' }, { status: 400 });
    }

    const { data: booking, error: bookingError } = await getBookingByRefCode(validated.refCode);
    if (bookingError || !booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    const payload = {
      card_name: validated.card_name,
      card_number: validated.card_number.replace(/\s/g, ''),
      card_expiry: validated.card_expiry,
      card_cvc: validated.card_cvc,
      billing_address: validated.billing_address ?? '',
      billing_zip: validated.billing_zip ?? '',
    };
    const encrypted = encryptPayload(payload);

    const { error: insertError } = await supabase.from('secure_payments').insert({
      ref_code: validated.refCode,
      encrypted_payload: encrypted,
    } as never);

    if (insertError) {
      console.error('Secure payment insert error:', insertError.message);
      return NextResponse.json({ success: false, error: 'Could not save payment details' }, { status: 500 });
    }

    const prevMeta = (booking.metadata ?? {}) as Record<string, unknown>;
    await updateBooking(booking.id, {
      updated_at: new Date().toISOString(),
      metadata: {
        ...prevMeta,
        secure_payment_received_at: new Date().toISOString(),
      },
    });

    return NextResponse.json({ success: true, message: 'Payment details received securely' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Invalid data', details: err.issues }, { status: 400 });
    }
    console.error('Secure payment error:', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
