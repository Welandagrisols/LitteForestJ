
"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardTab } from "@/components/dashboard-tab"
import { InventoryTab } from "@/components/inventory-tab"
import { SalesTab } from "@/components/sales-tab"
import { ReportsTab } from "@/components/reports-tab"
import { OpsTab } from "@/components/ops-tab"
import { Header } from "@/components/header"
import { ErrorBoundary } from "@/components/error-boundary"
import { SupabaseProvider } from "@/components/supabase-provider"
import { useIsMobile } from "@/hooks/use-mobile"
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset
} from "@/components/ui/sidebar"
import { 
  BarChart3, 
  Package, 
  ShoppingCart, 
  FileText, 
  Settings,
  Menu
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const tabs = [
  { value: "dashboard", label: "Dashboard", icon: BarChart3 },
  { value: "inventory", label: "Inventory", icon: Package },
  { value: "sales", label: "Sales", icon: ShoppingCart },
  { value: "reports", label: "Reports", icon: FileText },
  { value: "ops", label: "Operations", icon: Settings },
]

function AppContent() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isMobile = useIsMobile()

  const NavigationItems = ({ onItemClick }: { onItemClick?: () => void }) => (
    <SidebarMenu className="space-y-2">
      {tabs.map((tab) => {
        const Icon = tab.icon
        return (
          <SidebarMenuItem key={tab.value}>
            <SidebarMenuButton
              onClick={() => {
                setActiveTab(tab.value)
                onItemClick?.()
              }}
              isActive={activeTab === tab.value}
              className="w-full justify-start px-4 py-3 text-base font-medium rounded-xl transition-all duration-200 hover:bg-primary/10 data-[active=true]:bg-primary data-[active=true]:text-white"
            >
              <Icon className="h-5 w-5 mr-3" />
              {tab.label}
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardTab />
      case "inventory":
        return <InventoryTab />
      case "sales":
        return <SalesTab />
      case "reports":
        return <ReportsTab />
      case "ops":
        return <OpsTab />
      default:
        return <DashboardTab />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {isMobile ? (
        <div className="min-h-screen">
          <Header />
          <div className="flex items-center justify-between p-4 border-b">
            <h1 className="text-lg font-semibold">
              {tabs.find(tab => tab.value === activeTab)?.label}
            </h1>
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="p-4">
                  <h2 className="text-lg font-semibold mb-4">Menu</h2>
                  <NavigationItems onItemClick={() => setMobileMenuOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <main className="p-4">
            <ErrorBoundary>
              {renderTabContent()}
            </ErrorBoundary>
          </main>
        </div>
      ) : (
        <div className="flex">
          <Sidebar className="w-64 border-r">
            <SidebarHeader className="p-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-primary rounded-lg"></div>
                <span className="text-lg font-semibold">LittleForest</span>
              </div>
            </SidebarHeader>
            <SidebarContent className="p-4">
              <NavigationItems />
            </SidebarContent>
          </Sidebar>
          <div className="flex-1">
            <Header />
            <main className="p-6">
              <ErrorBoundary>
                {renderTabContent()}
              </ErrorBoundary>
            </main>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Home() {
  return (
    <SupabaseProvider>
      <SidebarProvider>
        <AppContent />
      </SidebarProvider>
    </SupabaseProvider>
  )
}
