
'use client'

import { Button } from '@/components/ui/button'
import { X, Download } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

interface PwaInstallBannerProps {
  deferredPrompt: BeforeInstallPromptEvent | null
  showInstallBanner: boolean
  canInstall: boolean
  isInstalled: boolean
  handleInstallClick: () => void
  setShowInstallBanner: (show: boolean) => void
}

export default function PwaInstallBanner({
  showInstallBanner,
  canInstall,
  isInstalled,
  handleInstallClick,
  setShowInstallBanner
}: PwaInstallBannerProps) {
  if (isInstalled || !showInstallBanner || !canInstall) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground p-4 shadow-lg">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <Download className="h-5 w-5" />
          <div>
            <p className="font-medium">Install LittleForest App</p>
            <p className="text-sm opacity-90">Get the full app experience with offline access</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleInstallClick}
            className="bg-white text-primary hover:bg-gray-100"
          >
            Install
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowInstallBanner(false)}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
