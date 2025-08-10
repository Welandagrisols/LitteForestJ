
'use client'

import { ReactNode, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Download, Wifi, WifiOff, Upload } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

interface PWAProviderProps {
  children: ReactNode
}

// Simple install banner component
function InstallBanner({ 
  onInstall, 
  onDismiss 
}: { 
  onInstall: () => void
  onDismiss: () => void 
}) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground p-4 shadow-lg">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <Download className="h-5 w-5" />
          <div>
            <p className="font-medium">Install LittleForest App</p>
            <p className="text-sm opacity-90">Get the full app experience</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onInstall}
            className="bg-white text-primary hover:bg-gray-100"
          >
            Install
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Simple offline banner component
function OfflineBanner({ isOnline }: { isOnline: boolean }) {
  if (isOnline) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-yellow-500 text-white p-2 text-center text-sm">
      <div className="flex items-center justify-center gap-2">
        <WifiOff className="h-4 w-4" />
        <span>You're offline. Changes will sync when connection is restored.</span>
      </div>
    </div>
  )
}

export function PWAProvider({ children }: PWAProviderProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [isInstalled, setIsInstalled] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      if ('standalone' in window.navigator && (window.navigator as any).standalone) {
        setIsInstalled(true)
      } else if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true)
      }
    }

    checkInstalled()

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      if (!isInstalled) {
        setShowInstallBanner(true)
      }
    }

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowInstallBanner(false)
      toast({
        title: "App Installed!",
        description: "LittleForest has been installed successfully.",
      })
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check initial online status
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [isInstalled, toast])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const choiceResult = await deferredPrompt.userChoice
      
      if (choiceResult.outcome === 'accepted') {
        setShowInstallBanner(false)
        setDeferredPrompt(null)
      }
    } catch (error) {
      console.error('Error during install:', error)
      toast({
        title: "Installation Error",
        description: "Unable to install the app. Please try again later.",
        variant: "destructive"
      })
    }
  }

  return (
    <>
      {children}
      {showInstallBanner && !isInstalled && (
        <InstallBanner
          onInstall={handleInstallClick}
          onDismiss={() => setShowInstallBanner(false)}
        />
      )}
      <OfflineBanner isOnline={isOnline} />
    </>
  )
}
