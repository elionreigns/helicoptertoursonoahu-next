import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { emails } from '@/lib/constants';

/**
 * Resend Inbound Webhook
 *
 * Resend POSTs here when an email is received at your receiving address
 * (e.g. helicopter@goudamo.resend.app — set REPLY_TO_INBOUND in Vercel).
 *
 * We fetch the email body via Resend API, then route to:
 * - /api/operator-reply if from = Blue Hawaiian or Rainbow
 * - /api/customer-reply otherwise (customer replies)
 *
 * Required: Resend Receiving on + webhook URL with event "email.received".
 * See RESEND_INBOUND_CHECKLIST.md.
 */

const OPERATOR_EMAILS = [emails.blueHawaiian, emails.rainbow].map((e) => e.toLowerCase());

function extractFromEmail(from: string): string {
  const match = from.match(/<([^>]+)>/);
  if (match) return match[1].trim().toLowerCase();
  return from.trim().toLowerCase();
}

/** Optional Svix signature verification when RESEND_WEBHOOK_SECRET is set. */
function verifyWebhookSignature(
  rawBody: string,
  svixId: string | null,
  svixTimestamp: string | null,
  svixSignature: string | null,
  secret: string
): boolean {
  if (!svixId || !svixTimestamp || !svixSignature) return false;
  const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`;
  const key = secret.startsWith('whsec_') ? Buffer.from(secret.slice(6), 'base64') : secret;
  const expected = createHmac('sha256', key).update(signedContent).digest('base64');
  const v1Part = svixSignature.split(' ').find((s) => s.startsWith('v1,'));
  if (!v1Part) return false;
  const sig = v1Part.slice(3);
  if (expected.length !== sig.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, 'base64'), Buffer.from(sig, 'base64'));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch (e) {
    console.error('Resend Inbound: failed to read body', e);
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  if (webhookSecret) {
    const id = request.headers.get('svix-id');
    const timestamp = request.headers.get('svix-timestamp');
    const signature = request.headers.get('svix-signature');
    if (!verifyWebhookSignature(rawBody, id, timestamp, signature, webhookSecret)) {
      console.warn('Resend Inbound: webhook signature verification failed');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  try {
    const event = JSON.parse(rawBody) as {
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
      if (res.status === 401 && err.includes('restricted') && err.includes('send')) {
        console.error(
          'Resend Inbound: API key is restricted to sending only. To fetch received emails, use an API key with Receiving scope. Resend Dashboard → API Keys → create key with full access or enable Receiving.'
        );
      }
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
    // Extract refCode from subject (e.g. "Re: Availability inquiry HTO-S7GPQ4 - Erix") so operator-reply can find the booking
    const refCodeMatch = subject.match(/HTO-[A-Z0-9]{6}/);
    const refCode = refCodeMatch ? refCodeMatch[0] : undefined;
    const body = isOperator
      ? { emailContent, fromEmail, subject, refCode }
      : { emailContent, fromEmail, subject, refCode };

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
      return NextResponse.json({ received: true, error: 'downstream_failed', endpoint });
    }

    console.log('Resend Inbound: routed to', endpoint, 'from', fromEmail);
    return NextResponse.json({ received: true, routed: endpoint });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    const errStack = error instanceof Error ? error.stack : undefined;
    console.error('Resend Inbound webhook error:', errMsg, errStack ?? '');
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
