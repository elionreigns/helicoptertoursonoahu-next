import { NextRequest, NextResponse } from 'next/server';
import { emails } from '@/lib/constants';

/**
 * Resend Inbound Webhook
 *
 * Resend POSTs here when an email is received at your receiving domain
 * (e.g. bookings@helicoptertoursonoahu.com if you set up Resend Inbound).
 *
 * We fetch the email body via Resend API, then route to:
 * - /api/operator-reply if from = Blue Hawaiian or Rainbow
 * - /api/customer-reply otherwise (customer replies)
 *
 * Required: Set up Resend Inbound (receiving) and add this URL as a webhook
 * with event type "email.received". See RESEND_INBOUND_SETUP.md.
 */

const OPERATOR_EMAILS = [emails.blueHawaiian, emails.rainbow].map((e) => e.toLowerCase());

function extractFromEmail(from: string): string {
  const match = from.match(/<([^>]+)>/);
  if (match) return match[1].trim().toLowerCase();
  return from.trim().toLowerCase();
}

export async function POST(request: NextRequest) {
  try {
    const event = (await request.json()) as {
      type?: string;
      data?: { email_id?: string; from?: string; subject?: string };
    };

    if (event?.type !== 'email.received' || !event?.data?.email_id) {
      return NextResponse.json({ received: true });
    }

    const emailId = event.data.email_id;
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey) {
      console.error('Resend Inbound: RESEND_API_KEY not set');
      return NextResponse.json({ error: 'Config missing' }, { status: 500 });
    }

    const res = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Resend Inbound: failed to fetch email', emailId, res.status, err);
      return NextResponse.json({ error: 'Failed to fetch email' }, { status: 502 });
    }

    const email = (await res.json()) as {
      from?: string;
      subject?: string;
      text?: string | null;
      html?: string | null;
    };

    const fromRaw = email.from ?? event.data.from ?? '';
    const fromEmail = extractFromEmail(fromRaw);
    const subject = email.subject ?? event.data.subject ?? '';
    const emailContent = (email.text || email.html || '').trim();
    if (!emailContent) {
      console.warn('Resend Inbound: empty body for', emailId);
    }
    if (!fromEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail)) {
      console.warn('Resend Inbound: invalid from', fromRaw);
      return NextResponse.json({ received: true });
    }

    const baseUrl =
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXT_PUBLIC_APP_URL || 'https://booking.helicoptertoursonoahu.com';

    const isOperator = OPERATOR_EMAILS.includes(fromEmail);
    const endpoint = isOperator ? '/api/operator-reply' : '/api/customer-reply';
    const body = isOperator
      ? { emailContent, fromEmail, subject }
      : { emailContent, fromEmail, subject };

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
    if (bypassSecret) headers['x-vercel-protection-bypass'] = bypassSecret;

    const apiRes = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error('Resend Inbound: API call failed', endpoint, apiRes.status, errText);
      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true, routed: endpoint });
  } catch (error) {
    console.error('Resend Inbound webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
