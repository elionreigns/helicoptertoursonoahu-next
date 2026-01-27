-- Supabase Database Schema for Helicopter Tours Booking System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Operators table
CREATE TABLE IF NOT EXISTS operators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  website TEXT,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending',
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  party_size INTEGER,
  preferred_date DATE,
  time_window TEXT,
  doors_off BOOLEAN DEFAULT false,
  hotel TEXT,
  special_requests TEXT,
  operator_id UUID REFERENCES operators(id),
  operator_name TEXT,
  confirmation_number TEXT,
  payment_status TEXT,
  total_amount DECIMAL(10, 2),
  source TEXT, -- 'web', 'chatbot', 'phone', 'email'
  metadata JSONB
);

-- Availability logs table
CREATE TABLE IF NOT EXISTS availability_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  booking_id UUID REFERENCES bookings(id),
  operator_id UUID REFERENCES operators(id),
  operator_name TEXT,
  date DATE NOT NULL,
  available BOOLEAN,
  details JSONB,
  source TEXT -- 'browserbase', 'playwright', 'manual'
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_customer_email ON bookings(customer_email);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_preferred_date ON bookings(preferred_date);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_availability_logs_booking_id ON availability_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_availability_logs_date ON availability_logs(date);
CREATE INDEX IF NOT EXISTS idx_availability_logs_operator_name ON availability_logs(operator_name);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to update updated_at automatically
CREATE TRIGGER update_operators_updated_at BEFORE UPDATE ON operators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial operators
INSERT INTO operators (name, email, website, is_active) VALUES
  ('Blue Hawaiian Helicopters', 'coralcrowntechnologies@gmail.com', 'https://www.bluehawaiian.com', true),
  ('Rainbow Helicopters', 'ashleydanielleschaefer@gmail.com', 'https://www.rainbowhelicopters.com', true)
ON CONFLICT (email) DO NOTHING;

-- Enable Row Level Security (RLS) - adjust policies as needed
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_logs ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your security requirements)
-- For now, allow service role to access everything
-- In production, create more restrictive policies

-- Allow service role full access
CREATE POLICY "Service role full access" ON bookings
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON operators
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON availability_logs
  FOR ALL USING (auth.role() = 'service_role');
