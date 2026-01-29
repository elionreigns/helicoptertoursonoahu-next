import 'server-only';
import nodemailer from 'nodemailer';
import { emails, VAPI_PHONE_NUMBER } from './constants';

/** Reply-To for inbound: use env so you can set Resend's free .resend.app address without code change or paying for another domain. Exported for use in API routes that send email directly. */
export const replyToInbound = () =>
  process.env.REPLY_TO_INBOUND?.trim() || emails.bookingsHubInbound || emails.bookingsHub;

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
  tourName,
  totalPrice,
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
  tourName?: string;
  totalPrice?: number;
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
${tourName ? `- Tour: ${tourName}` : ''}
${totalPrice ? `- Total Price: $${totalPrice.toFixed(2)} (${bookingDetails.partySize} ${bookingDetails.partySize === 1 ? 'person' : 'people'})` : ''}
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
        ${tourName ? `<li><strong>Tour:</strong> ${tourName}</li>` : ''}
        ${totalPrice ? `<li><strong>Total Price:</strong> $${totalPrice.toFixed(2)} (${bookingDetails.partySize} ${bookingDetails.partySize === 1 ? 'person' : 'people'})</li>` : ''}
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

  // Send to operator only (single recipient for reliable delivery from bookings@)
  const result = await sendEmail({
    to: operatorEmail,
    subject,
    text,
    html,
    from: emails.bookingsHub,
    replyTo: replyToInbound(),
  });
  // Send a copy to bookings hub for records (separate email so operator is sole recipient)
  if (result.success && emails.bookingsHub && emails.bookingsHub !== operatorEmail) {
    await sendEmail({
      to: emails.bookingsHub,
      subject: `Copy: ${subject}`,
      text,
      html,
      from: emails.bookingsHub,
      replyTo: replyToInbound(),
    });
  }
  return result;
}

/**
 * Send availability inquiry to Rainbow Helicopters (not full booking).
 * Asks what times they have on the requested date; full booking is sent after customer confirms.
 */
