"use client"

import { useState, useEffect } from "react"
import { Suspense } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { NotificationProvider } from "@/components/notification-provider"
import { ErrorBoundary } from "@/components/error-boundary"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useIsMobile } from "@/hooks/use-mobile"
import { Header } from "@/components/header"
import { DashboardTab } from "@/components/dashboard-tab"
import { InventoryTab } from "@/components/inventory-tab"
import { SalesTab } from "@/components/sales-tab"
import { CustomersTab } from "@/components/customers-tab"
import { TasksTab } from "@/components/tasks-tab"
import { ReportsTab } from "@/components/reports-tab"
import { OpsTab } from "@/components/ops-tab"
import { WebsiteIntegrationTab } from "@/components/website-integration-tab"
import { NotificationSettings } from "@/components/notification-settings"
import { DemoModeBanner } from "@/components/demo-mode-banner"

function AppContent() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    console.log("App loaded successfully, activeTab:", activeTab)
  }, [])

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
      case "notifications":
        return <NotificationSettings />
      default:
        return <DashboardTab />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DemoModeBanner />
      <Header 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />
      <main className="container mx-auto px-4 py-6">
        {renderActiveTab()}
      </main>
    </div>
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
        <NotificationProvider>
          <SidebarProvider>
            <Suspense fallback={
              <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                  <LoadingSpinner />
                  <p className="text-sm text-muted-foreground">Loading LittleForest...</p>
                </div>
              </div>
            }>
              <AppContent />
            </Suspense>
            <Toaster />
          </SidebarProvider>
        </NotificationProvider>
      </ErrorBoundary>
    </ThemeProvider>
  )
}