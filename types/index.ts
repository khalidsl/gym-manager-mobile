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
          role: 'member' | 'admin' | 'coach'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          avatar_url?: string | null
          qr_code?: string
          phone?: string | null
          role?: 'member' | 'admin' | 'coach'
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
          role?: 'member' | 'admin' | 'coach'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: [
          {
            foreignKeyName: "memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: []
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
          weight_kg: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          machine_id: string
          start_time?: string
          end_time?: string | null
          sets?: number
          reps?: number
          weight_kg?: number
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
          weight_kg?: number
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "machine_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machine_sessions_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          }
        ]
      }
      access_logs: {
        Row: {
          id: string
          member_id: string
          type: 'entry' | 'exit'
          timestamp: string  
          method: string | null
          created_at: string
        }
        Insert: {
          id?: string
          member_id: string
          type: 'entry' | 'exit'
          timestamp?: string
          method?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          member_id?: string
          type?: 'entry' | 'exit'
          timestamp?: string
          method?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_logs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      daily_qr_codes: {
        Row: {
          id: string
          date: string
          entry_code: string
          exit_code: string
          created_at: string
        }
        Insert: {
          id?: string
          date: string
          entry_code: string
          exit_code: string
          created_at?: string
        }
        Update: {
          id?: string
          date?: string
          entry_code?: string
          exit_code?: string
          created_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          id: string
          user_id: string
          class_id: string
          booking_date: string
          status: 'confirmed' | 'cancelled' | 'completed'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          class_id: string
          booking_date: string
          status?: 'confirmed' | 'cancelled' | 'completed'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          class_id?: string
          booking_date?: string
          status?: 'confirmed' | 'cancelled' | 'completed'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      classes: {
        Row: {
          id: string
          name: string
          description: string | null
          instructor: string | null
          duration_minutes: number
          capacity: number
          day_of_week: number
          start_time: string
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          instructor?: string | null
          duration_minutes?: number
          capacity?: number
          day_of_week: number
          start_time: string
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          instructor?: string | null
          duration_minutes?: number
          capacity?: number
          day_of_week?: number
          start_time?: string
          image_url?: string | null
          created_at?: string
        }
        Relationships: []
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Types d'application
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Membership = Database['public']['Tables']['memberships']['Row']
export type Machine = Database['public']['Tables']['machines']['Row']
export type MachineSession = Database['public']['Tables']['machine_sessions']['Row']
export type AccessLog = Database['public']['Tables']['access_logs']['Row']
export type DailyQRCode = Database['public']['Tables']['daily_qr_codes']['Row']
export type Class = Database['public']['Tables']['classes']['Row']
export type Booking = Database['public']['Tables']['bookings']['Row']

export type MembershipType = 'basic' | 'premium' | 'vip'
export type MembershipStatus = 'active' | 'expired' | 'suspended'
export type MachineStatus = 'available' | 'in_use' | 'maintenance'
export type AccessType = 'entry' | 'exit'
export type BookingStatus = 'confirmed' | 'cancelled' | 'completed'

// Types pour l'interface utilisateur
export interface Member extends Profile {
  membership?: Membership | null
  last_access?: string | null
}

export interface MachineWithStatus extends Machine {
  current_user?: Profile | null
  session_start?: string | null
}

export interface ClassWithBookings extends Class {
  current_bookings: number
}

export interface AccessLogWithMember extends AccessLog {
  member: Profile
}

export interface StatCard {
  icon: string
  title: string
  value: string
  accent: string
}

export interface QuickAction {
  icon: string
  label: string
  action: () => void
}

export interface ScanResult {
  success: boolean
  memberName?: string
  action?: string
  message: string
}

export interface QRScanResult {
  success: boolean
  memberName?: string
  action?: 'entry' | 'exit'
  message: string
}