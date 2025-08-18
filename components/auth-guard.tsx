"use client"

import { useAuth } from '@/contexts/auth-context'
import { LoadingSpinner } from '@/components/loading-spinner'
import { AdminLogin } from '@/components/admin-login'
import { Button } from "./ui/button"
import { useState, useEffect } from "react"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const [showFallback, setShowFallback] = useState(false)

  // Show fallback after 3 seconds of loading
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setShowFallback(true)
      }, 3000)
      return () => clearTimeout(timer)
    } else {
      setShowFallback(false)
    }
  }, [loading])

  if (loading && !showFallback) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-muted-foreground">Authenticating...</p>
        </div>
      </div>
    )
  }

  if (loading && showFallback) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Authentication is taking longer than expected.</p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            className="mt-4"
          >
            Refresh Page
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            You can also proceed without authentication
          </p>
          <Button 
            onClick={() => setShowFallback(false)} 
            variant="ghost" 
            className="mt-2"
          >
            Continue Anyway
          </Button>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AdminLogin />
  }

  return <>{children}</>
}