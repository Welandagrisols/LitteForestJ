
"use client"

import * as React from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"

interface AppHeaderProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function AppHeader({ activeTab, setActiveTab }: AppHeaderProps) {
  const { toggleSidebar } = useSidebar()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4">
        {/* Logo and Menu Button */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <img 
            src="/images/littleforest-logo.png" 
            alt="LittleForest Logo" 
            className="size-8 rounded-lg object-contain"
          />
          <div className="flex flex-col leading-none">
            <span className="font-semibold">
              <span style={{color: '#FF7A29'}}>Little</span>
              <span style={{color: '#4CB76F'}}>Forest</span>
            </span>
            <span className="text-xs hidden sm:block" style={{color: '#4CB76F'}}>Agrisols Systems</span>
          </div>
        </div>
      </div>
    </header>
  )
}
