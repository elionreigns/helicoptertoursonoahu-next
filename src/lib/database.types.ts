/**
 * Database types for Supabase
 * Auto-generated from Supabase schema
 * 
 * Run: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/database.types.ts
 * Or manually define based on your schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      bookings: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          ref_code: string | null
          status: string
          customer_name: string | null
          customer_email: string | null
          customer_phone: string | null
          party_size: number | null
          preferred_date: string | null
          time_window: string | null
          doors_off: boolean | null
          hotel: string | null
          special_requests: string | null
          operator_id: string | null
          operator_name: string | null
          operator: string | null
          confirmation_number: string | null
          payment_status: string | null
          total_amount: number | null
          total_weight: number // not nullable
          source: string | null // 'web', 'chatbot', 'phone'
          metadata: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          ref_code?: string | null
          status?: string
          customer_name?: string | null
          customer_email?: string | null
          customer_phone?: string | null
          party_size?: number | null
          preferred_date?: string | null
          time_window?: string | null
          doors_off?: boolean | null
          hotel?: string | null
          special_requests?: string | null
          operator_id?: string | null
          operator_name?: string | null
          operator?: string | null
          confirmation_number?: string | null
          payment_status?: string | null
          total_amount?: number | null
          total_weight: number // required
          source?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          ref_code?: string | null
          status?: string
          customer_name?: string | null
          customer_email?: string | null
          customer_phone?: string | null
          party_size?: number | null
          preferred_date?: string | null
          time_window?: string | null
          doors_off?: boolean | null
          hotel?: string | null
          special_requests?: string | null
          operator_id?: string | null
          operator_name?: string | null
          operator?: string | null
          confirmation_number?: string | null
          payment_status?: string | null
          total_amount?: number | null
          total_weight?: number
          source?: string | null
          metadata?: Json | null
        }
      }
      operators: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          email: string
          website: string | null
          is_active: boolean
          metadata: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          email: string
          website?: string | null
          is_active?: boolean
          metadata?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          email?: string
          website?: string | null
          is_active?: boolean
          metadata?: Json | null
        }
      }
      availability_logs: {
        Row: {
          id: string
          created_at: string
          booking_id: string | null
          operator_id: string | null
          operator_name: string | null
          date: string
          available: boolean
          details: Json | null
          source: string | null // 'browserbase', 'playwright', 'manual'
        }
        Insert: {
          id?: string
          created_at?: string
          booking_id?: string | null
          operator_id?: string | null
          operator_name?: string | null
          date: string
          available?: boolean
          details?: Json | null
          source?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          booking_id?: string | null
          operator_id?: string | null
          operator_name?: string | null
          date?: string
          available?: boolean
          details?: Json | null
          source?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
