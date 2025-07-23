
"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isDemoMode } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  isAdmin: boolean
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Define admin emails - you can modify this list
  const adminEmails = ['admin@littleforest.com', 'farm@littleforest.com']

  const isAdmin = user ? adminEmails.includes(user.email || '') : false
  const isAuthenticated = !!user && isAdmin

  useEffect(() => {
    if (isDemoMode) {
      setIsLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    if (isDemoMode) {
      // Demo mode - simulate admin login
      if (adminEmails.includes(email)) {
        setUser({ email, id: 'demo-admin' } as User)
        return { error: null }
      }
      return { error: { message: 'Invalid admin credentials' } }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (data.user && !adminEmails.includes(data.user.email || '')) {
      await supabase.auth.signOut()
      return { error: { message: 'Access denied. Admin privileges required.' } }
    }

    return { error }
  }

  const signOut = async () => {
    if (isDemoMode) {
      setUser(null)
      return
    }
    await supabase.auth.signOut()
  }

  const value = {
    user,
    isAdmin,
    isLoading,
    signIn,
    signOut,
    isAuthenticated,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
