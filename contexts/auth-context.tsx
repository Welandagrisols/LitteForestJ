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
  const [isAdmin, setIsAdmin] = useState(false)

  // Debug logging
  useEffect(() => {
    console.log("AuthProvider: Loading state changed to:", isLoading)
    console.log("AuthProvider: User state:", user ? "authenticated" : "not authenticated")
    console.log("AuthProvider: Demo mode:", isDemoMode)
  }, [isLoading, user])

  // Define admin emails - you can modify this list
  const adminEmails = ['admin@littleforest.com', 'farm@littleforest.com']

  const isAdminCheck = user ? adminEmails.includes(user.email || '') : false
  const isAuthenticated = !!user && isAdminCheck

  useEffect(() => {
    let mounted = true
    
    // Failsafe timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (mounted) {
        console.warn("Auth loading timeout reached - forcing demo mode")
        setIsAdmin(true)
        setIsLoading(false)
      }
    }, 5000) // 5 second timeout

    async function getInitialSession() {
      try {
        if (isDemoMode) {
          console.log("AuthProvider: Setting demo mode")
          if (mounted) {
            setIsAdmin(true)
            setIsLoading(false)
          }
          return
        }
        
        console.log("AuthProvider: Checking Supabase session")
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error("AuthProvider: Session error:", error)
          // Force demo mode on error
          if (mounted) {
            setIsAdmin(true)
            setIsLoading(false)
          }
          return
        }
        
        console.log("AuthProvider: Session received:", !!session)
        if (mounted) {
          setUser(session?.user ?? null)
          setIsAdmin(!!session?.user)
          setIsLoading(false)
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          console.log("AuthProvider: Auth state changed:", !!session)
          if (mounted) {
            setUser(session?.user ?? null)
            setIsAdmin(!!session?.user)
            setIsLoading(false)
          }
        })

        return () => {
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error('AuthProvider: Error getting session:', error)
        // Force demo mode on any error
        if (mounted) {
          setIsAdmin(true)
          setIsLoading(false)
        }
      }
    }

    getInitialSession()

    return () => {
      mounted = false
      clearTimeout(timeout)
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    if (isDemoMode) {
      // Demo mode - simulate admin login
      if (adminEmails.includes(email)) {
        setUser({ email, id: 'demo-admin' } as User)
        setIsAdmin(true)
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

    if (data.user) {
      setIsAdmin(adminEmails.includes(data.user.email || ''))
    }

    return { error }
  }

  const signOut = async () => {
    if (isDemoMode) {
      setUser(null)
      setIsAdmin(false)
      return
    }
    await supabase.auth.signOut()
  }

  const value = {
    user,
    isAdmin: isAdminCheck,
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