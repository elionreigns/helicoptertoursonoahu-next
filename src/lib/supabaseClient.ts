import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

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
