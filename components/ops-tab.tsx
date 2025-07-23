"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { supabase, isDemoMode } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { BulkImportForm } from "./bulk-import-form"
import { BatchStatusManager } from "./batch-status-manager"
import { DemoData } from "./demo-data"
import { Package, FileText, TrendingUp, Database, Upload, Settings, Trash2, Loader2, AlertTriangle } from "lucide-react"

interface InventoryStats {
  totalPlants: number
  currentPlants: number
  futurePlants: number
  totalConsumables: number
  categories: string[]
}

export function OpsTab() {
  const [stats, setStats] = useState<InventoryStats>({
    totalPlants: 0,
    currentPlants: 0,
    futurePlants: 0,
    totalConsumables: 0,
    categories: [],
  })
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)
  const { toast } = useToast()

  const fetchStats = async () => {
    if (isDemoMode) {
      // Use demo data stats
      setStats({
        totalPlants: 63,
        currentPlants: 9,
        futurePlants: 54,
        totalConsumables: 5,
        categories: ["Indigenous Trees", "Fruit Trees", "Ornamental Plants", "Medicinal Plants"],
      })
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data: inventory, error } = await supabase.from("inventory").select("*")

      if (error) throw error

      const plants = inventory?.filter((item) => !item.category?.startsWith("Consumable:")) || []
      const consumables = inventory?.filter((item) => item.category?.startsWith("Consumable:")) || []

      const currentPlants = plants.filter((item) => item.ready_for_sale === true)
      const futurePlants = plants.filter((item) => item.ready_for_sale === false)

      const categories = [...new Set(plants.map((item) => item.category).filter(Boolean))]

      setStats({
        totalPlants: plants.length,
        currentPlants: currentPlants.length,
        futurePlants: futurePlants.length,
        totalConsumables: consumables.length,
        categories,
      })
    } catch (error: any) {
      console.error("Error fetching stats:", error)
      toast({
        title: "Error loading statistics",
        description: error.message || "Failed to load inventory statistics",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClearAllData = async () => {
    if (isDemoMode) {
      toast({
        title: "Demo Mode",
        description: "Cannot clear data in demo mode",
        variant: "destructive",
      })
      return
    }

    setClearing(true)
    try {
      // Clear data in order due to foreign key constraints
      const tables = ["sales", "customers", "inventory", "tasks"]

      for (const table of tables) {
        const { error } = await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000") // Delete all records

        if (error) {
          console.error(`Error clearing ${table}:`, error)
          // Continue with other tables even if one fails
        }
      }

      toast({
        title: "Data cleared successfully",
        description: "All data has been removed from your database",
      })

      // Refresh stats after clearing
      await fetchStats()
    } catch (error: any) {
      console.error("Error clearing data:", error)
      toast({
        title: "Error clearing data",
        description: error.message || "Failed to clear all data",
        variant: "destructive",
      })
    } finally {
      setClearing(false)
    }
  }

  const handleBulkImportSuccess = () => {
    console.log("Bulk import success callback triggered")
    fetchStats()
    toast({
      title: "Import completed",
      description: "Plants have been imported successfully",
    })
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Operations Center</h2>
        <p className="text-muted-foreground">Manage bulk operations, imports, and system settings</p>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-600 rounded-full">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Nursery</p>
                <p className="text-2xl font-bold text-green-600">{loading ? "..." : stats.currentPlants}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-full">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Future Plans</p>
                <p className="text-2xl font-bold text-blue-600">{loading ? "..." : stats.futurePlants}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-600 rounded-full">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Plants</p>
                <p className="text-2xl font-bold text-purple-600">{loading ? "..." : stats.totalPlants}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-600 rounded-full">
                <Database className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold text-orange-600">{loading ? "..." : stats.categories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operations Tabs */}
      <Tabs defaultValue="batch-manager" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="batch-manager" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Batch Manager
          </TabsTrigger>
          <TabsTrigger value="bulk-import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Bulk Import
          </TabsTrigger>
          <TabsTrigger value="demo-data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Demo Data
          </TabsTrigger>
          <TabsTrigger value="data-management" className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Data Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="batch-manager" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Batch Status Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BatchStatusManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk-import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Bulk Plant Import
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BulkImportForm onSuccess={handleBulkImportSuccess} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demo-data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Demo Data Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DemoData onDataChange={fetchStats} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data-management" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Data Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Clear All Data Section */}
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-red-900 mb-2">Danger Zone</h4>
                    <p className="text-sm text-red-700 mb-4">
                      This will permanently delete all data from your nursery management system including:
                    </p>
                    <ul className="text-sm text-red-700 mb-4 list-disc list-inside space-y-1">
                      <li>All inventory items (plants and consumables)</li>
                      <li>All customer records</li>
                      <li>All sales records</li>
                      <li>All task records</li>
                    </ul>
                    <p className="text-sm text-red-700 mb-4 font-medium">
                      This action cannot be undone. Make sure you have exported any data you want to keep.
                    </p>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          disabled={clearing || isDemoMode}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {clearing ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Clearing All Data...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Clear All Data
                            </>
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete all data from your database
                            including:
                            <br />
                            <br />• All inventory items (plants and consumables)
                            <br />• All customer records
                            <br />• All sales records
                            <br />• All task records
                            <br />
                            <br />
                            This is useful when you want to clear test data and start fresh with real nursery data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleClearAllData}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Yes, clear all data
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>

              {/* System Information */}
              <div>
                <h4 className="font-medium mb-3">System Information</h4>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Database:</span>
                    <span className={isDemoMode ? "text-yellow-600" : "text-green-600"}>
                      {isDemoMode ? "Demo Mode" : "Connected"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Total Records:</span>
                    <span className="font-medium">{stats.totalPlants + stats.totalConsumables}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Categories:</span>
                    <span className="font-medium">{stats.categories.length}</span>
                  </div>
                </div>
              </div>

              {isDemoMode && (
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-900 mb-1">Demo Mode Active</h4>
                      <p className="text-sm text-yellow-700">
                        Connect to Supabase to enable full data management features including the ability to clear data.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Status Management</h4>
              <p className="text-sm text-muted-foreground">
                Use the Batch Manager to move plants between "In Nursery" and "Future Plans" status. This affects
                website listing and inventory organization.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Bulk Operations</h4>
              <p className="text-sm text-muted-foreground">
                Import multiple plants at once using the Bulk Import feature. Plants are automatically categorized and
                assigned appropriate statuses.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
