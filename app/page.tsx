'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DashboardTab } from '@/components/dashboard-tab'
import { InventoryTab } from '@/components/inventory-tab-simple'
import { SalesTab } from '@/components/sales-tab'
import { CustomersTab } from '@/components/customers-tab'
import { TasksTab } from '@/components/tasks-tab'
import { ReportsTab } from '@/components/reports-tab'
import { WebsiteIntegrationTab } from '@/components/website-integration-tab'
import { OpsTab } from '@/components/ops-tab'
import { AppSidebar } from '@/components/app-sidebar'
import { AppHeader } from '@/components/app-header'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { DemoModeBanner } from '@/components/demo-mode-banner'
// Header removed for mobile-first sidebar-only design
import { ErrorBoundary } from '@/components/error-boundary'
import { supabase, isDemoMode } from '@/lib/supabase'

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-background">
        <SidebarProvider>
          <AppSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
          <SidebarInset className="flex-1">
            {/* Top Navigation Header */}
            <AppHeader activeTab={activeTab} setActiveTab={setActiveTab} />
            
            <main className="flex-1 overflow-auto p-4 md:p-6">
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
                
                <TabsContent value="customers" className="mt-0">
                  <CustomersTab />
                </TabsContent>
                
                <TabsContent value="tasks" className="mt-0">
                  <TasksTab />
                </TabsContent>
                
                <TabsContent value="reports" className="mt-0">
                  <ReportsTab />
                </TabsContent>
                
                <TabsContent value="website" className="mt-0">
                  <WebsiteIntegrationTab />
                </TabsContent>
                
                <TabsContent value="ops" className="mt-0">
                  <OpsTab />
                </TabsContent>
              </Tabs>
              
              
            </main>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </ErrorBoundary>
  )
}