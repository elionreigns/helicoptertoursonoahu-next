import 'server-only';
import nodemailer from 'nodemailer';
import { emails } from './constants';

/**
 * Email transporter configuration for Site5 email
 * Uses SMTP settings from environment variables
 * Required env vars: SITE5_SMTP_HOST, SITE5_SMTP_PORT, SITE5_EMAIL_USERNAME, SITE5_EMAIL_PASSWORD
 */
const createTransporter = () => {
  const smtpHost = process.env.SITE5_SMTP_HOST?.trim();
  const smtpPort = process.env.SITE5_SMTP_PORT ? parseInt(process.env.SITE5_SMTP_PORT, 10) : 587;
  const smtpUser = process.env.SITE5_EMAIL_USERNAME?.trim();
  const smtpPassword = process.env.SITE5_EMAIL_PASSWORD;

  if (!smtpHost || !smtpUser || !smtpPassword) {
    throw new Error('Missing required SMTP environment variables: SITE5_SMTP_HOST, SITE5_EMAIL_USERNAME, SITE5_EMAIL_PASSWORD');
  }

  const secure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure,
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    tls: {
      rejectUnauthorized: false,
    },
  });
};

/**
 * Send email via Resend API when RESEND_API_KEY is set; otherwise via SMTP.
 * Resend bypasses shared-host SMTP auth issues. Set RESEND_API_KEY in Vercel;
 * optional RESEND_FROM e.g. "Helicopter Tours <bookings@helicoptertoursonoahu.com>"
 * after verifying domain, or omit to use onboarding@resend.dev for testing.
 */
async function sendViaResend(
  to: string | string[],
  subject: string,
  from: string,
  replyTo: string | undefined,
  text?: string,
  html?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return { success: false, error: 'RESEND_API_KEY not set' };

  const toArray = Array.isArray(to) ? to : [to];
  const fromAddr = process.env.RESEND_FROM?.trim() || from || 'Helicopter Tours on Oahu <onboarding@resend.dev>';
  const body: Record<string, unknown> = {
    from: fromAddr,
    to: toArray,
    subject,
    reply_to: replyTo || fromAddr,
  };
  if (html) body.html = html;
  if (text) body.text = text;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as { id?: string; message?: string };
  if (!res.ok) {
    const err = data?.message || res.statusText || 'Resend API error';
    console.error('Resend API error:', res.status, err);
    return { success: false, error: err };
  }
  return { success: true, messageId: data?.id };
}

/**
 * Send email via SMTP or Resend (when RESEND_API_KEY is set).
 */
