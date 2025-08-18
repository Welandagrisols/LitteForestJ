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
  LogOut,
  TreePine, // Import TreePine
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils" // Import cn for className merging

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

interface AppSidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function AppSidebar({ activeTab, setActiveTab }: AppSidebarProps) {
  const { signOut, user } = useAuth()
  const { setOpenMobile, isMobile } = useSidebar()

  const handleTabSelect = (tabId: string) => {
    setActiveTab(tabId)
    // Auto-close sidebar on mobile when tab is selected
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <Sidebar>
      <SidebarHeader className="p-4 sticky top-0 bg-background border-b z-10">
        {/* Updated Header Content */}
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg" style={{backgroundColor: '#4CB76F'}}>
            <TreePine className="size-4 text-white" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-semibold">
              <span style={{color: '#FF7A29'}}>Little</span>
              <span style={{color: '#4CB76F'}}>Forest</span>
            </span>
            <span className="text-xs" style={{color: '#333333'}}>Farm Management</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => handleTabSelect(item.id)}
                    isActive={activeTab === item.id}
                    className={cn(
                      "transition-all duration-200 rounded-lg group",
                      activeTab === item.id 
                        ? "text-white shadow-sm" 
                        : "hover:bg-accent"
                    )}
                    style={activeTab === item.id ? {backgroundColor: '#4CB76F'} : {}}
                  >
                    <item.icon 
                      className="mr-2 h-4 w-4 transition-colors duration-200"
                      style={
                        activeTab === item.id 
                          ? {color: 'white'} 
                          : {color: '#4CB76F'}
                      }
                      onMouseEnter={(e) => {
                        if (activeTab !== item.id) {
                          e.currentTarget.style.color = '#FF7A29';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (activeTab !== item.id) {
                          e.currentTarget.style.color = '#4CB76F';
                        }
                      }}
                    />
                    <span 
                      style={
                        activeTab === item.id 
                          ? {color: 'white'} 
                          : {color: '#333333'}
                      }
                    >
                      {item.title}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 sticky bottom-0 bg-background border-t mt-auto">
        <div className="space-y-2">
          {user && (
            <div className="text-xs text-muted-foreground">
              {user.email}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={signOut}
            className="w-full justify-start"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}