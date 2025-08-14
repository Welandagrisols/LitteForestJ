"use client"

import { useState, useEffect, lazy, Suspense } from "react"
import { LoadingSpinner, DashboardSkeleton } from "@/components/loading-spinner"
// Lazy load components for better performance
const DashboardTab = lazy(() => import("@/components/dashboard-tab").then(m => ({ default: m.DashboardTab })))
const InventoryTab = lazy(() => import("@/components/inventory-tab").then(m => ({ default: m.InventoryTab })))
const SalesTab = lazy(() => import("@/components/sales-tab").then(m => ({ default: m.SalesTab })))
const CustomersTab = lazy(() => import("@/components/customers-tab").then(m => ({ default: m.CustomersTab })))
const TasksTab = lazy(() => import("@/components/tasks-tab").then(m => ({ default: m.TasksTab })))
const ReportsTab = lazy(() => import("@/components/reports-tab").then(m => ({ default: m.ReportsTab })))
const OpsTab = lazy(() => import("@/components/ops-tab").then(m => ({ default: m.OpsTab })))
// Import WebsiteIntegrationTab here
const WebsiteIntegrationTab = lazy(() => import("@/components/website-integration-tab"))


import { Header } from "@/components/header"
import { ErrorBoundary } from "@/components/error-boundary"
import { AuthProvider } from "@/contexts/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { BarChart, Package, ShoppingCart, FileText, Settings, Menu, Users, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


const tabs = [
  { value: "dashboard", label: "Dashboard", icon: BarChart },
  { value: "inventory", label: "Inventory", icon: Package },
  { value: "sales", label: "Sales", icon: ShoppingCart },
  { value: "customers", label: "Customers", icon: Users },
  { value: "tasks", label: "Tasks", icon: FileText },
  { value: "reports", label: "Reports", icon: FileText },
  { value: "website", label: "Website", icon: Globe },
  { value: "ops", label: "Operations", icon: Settings },
]

function AppContent() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [componentError, setComponentError] = useState<string | null>(null)
  const [appReady, setAppReady] = useState(false)
  const isMobile = useIsMobile()

  // Debug logging
  useEffect(() => {
    console.log("AppContent mounted, activeTab:", activeTab)
    
    // Force app to be ready after a short delay
    const readyTimeout = setTimeout(() => {
      setAppReady(true)
      console.log("App forced ready")
    }, 2000)
    
    return () => clearTimeout(readyTimeout)
  }, [])

  useEffect(() => {
    console.log("Active tab changed to:", activeTab)
  }, [activeTab])

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

  const getLoadingComponent = (tab: string) => {
    switch (tab) {
      case "dashboard":
        return <DashboardSkeleton />
      default:
        return <LoadingSpinner />
    }
  }

  const renderTabContent = () => {
    try {
      console.log("Rendering tab content for:", activeTab)
      switch (activeTab) {
        case "dashboard":
          return <DashboardTab />
        case "inventory":
          return <InventoryTab />
        case "sales":
          return <SalesTab />
        case "customers":
          return <CustomersTab />
        case "tasks":
          return <TasksTab />
        case "reports":
          return <ReportsTab />
        case "website":
          return <WebsiteIntegrationTab />
        case "ops":
          return <OpsTab />
        default:
          return <DashboardTab />
      }
    } catch (error) {
      console.error("Error rendering tab content:", error)
      setComponentError(`Error loading ${activeTab} tab: ${error}`)
      return <div className="p-4 text-red-500">Error loading {activeTab} tab. Check console for details.</div>
    }
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        {isMobile ? (
          <div className="flex h-screen bg-background pwa-scroll">
            {/* Mobile Header */}
            <div className="fixed top-0 left-0 right-0 z-40 pwa-header bg-background/98 backdrop-blur-xl supports-[backdrop-filter]:bg-background/95 border-b border-border/50">
              <div className="flex items-center justify-between px-4 py-3">
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="mobile-touch-target mobile-button">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-72 p-0 mobile-card">
                    <div className="flex h-full flex-col">
                      <div className="flex items-center justify-center p-6 border-b border-border/20">
                        <h2 className="mobile-title">
                          <span className="text-orange-500">Little</span>
                          <span className="text-green-600">Forest</span>
                        </h2>
                      </div>
                      <div className="flex-1 overflow-auto p-4 pwa-scroll">
                        <NavigationItems onItemClick={() => setMobileMenuOpen(false)} />
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
                <h1 className="mobile-title truncate">
                  {tabs.find((tab) => tab.value === activeTab)?.label}
                </h1>
                <div className="w-10" /> {/* Spacer */}
              </div>
            </div>

            {/* Mobile Content */}
            <div className="flex-1 pt-16 overflow-auto pwa-content">
              <div className="mobile-content">
                <Header />
                <main className="mt-6 pwa-card-enter">
                  {componentError ? (
                    <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
                      {componentError}
                      <button 
                        onClick={() => setComponentError(null)} 
                        className="ml-2 text-red-500 underline"
                      >
                        Retry
                      </button>
                    </div>
                  ) : (
                    <Suspense fallback={getLoadingComponent(activeTab)}>
                      {renderTabContent()}
                    </Suspense>
                  )}
                </main>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex">
            <Sidebar className="w-64 border-r">
              <SidebarHeader>
                <div className="px-2">
                  <span className="text-lg font-semibold text-orange-500">Little</span>
                  <span className="text-lg font-semibold text-green-600">Forest</span>
                </div>
              </SidebarHeader>
              <SidebarContent className="p-4">
                <NavigationItems />
              </SidebarContent>
            </Sidebar>
            <div className="flex-1">
              <Header />
              <main className="p-6">
                {componentError ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
                    {componentError}
                    <button 
                      onClick={() => setComponentError(null)} 
                      className="ml-2 text-red-500 underline"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <Suspense fallback={getLoadingComponent(activeTab)}>
                    {renderTabContent()}
                  </Suspense>
                )}
              </main>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}

export default function Home() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-4">
              <LoadingSpinner />
              <p className="text-sm text-muted-foreground">Loading LittleForest...</p>
            </div>
          </div>
        }>
          <AuthGuard>
            <SidebarProvider>
              <AppContent />
            </SidebarProvider>
          </AuthGuard>
        </Suspense>
      </AuthProvider>
    </ErrorBoundary>
  )
}