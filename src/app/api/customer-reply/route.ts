import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase, insertBooking, updateBooking, type InsertBookingResult } from '@/lib/supabaseClient';
import type { BookingsRow, BookingsUpdate, BookingsInsert } from '@/lib/database.types';
import { bookingStatuses, operators } from '@/lib/constants';
import { analyzeEmail, analyzeCustomerAvailabilityReply } from '@/lib/openai';
import { sendEmail, sendBookingRequestToOperator } from '@/lib/email';
import { getTourById, calculateTotalPrice } from '@/lib/tours';

const customerReplySchema = z.object({
  emailContent: z.string(),
  fromEmail: z.string().email(),
  subject: z.string().optional(),
});

/**
 * POST /api/customer-reply
 * Processes customer replies to booking emails: analyze, find/update booking, send ack.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = customerReplySchema.parse(body);

    const analysis = await analyzeEmail(
      validated.emailContent,
      validated.fromEmail,
      validated.subject
    );

    if (analysis.isSpam) {
      if (process.env.REPLY_TO_SPAM === 'true') {
        await sendEmail({
          to: validated.fromEmail,
          subject: 'Re: ' + (validated.subject ?? 'Your inquiry'),
          text: 'Thank you for your message. If you are interested in booking a helicopter tour, please visit our website or call us directly.',
        });
      }
      return NextResponse.json({
        success: true,
        data: { handled: 'spam', message: 'Spam detected and handled' },
      });
    }

    const { data: rows, error: queryError } = await supabase
      .from('bookings')
      .select('*')
      .eq('customer_email', validated.fromEmail)
      .order('created_at', { ascending: false })
      .limit(1);

    const bookings: BookingsRow[] | null = (rows as BookingsRow[] | null) ?? null;
    if (queryError || !bookings || bookings.length === 0) {
      if (analysis.isBookingRequest && analysis.extractedData) {
        const insertData: BookingsInsert = {
          status: bookingStatuses.COLLECTING_INFO,
          customer_name: analysis.extractedData.name ?? 'Unknown',
          customer_email: validated.fromEmail,
          customer_phone: analysis.extractedData.phone ?? null,
          party_size: analysis.extractedData.partySize ?? null,
          preferred_date: analysis.extractedData.preferredDate ?? null,
          time_window: analysis.extractedData.timeWindow ?? null,
          doors_off: analysis.extractedData.doorsOff ?? null,
          hotel: analysis.extractedData.hotel ?? null,
          special_requests: analysis.extractedData.specialRequests ?? null,
          source: 'email',
          total_weight: 300,
        };

        const insertResult: InsertBookingResult = await insertBooking(insertData);
        const newRow = insertResult.data;
        const createError = insertResult.error;

        if (!createError && newRow != null && newRow.id) {
          await sendEmail({
            to: validated.fromEmail,
            subject: 'Thank You for Your Booking Inquiry',
            text: `Thank you for your inquiry. We've received your booking request and will contact you shortly with availability and pricing.\n\nBest regards,\nHelicopter Tours on Oahu`,
          });
          return NextResponse.json({
            success: true,
            data: { handled: 'new_booking_created', bookingId: newRow.id },
          });
        }
      }

      await sendEmail({
        to: validated.fromEmail,
        subject: 'Re: ' + (validated.subject ?? 'Your inquiry'),
        text: "Thank you for contacting Helicopter Tours on Oahu. To book a tour, please visit our website or call us. We'd be happy to help you plan your adventure!",
      });
      return NextResponse.json({
        success: true,
        data: { handled: 'general_inquiry' },
      });
    }

    const booking: BookingsRow = bookings[0];
    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    const prevMeta = (booking?.metadata ?? {}) as Record<string, unknown>;
    const prevMessages = Array.isArray(prevMeta.customerMessages)
      ? prevMeta.customerMessages
      : [];
    const operatorEmailSentAt = prevMeta.operator_email_sent_at as string | undefined;
    const operatorProposedTime = prevMeta.operator_proposed_time as string | undefined;

    const updateData: BookingsUpdate = {
      updated_at: new Date().toISOString(),
      metadata: {
        ...prevMeta,
        customerMessages: [
          ...prevMessages,
          { content: validated.emailContent, timestamp: new Date().toISOString() },
        ],
      },
    };

    if (analysis.extractedData) {
      if (analysis.extractedData.name) updateData.customer_name = analysis.extractedData.name;
      if (analysis.extractedData.phone) updateData.customer_phone = analysis.extractedData.phone;
      if (analysis.extractedData.partySize != null) updateData.party_size = analysis.extractedData.partySize;
      if (analysis.extractedData.preferredDate) updateData.preferred_date = analysis.extractedData.preferredDate;
      if (analysis.extractedData.timeWindow) updateData.time_window = analysis.extractedData.timeWindow;
      if (analysis.extractedData.doorsOff !== undefined) updateData.doors_off = analysis.extractedData.doorsOff;
      if (analysis.extractedData.hotel) updateData.hotel = analysis.extractedData.hotel;
      if (analysis.extractedData.specialRequests) updateData.special_requests = analysis.extractedData.specialRequests;
    }

    // If customer is confirming a time (Blue Hawaiian: chosen slot; Rainbow: confirm proposed time), send full booking to operator
    const opKey = booking.operator_name?.toLowerCase().includes('rainbow') ? 'rainbow' : 'blueHawaiian';
    const operator = operators[opKey];
    if (operator && !operatorEmailSentAt) {
      const availabilityReply = await analyzeCustomerAvailabilityReply(validated.emailContent);
      const shouldSendToOperator =
        (opKey === 'blueHawaiian' && availabilityReply.chosenTimeSlot) ||
        (opKey === 'rainbow' && availabilityReply.confirmsProposedTime && operatorProposedTime);

      if (shouldSendToOperator) {
        const tourId = (prevMeta.tour_id as string) || (prevMeta.tour_name as string);
        const tour = tourId ? getTourById(tourId) : undefined;
        const tourName = (prevMeta.tour_name as string) || tour?.name || 'Helicopter Tour';
        const totalPrice = tour ? calculateTotalPrice(tour.id, booking.party_size || 2) : undefined;
        const confirmedTime = opKey === 'blueHawaiian' ? availabilityReply.chosenTimeSlot : operatorProposedTime;

        try {
          const sendResult = await sendBookingRequestToOperator({
            operatorEmail: operator.email,
            operatorName: operator.name,
            bookingDetails: {
              customerName: booking.customer_name || 'Customer',
              customerEmail: booking.customer_email || '',
              customerPhone: booking.customer_phone || 'Not provided',
              partySize: booking.party_size || 2,
              preferredDate: booking.preferred_date || '',
              timeWindow: confirmedTime || booking.time_window || undefined,
              doorsOff: booking.doors_off ?? false,
              hotel: booking.hotel || undefined,
              specialRequests: booking.special_requests || undefined,
              totalWeight: booking.total_weight || undefined,
            },
            availabilityResult: prevMeta.availability_check as object | undefined,
            refCode: booking.ref_code || undefined,
            tourName,
            totalPrice,
          });
          if (sendResult.success) {
            (updateData.metadata as Record<string, unknown>).operator_email_sent_at = new Date().toISOString();
            (updateData.metadata as Record<string, unknown>).confirmed_time = confirmedTime;
            console.log('Full booking sent to operator after customer confirmed time:', operator.email);
          } else {
            console.error('Failed to send booking to operator:', sendResult.error);
          }
        } catch (err) {
          console.error('Error sending booking to operator:', err);
        }
      }
    }

    const { error: updateError } = await updateBooking(booking.id, updateData);

    if (updateError) {
      console.error('Error updating booking:', updateError);
    }

    await sendEmail({
      to: validated.fromEmail,
      subject: 'Re: ' + (validated.subject ?? 'Your booking'),
      text: "Thank you for your message. We've updated your booking and will get back to you shortly.\n\nBest regards,\nHelicopter Tours on Oahu",
    });

    if (process.env.N8N_WEBHOOK_URL) {
      try {
        await fetch(process.env.N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'customer_reply',
            bookingId: booking.id,
            analysis,
          }),
        });
      } catch (err) {
        console.error('n8n webhook error:', err);
      }
    }

    return NextResponse.json({
      success: true,
      data: { handled: 'booking_updated', bookingId: booking.id, analysis },
    });
  } catch (err) {
    console.error('Customer reply error:', err);
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: err.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
