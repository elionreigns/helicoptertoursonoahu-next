-- Run this in Supabase SQL Editor if you get "Could not find the 'customer_email' column" (or similar).
-- Your bookings table may have been created from an older/different schema. This adds the columns the app expects.

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS ref_code TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS party_size INTEGER;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS preferred_date DATE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS time_window TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS doors_off BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS hotel TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS special_requests TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_weight INTEGER;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS operator_name TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS metadata JSONB;

CREATE INDEX IF NOT EXISTS idx_bookings_customer_email ON bookings(customer_email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_ref_code_unique ON bookings(ref_code) WHERE ref_code IS NOT NULL;
