"use client"

import { Header } from "@/components/header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardTab } from "@/components/dashboard-tab"
import { InventoryTab } from "@/components/inventory-tab"
import { SalesTab } from "@/components/sales-tab"
import { OpsTab } from "@/components/ops-tab"
import { CustomersTab } from "@/components/customers-tab"
import { ReportsTab } from "@/components/reports-tab"
import { SupabaseProvider } from "@/components/supabase-provider"
import { ErrorBoundary } from "@/components/error-boundary"
import { useIsMobile } from "@/hooks/use-mobile"
import { BarChart3, Package, ShoppingCart, Users, FileText, Wrench } from "lucide-react"

export default function HomePage() {
  const isMobile = useIsMobile()

  const tabs = [
    { value: "dashboard", label: "Dashboard", icon: BarChart3 },
    { value: "inventory", label: "Inventory", icon: Package },
    { value: "ops", label: "Operations", icon: Wrench },
    { value: "customers", label: "Customers", icon: Users },
    { value: "reports", label: "Reports", icon: FileText },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className={`container mx-auto px-4 ${isMobile ? 'pb-20' : 'py-6'}`}>
        <ErrorBoundary>
          <SupabaseProvider>
            <Tabs defaultValue="dashboard" className="w-full">
              {/* Desktop Navigation */}
              {!isMobile && (
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                  <TabsList className="grid w-full max-w-md grid-cols-5 lg:grid-cols-5">
                    {tabs.map((tab) => (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md"
                      >
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
              )}

              {/* Mobile Bottom Navigation */}
              {isMobile && (
                <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
                  <TabsList className="grid w-full grid-cols-5 h-16 bg-background rounded-none">
                    {tabs.map((tab) => {
                      const Icon = tab.icon
                      return (
                        <TabsTrigger
                          key={tab.value}
                          value={tab.value}
                          className="flex flex-col items-center justify-center gap-1 h-full data-[state=active]:bg-primary data-[state=active]:text-white text-xs"
                        >
                          <Icon className="h-4 w-4" />
                          <span className="text-[10px]">{tab.label}</span>
                        </TabsTrigger>
                      )
                    })}
                  </TabsList>
                </div>
              )}

              <TabsContent value="dashboard">
                <DashboardTab />
              </TabsContent>
              <TabsContent value="inventory">
                <InventoryTab />
              </TabsContent>
              <TabsContent value="ops">
                <OpsTab />
              </TabsContent>
              <TabsContent value="customers">
                <CustomersTab />
              </TabsContent>
              <TabsContent value="reports">
                <ReportsTab />
              </TabsContent>
            </Tabs>
          </SupabaseProvider>
        </ErrorBoundary>
      </main>
    </div>
  )
}