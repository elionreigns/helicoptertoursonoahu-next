import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase, type Booking, type BookingUpdate } from '@/lib/supabaseClient';
import type { Database } from '@/lib/database.types';
import { bookingStatuses } from '@/lib/constants';
import { analyzeEmail } from '@/lib/openai';
import { sendEmail, sendBookingRequestToOperator } from '@/lib/email';

// Type aliases for database types
type BookingsRow = Database['public']['Tables']['bookings']['Row'];

/**
 * Schema for customer reply
 */
const customerReplySchema = z.object({
  emailContent: z.string(),
  fromEmail: z.string().email(),
  subject: z.string().optional(),
});

/**
 * POST /api/customer-reply
 * 
 * Processes customer replies to booking emails
 * - Analyzes email content using OpenAI
 * - Finds associated booking by email
 * - Updates booking with new information
 * - Handles spam detection
 * - Sends appropriate responses
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = customerReplySchema.parse(body);

    // Analyze email content with spam detection
    const analysis = await analyzeEmail(
      validated.emailContent,
      validated.fromEmail,
      validated.subject
    );

    // Spam detection
    if (analysis.isSpam) {
      // Optionally send polite reply or ignore
      if (process.env.REPLY_TO_SPAM === 'true') {
        await sendEmail({
          to: validated.fromEmail,
          subject: 'Re: ' + (validated.subject || 'Your inquiry'),
          text: 'Thank you for your message. If you are interested in booking a helicopter tour, please visit our website or call us directly.',
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          handled: 'spam',
          message: 'Spam detected and handled',
        },
      });
    }

    // Find booking by customer email
    const queryResult = await supabase
      .from('bookings')
      .select('*')
      .eq('customer_email', validated.fromEmail)
      .order('created_at', { ascending: false })
      .limit(1);

    const bookings = queryResult.data as Booking[] | null;
    const bookingError = queryResult.error;

    if (bookingError || !bookings || bookings.length === 0) {
      // No existing booking - treat as new inquiry
      if (analysis.isBookingRequest && analysis.extractedData) {
        // Create new booking from extracted data
        const insertData: Database['public']['Tables']['bookings']['Insert'] = {
          status: bookingStatuses.COLLECTING_INFO,
          customer_name: analysis.extractedData.name || 'Unknown',
          customer_email: validated.fromEmail,
          customer_phone: analysis.extractedData.phone || null,
          party_size: analysis.extractedData.partySize || null,
          preferred_date: analysis.extractedData.preferredDate || null,
          time_window: analysis.extractedData.timeWindow || null,
          doors_off: analysis.extractedData.doorsOff || null,
          hotel: analysis.extractedData.hotel || null,
          special_requests: analysis.extractedData.specialRequests || null,
          source: 'email',
          total_weight: 300, // Default weight if not provided
        };
        
        const insertResult = await supabase
          .from('bookings')
          .insert(insertData)
          .select()
          .single();

        const newBooking = insertResult.data as Booking | null;
        const createError = insertResult.error;

        if (!createError && newBooking && newBooking.id) {
          // Send acknowledgment
          await sendEmail({
            to: validated.fromEmail,
            subject: 'Thank You for Your Booking Inquiry',
            text: `Thank you for your inquiry. We've received your booking request and will contact you shortly with availability and pricing.\n\nBest regards,\nHelicopter Tours on Oahu`,
          });

          return NextResponse.json({
            success: true,
            data: {
              handled: 'new_booking_created',
              bookingId: newBooking.id,
            },
          });
        }
      }

      // Generic response for inquiries without booking data
      await sendEmail({
        to: validated.fromEmail,
        subject: 'Re: ' + (validated.subject || 'Your inquiry'),
        text: 'Thank you for contacting Helicopter Tours on Oahu. To book a tour, please visit our website or call us. We\'d be happy to help you plan your adventure!',
      });

      return NextResponse.json({
        success: true,
        data: {
          handled: 'general_inquiry',
        },
      });
    }

    // Update existing booking with new information
    if (!bookings || bookings.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    const booking: BookingsRow | null = bookings[0] as BookingsRow | null;
    
    // Null check for booking
    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }
    
    // Build update data using BookingUpdate type (the correct type for Supabase updates)
    // This type is specifically designed for update operations
    const updateData: BookingUpdate = {
      updated_at: new Date().toISOString(),
    };

    if (analysis.extractedData) {
      if (analysis.extractedData.name) updateData.customer_name = analysis.extractedData.name;
      if (analysis.extractedData.phone) updateData.customer_phone = analysis.extractedData.phone;
      if (analysis.extractedData.partySize) updateData.party_size = analysis.extractedData.partySize;
      if (analysis.extractedData.preferredDate) updateData.preferred_date = analysis.extractedData.preferredDate;
      if (analysis.extractedData.timeWindow) updateData.time_window = analysis.extractedData.timeWindow;
      if (analysis.extractedData.doorsOff !== undefined) updateData.doors_off = analysis.extractedData.doorsOff;
      if (analysis.extractedData.hotel) updateData.hotel = analysis.extractedData.hotel;
      if (analysis.extractedData.specialRequests) updateData.special_requests = analysis.extractedData.specialRequests;
    }

    // Update metadata with customer message (safely handle JSONB metadata)
    // booking.metadata is Json | null from database, safely extract existing data
    const existingMetadata = booking.metadata 
      ? (booking.metadata as Record<string, any>)
      : {};
    
    // Build new metadata object with customer message
    // Ensure customerMessages is an array
    const existingMessages = Array.isArray(existingMetadata.customerMessages) 
      ? existingMetadata.customerMessages 
      : [];
    
    // Create new metadata object
    // The Json type accepts objects, so this is compatible
    const newMetadata = {
      ...existingMetadata,
      customerMessages: [
        ...existingMessages,
        {
          content: validated.emailContent,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    // Assign metadata to updateData
    // TypeScript will infer this as compatible with Json type
    updateData.metadata = newMetadata as Database['public']['Tables']['bookings']['Update']['metadata'];

    // Update booking in database
    // No type cast needed - updateData is already typed as BookingUpdate
    // This matches exactly what Supabase expects for update operations
    const { error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', booking.id);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      // Continue anyway - don't fail the request
    }

    // Send acknowledgment
    await sendEmail({
      to: validated.fromEmail,
      subject: 'Re: ' + (validated.subject || 'Your booking'),
      text: `Thank you for your message. We've updated your booking and will get back to you shortly.\n\nBest regards,\nHelicopter Tours on Oahu`,
    });

    // Trigger n8n webhook if configured
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
      } catch (error) {
        console.error('n8n webhook error:', error);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        handled: 'booking_updated',
        bookingId: booking.id,
        analysis,
      },
    });
  } catch (error) {
    console.error('Customer reply error:', error);

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
