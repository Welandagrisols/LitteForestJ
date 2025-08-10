'use client'

import { AuthProvider } from '@/contexts/auth-context'
import { AuthGuard } from '@/components/auth-guard'
import { ErrorBoundary } from '@/components/error-boundary'
import { LoadingSpinner } from '@/components/loading-spinner'
import { Toaster } from '@/components/ui/toaster'
import dynamic from 'next/dynamic'

// Lazy load the dashboard
const LazyDashboard = dynamic(() => import('@/components/lazy-dashboard'), {
  loading: () => <LoadingSpinner />,
  ssr: false
})

export default function HomePage() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AuthGuard>
          <div className="min-h-screen bg-background">
            <LazyDashboard />
          </div>
        </AuthGuard>
      </AuthProvider>
      <Toaster />
    </ErrorBoundary>
  )
}