import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log("Supabase URL:", supabaseUrl)
console.log("Supabase Key:", supabaseAnonKey ? "Set" : "Not set")

// Check if we have valid Supabase configuration
const hasValidUrl = supabaseUrl && supabaseUrl.startsWith("https://") && supabaseUrl.includes(".supabase.co")
const hasValidKey = supabaseAnonKey && supabaseAnonKey.length > 50

console.log("Is valid URL:", hasValidUrl)

// Check if we're in demo mode (missing required env vars)
export const isDemoMode =
  !process.env.NEXT_PUBLIC_SUPABASE_URL || 
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  !isValidUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'your-project-url' ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'your-anon-key'

console.log("Is Demo Mode:", isDemoMode)

// If in demo mode, log the reason
if (isDemoMode) {
  console.log("Demo mode reason:", {
    hasUrl: !!supabaseUrl,
    hasValidUrl,
    hasKey: !!supabaseAnonKey,
    hasValidKey
  })
}

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
  console.log(`Checking if table ${tableName} exists...`)

  if (isDemoMode) {
    console.log(`Skipping table check - in demo mode`)
    return false
  }

  try {
    // Try to select a single row to check if the table exists
    const { data, error } = await supabase.from(tableName).select("id").limit(1)

    console.log(`Table ${tableName} check result:`, { data, error })

    // If the error contains "relation does not exist", the table doesn't exist
    if (error && error.message.includes("relation") && error.message.includes("does not exist")) {
      console.log(`Table ${tableName} does not exist`)
      return false
    }

    // If there's no error or a different error, assume the table exists
    console.log(`Table ${tableName} exists`)
    return true
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error)
    return false
  }
}