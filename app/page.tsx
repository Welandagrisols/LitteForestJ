
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

export default function Home() {
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

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        
        {/* Mobile Header with Menu Button */}
        <div className="sticky top-16 z-40 bg-background border-b px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold capitalize">{activeTab}</h1>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="flex flex-col h-full">
                <div className="p-6 border-b">
                  <h2 className="text-lg font-semibold">Navigation</h2>
                </div>
                <div className="flex-1 p-4">
                  <NavigationItems onItemClick={() => setMobileMenuOpen(false)} />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <main className="px-4 py-6 pb-20">
          <ErrorBoundary>
            <SupabaseProvider>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsContent value="dashboard" className="mt-0">
                  <DashboardTab />
                </TabsContent>
                <TabsContent value="inventory" className="mt-0">
                  <InventoryTab />
                </TabsContent>
                <TabsContent value="sales" className="mt-0">
                  <SalesTab />
                </TabsContent>
                <TabsContent value="reports" className="mt-0">
                  <ReportsTab />
                </TabsContent>
                <TabsContent value="ops" className="mt-0">
                  <OpsTab />
                </TabsContent>
              </Tabs>
            </SupabaseProvider>
          </ErrorBoundary>
        </main>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar className="border-r">
          <SidebarHeader className="p-6 border-b">
            <h2 className="text-xl font-semibold text-primary">Farm Management</h2>
          </SidebarHeader>
          <SidebarContent className="p-4">
            <NavigationItems />
          </SidebarContent>
        </Sidebar>
        
        <SidebarInset className="flex-1">
          <Header />
          
          <main className="flex-1 p-6">
            <ErrorBoundary>
              <SupabaseProvider>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsContent value="dashboard" className="mt-0">
                    <DashboardTab />
                  </TabsContent>
                  <TabsContent value="inventory" className="mt-0">
                    <InventoryTab />
                  </TabsContent>
                  <TabsContent value="sales" className="mt-0">
                    <SalesTab />
                  </TabsContent>
                  <TabsContent value="reports" className="mt-0">
                    <ReportsTab />
                  </TabsContent>
                  <TabsContent value="ops" className="mt-0">
                    <OpsTab />
                  </TabsContent>
                </Tabs>
              </SupabaseProvider>
            </ErrorBoundary>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
