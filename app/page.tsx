'use client'

import { useState, useEffect, Suspense } from 'react'
import { AuthProvider } from '@/contexts/auth-context'
import { AuthGuard } from '@/components/auth-guard'
import { ErrorBoundary } from '@/components/error-boundary'
import { LoadingSpinner } from '@/components/loading-spinner'
import { Toaster } from '@/components/ui/toaster'
import dynamic from 'next/dynamic'

// Lazy load the dashboard to improve initial load time
const LazyDashboard = dynamic(() => import('@/components/lazy-dashboard'), {
  loading: () => <LoadingSpinner />,
  ssr: false
})

export default function HomePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <LoadingSpinner />
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <AuthGuard>
          <div className="min-h-screen bg-background">
            <Suspense fallback={<LoadingSpinner />}>
              <LazyDashboard />
            </Suspense>
          </div>
        </AuthGuard>
      </AuthProvider>
      <Toaster />
    </ErrorBoundary>
  )
}