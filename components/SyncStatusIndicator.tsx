
'use client'

import { Upload, Wifi, WifiOff } from 'lucide-react'

interface SyncStatusIndicatorProps {
  isOnline: boolean
  isSyncing: boolean
  hasPendingSync: boolean
}

export default function SyncStatusIndicator({ isOnline, isSyncing, hasPendingSync }: SyncStatusIndicatorProps) {
  if (!isSyncing && !hasPendingSync) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-30">
      <div className="bg-background/80 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
        <div className="flex items-center gap-2 text-sm">
          {isSyncing ? (
            <>
              <Upload className="h-4 w-4 animate-spin" />
              <span>Syncing...</span>
            </>
          ) : hasPendingSync ? (
            <>
              <WifiOff className="h-4 w-4 text-orange-500" />
              <span className="text-orange-600">Pending sync</span>
            </>
          ) : (
            <>
              <Wifi className="h-4 w-4 text-green-500" />
              <span className="text-green-600">Online</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
