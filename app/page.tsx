import { Header } from "@/components/header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InventoryTab } from "@/components/inventory-tab"
import { CustomersTab } from "@/components/customers-tab"
import { ReportsTab } from "@/components/reports-tab"
import { DashboardTab } from "@/components/dashboard-tab"
import { OpsTab } from "@/components/ops-tab"
import { ErrorBoundary } from "@/components/error-boundary"
import { SupabaseProvider } from "@/components/supabase-provider"

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto p-4">
        <ErrorBoundary>
          <SupabaseProvider>
            <Tabs defaultValue="dashboard" className="w-full">
              <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border mb-6">
                <TabsList className="grid w-full grid-cols-5 warm-nav shadow-sm">
                  <TabsTrigger
                    value="dashboard"
                    className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md"
                  >
                    Dashboard
                  </TabsTrigger>
                  <TabsTrigger
                    value="inventory"
                    className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md"
                  >
                    Inventory
                  </TabsTrigger>
                  <TabsTrigger
                    value="ops"
                    className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md"
                  >
                    Ops
                  </TabsTrigger>
                  <TabsTrigger
                    value="customers"
                    className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md"
                  >
                    Customers
                  </TabsTrigger>
                  <TabsTrigger
                    value="reports"
                    className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md"
                  >
                    Reports
                  </TabsTrigger>
                </TabsList>
              </div>
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