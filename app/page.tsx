"use client"

import { useState, lazy, Suspense } from "react"
import { LoadingSpinner, DashboardSkeleton } from "@/components/loading-spinner"
// Lazy load components for better performance
const DashboardTab = lazy(() => import("@/components/dashboard-tab").then(m => ({ default: m.DashboardTab })))
const InventoryTab = lazy(() => import("@/components/inventory-tab").then(m => ({ default: m.InventoryTab })))
const SalesTab = lazy(() => import("@/components/sales-tab").then(m => ({ default: m.SalesTab })))
const CustomersTab = lazy(() => import("@/components/customers-tab").then(m => ({ default: m.CustomersTab })))
const TasksTab = lazy(() => import("@/components/tasks-tab").then(m => ({ default: m.TasksTab })))
const ReportsTab = lazy(() => import("@/components/reports-tab").then(m => ({ default: m.ReportsTab })))
const OpsTab = lazy(() => import("@/components/ops-tab").then(m => ({ default: m.OpsTab })))
const WebsiteIntegrationTab = lazy(() => import("@/components/website-integration-tab").then(m => ({ default: m.WebsiteIntegrationTab })))
import { Header } from "@/components/header"
import { ErrorBoundary } from "@/components/error-boundary"
import { SupabaseProvider } from "@/components/supabase-provider"
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
import { BarChart3, Package, ShoppingCart, FileText, Settings, Globe, Menu, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"


const tabs = [
  { value: "dashboard", label: "Dashboard", icon: BarChart3 },
  { value: "inventory", label: "Inventory", icon: Package },
  { value: "sales", label: "Sales", icon: ShoppingCart },
  { value: "customers", label: "Customers", icon: Users },
  { value: "tasks", label: "Tasks", icon: Users },
  { value: "reports", label: "Reports", icon: FileText },
  { value: "website", label: "Website", icon: Globe },
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
    const getLoadingComponent = (tab: string) => {
      switch (tab) {
        case "dashboard":
          return <DashboardSkeleton />
        default:
          return <LoadingSpinner />
      }
    }

    const content = (() => {
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
    })()

    return (
      <Suspense fallback={getLoadingComponent(activeTab)}>
        {content}
      </Suspense>
    )
  }

  return (
    <ErrorBoundary>
      <SupabaseProvider>
        <div className="min-h-screen bg-background">
          {isMobile ? (
            <div className="flex h-screen bg-background">
              {/* Mobile Header */}
              <div className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
                <div className="flex items-center justify-between px-4 py-3">
                  <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon" className="mobile-touch-target">
                        <Menu className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-72 p-0">
                      <div className="flex h-full flex-col">
                        <div className="flex items-center justify-center p-6 border-b">
                          <h2 className="text-xl font-bold">
                            <span className="text-orange-500">Little</span>
                            <span className="text-green-600">Forest</span>
                          </h2>
                        </div>
                        <div className="flex-1 overflow-auto p-4">
                          <NavigationItems onItemClick={() => setMobileMenuOpen(false)} />
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                  <h1 className="text-lg font-semibold truncate">
                    {tabs.find((tab) => tab.value === activeTab)?.label}
                  </h1>
                  <div className="w-10" /> {/* Spacer */}
                </div>
              </div>

              {/* Mobile Content */}
              <div className="flex-1 pt-16 overflow-auto">
                <div className="mobile-content">
                  <Header />
                  <main className="mt-6">{renderTabContent()}</main>
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
                  <ErrorBoundary>{renderTabContent()}</ErrorBoundary>
                </main>
              </div>
            </div>
          )}
        </div>
      </SupabaseProvider>
    </ErrorBoundary>
  )
}

export default function Home() {
  return (
    <ErrorBoundary>
      <SupabaseProvider>
        <AuthProvider>
          <Suspense fallback={<LoadingSpinner />}>
            <AuthGuard>
              <SidebarProvider>
                <AppContent />
              </SidebarProvider>
            </AuthGuard>
          </Suspense>
        </AuthProvider>
      </SupabaseProvider>
    </ErrorBoundary>
  )
}