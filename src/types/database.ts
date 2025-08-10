export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          company_id: string
          logo_url: string | null
          primary_color: string
          secondary_color: string
          accent_color: string
          is_active: boolean
          subscription_plan: string
          max_users: number
          max_screens: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          company_id: string
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          accent_color?: string
          is_active?: boolean
          subscription_plan?: string
          max_users?: number
          max_screens?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          company_id?: string
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          accent_color?: string
          is_active?: boolean
          subscription_plan?: string
          max_users?: number
          max_screens?: number
          created_at?: string
          updated_at?: string
        }
      }
      company_users: {
        Row: {
          user_id: string
          company_id: string
          role: 'super_admin' | 'admin' | 'creator' | 'audience'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          company_id: string
          role?: 'super_admin' | 'admin' | 'creator' | 'audience'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          company_id?: string
          role?: 'super_admin' | 'admin' | 'creator' | 'audience'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'admin' | 'editor' | 'viewer'
          company_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          role?: 'admin' | 'editor' | 'viewer'
          company_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'admin' | 'editor' | 'viewer'
          company_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      screens: {
        Row: {
          id: string
          name: string
          location: string
          resolution: string
          status: 'online' | 'offline' | 'maintenance'
          last_seen: string
          company_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          location: string
          resolution?: string
          status?: 'online' | 'offline' | 'maintenance'
          last_seen?: string
          company_id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          location?: string
          resolution?: string
          status?: 'online' | 'offline' | 'maintenance'
          last_seen?: string
          company_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      content: {
        Row: {
          id: string
          title: string
          type: 'text' | 'image' | 'video' | 'html'
          content_data: any
          duration: number
          is_active: boolean
          created_by: string
          company_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          type: 'text' | 'image' | 'video' | 'html'
          content_data: any
          duration: number
          is_active?: boolean
          created_by?: string
          company_id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          type?: 'text' | 'image' | 'video' | 'html'
          content_data?: any
          duration?: number
          is_active?: boolean
          created_by?: string
          company_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      playlists: {
        Row: {
          id: string
          name: string
          description: string
          is_active: boolean
          created_by: string
          company_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          is_active?: boolean
          created_by?: string
          company_id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          is_active?: boolean
          created_by?: string
          company_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      playlist_items: {
        Row: {
          id: string
          playlist_id: string
          content_id: string
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          playlist_id: string
          content_id: string
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          playlist_id?: string
          content_id?: string
          order_index?: number
          created_at?: string
        }
      }
      schedules: {
        Row: {
          id: string
          name: string
          playlist_id: string
          screen_id: string
          start_time: string
          end_time: string
          days_of_week: number[]
          is_active: boolean
          created_by: string
          company_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          playlist_id: string
          screen_id: string
          start_time: string
          end_time: string
          days_of_week?: number[]
          is_active?: boolean
          created_by?: string
          company_id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          playlist_id?: string
          screen_id?: string
          start_time?: string
          end_time?: string
          days_of_week?: number[]
          is_active?: boolean
          created_by?: string
          company_id?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}