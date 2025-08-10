'use client'

import { ReactNode, useEffect, useState, lazy, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { X, Download, Wifi, WifiOff, Upload } from 'lucide-react'
import { offlineSync } from '@/lib/offline-sync'
import { useToast } from '@/components/ui/use-toast'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

const PwaInstallBanner = dynamic(() => import('./PwaInstallBanner'), { ssr: false })
const OfflineStatusBanner = dynamic(() => import('./OfflineStatusBanner'), { ssr: false })
const SyncStatusIndicator = dynamic(() => import('./SyncStatusIndicator'), { ssr: false })

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [canInstall, setCanInstall] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [hasPendingSync, setHasPendingSync] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration)
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError)
        })
    }

    // Check if already installed
    const checkIfInstalled = () => {
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true)
      }
      // Also check for iOS Safari standalone mode
      if ((window.navigator as any).standalone === true) {
        setIsInstalled(true)
      }
    }

    // Handle install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setCanInstall(true)
      setShowInstallBanner(true)
    }

    checkIfInstalled()

    // Handle online/offline status
    const handleOnline = async () => {
      setIsOnline(true)
      setIsSyncing(true)

      try {
        const result = await offlineSync.syncPendingOperations()
        if (result.synced > 0) {
          toast({
            title: "Data Synced",
            description: `${result.synced} offline changes synced successfully`,
          })
        }
        if (result.failed > 0) {
          toast({
            title: "Sync Issues",
            description: `${result.failed} items failed to sync`,
            variant: "destructive"
          })
        }
        setHasPendingSync(false)
      } catch (error) {
        console.error('Sync failed:', error)
      } finally {
        setIsSyncing(false)
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      setHasPendingSync(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Show manual install instructions
      showManualInstallInstructions()
      return
    }

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setDeferredPrompt(null)
      setShowInstallBanner(false)
      setCanInstall(false)
    }
  }

  const showManualInstallInstructions = () => {
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor)
    const isSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor)
    const isEdge = /Edg/.test(navigator.userAgent)

    let instructions = ""

    if (isChrome || isEdge) {
      instructions = "Look for the install icon (⊞) in your address bar, or click the three dots menu → 'Install LittleForest'"
    } else if (isSafari) {
      instructions = "Tap the Share button (□↗) and select 'Add to Home Screen'"
    } else {
      instructions = "Look for an install or 'Add to Home Screen' option in your browser menu"
    }

    toast({
      title: "Install LittleForest",
      description: instructions,
      duration: 8000,
    })
  }

  return (
    <>
      {children}

      <Suspense fallback={null}>
        <PwaInstallBanner
          deferredPrompt={deferredPrompt}
          showInstallBanner={showInstallBanner}
          canInstall={canInstall}
          isInstalled={isInstalled}
          handleInstallClick={handleInstallClick}
          setShowInstallBanner={setShowInstallBanner}
        />
      </Suspense>

      {/* Permanent Install Button for Desktop */}
      {!isInstalled && (
        <div className="fixed top-4 right-4 z-40 hidden md:block">
          <Button
            variant="outline"
            size="sm"
            onClick={handleInstallClick}
            className="bg-background/80 backdrop-blur-sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Install App
          </Button>
        </div>
      )}

      <Suspense fallback={null}>
        <OfflineStatusBanner isOnline={isOnline} hasPendingSync={hasPendingSync} />
      </Suspense>

      <Suspense fallback={null}>
        <SyncStatusIndicator isOnline={isOnline} isSyncing={isSyncing} hasPendingSync={hasPendingSync} />
      </Suspense>
    </>
  )
}