export async function sendEmail({
  to,
  subject,
  text,
  html,
  from,
  replyTo,
}: {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const fromEmail = from || emails.bookingsHub;
  const replyToEmail = replyTo || fromEmail;

  if (process.env.RESEND_API_KEY?.trim()) {
    return sendViaResend(to, subject, fromEmail, replyToEmail, text, html);
  }

  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: fromEmail,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      text,
      html,
      replyTo: replyToEmail,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send booking request to operator
 */
export async function sendBookingRequestToOperator({
  operatorEmail,
  operatorName,
  bookingDetails,
  availabilityResult,
  paymentDetails,
  refCode,
}: {
  operatorEmail: string;
  operatorName: string;
  bookingDetails: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    partySize: number;
    preferredDate: string;
    timeWindow?: string;
    doorsOff?: boolean;
    hotel?: string;
    specialRequests?: string;
    totalWeight?: number;
  };
  availabilityResult?: {
    available: boolean;
    availableSlots?: Array<{ time: string; price?: number; available: boolean }>;
    details?: any;
    error?: string;
    source?: string;
  } | null;
  paymentDetails?: {
    card_name: string;
    card_number: string;
    card_expiry: string;
    card_cvc: string;
    billing_address?: string;
    billing_zip?: string;
  } | null;
  refCode?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const subject = `New Helicopter Tour Booking Request${refCode ? ` - ${refCode}` : ''} - ${bookingDetails.customerName}`;

  // Build availability section
  let availabilityText = '';
  let availabilityHtml = '';
  if (availabilityResult) {
    if (availabilityResult.available && availabilityResult.availableSlots && availabilityResult.availableSlots.length > 0) {
      availabilityText = `\nAvailability Check Results:\n- Status: Available\n- Available Time Slots:\n${availabilityResult.availableSlots.map(slot => `  • ${slot.time}${slot.price ? ` - $${slot.price}` : ''}`).join('\n')}\n`;
      availabilityHtml = `
      <h3>Availability Check Results</h3>
      <p><strong>Status:</strong> Available</p>
      <p><strong>Available Time Slots:</strong></p>
      <ul>
        ${availabilityResult.availableSlots.map(slot => `<li>${slot.time}${slot.price ? ` - $${slot.price}` : ''}</li>`).join('')}
      </ul>
      `;
    } else if (availabilityResult.error) {
      availabilityText = `\nAvailability Check: ${availabilityResult.error}\n(Manual check required)\n`;
      availabilityHtml = `<p><strong>Availability Check:</strong> ${availabilityResult.error} (Manual check required)</p>`;
    } else {
      availabilityText = `\nAvailability Check: Manual check required\n`;
      availabilityHtml = `<p><strong>Availability Check:</strong> Manual check required</p>`;
    }
  }

  // Build payment section (SECURE - full details for operator to process)
  let paymentText = '';
  let paymentHtml = '';
  if (paymentDetails) {
    paymentText = `\n\n⚠️ PAYMENT INFORMATION PROVIDED - PROCESS IMMEDIATELY ⚠️\n\nCard Name: ${paymentDetails.card_name}\nCard Number: ${paymentDetails.card_number}\nExpiry: ${paymentDetails.card_expiry}\nCVC: ${paymentDetails.card_cvc}\nBilling Address: ${paymentDetails.billing_address || 'Not provided'}\nZIP: ${paymentDetails.billing_zip || 'Not provided'}\n\n⚠️ IMPORTANT: Please call customer at ${bookingDetails.customerPhone} to confirm before charging. Never share CVC over phone.\n`;
    paymentHtml = `
      <div style="background-color: #fff3cd; border: 2px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
        <h3 style="color: #856404; margin-top: 0;">⚠️ PAYMENT INFORMATION PROVIDED - PROCESS IMMEDIATELY ⚠️</h3>
        <p><strong>Card Name:</strong> ${paymentDetails.card_name}</p>
        <p><strong>Card Number:</strong> ${paymentDetails.card_number}</p>
        <p><strong>Expiry:</strong> ${paymentDetails.card_expiry}</p>
        <p><strong>CVC:</strong> ${paymentDetails.card_cvc}</p>
        <p><strong>Billing Address:</strong> ${paymentDetails.billing_address || 'Not provided'}</p>
        <p><strong>ZIP:</strong> ${paymentDetails.billing_zip || 'Not provided'}</p>
        <p style="color: #856404; font-weight: bold; margin-top: 15px;">⚠️ IMPORTANT: Please call customer at ${bookingDetails.customerPhone} to confirm before charging. Never share CVC over phone.</p>
      </div>
    `;
  }

  const text = `
New Booking Request${refCode ? ` - Reference: ${refCode}` : ''}

Customer Information:
- Name: ${bookingDetails.customerName}
- Email: ${bookingDetails.customerEmail}
- Phone: ${bookingDetails.customerPhone}${paymentDetails ? ' ⚠️ CALL TO CONFIRM BEFORE CHARGING' : ''}

Tour Details:
- Party Size: ${bookingDetails.partySize}
- Preferred Date: ${bookingDetails.preferredDate}
- Time Window: ${bookingDetails.timeWindow || 'Flexible'}
- Doors Off: ${bookingDetails.doorsOff ? 'Yes' : 'No'}
- Hotel: ${bookingDetails.hotel || 'Not specified'}
- Total Weight: ${bookingDetails.totalWeight ? `${bookingDetails.totalWeight} lbs` : 'Not specified'} – please confirm for safety
- Special Requests: ${bookingDetails.specialRequests || 'None'}
${availabilityText}
${paymentText}
Please confirm availability and pricing for this booking.

Thank you,
Helicopter Tours on Oahu
  `.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a73e8;">New Booking Request${refCode ? ` - ${refCode}` : ''}</h2>
      
      <h3>Customer Information</h3>
      <ul>
        <li><strong>Name:</strong> ${bookingDetails.customerName}</li>
        <li><strong>Email:</strong> ${bookingDetails.customerEmail}</li>
        <li><strong>Phone:</strong> ${bookingDetails.customerPhone}${paymentDetails ? ' <span style="color: #856404; font-weight: bold;">⚠️ CALL TO CONFIRM BEFORE CHARGING</span>' : ''}</li>
      </ul>
      
      <h3>Tour Details</h3>
      <ul>
        <li><strong>Party Size:</strong> ${bookingDetails.partySize}</li>
        <li><strong>Preferred Date:</strong> ${bookingDetails.preferredDate}</li>
        <li><strong>Time Window:</strong> ${bookingDetails.timeWindow || 'Flexible'}</li>
        <li><strong>Doors Off:</strong> ${bookingDetails.doorsOff ? 'Yes' : 'No'}</li>
        <li><strong>Hotel:</strong> ${bookingDetails.hotel || 'Not specified'}</li>
        <li><strong>Total Weight:</strong> ${bookingDetails.totalWeight ? `${bookingDetails.totalWeight} lbs` : 'Not specified'} – please confirm for safety</li>
        <li><strong>Special Requests:</strong> ${bookingDetails.specialRequests || 'None'}</li>
      </ul>
      
      ${availabilityHtml}
      ${paymentHtml}
      
      <p>Please confirm availability and pricing for this booking.</p>
      
      <p>Thank you,<br>Helicopter Tours on Oahu</p>
    </div>
  `;

  // Send to operator and to bookings hub so you always get a copy at bookings@
  const toAddresses = [operatorEmail];
  if (emails.bookingsHub && !toAddresses.includes(emails.bookingsHub)) {
    toAddresses.push(emails.bookingsHub);
  }
  return sendEmail({
    to: toAddresses,
    subject,
    text,
    html,
    from: emails.bookingsHub,
    replyTo: emails.testAgent,
  });
}

/**
 * Send confirmation email to customer
 */
export async function sendConfirmationToCustomer({
  customerEmail,
  customerName,
  bookingDetails,
  confirmationNumber,
  hasPayment,
}: {
  customerEmail: string;
  customerName: string;
  bookingDetails: {
    operatorName: string;
    date: string;
    time?: string;
    partySize: number;
    totalAmount?: number;
  };
  confirmationNumber?: string;
  hasPayment?: boolean;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const subject = `Your Helicopter Tour Booking${confirmationNumber ? ` - ${confirmationNumber}` : ''}`;

  const paymentNote = hasPayment 
    ? '\n\nPayment Information: We have received your payment information. The operator will contact you to confirm your booking before processing payment. For security, never share your CVC over the phone.\n'
    : '\n\nPayment: The operator will contact you with payment instructions once availability is confirmed.\n';

  const text = `
Dear ${customerName},

Thank you for booking with Helicopter Tours on Oahu!

Booking Details:
- Reference Code: ${confirmationNumber || 'Pending'}
- Operator: ${bookingDetails.operatorName}
- Date: ${bookingDetails.date}
- Time: ${bookingDetails.time || 'To be confirmed'}
- Party Size: ${bookingDetails.partySize}
${bookingDetails.totalAmount ? `- Total Amount: $${bookingDetails.totalAmount}` : ''}
${paymentNote}
We will contact you shortly with final confirmation${hasPayment ? ' and to verify your payment information' : ' and payment details'}.

If you have any questions, please reply to this email or call us.

Best regards,
Helicopter Tours on Oahu
  `.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a73e8;">Thank You for Your Booking!</h2>
      
      <p>Dear ${customerName},</p>
      
      <p>Thank you for booking with Helicopter Tours on Oahu!</p>
      
      <h3>Booking Details</h3>
      <ul>
        <li><strong>Operator:</strong> ${bookingDetails.operatorName}</li>
        <li><strong>Date:</strong> ${bookingDetails.date}</li>
        <li><strong>Time:</strong> ${bookingDetails.time || 'To be confirmed'}</li>
        <li><strong>Party Size:</strong> ${bookingDetails.partySize}</li>
        ${bookingDetails.totalAmount ? `<li><strong>Total Amount:</strong> $${bookingDetails.totalAmount}</li>` : ''}
        ${confirmationNumber ? `<li><strong>Confirmation Number:</strong> ${confirmationNumber}</li>` : ''}
      </ul>
      
      ${hasPayment ? `
      <div style="background-color: #d1ecf1; border-left: 4px solid #0c5460; padding: 12px; margin: 15px 0;">
        <p style="margin: 0; color: #0c5460;"><strong>Payment Information Received:</strong> We have received your payment information. The operator will contact you to confirm your booking before processing payment. For security, never share your CVC over the phone.</p>
      </div>
      ` : `
      <p>We will contact you shortly with final confirmation and payment details.</p>
      `}
      
      <p>If you have any questions, please reply to this email or call us.</p>
      
      <p>Best regards,<br>Helicopter Tours on Oahu</p>
    </div>
  `;

  return sendEmail({
    to: customerEmail,
    subject,
    text,
    html,
    from: emails.bookingsHub,
    replyTo: emails.testAgent,
  });
}
