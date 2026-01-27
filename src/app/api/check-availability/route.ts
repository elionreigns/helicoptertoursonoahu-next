import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabase, type AvailabilityLogInsert } from '@/lib/supabaseClient';
import { checkAvailability } from '@/lib/browserAutomation';

/**
 * Schema for availability check
 */
const availabilityCheckSchema = z.object({
  operator: z.enum(['blueHawaiian', 'rainbow']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  partySize: z.number().int().min(1).max(20),
  bookingId: z.string().uuid().optional(),
  tourName: z.string().optional(),
  timeWindow: z.string().optional(),
});

/**
 * POST /api/check-availability
 * 
 * Checks availability for a specific operator, date, and party size
 * - Uses browser automation (Browserbase or Playwright)
 * - Logs results to availability_logs table
 * - Returns availability status
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = availabilityCheckSchema.parse(body);

    // Check availability
    const result = await checkAvailability({
      operator: validated.operator,
      date: validated.date,
      partySize: validated.partySize,
      tourName: validated.tourName,
      timeWindow: validated.timeWindow,
    });

    // Log to database
    const operatorName = validated.operator === 'blueHawaiian' 
      ? 'Blue Hawaiian Helicopters' 
      : 'Rainbow Helicopters';

    // Log availability check result (using type assertion to work around Supabase type inference)
    try {
      await supabase
        .from('availability_logs')
        .insert({
          booking_id: validated.bookingId ?? null,
          operator_name: operatorName,
          date: validated.date,
          available: result.available ?? false,
          details: result.details ? (result.details as any) : null,
          source: result.source ?? 'manual',
        } as any);
    } catch (dbError) {
      console.error('Error logging availability check:', dbError);
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      success: true,
      data: {
        available: result.available,
        availableSlots: result.availableSlots,
        details: result.details,
        source: result.source,
        error: result.error,
      },
    });
  } catch (error) {
    console.error('Check availability error:', error);

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
