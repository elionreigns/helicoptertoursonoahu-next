import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendClientInteractionAlert, type ClientInteractionSource } from '@/lib/email';

const cartItemSchema = z.object({
  name: z.string().optional(),
  provider: z.string().optional(),
  quantity: z.number().optional(),
  price: z.number().optional(),
  adults: z.number().optional(),
  children: z.number().optional(),
  island: z.string().optional(),
  duration: z.string().optional(),
}).passthrough();

const clientInteractionSchema = z.object({
  source: z.enum(['cart', 'chatbot', 'phone', 'vapi', 'web', 'form']),
  outcome: z.string().optional().default('submitted'),
  customer_name: z.string().optional(),
  customer_email: z.string().optional(),
  customer_phone: z.string().optional(),
  hotel: z.string().optional(),
  ref_code: z.string().optional(),
  call_id: z.string().optional(),
  duration_seconds: z.number().optional(),
  ended_reason: z.string().optional(),
  transcript: z.string().optional(),
  summary: z.string().optional(),
  cart: z.array(cartItemSchema).optional(),
  total: z.number().optional(),
  item_count: z.number().optional(),
});

/**
 * POST /api/client-interaction
 *
 * Unified webhook for marketing-site cart, chatbot passthrough, and other
 * client touchpoints. Sends an email to coralcrowntechnologies@gmail.com.
 *
 * Optional: set CLIENT_INTERACTION_SECRET in Vercel and send header
 * x-client-interaction-secret from trusted callers (PHP cart on marketing site).
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    path: '/api/client-interaction',
    method: 'POST',
    description: 'Client interaction alert — emails coralcrowntechnologies@gmail.com',
    secretConfigured: Boolean(process.env.CLIENT_INTERACTION_SECRET?.trim()),
  });
}

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.CLIENT_INTERACTION_SECRET?.trim();
    if (secret) {
      const provided =
        request.headers.get('x-client-interaction-secret') ??
        request.headers.get('X-Client-Interaction-Secret');
      if (provided !== secret) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await request.json();
    const validated = clientInteractionSchema.parse(body);

    const cartItems = validated.cart?.map((item) => ({
      name: item.name,
      provider: item.provider,
      quantity: item.quantity ?? ((item.adults ?? 0) + (item.children ?? 0) || 1),
      price: item.price,
    }));

    const result = await sendClientInteractionAlert({
      source: validated.source as ClientInteractionSource,
      outcome: validated.outcome,
      customerName: validated.customer_name,
      customerEmail: validated.customer_email,
      customerPhone: validated.customer_phone,
      hotel: validated.hotel,
      refCode: validated.ref_code,
      callId: validated.call_id,
      durationSeconds: validated.duration_seconds,
      endedReason: validated.ended_reason,
      transcript: validated.transcript,
      summary: validated.summary,
      cartItems,
      totalAmount: validated.total,
      itemCount: validated.item_count ?? cartItems?.length,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send alert' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }
    console.error('client-interaction error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}