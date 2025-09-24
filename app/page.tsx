'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DashboardTab } from '@/components/dashboard-tab'
import { InventoryTab } from '@/components/inventory-tab'
import { SalesTab } from '@/components/sales-tab'
import { CustomersTab } from '@/components/customers-tab'
import { TasksTab } from '@/components/tasks-tab'
import { ReportsTab } from '@/components/reports-tab'
import { WebsiteIntegrationTab } from '@/components/website-integration-tab'
import { AppSidebar } from '@/components/app-sidebar'
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
            {/* Mobile navigation header */}
            <header className="md:hidden border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30">
              <div className="flex h-14 items-center justify-between px-4">
                <div className="flex items-center gap-2">
                  <img 
                    src="/images/littleforest-logo.png" 
                    alt="LittleForest Logo" 
                    className="size-6 rounded object-contain"
                  />
                  <div className="flex flex-col leading-none">
                    <span className="text-sm font-semibold">
                      <span style={{color: '#FF7A29'}}>Little</span>
                      <span style={{color: '#4CB76F'}}>Forest</span>
                    </span>
                  </div>
                </div>
                <SidebarTrigger className="md:hidden" />
              </div>
            </header>
            
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
              </Tabs>
              
              {/* Floating navigation trigger for mobile */}
              <div className="md:hidden fixed bottom-6 right-6 z-50">
                <SidebarTrigger className="h-14 w-14 rounded-full shadow-lg" style={{backgroundColor: '#4CB76F'}}>
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </SidebarTrigger>
              </div>
            </main>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </ErrorBoundary>
  )
}