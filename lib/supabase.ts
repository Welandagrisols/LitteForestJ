import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if we're in demo mode (no real Supabase config or invalid config)
export const isDemoMode =
  !supabaseUrl ||
  !supabaseAnonKey ||
  supabaseUrl === "" ||
  supabaseAnonKey === "" ||
  supabaseUrl === "your_supabase_project_url_here" ||
  supabaseAnonKey === "your_supabase_anon_key_here" ||
  !isValidUrl(supabaseUrl)

// Helper function to validate URL format
function isValidUrl(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

// Use valid demo values when in demo mode to prevent URL constructor errors
const validSupabaseUrl = isDemoMode ? "https://demo.supabase.co" : supabaseUrl!
const validSupabaseAnonKey = isDemoMode ? "demo-key" : supabaseAnonKey!

// Create a single supabase client for the entire app
export const supabase = createClient<Database>(validSupabaseUrl, validSupabaseAnonKey, {
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