
"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Smartphone, Wifi, WifiOff, Battery, Signal } from 'lucide-react'

interface NetworkStatus {
  online: boolean
  connectionType: string
}

export function MobileFeatures() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    online: true,
    connectionType: 'unknown'
  })
  const [isCapacitor, setIsCapacitor] = useState(false)

  useEffect(() => {
    // Check if running in Capacitor
    setIsCapacitor(!!(window as any).Capacitor)

    // Monitor network status
    const updateNetworkStatus = () => {
      setNetworkStatus({
        online: navigator.onLine,
        connectionType: (navigator as any).connection?.effectiveType || 'unknown'
      })
    }

    window.addEventListener('online', updateNetworkStatus)
    window.addEventListener('offline', updateNetworkStatus)
    updateNetworkStatus()

    return () => {
      window.removeEventListener('online', updateNetworkStatus)
      window.removeEventListener('offline', updateNetworkStatus)
    }
  }, [])

  const handleDeviceInfo = async () => {
    if ((window as any).Capacitor) {
      try {
        const { Device } = await import('@capacitor/device')
        const info = await Device.getInfo()
        alert(`Device: ${info.model}\nPlatform: ${info.platform}\nOS: ${info.operatingSystem}`)
      } catch (error) {
        console.error('Device info error:', error)
        alert('Device info not available in development mode')
      }
    } else {
      alert('Device features only available in mobile app')
    }
  }

  if (!isCapacitor) {
    return null // Only show on mobile app
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Mobile Features
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span>Network Status:</span>
          <Badge variant={networkStatus.online ? "default" : "destructive"} className="flex items-center gap-1">
            {networkStatus.online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {networkStatus.online ? 'Online' : 'Offline'}
          </Badge>
        </div>
        
        {networkStatus.online && (
          <div className="flex items-center justify-between">
            <span>Connection:</span>
            <Badge variant="outline" className="flex items-center gap-1">
              <Signal className="h-3 w-3" />
              {networkStatus.connectionType.toUpperCase()}
            </Badge>
          </div>
        )}

        <Button onClick={handleDeviceInfo} variant="outline" className="w-full">
          Device Information
        </Button>
      </CardContent>
    </Card>
  )
}
