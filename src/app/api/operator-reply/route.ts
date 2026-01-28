import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase, updateBooking, getBookingByRefCode } from '@/lib/supabaseClient';
import type { BookingsRow, BookingsUpdate } from '@/lib/database.types';
import { bookingStatuses, operators, emails, VAPI_PHONE_NUMBER } from '@/lib/constants'; // Import operators for operator selection
import { parseOperatorReply } from '@/lib/openai';
import { sendEmail, sendConfirmationToCustomer, replyToInbound } from '@/lib/email';

/**
 * Schema for operator reply from n8n webhook
 * n8n will send operator email replies to this endpoint
 */
const operatorReplySchema = z.object({
  bookingId: z.string().uuid().optional(), // May be in metadata or email headers
  operatorEmail: z.string().email().optional(), // From email address
  operatorName: z.string().optional(), // Can be inferred from email
  emailContent: z.string(), // Full email body/content
  fromEmail: z.string().email().optional(), // Sender email
  subject: z.string().optional(), // Email subject
  // n8n may also send the booking ref_code
  refCode: z.string().optional(),
});

/**
 * POST /api/operator-reply
 * 
 * Processes incoming operator reply from n8n webhook
 * - Receives operator email reply from n8n
 * - Parses email content using OpenAI
 * - Finds booking by bookingId or refCode
 * - Updates Supabase booking status
 * - Sends confirmation email to customer if booking confirmed
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Operator reply received:', { 
      hasBookingId: !!body.bookingId, 
      hasRefCode: !!body.refCode,
      fromEmail: body.fromEmail 
    });
    
    const validated = operatorReplySchema.parse(body);

    // Find booking by bookingId, refCode, or extract refCode from email content/subject
    type SelectOne = { data: BookingsRow | null; error: { message?: string } | null };
    let booking: BookingsRow | null = null;
    let bookingError: { message?: string } | null = null;

    // Try to extract refCode from email subject or content if not provided
    let refCodeToSearch = validated.refCode;
    if (!refCodeToSearch) {
      // Look for HTO-XXXXXX pattern in subject or content
      const refCodeMatch = (validated.subject || validated.emailContent || '').match(/HTO-[A-Z0-9]{6}/);
      if (refCodeMatch) {
        refCodeToSearch = refCodeMatch[0];
        console.log('Extracted refCode from email:', refCodeToSearch);
      }
    }

    if (validated.bookingId) {
      const result = await supabase
        .from('bookings')
        .select('*')
        .eq('id', validated.bookingId)
        .single() as SelectOne;
      booking = result.data;
      bookingError = result.error;
    } else if (refCodeToSearch) {
      // Use getBookingByRefCode helper
      const result = await getBookingByRefCode(refCodeToSearch);
      booking = result.data;
      bookingError = result.error;
    } else {
      // Try to find by operator email and most recent booking
      const result = await supabase
        .from('bookings')
        .select('*')
        .eq('operator_name', validated.operatorName || '')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle() as SelectOne;
      booking = result.data;
      bookingError = result.error;
    }

    if (bookingError || !booking) {
      console.error('Booking not found:', { 
        bookingId: validated.bookingId, 
        refCode: validated.refCode,
        error: bookingError 
      });
      return NextResponse.json(
        { success: false, error: 'Booking not found. Please provide bookingId or refCode.' },
        { status: 404 }
      );
    }

    // Parse operator reply using OpenAI
    const parsed = await parseOperatorReply(validated.emailContent);
    console.log('Parsed operator reply:', parsed);

    // Determine operator name from email if not provided
    // Uses operators from constants.ts to match operator emails
    let operatorName = validated.operatorName;
    if (!operatorName && validated.operatorEmail) {
      // Match operator email to known operators from constants
      const matchedOperator = Object.values(operators).find(
        op => op.email.toLowerCase() === validated.operatorEmail?.toLowerCase()
      );
      operatorName = matchedOperator?.name || 'Unknown Operator';
    }

    // Update booking based on operator response
    const prevMeta = (booking?.metadata ?? {}) as Record<string, unknown>;
    let newStatus = booking.status ?? null;
    const updateData: BookingsUpdate = {
      updated_at: new Date().toISOString(),
      operator_name: operatorName ?? null,
    };

    const isRainbow = booking?.operator_name?.toLowerCase().includes('rainbow');
    const proposedTime = parsed.notes || (parsed.availableDates && parsed.availableDates.length > 0 ? parsed.availableDates[0] : null);

    // Rainbow: operator replied with a proposed time → ask customer to confirm
    if (isRainbow && proposedTime && !parsed.isConfirmation && !parsed.isRejection && !parsed.willHandleDirectly) {
      newStatus = bookingStatuses.AWAITING_PAYMENT;
      updateData.status = newStatus;
      updateData.metadata = {
        ...prevMeta,
        operator_proposed_time: proposedTime,
        operator_availability_replied_at: new Date().toISOString(),
      };

      if (booking.customer_email && booking.customer_name) {
        const phone = VAPI_PHONE_NUMBER;
        const phoneLink = `tel:+1${phone.replace(/\D/g, '')}`;
        await sendEmail({
          to: booking.customer_email,
          subject: `Confirm your time – ${booking.ref_code || 'Your Tour'}`,
          text: `Dear ${booking.customer_name},\n\nRainbow Helicopters has ${proposedTime} available for your tour.\n\nPlease reply to this email with:\n1. Which time you'd like to confirm\n2. Your payment information (if you haven't already provided it) so we can forward everything to Rainbow and finalize your booking.\n\nOr call us at ${phone} to confirm and pay over the phone.\n\nBest regards,\nHelicopter Tours on Oahu\nReference: ${booking.ref_code || 'N/A'}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1a73e8;">Confirm your tour time</h2>
              <p>Dear ${booking.customer_name},</p>
              <p><strong>Rainbow Helicopters</strong> has <strong>${proposedTime}</strong> available for your tour.</p>
              <p>Please reply to this email with:</p>
              <ol>
                <li>Which time you'd like to confirm</li>
                <li>Your payment information (if you haven't already provided it) so we can forward everything to Rainbow and finalize your booking.</li>
              </ol>
              <p>Or call us at <a href="${phoneLink}">${phone}</a> to confirm and pay over the phone.</p>
              <p>Best regards,<br>Helicopter Tours on Oahu</p>
              <p style="color: #94a3b8; font-size: 12px;">Reference: ${booking.ref_code || 'N/A'}</p>
            </div>
          `,
          from: emails.bookingsHub,
          replyTo: replyToInbound(),
        });
        console.log('Customer asked to confirm Rainbow time:', booking.customer_email);
      }
    } else if (parsed.isConfirmation) {
      newStatus = bookingStatuses.CONFIRMED;
      updateData.status = newStatus;
      updateData.confirmation_number = parsed.confirmationNumber || null;
      updateData.total_amount = parsed.price ?? null;

      // Send confirmation to customer
      if (booking.customer_email && booking.customer_name) {
        const confirmResult = await sendConfirmationToCustomer({
          customerEmail: booking.customer_email,
          customerName: booking.customer_name,
          bookingDetails: {
            operatorName: validated.operatorName || booking.operator_name || 'Operator',
            date: booking.preferred_date || '',
            time: parsed.notes || undefined,
            partySize: booking.party_size || 1,
            totalAmount: parsed.price || undefined,
          },
          confirmationNumber: parsed.confirmationNumber,
        });
        if (confirmResult.success) {
          console.log('Confirmation email sent to customer:', booking.customer_email);
        } else {
          console.error('Confirmation email failed:', confirmResult.error);
        }
      }
    } else if (parsed.willHandleDirectly) {
      // Operator says they'll contact customer directly
      newStatus = bookingStatuses.AWAITING_OPERATOR_RESPONSE;
      updateData.status = newStatus;
      updateData.metadata = {
        ...prevMeta,
        operatorWillHandleDirectly: true,
        operatorResponse: parsed.notes,
        operatorContactedAt: new Date().toISOString(),
      };

      // Notify customer that operator will contact them directly
      if (booking.customer_email && booking.customer_name) {
        const notifyResult = await sendEmail({
          to: booking.customer_email,
          subject: `Booking Update - ${booking.ref_code || 'Your Tour'}`,
          text: `Dear ${booking.customer_name},\n\nGreat news! ${validated.operatorName || booking.operator_name || 'The operator'} has received your booking request and will contact you directly to confirm your tour details and finalize your booking.\n\nYou can expect to hear from them soon with:\n- Confirmed time slot\n- Final pricing\n- Meeting location and instructions\n\nIf you have any questions in the meantime, feel free to reply to this email or call us at (707) 381-2583.\n\nBest regards,\nHelicopter Tours on Oahu\n\nReference Code: ${booking.ref_code || 'N/A'}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1a73e8;">Booking Update - ${booking.ref_code || 'Your Tour'}</h2>
              <p>Dear ${booking.customer_name},</p>
              <p>Great news! <strong>${validated.operatorName || booking.operator_name || 'The operator'}</strong> has received your booking request and will contact you directly to confirm your tour details and finalize your booking.</p>
              <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 16px; margin: 20px 0;">
                <p style="margin: 0; color: #0c4a6e;"><strong>What to Expect:</strong></p>
                <ul style="color: #075985; margin: 8px 0 0 20px;">
                  <li>Confirmed time slot</li>
                  <li>Final pricing</li>
                  <li>Meeting location and instructions</li>
                </ul>
              </div>
              <p>If you have any questions in the meantime, feel free to reply to this email or call us at <strong><a href="tel:+17073812583">(707) 381-2583</a></strong>.</p>
              <p>Best regards,<br><strong>Helicopter Tours on Oahu</strong></p>
              <p style="color: #94a3b8; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                Reference Code: <strong>${booking.ref_code || 'N/A'}</strong>
              </p>
            </div>
          `,
        });
        if (notifyResult.success) {
          console.log('Customer notified that operator will handle directly:', booking.customer_email);
        } else {
          console.error('Customer notification failed:', notifyResult.error);
        }
      }
    } else if (parsed.isRejection) {
      newStatus = bookingStatuses.CANCELLED;
      updateData.status = newStatus;
      updateData.metadata = {
        ...prevMeta,
        rejectionReason: parsed.notes,
      };

      // Notify customer of rejection
      if (booking.customer_email && booking.customer_name) {
        await sendEmail({
          to: booking.customer_email,
          subject: 'Booking Update - Alternative Options Available',
          text: `Dear ${booking.customer_name},\n\nUnfortunately, the requested date is not available. We're working on finding alternative options for you. We'll contact you shortly.\n\nBest regards,\nHelicopter Tours on Oahu`,
          html: `<p>Dear ${booking.customer_name},</p><p>Unfortunately, the requested date is not available. We're working on finding alternative options for you. We'll contact you shortly.</p><p>Best regards,<br>Helicopter Tours on Oahu</p>`,
        });
      }
    } else if (parsed.availableDates && parsed.availableDates.length > 0) {
      newStatus = bookingStatuses.AWAITING_PAYMENT;
      updateData.status = newStatus;
      updateData.metadata = {
        ...prevMeta,
        alternativeDates: parsed.availableDates,
        operatorNotes: parsed.notes,
      };

      // Notify customer of alternative dates
      if (booking.customer_email && booking.customer_name) {
        await sendEmail({
          to: booking.customer_email,
          subject: 'Alternative Dates Available',
          text: `Dear ${booking.customer_name},\n\nThe requested date is not available, but we have these alternative dates:\n${parsed.availableDates.join('\n')}\n\nPlease let us know which date works for you.\n\nBest regards,\nHelicopter Tours on Oahu`,
          html: `<p>Dear ${booking.customer_name},</p><p>The requested date is not available, but we have these alternative dates:</p><ul>${parsed.availableDates.map(d => `<li>${d}</li>`).join('')}</ul><p>Please let us know which date works for you.</p><p>Best regards,<br>Helicopter Tours on Oahu</p>`,
        });
      }
    } else {
      updateData.metadata = {
        ...prevMeta,
        operatorResponse: parsed.notes,
        lastOperatorContact: new Date().toISOString(),
      };
    }

    const { error: updateError } = await updateBooking(booking.id, updateData);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update booking' },
        { status: 500 }
      );
    }

    // Trigger n8n webhook if configured
    if (process.env.N8N_WEBHOOK_URL) {
      try {
        await fetch(process.env.N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'operator_reply',
            bookingId: validated.bookingId,
            parsed,
          }),
        });
      } catch (error) {
        console.error('n8n webhook error:', error);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        bookingId: validated.bookingId,
        status: newStatus,
        parsed,
      },
    });
  } catch (error) {
    console.error('Operator reply error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
