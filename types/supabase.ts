export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      inventory: {
        Row: {
          id: string
          plant_name: string
          scientific_name: string | null
          category: string
          quantity: number
          age: string | null
          date_planted: string | null
          status: string
          price: number
          sku: string
          section: string | null
          row: string | null
          source: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          plant_name: string
          scientific_name?: string | null
          category: string
          quantity: number
          age?: string | null
          date_planted?: string | null
          status: string
          price: number
          sku: string
          section?: string | null
          row?: string | null
          source?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          plant_name?: string
          scientific_name?: string | null
          category?: string
          quantity?: number
          age?: string | null
          date_planted?: string | null
          status?: string
          price?: number
          sku?: string
          section?: string | null
          row?: string | null
          source?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sales: {
        Row: {
          id: string
          inventory_id: string
          quantity: number
          sale_date: string
          customer_id: string | null
          total_amount: number
          created_at: string
        }
        Insert: {
          id?: string
          inventory_id: string
          quantity: number
          sale_date?: string
          customer_id?: string | null
          total_amount: number
          created_at?: string
        }
        Update: {
          id?: string
          inventory_id?: string
          quantity?: number
          sale_date?: string
          customer_id?: string | null
          total_amount?: number
          created_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          name: string
          contact: string
          email: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          contact: string
          email?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          contact?: string
          email?: string | null
          created_at?: string
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
