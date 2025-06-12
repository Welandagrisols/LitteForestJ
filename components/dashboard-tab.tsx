"use client"

import { useState, useEffect } from "react"
import { supabase, isDemoMode, checkTableExists } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertCircle } from "lucide-react"
import { demoInventory, demoSales } from "@/components/demo-data"
import { DemoModeBanner } from "@/components/demo-mode-banner"

export function DashboardTab() {
  const [inventorySummary, setInventorySummary] = useState({
    totalItems: 0,
    totalQuantity: 0,
    lowStock: 0,
  })
  const [salesSummary, setSalesSummary] = useState({
    totalSales: 0,
    totalAmount: 0,
    todaySales: 0,
  })
  const [recentSales, setRecentSales] = useState<any[]>([])
  const [lowStockItems, setLowStockItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tablesExist, setTablesExist] = useState({
    inventory: true,
    sales: true,
  })
  const { toast } = useToast()

  useEffect(() => {
    async function init() {
      if (isDemoMode) {
        loadDemoData()
        return
      }

      // Check if tables exist
      const inventoryExists = await checkTableExists("inventory")
      const salesExists = await checkTableExists("sales")

      setTablesExist({
        inventory: inventoryExists,
        sales: salesExists,
      })

      if (!inventoryExists || !salesExists) {
        loadDemoData()
        return
      }

      // If tables exist, fetch data
      fetchDashboardData().catch((error) => {
        console.log("Falling back to demo mode due to:", error.message)
        loadDemoData()
      })
    }

    init()
  }, [])

  function loadDemoData() {
    try {
      setLoading(true)

      // Calculate inventory metrics from demo data
      const totalItems = demoInventory.length
      let totalQuantity = 0
      let lowStock = 0
      const lowStockThreshold = 20
      const lowStockItemsList: any[] = []

      demoInventory.forEach((item) => {
        totalQuantity += item.quantity
        if (item.quantity < lowStockThreshold) {
          lowStock++
          lowStockItemsList.push(item)
        }
      })

      setInventorySummary({
        totalItems,
        totalQuantity,
        lowStock,
      })

      setLowStockItems(lowStockItemsList)

      // Calculate sales metrics from demo data
      const totalSalesCount = demoSales.length
      let totalAmount = 0
      let todaySalesCount = 0
      const today = new Date().toISOString().split("T")[0]

      demoSales.forEach((sale) => {
        totalAmount += sale.total_amount
        if (sale.sale_date === today) {
          todaySalesCount++
        }
      })

      setSalesSummary({
        totalSales: totalSalesCount,
        totalAmount,
        todaySales: todaySalesCount,
      })

      setRecentSales(demoSales)
    } catch (error: any) {
      console.error("Demo data load error:", error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchDashboardData() {
    try {
      setLoading(true)

      // Fetch inventory summary
      const { data: inventoryData, error: inventoryError } = await supabase.from("inventory").select("*")

      if (inventoryError) {
        console.error("Inventory fetch error:", inventoryError)
        throw inventoryError
      }

      // Calculate inventory metrics
      const totalItems = inventoryData?.length || 0
      let totalQuantity = 0
      let lowStock = 0
      const lowStockThreshold = 10
      const lowStockItemsList: any[] = []

      inventoryData?.forEach((item) => {
        totalQuantity += item.quantity
        if (item.quantity < lowStockThreshold) {
          lowStock++
          lowStockItemsList.push(item)
        }
      })

      setInventorySummary({
        totalItems,
        totalQuantity,
        lowStock,
      })

      setLowStockItems(lowStockItemsList)

      // Fetch sales summary
      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .select(`
          *,
          inventory:inventory_id (plant_name)
        `)
        .order("sale_date", { ascending: false })

      if (salesError) {
        console.error("Sales fetch error:", salesError)
        throw salesError
      }

      // Calculate sales metrics
      const totalSalesCount = salesData?.length || 0
      let totalAmount = 0
      let todaySalesCount = 0
      const today = new Date().toISOString().split("T")[0]

      salesData?.forEach((sale) => {
        totalAmount += sale.total_amount
        if (sale.sale_date.startsWith(today)) {
          todaySalesCount++
        }
      })

      setSalesSummary({
        totalSales: totalSalesCount,
        totalAmount,
        todaySales: todaySalesCount,
      })

      // Set recent sales
      setRecentSales(salesData?.slice(0, 5) || [])
    } catch (error: any) {
      console.error("Dashboard data fetch error:", error)
      throw error // Re-throw to trigger demo mode
    } finally {
      setLoading(false)
    }
  }

  const tablesNotExist = !tablesExist.inventory || !tablesExist.sales

  return (
    <div className="space-y-6">
      {(isDemoMode || tablesNotExist) && <DemoModeBanner isDemoMode={isDemoMode} tablesNotFound={tablesNotExist} />}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="warm-card hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Plants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{inventorySummary.totalItems}</div>
          </CardContent>
        </Card>
        <Card className="warm-card hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Seedlings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{inventorySummary.totalQuantity}</div>
          </CardContent>
        </Card>
        <Card className="warm-card hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">Ksh {salesSummary.totalAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="warm-card hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{salesSummary.todaySales}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Sales */}
        <Card className="warm-card">
          <CardHeader className="sage-header border-b border-border">
            <CardTitle className="text-lg">Recent Sales</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : recentSales.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">No recent sales</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="sage-header hover:bg-muted/50">
                    <TableHead>Date</TableHead>
                    <TableHead>Plant</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSales.map((sale) => (
                    <TableRow key={sale.id} className="hover:bg-muted/50">
                      <TableCell>{new Date(sale.sale_date).toLocaleDateString()}</TableCell>
                      <TableCell>{sale.inventory?.plant_name || "Unknown"}</TableCell>
                      <TableCell>{sale.quantity}</TableCell>
                      <TableCell>Ksh {sale.total_amount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Items */}
        <Card className="warm-card">
          <CardHeader className="sage-header border-b border-border">
            <CardTitle className="text-lg">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : lowStockItems.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">No low stock items</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="sage-header hover:bg-muted/50">
                    <TableHead>Plant</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell>{item.plant_name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Low Stock
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
