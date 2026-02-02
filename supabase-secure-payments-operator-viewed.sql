-- Add operator_viewed_at to secure_payments for reservations flow.
-- When operator views payment via booking.helicoptertoursonoahu.com/reservations (ref + vendor password),
-- we set operator_viewed_at = now(). A cleanup deletes rows where operator_viewed_at < now() - 5 minutes.
-- Run once in Supabase SQL Editor after supabase-secure-payments.sql.

ALTER TABLE secure_payments
  ADD COLUMN IF NOT EXISTS operator_viewed_at timestamptz;

COMMENT ON COLUMN secure_payments.operator_viewed_at IS 'When operator viewed payment via /reservations; row is deleted 5 min after this.';
