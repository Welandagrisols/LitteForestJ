"use client"

import { useState, useEffect } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClearDataButton } from "@/components/clear-data-button"
import { SalesTab } from "./sales-tab"
import { TasksTab } from "./tasks-tab"

export function OpsTab() {
  const isMobile = useIsMobile()
  
  const refreshAllData = () => {
    // This will trigger a page refresh to reload all data
    window.location.reload()
  }

  return (
    <div className="space-y-6">
      {/* Data Management Section */}
      <Card className="rounded-2xl shadow-md">
        <CardHeader className="bg-muted/50">
          <CardTitle className="text-lg font-semibold">Data Management</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col space-y-4">
            <div>
              <h3 className="font-medium mb-2">Database Operations</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Use this to clear all data and start fresh with your real nursery data.
              </p>
              <ClearDataButton onDataCleared={refreshAllData} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger
            value="sales"
            className="data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            Sales
          </TabsTrigger>
          <TabsTrigger
            value="tasks"
            className="data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            Tasks
          </TabsTrigger>
        </TabsList>
        <TabsContent value="sales">
          <SalesTab />
        </TabsContent>
        <TabsContent value="tasks">
          <TasksTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
