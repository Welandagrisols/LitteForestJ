
"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const getSession = async () => {
      try {
        // Set a timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          if (mounted) {
            console.log('Auth session timeout, setting loading to false')
            setLoading(false)
          }
        }, 3000) // 3 second timeout

        const { data: { session }, error } = await supabase.auth.getSession()
        
        clearTimeout(timeoutId)
        
        if (mounted) {
          if (error) {
            console.error('Auth session error:', error)
          }
          setSession(session)
          setUser(session?.user ?? null)
          setLoading(false)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          console.log('Auth state changed:', event, session?.user?.email)
          setSession(session)
          setUser(session?.user ?? null)
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
