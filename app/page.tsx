
"use client"

import { useState } from "react"
import { Suspense } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { NotificationProvider } from "@/components/notification-provider"
import { ErrorBoundary } from "@/components/error-boundary"
import { AuthProvider } from "@/contexts/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import { LoadingSpinner } from "@/components/loading-spinner"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardTab } from "@/components/dashboard-tab"
import { InventoryTab } from "@/components/inventory-tab"
import { SalesTab } from "@/components/sales-tab"
import { CustomersTab } from "@/components/customers-tab"
import { TasksTab } from "@/components/tasks-tab"
import { ReportsTab } from "@/components/reports-tab"
import { OpsTab } from "@/components/ops-tab"
import { WebsiteIntegrationTab } from "@/components/website-integration-tab"
import { ThemeToggle } from "@/components/theme-toggle"
import { Separator } from "@/components/ui/separator"

function AppContent() {
  const [activeTab, setActiveTab] = useState("dashboard")

  const renderActiveTab = () => {
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
      case "ops":
        return <OpsTab />
      case "website":
        return <WebsiteIntegrationTab />
      default:
        return <DashboardTab />
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 bg-background border-b">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h1 className="text-lg font-semibold text-foreground">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h1>
          </div>
          <div className="ml-auto flex items-center gap-3 px-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">AS</span>
              </div>
              <span className="text-sm font-semibold text-foreground">Agrisols Systems</span>
            </div>
            <ThemeToggle />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {renderActiveTab()}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function Home() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ErrorBoundary>
        <AuthProvider>
          <NotificationProvider>
            <Suspense fallback={
              <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                  <LoadingSpinner />
                  <p className="text-sm text-muted-foreground">Loading LittleForest...</p>
                </div>
              </div>
            }>
              <AuthGuard>
                <AppContent />
              </AuthGuard>
            </Suspense>
            <Toaster />
          </NotificationProvider>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  )
}
