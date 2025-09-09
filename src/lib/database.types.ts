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
      tables: {
        Row: {
          id: number
          table_number: number
          qr_code: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: number
          table_number: number
          qr_code: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          table_number?: number
          qr_code?: string
          is_active?: boolean
          created_at?: string
        }
      }
      menus: {
        Row: {
          id: number
          name: string
          description: string | null
          price: number
          image_url: string | null
          category: string
          is_available: boolean
          stock_quantity: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          price: number
          image_url?: string | null
          category: string
          is_available?: boolean
          stock_quantity?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          price?: number
          image_url?: string | null
          category?: string
          is_available?: boolean
          stock_quantity?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: number
          table_id: number
          status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
          total_amount: number
          special_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          table_id: number
          status?: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
          total_amount: number
          special_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          table_id?: number
          status?: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
          total_amount?: number
          special_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: number
          order_id: number
          menu_id: number
          quantity: number
          price: number
          special_notes: string | null
          created_at: string
        }
        Insert: {
          id?: number
          order_id: number
          menu_id: number
          quantity: number
          price: number
          special_notes?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          order_id?: number
          menu_id?: number
          quantity?: number
          price?: number
          special_notes?: string | null
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'admin' | 'barista'
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'admin' | 'barista'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'admin' | 'barista'
          created_at?: string
        }
      }
    }
  }
}