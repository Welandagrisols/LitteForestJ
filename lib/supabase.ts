import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Create a single supabase client for the entire app
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://demo.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "demo-key"

// Check if we're in demo mode (no real Supabase config)
export const isDemoMode =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === "" ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === ""

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Helper function to check if a table exists
export async function checkTableExists(tableName: string): Promise<boolean> {
  if (isDemoMode) return false

  try {
    // Try to select a single row to check if the table exists
    const { error } = await supabase.from(tableName).select("id").limit(1).single()

    // If the error contains "relation does not exist", the table doesn't exist
    if (error && error.message.includes("relation") && error.message.includes("does not exist")) {
      return false
    }

    // If there's no error or a different error, assume the table exists
    return true
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error)
    return false
  }
}
