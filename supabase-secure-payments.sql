-- Secure payments: encrypted card payloads per booking. Never store plain card data.
-- Run this once in Supabase SQL Editor (Dashboard → SQL Editor).

CREATE TABLE IF NOT EXISTS secure_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code text NOT NULL,
  encrypted_payload text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  consumed_at timestamptz,
  operator_token text UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_secure_payments_ref_code ON secure_payments(ref_code);
CREATE INDEX IF NOT EXISTS idx_secure_payments_operator_token ON secure_payments(operator_token) WHERE operator_token IS NOT NULL;

COMMENT ON TABLE secure_payments IS 'Encrypted card payloads for bookings. Decrypted only for one-time operator view.';