export async function sendRainbowAvailabilityInquiry({
  operatorEmail,
  operatorName,
  refCode,
  customerName,
  preferredDate,
  partySize,
  tourName,
  totalWeight,
  doorsOff,
  hotel,
}: {
  operatorEmail: string;
  operatorName: string;
  refCode: string;
  customerName: string;
  preferredDate: string;
  partySize: number;
  tourName?: string;
  totalWeight?: number;
  doorsOff?: boolean;
  hotel?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const subject = `Availability inquiry ${refCode} - ${customerName} - ${preferredDate}`;
  const dateFormatted = new Date(preferredDate + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const text = `
Availability inquiry – we have a customer interested in booking with ${operatorName}.

Reference: ${refCode}
Customer: ${customerName}
Preferred date: ${dateFormatted}
Party size: ${partySize}
${tourName ? `Tour: ${tourName}` : ''}
${totalWeight ? `Total weight: ${totalWeight} lbs` : ''}
${doorsOff ? 'Doors-off: Yes' : ''}
${hotel ? `Hotel: ${hotel}` : ''}

Please reply with what times you have available on this date. We will send full booking details and relay the confirmed time to the customer once they confirm.

Thank you,
Helicopter Tours on Oahu
  `.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a73e8;">Availability inquiry – ${operatorName}</h2>
      <p>We have a customer interested in booking. Please reply with available times for the date below.</p>
      <p><strong>Reference:</strong> ${refCode}</p>
      <p><strong>Customer:</strong> ${customerName}</p>
      <p><strong>Preferred date:</strong> ${dateFormatted}</p>
      <p><strong>Party size:</strong> ${partySize}</p>
      ${tourName ? `<p><strong>Tour:</strong> ${tourName}</p>` : ''}
      ${totalWeight ? `<p><strong>Total weight:</strong> ${totalWeight} lbs</p>` : ''}
      ${doorsOff ? `<p>Doors-off: Yes</p>` : ''}
      ${hotel ? `<p><strong>Hotel:</strong> ${hotel}</p>` : ''}
      <p>We will send full booking details and confirm with the customer once you provide available times.</p>
      <p>Thank you,<br>Helicopter Tours on Oahu</p>
    </div>
  `;

  const res = await sendEmail({
    to: operatorEmail,
    subject,
    text,
    html,
    from: emails.bookingsHub,
    replyTo: replyToInbound(),
  });
  if (res.success && emails.bookingsHub && emails.bookingsHub !== operatorEmail) {
    await sendEmail({
      to: emails.bookingsHub,
      subject: `Copy: ${subject}`,
      text,
      html,
      from: emails.bookingsHub,
      replyTo: replyToInbound(),
    });
  }
  return res;
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
  tourName,
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
  tourName?: string;
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
${tourName ? `- Tour: ${tourName}` : ''}
- Operator: ${bookingDetails.operatorName}
- Date: ${bookingDetails.date}
- Time: ${bookingDetails.time || 'To be confirmed'}
- Party Size: ${bookingDetails.partySize}
${bookingDetails.totalAmount ? `- Total Amount: $${bookingDetails.totalAmount.toFixed(2)}` : ''}
${paymentNote}
We will contact you shortly with final confirmation${hasPayment ? ' and to verify your payment information' : ' and payment details'}.

If you have any questions, please reply to this email or call us at ${VAPI_PHONE_NUMBER}.

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
        ${confirmationNumber ? `<li><strong>Reference Code:</strong> ${confirmationNumber}</li>` : ''}
        ${tourName ? `<li><strong>Tour:</strong> ${tourName}</li>` : ''}
        <li><strong>Operator:</strong> ${bookingDetails.operatorName}</li>
        <li><strong>Date:</strong> ${bookingDetails.date}</li>
        <li><strong>Time:</strong> ${bookingDetails.time || 'To be confirmed'}</li>
        <li><strong>Party Size:</strong> ${bookingDetails.partySize}</li>
        ${bookingDetails.totalAmount ? `<li><strong>Total Amount:</strong> $${bookingDetails.totalAmount.toFixed(2)}</li>` : ''}
      </ul>
      
      ${hasPayment ? `
      <div style="background-color: #d1ecf1; border-left: 4px solid #0c5460; padding: 12px; margin: 15px 0;">
        <p style="margin: 0; color: #0c5460;"><strong>Payment Information Received:</strong> We have received your payment information. The operator will contact you to confirm your booking before processing payment. For security, never share your CVC over the phone.</p>
      </div>
      ` : `
      <p>We will contact you shortly with final confirmation and payment details.</p>
      `}
      
      <p>If you have any questions, please reply to this email or call us at <strong>${VAPI_PHONE_NUMBER}</strong>.</p>
      
      <p>Best regards,<br>Helicopter Tours on Oahu</p>
    </div>
  `;

  return sendEmail({
    to: customerEmail,
    subject,
    text,
    html,
    from: emails.bookingsHub,
    replyTo: replyToInbound(),
  });
}

/**
 * Notify the internal agent to arrange with Rainbow Helicopters for a booking.
 * Sent when we've emailed the client the "we're in contact with Rainbow" follow-up.
 */
export async function sendRainbowArrangeNotificationToAgent({
  agentEmail,
  refCode,
  customerName,
  customerEmail,
  tourName,
  date,
  partySize,
}: {
  agentEmail: string;
  refCode: string;
  customerName: string;
  customerEmail: string;
  tourName: string;
  date: string;
  partySize: number;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const subject = `Arrange with Rainbow – ${refCode} – ${customerName}`;
  const text = `
Client wants Rainbow Helicopters tour – please arrange a time.

Reference: ${refCode}
Client: ${customerName} (${customerEmail})
Tour: ${tourName}
Preferred date: ${formattedDate}
Party size: ${partySize}

When Rainbow replies with a time, reply to that email (or use the operator-reply flow). We'll then notify the client that Rainbow has confirmed and is ready for payment. The client can reply with payment info if they haven't already; we'll relay that to Rainbow and confirm with the client.

From: Helicopter Tours on Oahu
  `.trim();
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #166534;">Arrange with Rainbow – ${refCode}</h2>
      <p>Client wants a Rainbow Helicopters tour. Please arrange a time with Rainbow.</p>
      <p><strong>Reference:</strong> ${refCode}</p>
      <p><strong>Client:</strong> ${customerName} (<a href="mailto:${customerEmail}">${customerEmail}</a>)</p>
      <p><strong>Tour:</strong> ${tourName}</p>
      <p><strong>Preferred date:</strong> ${formattedDate}</p>
      <p><strong>Party size:</strong> ${partySize}</p>
      <p>When Rainbow replies with a time, we'll notify the client that Rainbow has confirmed and is ready for payment. The client can reply with payment info; we'll relay to Rainbow and confirm with the client.</p>
      <p style="color: #64748b; font-size: 12px;">Helicopter Tours on Oahu</p>
    </div>
  `;
  return sendEmail({
    to: agentEmail,
    subject,
    text,
    html,
    from: emails.bookingsHub,
    replyTo: replyToInbound(),
  });
}

/**
 * Rainbow first follow-up (RAINBOW_EMAILS.md #1): right after confirmation.
 * Says we're communicating with Rainbow for times; asks for payment and any missing info.
 */
export async function sendRainbowFirstFollowUp({
  customerEmail,
  customerName,
  refCode,
  tourName,
  date,
  phoneNumber,
}: {
  customerEmail: string;
  customerName: string;
  refCode: string;
  tourName: string;
  date: string;
  phoneNumber?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const phone = phoneNumber || VAPI_PHONE_NUMBER;
  const subject = `Available Tour Times for ${refCode} – We're Contacting Rainbow & Need Your Details`;
  const text = `
Dear ${customerName},

Thank you for booking with Helicopter Tours on Oahu! We've received your request for ${tourName} with Rainbow Helicopters on ${formattedDate}.

We're now in contact with Rainbow Helicopters to get available times closest to your preferred date. We'll email you as soon as we have options.

**We need a few details from you so we can send everything to Rainbow in one go:**

• If you haven't already, please send us your **payment information** (card name, number, expiry, CVC, billing address). We'll pass it securely to Rainbow once your time is confirmed. For security, you can also call us at ${phone} to provide payment over the phone.
• If any of the following were missing from your booking, please send them now: full name, party size, total weight (all guests combined), hotel or pickup location, and any special requests or doors-off preference.

If we already have everything from your booking, you're all set — we'll just need you to confirm your preferred time once Rainbow sends us their available slots.

Reply to this email with your payment info and any missing details, or call us at ${phone}.

Best regards,
Helicopter Tours on Oahu

Reference Code: ${refCode}
  `.trim();
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #166534;">We're Contacting Rainbow & Need Your Details</h2>
      <p>Dear ${customerName},</p>
      <p>Thank you for booking with Helicopter Tours on Oahu! We've received your request for <strong>${tourName}</strong> with Rainbow Helicopters on <strong>${formattedDate}</strong>.</p>
      <p>We're now in contact with Rainbow Helicopters to get available times closest to your preferred date. We'll email you as soon as we have options.</p>
      <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin: 20px 0;">
        <p style="margin: 0 0 12px 0; font-weight: bold;">We need a few details from you so we can send everything to Rainbow in one go:</p>
        <ul style="margin: 0; padding-left: 20px;">
          <li>If you haven't already, please send us your <strong>payment information</strong> (card name, number, expiry, CVC, billing address). We'll pass it securely to Rainbow once your time is confirmed. For security, you can also call us at <a href="tel:${phone.replace(/\D/g, '')}">${phone}</a> to provide payment over the phone.</li>
          <li>If any of the following were missing from your booking, please send them now: full name, party size, total weight (all guests combined), hotel or pickup location, and any special requests or doors-off preference.</li>
        </ul>
        <p style="margin: 12px 0 0 0;">If we already have everything from your booking, you're all set — we'll just need you to confirm your preferred time once Rainbow sends us their available slots.</p>
      </div>
      <p>Reply to this email with your payment info and any missing details, or call us at <strong><a href="tel:${phone.replace(/\D/g, '')}">${phone}</a></strong>.</p>
      <p>Best regards,<br>Helicopter Tours on Oahu</p>
      <p style="color: #64748b; font-size: 12px;">Reference Code: ${refCode}</p>
    </div>
  `;
  return sendEmail({
    to: customerEmail,
    subject,
    text,
    html,
    from: emails.bookingsHub,
    replyTo: replyToInbound(),
  });
}

/**
 * Rainbow: email customer when Rainbow has sent us available times (RAINBOW_EMAILS.md #2).
 */
export async function sendRainbowTimesToCustomer({
  customerEmail,
  customerName,
  refCode,
  date,
  timesList,
  phoneNumber,
}: {
  customerEmail: string;
  customerName: string;
  refCode: string;
  date: string;
  timesList: string[];
  phoneNumber?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const phone = phoneNumber || VAPI_PHONE_NUMBER;
  const listText = timesList.length ? timesList.map(t => `• ${t}`).join('\n') : '• (times provided by Rainbow)';
  const listHtml = timesList.length ? timesList.map(t => `<li>${t}</li>`).join('') : '<li>(times provided by Rainbow)</li>';
  const subject = `${refCode} – Rainbow Has Times for You – Pick One & Confirm`;
  const text = `
Dear ${customerName},

Rainbow Helicopters has provided the following available times for your tour on ${formattedDate}:

${listText}

Please reply to this email with which time works best for you (e.g. "2pm works" or "I'll take 11:30 AM"). If you haven't already sent your payment information, please include it in your reply or call us at ${phone} so we can confirm your booking with Rainbow.

Once you confirm your time, we'll notify Rainbow and get your tour locked in.

Best regards,
Helicopter Tours on Oahu

Reference Code: ${refCode}
  `.trim();
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #166534;">Rainbow Has Times for You – Pick One & Confirm</h2>
      <p>Dear ${customerName},</p>
      <p>Rainbow Helicopters has provided the following available times for your tour on <strong>${formattedDate}</strong>:</p>
      <ul>${listHtml}</ul>
      <p>Please reply to this email with which time works best for you (e.g. "2pm works" or "I'll take 11:30 AM"). If you haven't already sent your payment information, please include it in your reply or call us at <strong><a href="tel:${phone.replace(/\D/g, '')}">${phone}</a></strong> so we can confirm your booking with Rainbow.</p>
      <p>Once you confirm your time, we'll notify Rainbow and get your tour locked in.</p>
      <p>Best regards,<br>Helicopter Tours on Oahu</p>
      <p style="color: #64748b; font-size: 12px;">Reference Code: ${refCode}</p>
    </div>
  `;
  return sendEmail({
    to: customerEmail,
    subject,
    text,
    html,
    from: emails.bookingsHub,
    replyTo: replyToInbound(),
  });
}

/** Island for Rainbow: oahu | big_island (Kona). */
export type RainbowIsland = 'oahu' | 'big_island';

/**
 * Rainbow final confirmation (RAINBOW_EMAILS.md #3): when Rainbow says "it's a go".
 * Includes where to go (Oahu or Big Island), when to arrive, what to bring/not bring.
 */
export async function sendRainbowFinalConfirmation({
  customerEmail,
  customerName,
  refCode,
  tourName,
  date,
  confirmedTime,
  island,
  phoneNumber,
}: {
  customerEmail: string;
  customerName: string;
  refCode: string;
  tourName: string;
  date: string;
  confirmedTime: string;
  island: RainbowIsland;
  phoneNumber?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const phone = phoneNumber || VAPI_PHONE_NUMBER;
  const subject = `${refCode} – You're Confirmed! Rainbow Helicopter Tour – Where to Go & What to Know`;
  const addressBlock =
    island === 'oahu'
      ? `Oahu – Honolulu\n155 Kapalulu Pl, Ste. 197, Honolulu, HI 96819\n(Honolulu International Airport – Castle & Cooke Aviation building. Parking: left-hand side lot. Check-in at the large glass doors at the main entrance.)`
      : `Big Island – Kona\n73-4370 Pao'o St, Kailua-Kona, HI 96740\n(Check-in at the address above. Kona location only.)`;
  const addressBlockHtml =
    island === 'oahu'
      ? `<p><strong>Oahu – Honolulu</strong><br>155 Kapalulu Pl, Ste. 197, Honolulu, HI 96819<br><span style="color: #64748b;">(Honolulu International Airport – Castle & Cooke Aviation building. Parking: left-hand side lot. Check-in at the large glass doors at the main entrance.)</span></p>`
      : `<p><strong>Big Island – Kona</strong><br>73-4370 Pao'o St, Kailua-Kona, HI 96740<br><span style="color: #64748b;">(Check-in at the address above. Kona location only.)</span></p>`;
  const text = `
Dear ${customerName},

You're all set! Rainbow Helicopters has confirmed your tour.

**Your tour**
• Tour: ${tourName}
• Date: ${formattedDate}
• Time: ${confirmedTime}
• Reference: ${refCode}

**Where to go (check-in address)**

${addressBlock}

**When to arrive**
Please arrive 15–30 minutes before your scheduled flight time. Have your confirmation and ID ready.

**What to bring**
• Comfortable, loose-fitting clothing and long pants
• Closed-toe flat shoes (e.g. sneakers)
• Sunglasses, hat, sunscreen (apply before flight)
• Camera

**What not to bring**
• Loose items that could fall (store in car or as directed at check-in)

**Parking**
Use the lot indicated for your location (Oahu: left-hand side lot at Castle & Cooke Aviation).

If you have any questions, reply to this email or call us at ${phone}.

Have an amazing flight!

Helicopter Tours on Oahu

Reference Code: ${refCode}
  `.trim();
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #166534;">You're Confirmed! Rainbow Helicopter Tour</h2>
      <p>Dear ${customerName},</p>
      <p>You're all set! Rainbow Helicopters has confirmed your tour.</p>
      <h3>Your tour</h3>
      <ul>
        <li>Tour: ${tourName}</li>
        <li>Date: ${formattedDate}</li>
        <li>Time: ${confirmedTime}</li>
        <li>Reference: ${refCode}</li>
      </ul>
      <h3>Where to go (check-in address)</h3>
      ${addressBlockHtml}
      <h3>When to arrive</h3>
      <p>Please arrive 15–30 minutes before your scheduled flight time. Have your confirmation and ID ready.</p>
      <h3>What to bring</h3>
      <ul><li>Comfortable, loose-fitting clothing and long pants</li><li>Closed-toe flat shoes (e.g. sneakers)</li><li>Sunglasses, hat, sunscreen (apply before flight)</li><li>Camera</li></ul>
      <h3>What not to bring</h3>
      <p>Loose items that could fall (store in car or as directed at check-in).</p>
      <h3>Parking</h3>
      <p>Use the lot indicated for your location (Oahu: left-hand side lot at Castle & Cooke Aviation).</p>
      <p>If you have any questions, reply to this email or call us at <strong><a href="tel:${phone.replace(/\D/g, '')}">${phone}</a></strong>.</p>
      <p>Have an amazing flight!<br>Helicopter Tours on Oahu</p>
      <p style="color: #64748b; font-size: 12px;">Reference Code: ${refCode}</p>
    </div>
  `;
  return sendEmail({
    to: customerEmail,
    subject,
    text,
    html,
    from: emails.bookingsHub,
    replyTo: replyToInbound(),
  });
}

/** Island for Blue Hawaiian: oahu | maui | kauai | big_island. */
export type BlueHawaiianIsland = 'oahu' | 'maui' | 'kauai' | 'big_island';

/**
 * Blue Hawaiian first follow-up (BLUE_HAWAIIAN_EMAILS.md #1): after we scrape FareHarbor.
 * Lists available times (or "checking live availability" fallback) and asks for preferred time + payment/missing info.
 */
export async function sendBlueHawaiianFirstFollowUp({
  customerEmail,
  customerName,
  refCode,
  tourName,
  date,
  partySize,
  totalPrice,
  availableSlots,
  phoneNumber,
}: {
  customerEmail: string;
  customerName: string;
  refCode: string;
  tourName: string;
  date: string;
  partySize: number;
  totalPrice: number;
  availableSlots: Array<{ time: string; price?: number; available?: boolean }>;
  phoneNumber?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const phone = phoneNumber || VAPI_PHONE_NUMBER;
  const subject = `Available Tour Times for ${refCode} – Choose Your Time`;
  const hasSlots = availableSlots && availableSlots.length > 0;
  let slotsText = '';
  let slotsHtml = '';
  if (hasSlots) {
    slotsText = availableSlots
      .map((slot, idx) => {
        const pricePer = slot.price ?? totalPrice / partySize;
        const slotTotal = pricePer * partySize;
        return `${idx + 1}. ${slot.time} – $${pricePer.toFixed(0)} per person (Total: $${slotTotal.toFixed(0)} for ${partySize} guest(s))`;
      })
      .join('\n');
    slotsHtml = availableSlots
      .map((slot) => {
        const pricePer = slot.price ?? totalPrice / partySize;
        const slotTotal = pricePer * partySize;
        return `<li><strong>${slot.time}</strong> – $${pricePer.toFixed(0)} per person (Total: $${slotTotal.toFixed(0)} for ${partySize} guest(s))</li>`;
      })
      .join('');
  } else {
    slotsText = `We're checking live availability for your preferred date (${formattedDate}) and will contact you shortly with available time slots. You can also call us at ${phone} to discuss times.\n\nIn the meantime, if you haven't already sent your payment information or any missing booking details (party size, weight, hotel), please send them now so we're ready to confirm as soon as we have times.`;
    slotsHtml = `<p>We're checking live availability for your preferred date (<strong>${formattedDate}</strong>) and will contact you shortly with available time slots. You can also call us at <a href="tel:${phone.replace(/\D/g, '')}">${phone}</a> to discuss times.</p><p>In the meantime, if you haven't already sent your payment information or any missing booking details (party size, weight, hotel), please send them now so we're ready to confirm as soon as we have times.</p>`;
  }
  const text = `
Dear ${customerName},

Great news! We've checked availability for your ${tourName} tour with Blue Hawaiian Helicopters on ${formattedDate}.

${hasSlots ? `**Available times near your preferred window:**\n\n${slotsText}\n\n` : slotsText + '\n\n'}

**What we need from you:**

1. Reply to this email with your **preferred time** (e.g. "11:30 AM" or "2pm works").
2. If you haven't already sent your **payment information**, please send it now (card name, number, expiry, CVC, billing address) so we can confirm your booking with Blue Hawaiian. You can also call us at ${phone} to provide payment over the phone.
3. If we're missing any details (party size, total weight, hotel, special requests), please send those too.

Once you pick a time and we have your payment (or you call us), we'll confirm with Blue Hawaiian and get you locked in.

**Total price:** $${totalPrice.toFixed(0)} for ${partySize} guest(s).

Reply or call us at ${phone} with your chosen time and any missing info.

Best regards,
Helicopter Tours on Oahu

Reference Code: ${refCode}
  `.trim();
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0c4a6e;">Available Tour Times – Choose Your Time</h2>
      <p>Dear ${customerName},</p>
      <p>Great news! We've checked availability for your <strong>${tourName}</strong> tour with Blue Hawaiian Helicopters on <strong>${formattedDate}</strong>.</p>
      <h3>Available times near your preferred window</h3>
      ${hasSlots ? `<ol>${slotsHtml}</ol>` : slotsHtml}
      <h3>What we need from you</h3>
      <ol>
        <li>Reply to this email with your <strong>preferred time</strong> (e.g. "11:30 AM" or "2pm works").</li>
        <li>If you haven't already sent your <strong>payment information</strong>, please send it now so we can confirm your booking with Blue Hawaiian. You can also call us at <a href="tel:${phone.replace(/\D/g, '')}">${phone}</a> to provide payment over the phone.</li>
        <li>If we're missing any details (party size, total weight, hotel, special requests), please send those too.</li>
      </ol>
      <p>Once you pick a time and we have your payment (or you call us), we'll confirm with Blue Hawaiian and get you locked in.</p>
      <p><strong>Total price:</strong> $${totalPrice.toFixed(0)} for ${partySize} guest(s).</p>
      <p>Reply or call us at <strong><a href="tel:${phone.replace(/\D/g, '')}">${phone}</a></strong> with your chosen time and any missing info.</p>
      <p>Best regards,<br>Helicopter Tours on Oahu</p>
      <p style="color: #64748b; font-size: 12px;">Reference Code: ${refCode}</p>
    </div>
  `;
  return sendEmail({
    to: customerEmail,
    subject,
    text,
    html,
    from: emails.bookingsHub,
    replyTo: replyToInbound(),
  });
}

/**
 * Blue Hawaiian final confirmation (BLUE_HAWAIIAN_EMAILS.md #2): when Blue Hawaiian says "it's a go".
 * Island-specific address block (Oahu, Maui, Kauai, Big Island).
 */
export async function sendBlueHawaiianFinalConfirmation({
  customerEmail,
  customerName,
  refCode,
  tourName,
  date,
  confirmedTime,
  island,
  phoneNumber,
}: {
  customerEmail: string;
  customerName: string;
  refCode: string;
  tourName: string;
  date: string;
  confirmedTime: string;
  island: BlueHawaiianIsland;
  phoneNumber?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const phone = phoneNumber || VAPI_PHONE_NUMBER;
  const subject = `${refCode} – You're Confirmed! Blue Hawaiian Helicopter Tour – Where to Go & What to Know`;
  const addressBlocks: Record<BlueHawaiianIsland, { text: string; html: string }> = {
    oahu: {
      text: `Oahu – Honolulu Heliport\n99 Kaulele Pl, Honolulu, HI 96819\nPhone: (808) 831-8800\n\nOr if your tour departs from North Shore:\nTurtle Bay Resort Heliport\n57-091 Kamehameha Hwy, Kahuku, HI 96731`,
      html: `<p><strong>Oahu – Honolulu Heliport</strong><br>99 Kaulele Pl, Honolulu, HI 96819<br>Phone: (808) 831-8800</p><p>Or if your tour departs from North Shore:<br><strong>Turtle Bay Resort Heliport</strong><br>57-091 Kamehameha Hwy, Kahuku, HI 96731</p>`,
    },
    maui: {
      text: `Maui – Kahului Heliport\n1 Lelepio Pl, Kahului, HI 96732\nPhone: (808) 871-8844`,
      html: `<p><strong>Maui – Kahului Heliport</strong><br>1 Lelepio Pl, Kahului, HI 96732<br>Phone: (808) 871-8844</p>`,
    },
    kauai: {
      text: `Kauai – Lihue Heliport\n3730 Ahukini Rd, Lihue Heliport #8, Lihue, HI 96766\nPhone: (808) 245-5800\n\nOr Princeville:\n5-3541 Kuhio Hwy, Kilauea, HI 96754`,
      html: `<p><strong>Kauai – Lihue Heliport</strong><br>3730 Ahukini Rd, Lihue Heliport #8, Lihue, HI 96766<br>Phone: (808) 245-5800</p><p>Or Princeville:<br>5-3541 Kuhio Hwy, Kilauea, HI 96754</p>`,
    },
    big_island: {
      text: `Big Island – Hilo Heliport\n2650 Kekuanaoa St, Hilo, HI 96720\nPhone: (808) 961-5600\n\nOr Waikoloa:\n68-690 Waikoloa Rd, Waikoloa Village, HI 96738\nPhone: (808) 886-1768`,
      html: `<p><strong>Big Island – Hilo Heliport</strong><br>2650 Kekuanaoa St, Hilo, HI 96720<br>Phone: (808) 961-5600</p><p>Or Waikoloa:<br>68-690 Waikoloa Rd, Waikoloa Village, HI 96738<br>Phone: (808) 886-1768</p>`,
    },
  };
  const block = addressBlocks[island];
  const text = `
Dear ${customerName},

You're all set! Blue Hawaiian Helicopters has confirmed your tour.

**Your tour**
• Tour: ${tourName}
• Date: ${formattedDate}
• Time: ${confirmedTime}
• Reference: ${refCode}

**Where to go (check-in address)**

${block.text}

**When to arrive**
Plan to arrive early. Allow about 75 minutes total (check-in, 7-minute FAA safety video, pilot briefing, and flight). Business hours: 7:00 AM – 7:00 PM Hawaii Standard Time.

**What to bring**
• Cell phone (airplane mode), camera, small plastic water bottle only.

**What NOT to bring**
• Loose items (hats, purses, backpacks). Lockers are available at check-in.

**What to wear**
• Dark clothing to reduce glare on the windows (better for photos and views).

**Cancellation**
Full refund if you cancel 24+ hours before your tour. Call 1-800-745-2583 (7 AM–7 PM HST). No-shows or cancellations within 24 hours are charged the full amount.

If you have any questions, reply to this email or call us at ${phone}.

Have an amazing flight!

Helicopter Tours on Oahu

Reference Code: ${refCode}
  `.trim();
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0c4a6e;">You're Confirmed! Blue Hawaiian Helicopter Tour</h2>
      <p>Dear ${customerName},</p>
      <p>You're all set! Blue Hawaiian Helicopters has confirmed your tour.</p>
      <h3>Your tour</h3>
      <ul>
        <li>Tour: ${tourName}</li>
        <li>Date: ${formattedDate}</li>
        <li>Time: ${confirmedTime}</li>
        <li>Reference: ${refCode}</li>
      </ul>
      <h3>Where to go (check-in address)</h3>
      ${block.html}
      <h3>When to arrive</h3>
      <p>Plan to arrive early. Allow about 75 minutes total (check-in, 7-minute FAA safety video, pilot briefing, and flight). Business hours: 7:00 AM – 7:00 PM Hawaii Standard Time.</p>
      <h3>What to bring</h3>
      <p>Cell phone (airplane mode), camera, small plastic water bottle only.</p>
      <h3>What NOT to bring</h3>
      <p>Loose items (hats, purses, backpacks). Lockers are available at check-in.</p>
      <h3>What to wear</h3>
      <p>Dark clothing to reduce glare on the windows (better for photos and views).</p>
      <h3>Cancellation</h3>
      <p>Full refund if you cancel 24+ hours before your tour. Call 1-800-745-2583 (7 AM–7 PM HST). No-shows or cancellations within 24 hours are charged the full amount.</p>
      <p>If you have any questions, reply to this email or call us at <strong><a href="tel:${phone.replace(/\D/g, '')}">${phone}</a></strong>.</p>
      <p>Have an amazing flight!<br>Helicopter Tours on Oahu</p>
      <p style="color: #64748b; font-size: 12px;">Reference Code: ${refCode}</p>
    </div>
  `;
  return sendEmail({
    to: customerEmail,
    subject,
    text,
    html,
    from: emails.bookingsHub,
    replyTo: replyToInbound(),
  });
}

/**
 * Send follow-up email to customer with available time slots and payment request
 * This is sent after availability check completes.
 * - Blue Hawaiian: shows live FareHarbor times when available, or "checking live availability" + phone
 * - Rainbow: says we're in contact with Rainbow Helicopters to arrange a time close to their date + phone
 */
export async function sendAvailabilityFollowUp({
  customerEmail,
  customerName,
  refCode,
  tourName,
  operatorName,
  date,
  partySize,
  availableSlots,
  totalPrice,
  phoneNumber,
  isRainbow,
}: {
  customerEmail: string;
  customerName: string;
  refCode: string;
  tourName: string;
  operatorName: string;
  date: string;
  partySize: number;
  availableSlots: Array<{ time: string; price?: number; available: boolean }>;
  totalPrice: number;
  phoneNumber?: string;
  /** True when operator is Rainbow Helicopters (no live availability; we're in contact with them) */
  isRainbow?: boolean;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const subject = `Available Tour Times for ${refCode} - Choose Your Time`;

  // Format date nicely
  const dateObj = new Date(date);
  const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const phone = phoneNumber || '(707) 381-2583';
  const phoneTel = phone.replace(/\D/g, '');
  const phoneLink = phoneTel ? `tel:+1${phoneTel}` : 'tel:+17073812583';

  // Build available slots list (Blue Hawaiian only when we have scraped times)
  let slotsText = '';
  let slotsHtml = '';
  if (isRainbow) {
    // Rainbow: no live availability; we're in contact with them to arrange a time
    slotsText = `We're in contact with Rainbow Helicopters to arrange a time close to your preferred date (${formattedDate}). We'll be in touch shortly with options. In the meantime, you can call us at ${phone} with any questions or to discuss times.`;
    slotsHtml = `
      <div style="background-color: #f0fdf4; border: 2px solid #22c55e; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #166534; margin-top: 0;">We're Arranging Your Tour with Rainbow Helicopters</h3>
        <p style="color: #15803d; margin: 0;">We're in contact with Rainbow Helicopters to arrange a time close to your preferred date (<strong>${formattedDate}</strong>). We'll be in touch shortly with options.</p>
        <p style="color: #15803d; margin: 12px 0 0 0;">In the meantime, call us at <strong><a href="${phoneLink}" style="color: #166534;">${phone}</a></strong> with any questions or to discuss times.</p>
      </div>
    `;
  } else if (availableSlots && availableSlots.length > 0) {
    // Blue Hawaiian: we have live times from FareHarbor
    slotsText = availableSlots.map((slot, idx) => {
      const slotPrice = slot.price || (totalPrice / partySize);
      const slotTotal = slotPrice * partySize;
      return `${idx + 1}. ${slot.time} - $${slotPrice.toFixed(0)} per person (Total: $${slotTotal.toFixed(0)} for ${partySize} ${partySize === 1 ? 'guest' : 'guests'})`;
    }).join('\n');

    slotsHtml = `
      <div style="background-color: #f0f9ff; border: 2px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #0c4a6e; margin-top: 0;">Available Times for ${formattedDate}</h3>
        <p style="color: #0c4a6e; margin-bottom: 12px;">Here are some available times near your preferred window:</p>
        <ul style="list-style: none; padding: 0;">
          ${availableSlots.map((slot, idx) => {
            const slotPrice = slot.price || (totalPrice / partySize);
            const slotTotal = slotPrice * partySize;
            return `
              <li style="padding: 12px; margin-bottom: 8px; background: white; border-radius: 6px; border-left: 4px solid #0ea5e9;">
                <strong style="color: #0c4a6e;">${slot.time}</strong><br>
                <span style="color: #64748b;">$${slotPrice.toFixed(0)} per person</span> • 
                <span style="color: #0c4a6e; font-weight: bold;">Total: $${slotTotal.toFixed(0)} for ${partySize} ${partySize === 1 ? 'guest' : 'guests'}</span>
              </li>
            `;
          }).join('')}
        </ul>
      </div>
    `;
  } else {
    // Blue Hawaiian: scraping didn't return times yet; we're checking live availability
    slotsText = `We're checking live availability for your preferred date (${formattedDate}) and will contact you shortly with available time slots. You can also call us at ${phone} to discuss times.`;
    slotsHtml = `
      <div style="background-color: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="color: #92400e; margin: 0;">We're checking live availability for your preferred date (<strong>${formattedDate}</strong>) and will contact you shortly with available time slots.</p>
        <p style="color: #92400e; margin: 12px 0 0 0;">You can also call us at <strong><a href="${phoneLink}" style="color: #b45309;">${phone}</a></strong> to discuss times.</p>
      </div>
    `;
  }

  const text = `
Dear ${customerName},

Great news! We've checked availability for your ${tourName} tour with ${operatorName} on ${formattedDate}.

${slotsText}

**What's Next:**
1. Reply to this email with your preferred time slot
2. Or call us at ${phone} to book over the phone
3. We'll confirm your booking and send payment instructions

**About Your Tour:**
${tourName} with ${operatorName} is an unforgettable experience. You'll soar above Oahu's most stunning landscapes, including pristine beaches, lush valleys, and iconic landmarks. Our experienced pilots provide informative commentary throughout your flight, ensuring you don't miss any of the breathtaking views.

**What's Included:**
- Professional pilot and safety briefing
- Scenic flight over Oahu's highlights
- Informative commentary
- All safety equipment

**Payment:**
Total price: $${totalPrice.toFixed(0)} for ${partySize} ${partySize === 1 ? 'guest' : 'guests'}

Once you confirm your preferred time, we'll send you a secure payment link or you can call us to complete your booking over the phone.

**Questions?**
Reply to this email or call us at ${phone}. We're here to help!

Best regards,
Helicopter Tours on Oahu

Reference Code: ${refCode}
  `.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a73e8;">Available Tour Times - ${refCode}</h2>
      
      <p>Dear ${customerName},</p>
      
      <p>Great news! We've checked availability for your <strong>${tourName}</strong> tour with <strong>${operatorName}</strong> on <strong>${formattedDate}</strong>.</p>
      
      ${slotsHtml}
      
      <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0;">
        <h3 style="color: #1e40af; margin-top: 0;">What's Next:</h3>
        <ol style="color: #475569; line-height: 1.8;">
          <li>Reply to this email with your preferred time slot</li>
          <li>Or call us at <strong><a href="${phoneLink}" style="color: #2563eb;">${phone}</a></strong> to book over the phone</li>
          <li>We'll confirm your booking and send payment instructions</li>
        </ol>
      </div>
      
      <div style="background-color: #fef3c7; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #92400e; margin-top: 0;">About Your Tour</h3>
        <p style="color: #78350f; line-height: 1.7;">
          <strong>${tourName}</strong> with <strong>${operatorName}</strong> is an unforgettable experience. You'll soar above Oahu's most stunning landscapes, including pristine beaches, lush valleys, and iconic landmarks. Our experienced pilots provide informative commentary throughout your flight, ensuring you don't miss any of the breathtaking views.
        </p>
        
        <h4 style="color: #92400e; margin-top: 16px;">What's Included:</h4>
        <ul style="color: #78350f; line-height: 1.8;">
          <li>Professional pilot and safety briefing</li>
          <li>Scenic flight over Oahu's highlights</li>
          <li>Informative commentary</li>
          <li>All safety equipment</li>
        </ul>
      </div>
      
      <div style="background-color: #ecfdf5; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #065f46; margin-top: 0;">Payment Information</h3>
        <p style="color: #047857; font-size: 18px; margin: 8px 0;">
          <strong>Total Price: $${totalPrice.toFixed(0)}</strong> for ${partySize} ${partySize === 1 ? 'guest' : 'guests'}
        </p>
        <p style="color: #047857; margin: 8px 0;">
          Once you confirm your preferred time, we'll send you a secure payment link or you can call us to complete your booking over the phone.
        </p>
      </div>
      
      <div style="background-color: #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
        <p style="color: #475569; margin: 0 0 12px 0;"><strong>Questions?</strong></p>
        <p style="color: #64748b; margin: 0;">
          Reply to this email or call us at <strong><a href="${phoneLink}" style="color: #2563eb; text-decoration: none;">${phone}</a></strong>
        </p>
        <p style="color: #64748b; margin: 8px 0 0 0; font-size: 12px;">We're here to help!</p>
      </div>
      
      <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
        Best regards,<br>
        <strong>Helicopter Tours on Oahu</strong>
      </p>
      
      <p style="color: #94a3b8; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        Reference Code: <strong>${refCode}</strong>
      </p>
    </div>
  `;

  return sendEmail({
    to: customerEmail,
    subject,
    text,
    html,
    from: emails.bookingsHub,
    replyTo: replyToInbound(),
  });
}
