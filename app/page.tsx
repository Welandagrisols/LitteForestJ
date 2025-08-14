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
import { BarChart, Package, ShoppingCart, FileText, Settings, Menu, Users, Monitor, Globe } from "lucide-react"
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
                  <Tabs defaultValue="dashboard" className="w-full">
                    <TabsList className="grid w-full grid-cols-7 lg:grid-cols-7">
                      <TabsTrigger value="dashboard" className="flex items-center gap-2 text-xs lg:text-sm">
                        <BarChart className="h-4 w-4" />
                        <span className="hidden sm:inline">Dashboard</span>
                        <span className="sm:hidden">Dash</span>
                      </TabsTrigger>
                      <TabsTrigger value="inventory" className="flex items-center gap-2 text-xs lg:text-sm">
                        <Package className="h-4 w-4" />
                        <span className="hidden sm:inline">Inventory</span>
                        <span className="sm:hidden">Inv</span>
                      </TabsTrigger>
                      <TabsTrigger value="sales" className="flex items-center gap-2 text-xs lg:text-sm">
                        <ShoppingCart className="h-4 w-4" />
                        <span className="hidden sm:inline">Sales</span>
                        <span className="sm:hidden">Sales</span>
                      </TabsTrigger>
                      <TabsTrigger value="customers" className="flex items-center gap-2 text-xs lg:text-sm">
                        <Users className="h-4 w-4" />
                        <span className="hidden sm:inline">Customers</span>
                        <span className="sm:hidden">Cust</span>
                      </TabsTrigger>
                      <TabsTrigger value="reports" className="flex items-center gap-2 text-xs lg:text-sm">
                        <FileText className="h-4 w-4" />
                        <span className="hidden sm:inline">Reports</span>
                        <span className="sm:hidden">Rep</span>
                      </TabsTrigger>
                      <TabsTrigger value="website" className="flex items-center gap-2 text-xs lg:text-sm">
                        <Globe className="h-4 w-4" />
                        <span className="hidden sm:inline">Website</span>
                        <span className="sm:hidden">Web</span>
                      </TabsTrigger>
                      <TabsTrigger value="ops" className="flex items-center gap-2 text-xs lg:text-sm">
                        <Settings className="h-4 w-4" />
                        <span className="hidden sm:inline">Operations</span>
                        <span className="sm:hidden">Ops</span>
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="dashboard" className="space-y-4">
                      <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                        <DashboardTab />
                      </Suspense>
                    </TabsContent>
                    <TabsContent value="inventory" className="space-y-4">
                      <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                        <InventoryTab />
                      </Suspense>
                    </TabsContent>
                    <TabsContent value="sales" className="space-y-4">
                      <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                        <SalesTab />
                      </Suspense>
                    </TabsContent>
                    <TabsContent value="customers" className="space-y-4">
                      <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                        <CustomersTab />
                      </Suspense>
                    </TabsContent>
                    <TabsContent value="tasks" className="space-y-4">
                      <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                        <TasksTab />
                      </Suspense>
                    </TabsContent>
                    <TabsContent value="reports" className="space-y-4">
                      <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                        <ReportsTab />
                      </Suspense>
                    </TabsContent>
                    <TabsContent value="website" className="space-y-4">
                      <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                        <WebsiteIntegrationTab />
                      </Suspense>
                    </TabsContent>
                    <TabsContent value="ops" className="space-y-4">
                      <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                        <OpsTab />
                      </Suspense>
                    </TabsContent>
                  </Tabs>
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
                <Tabs defaultValue="dashboard" className="w-full">
                  <TabsList className="grid w-full grid-cols-7 lg:grid-cols-7">
                    <TabsTrigger value="dashboard" className="flex items-center gap-2 text-xs lg:text-sm">
                      <BarChart className="h-4 w-4" />
                      <span className="hidden sm:inline">Dashboard</span>
                      <span className="sm:hidden">Dash</span>
                    </TabsTrigger>
                    <TabsTrigger value="inventory" className="flex items-center gap-2 text-xs lg:text-sm">
                      <Package className="h-4 w-4" />
                      <span className="hidden sm:inline">Inventory</span>
                      <span className="sm:hidden">Inv</span>
                    </TabsTrigger>
                    <TabsTrigger value="sales" className="flex items-center gap-2 text-xs lg:text-sm">
                      <ShoppingCart className="h-4 w-4" />
                      <span className="hidden sm:inline">Sales</span>
                      <span className="sm:hidden">Sales</span>
                    </TabsTrigger>
                    <TabsTrigger value="customers" className="flex items-center gap-2 text-xs lg:text-sm">
                      <Users className="h-4 w-4" />
                      <span className="hidden sm:inline">Customers</span>
                      <span className="sm:hidden">Cust</span>
                    </TabsTrigger>
                    <TabsTrigger value="reports" className="flex items-center gap-2 text-xs lg:text-sm">
                      <FileText className="h-4 w-4" />
                      <span className="hidden sm:inline">Reports</span>
                      <span className="sm:hidden">Rep</span>
                    </TabsTrigger>
                    <TabsTrigger value="website" className="flex items-center gap-2 text-xs lg:text-sm">
                      <Globe className="h-4 w-4" />
                      <span className="hidden sm:inline">Website</span>
                      <span className="sm:hidden">Web</span>
                    </TabsTrigger>
                    <TabsTrigger value="ops" className="flex items-center gap-2 text-xs lg:text-sm">
                      <Settings className="h-4 w-4" />
                      <span className="hidden sm:inline">Operations</span>
                      <span className="sm:hidden">Ops</span>
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="dashboard" className="space-y-4">
                    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                      <DashboardTab />
                    </Suspense>
                  </TabsContent>
                  <TabsContent value="inventory" className="space-y-4">
                    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                      <InventoryTab />
                    </Suspense>
                  </TabsContent>
                  <TabsContent value="sales" className="space-y-4">
                    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                      <SalesTab />
                    </Suspense>
                  </TabsContent>
                  <TabsContent value="customers" className="space-y-4">
                    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                      <CustomersTab />
                    </Suspense>
                  </TabsContent>
                  <TabsContent value="tasks" className="space-y-4">
                    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                      <TasksTab />
                    </Suspense>
                  </TabsContent>
                  <TabsContent value="reports" className="space-y-4">
                    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                      <ReportsTab />
                    </Suspense>
                  </TabsContent>
                  <TabsContent value="website" className="space-y-4">
                    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                      <WebsiteIntegrationTab />
                    </Suspense>
                  </TabsContent>
                  <TabsContent value="ops" className="space-y-4">
                    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                      <OpsTab />
                    </Suspense>
                  </TabsContent>
                </Tabs>
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
        <Suspense fallback={<LoadingSpinner />}>
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