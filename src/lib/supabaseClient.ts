import 'server-only';
import { createClient, type PostgrestError } from '@supabase/supabase-js';
import type { Database } from './database.types';
import type { BookingsInsert, BookingsUpdate, BookingsRow } from './database.types';

/**
 * Supabase client for database operations
 * Uses environment variables for connection
 *
 * SECURITY NOTE: This client uses the service role key which bypasses Row Level Security (RLS).
 * For production, ensure RLS policies are properly configured in Supabase:
 * 1. Enable RLS on all tables in Supabase dashboard
 * 2. Create policies that restrict access appropriately
 * 3. Consider using anon key for client-side operations where possible
 * 4. Service role key should only be used server-side (API routes)
 */
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}

// Admin client for server-side operations (uses service role key)
// This client has full access to the database and is used for API routes
// IMPORTANT: RLS should be enabled in Supabase for production security
export const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/** Result type for insertBooking so callers get BookingsRow, not 'never'. */
export type InsertBookingResult = { data: BookingsRow | null; error: PostgrestError | null };

/**
 * Typed insert for bookings — centralizes Supabase type workaround so route code has no casts.
 * Use this instead of supabase.from('bookings').insert(...) in API routes.
 */
export async function insertBooking(data: BookingsInsert): Promise<InsertBookingResult> {
  // Supabase client infers insert param as 'never'; assertion here keeps route code cast-free.
  const result = await supabase.from('bookings').insert(data as never).select().single();
  return result as InsertBookingResult;
}

/**
 * Typed update for bookings — centralizes Supabase type workaround so route code has no casts.
 * Use this instead of supabase.from('bookings').update(...) in API routes.
 */
export async function updateBooking(id: string, data: BookingsUpdate) {
  return supabase.from('bookings').update(data as never).eq('id', id);
}

/**
 * Type-safe database operations
 */
export type Booking = Database['public']['Tables']['bookings']['Row'];
export type BookingInsert = Database['public']['Tables']['bookings']['Insert'];
export type BookingUpdate = Database['public']['Tables']['bookings']['Update'];

export type Operator = Database['public']['Tables']['operators']['Row'];
export type OperatorInsert = Database['public']['Tables']['operators']['Insert'];

export type AvailabilityLog = Database['public']['Tables']['availability_logs']['Row'];
export type AvailabilityLogInsert = Database['public']['Tables']['availability_logs']['Insert'];
