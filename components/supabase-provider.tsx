"use client"

import type React from "react"

interface SupabaseProviderProps {
  children: React.ReactNode
}

export function SupabaseProvider({ children }: SupabaseProviderProps) {
  // Simplified provider that just passes through children
  // Each component will handle its own demo mode logic
  return <>{children}</>
}
