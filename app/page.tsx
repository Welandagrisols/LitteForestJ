import { Header } from "@/components/header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InventoryTab } from "@/components/inventory-tab"
import { SalesTab } from "@/components/sales-tab"
import { CustomersTab } from "@/components/customers-tab"
import { TasksTab } from "@/components/tasks-tab"
import { ReportsTab } from "@/components/reports-tab"
import { DashboardTab } from "@/components/dashboard-tab"

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto p-4">
        <ErrorBoundary>
          <SupabaseProvider>
            <Tabs defaultValue="dashboard" className="w-full">
              <TabsList className="grid w-full grid-cols-6 mb-6 warm-nav">
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
                  value="sales"
                  className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  Sales
                </TabsTrigger>
                <TabsTrigger
                  value="customers"
                  className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  Customers
                </TabsTrigger>
                <TabsTrigger
                  value="tasks"
                  className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  Tasks
                </TabsTrigger>
                <TabsTrigger
                  value="reports"
                  className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md"
                >
                  Reports
                </TabsTrigger>
              </TabsList>
              <TabsContent value="dashboard">
                <DashboardTab />
              </TabsContent>
              <TabsContent value="inventory">
                <InventoryTab />
              </TabsContent>
              <TabsContent value="sales">
                <SalesTab />
              </TabsContent>
              <TabsContent value="customers">
                <CustomersTab />
              </TabsContent>
              <TabsContent value="tasks">
                <TasksTab />
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