/**
 * Database types for Supabase — full BookingsRow and related types.
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
  status: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  party_size: number | null;
  preferred_date: string | null;
  time_window: string | null;
  doors_off: boolean | null;
  hotel: string | null;
  special_requests: string | null;
  total_weight: number | null;
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

/** Insert payload: id and created_at are auto-generated */
export type BookingsInsert = Partial<Omit<BookingsRow, 'id' | 'created_at'>> & { total_weight: number };

/** Update payload: all fields optional */
export type BookingsUpdate = Partial<BookingsRow>;

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
      secure_payments: {
        Row: {
          id: string;
          ref_code: string;
          encrypted_payload: string;
          created_at: string;
          consumed_at: string | null;
          operator_token: string | null;
        };
        Insert: {
          id?: string;
          ref_code: string;
          encrypted_payload: string;
          created_at?: string;
          consumed_at?: string | null;
          operator_token?: string | null;
        };
        Update: {
          id?: string;
          ref_code?: string;
          encrypted_payload?: string;
          created_at?: string;
          consumed_at?: string | null;
          operator_token?: string | null;
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
