
'use client'

import { WifiOff, Wifi } from 'lucide-react'

interface OfflineStatusBannerProps {
  isOnline: boolean
  hasPendingSync: boolean
}

export default function OfflineStatusBanner({ isOnline, hasPendingSync }: OfflineStatusBannerProps) {
  if (isOnline && !hasPendingSync) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-yellow-500 text-white p-2 text-center text-sm">
      <div className="flex items-center justify-center gap-2">
        {!isOnline ? (
          <>
            <WifiOff className="h-4 w-4" />
            <span>You're offline. Changes will sync when connection is restored.</span>
          </>
        ) : hasPendingSync ? (
          <>
            <Wifi className="h-4 w-4" />
            <span>Connection restored. Syncing offline changes...</span>
          </>
        ) : null}
      </div>
    </div>
  )
}
