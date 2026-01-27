/**
 * Database types for Supabase — complete BookingsRow and related types.
 * metadata: Record<string, any> | null for JSONB (customerMessages, etc.).
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/** Full row type for public.bookings — matches Supabase schema exactly */
export type BookingsRow = {
  id: string;
  created_at: string;
  updated_at: string;
  ref_code: string | null;
  status: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  party_size: number | null;
  preferred_date: string | null;
  time_window: string | null;
  doors_off: boolean | null;
  hotel: string | null;
  special_requests: string | null;
  total_weight: number;
  operator: string | null;
  /** JSONB — customerMessages and other app data */
  metadata: Record<string, any> | null;
  payment_status: string | null;
  total_amount: number | null;
  confirmation_number: string | null;
  source: string | null;
  operator_id: string | null;
  operator_name: string | null;
};

/** Update payload: all fields optional */
export type BookingsUpdate = Partial<BookingsRow>;

/** Insert payload: total_weight required; all other fields optional */
export type BookingsInsert = Partial<Omit<BookingsRow, 'total_weight'>> & {
  total_weight: number;
};

/** Supabase Database interface — bookings table uses types above */
export interface Database {
  public: {
    Tables: {
      bookings: {
        Row: BookingsRow;
        Insert: BookingsInsert;
        Update: BookingsUpdate;
      };
      operators: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          name: string;
          email: string;
          website: string | null;
          is_active: boolean;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name: string;
          email: string;
          website?: string | null;
          is_active?: boolean;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name?: string;
          email?: string;
          website?: string | null;
          is_active?: boolean;
          metadata?: Json | null;
        };
      };
      availability_logs: {
        Row: {
          id: string;
          created_at: string;
          booking_id: string | null;
          operator_id: string | null;
          operator_name: string | null;
          date: string;
          available: boolean;
          details: Json | null;
          source: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          booking_id?: string | null;
          operator_id?: string | null;
          operator_name?: string | null;
          date: string;
          available?: boolean;
          details?: Json | null;
          source?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          booking_id?: string | null;
          operator_id?: string | null;
          operator_name?: string | null;
          date?: string;
          available?: boolean;
          details?: Json | null;
          source?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
