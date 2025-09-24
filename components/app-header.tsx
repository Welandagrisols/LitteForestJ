
"use client"

import * as React from "react"
import {
  BarChart3,
  Package,
  ShoppingCart,
  Users,
  CheckSquare,
  FileText,
  Settings,
  Globe,
  Menu,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

const navigationItems = [
  { id: "dashboard", title: "Dashboard", icon: BarChart3 },
  { id: "inventory", title: "Inventory", icon: Package },
  { id: "sales", title: "Sales", icon: ShoppingCart },
  { id: "customers", title: "Customers", icon: Users },
  { id: "tasks", title: "Tasks", icon: CheckSquare },
  { id: "reports", title: "Reports", icon: FileText },
  { id: "website", title: "Website", icon: Globe },
  { id: "ops", title: "Operations", icon: Settings },
]

interface AppHeaderProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function AppHeader({ activeTab, setActiveTab }: AppHeaderProps) {
  const { toggleSidebar, isMobile } = useSidebar()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4">
        {/* Logo and Menu Button */}
        <div className="flex items-center gap-2 mr-6">
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

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 flex-1 overflow-x-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon
            return (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md transition-all whitespace-nowrap",
                  "hover:bg-accent hover:text-accent-foreground",
                  activeTab === item.id 
                    ? "text-white shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                style={activeTab === item.id ? {backgroundColor: '#4CB76F'} : {}}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.title}</span>
              </Button>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
