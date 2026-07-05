export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          display_name: string | null
          avatar_url: string | null
          email: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          display_name?: string | null
          avatar_url?: string | null
          email?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          full_name?: string | null
          display_name?: string | null
          avatar_url?: string | null
          email?: string | null
          phone?: string | null
          updated_at?: string
        }
      }
      households: {
        Row: {
          id: string
          name: string
          currency: string
          update_frequency: 'weekly' | 'monthly' | 'manual'
          created_by: string
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          name: string
          currency?: string
          update_frequency?: 'weekly' | 'monthly' | 'manual'
          created_by: string
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['households']['Insert']>
      }
      household_members: {
        Row: {
          id: string
          household_id: string
          user_id: string
          role: 'owner' | 'partner' | 'viewer'
          permission_level:
            | 'view_summary'
            | 'view_grouped'
            | 'view_detail'
            | 'edit_content'
            | 'admin'
          joined_at: string
          invited_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          household_id: string
          user_id: string
          role?: 'owner' | 'partner' | 'viewer'
          permission_level?:
            | 'view_summary'
            | 'view_grouped'
            | 'view_detail'
            | 'edit_content'
            | 'admin'
          joined_at?: string
          invited_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['household_members']['Insert']>
      }
    }
  }
}
