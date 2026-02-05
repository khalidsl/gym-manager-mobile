// Types pour la base de données et l'application

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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          avatar_url: string | null
          qr_code: string
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          avatar_url?: string | null
          qr_code: string
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          avatar_url?: string | null
          qr_code?: string
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      memberships: {
        Row: {
          id: string
          user_id: string
          type: 'basic' | 'premium' | 'vip'
          start_date: string
          end_date: string
          status: 'active' | 'expired' | 'suspended'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'basic' | 'premium' | 'vip'
          start_date: string
          end_date: string
          status?: 'active' | 'expired' | 'suspended'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'basic' | 'premium' | 'vip'
          start_date?: string
          end_date?: string
          status?: 'active' | 'expired' | 'suspended'
          created_at?: string
        }
      }
      machines: {
        Row: {
          id: string
          name: string
          type: string
          description: string | null
          image_url: string | null
          qr_code: string
          status: 'available' | 'in_use' | 'maintenance'
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          type: string
          description?: string | null
          image_url?: string | null
          qr_code: string
          status?: 'available' | 'in_use' | 'maintenance'
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          description?: string | null
          image_url?: string | null
          qr_code?: string
          status?: 'available' | 'in_use' | 'maintenance'
          created_at?: string
        }
      }
      machine_sessions: {
        Row: {
          id: string
          user_id: string
          machine_id: string
          start_time: string
          end_time: string | null
          sets: number
          reps: number
          weight: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          machine_id: string
          start_time: string
          end_time?: string | null
          sets?: number
          reps?: number
          weight?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          machine_id?: string
          start_time?: string
          end_time?: string | null
          sets?: number
          reps?: number
          weight?: number | null
          notes?: string | null
          created_at?: string
        }
      }
      machine_positions: {
        Row: {
          id: string
          user_id: string
          machine_id: string
          position_data: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          machine_id: string
          position_data: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          machine_id?: string
          position_data?: Json
          created_at?: string
          updated_at?: string
        }
      }
      machine_reservations: {
        Row: {
          id: string
          user_id: string
          machine_id: string
          start_time: string
          end_time: string
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          machine_id: string
          start_time: string
          end_time: string
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          machine_id?: string
          start_time?: string
          end_time?: string
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          created_at?: string
        }
      }
      access_logs: {
        Row: {
          id: string
          user_id: string
          type: 'entry' | 'exit'
          timestamp: string
          qr_code_scanned: string
          location: string | null
        }
        Insert: {
          id?: string
          user_id: string
          type: 'entry' | 'exit'
          timestamp?: string
          qr_code_scanned: string
          location?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'entry' | 'exit'
          timestamp?: string
          qr_code_scanned?: string
          location?: string | null
        }
      }
      access_permissions: {
        Row: {
          id: string
          membership_type: 'basic' | 'premium' | 'vip'
          allowed_days: string[]
          start_hour: string
          end_hour: string
          created_at: string
        }
        Insert: {
          id?: string
          membership_type: 'basic' | 'premium' | 'vip'
          allowed_days: string[]
          start_hour: string
          end_hour: string
          created_at?: string
        }
        Update: {
          id?: string
          membership_type?: 'basic' | 'premium' | 'vip'
          allowed_days?: string[]
          start_hour?: string
          end_hour?: string
          created_at?: string
        }
      }
      classes: {
        Row: {
          id: string
          name: string
          description: string | null
          coach_id: string
          max_capacity: number
          start_time: string
          end_time: string
          day_of_week: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          coach_id: string
          max_capacity: number
          start_time: string
          end_time: string
          day_of_week: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          coach_id?: string
          max_capacity?: number
          start_time?: string
          end_time?: string
          day_of_week?: number
          created_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          user_id: string
          class_id: string
          booking_date: string
          status: 'confirmed' | 'cancelled' | 'attended'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          class_id: string
          booking_date: string
          status?: 'confirmed' | 'cancelled' | 'attended'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          class_id?: string
          booking_date?: string
          status?: 'confirmed' | 'cancelled' | 'attended'
          created_at?: string
        }
      }
    }
  }
}

// Types d'application
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Membership = Database['public']['Tables']['memberships']['Row']
export type Machine = Database['public']['Tables']['machines']['Row']
export type MachineSession = Database['public']['Tables']['machine_sessions']['Row']
export type MachinePosition = Database['public']['Tables']['machine_positions']['Row']
export type MachineReservation = Database['public']['Tables']['machine_reservations']['Row']
export type AccessLog = Database['public']['Tables']['access_logs']['Row']
export type AccessPermission = Database['public']['Tables']['access_permissions']['Row']
export type Class = Database['public']['Tables']['classes']['Row']
export type Booking = Database['public']['Tables']['bookings']['Row']

export type MembershipType = 'basic' | 'premium' | 'vip'
export type MembershipStatus = 'active' | 'expired' | 'suspended'
export type MachineStatus = 'available' | 'in_use' | 'maintenance'
export type AccessType = 'entry' | 'exit'
export type BookingStatus = 'confirmed' | 'cancelled' | 'attended'
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'
