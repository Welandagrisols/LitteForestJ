"use client"

import { useState, useEffect } from "react"
import { supabase, isDemoMode, checkTableExists } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, ShoppingCart } from "lucide-react"
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

  // Dummy data for increases, replace with actual calculations
  const inventoryIncrease = 10;
  const salesIncrease = 5;
  const customerIncrease = 7;
  const totals = {
    inventory: inventorySummary.totalItems,
    monthSales: salesSummary.totalAmount,
    customers: 100, // Replace with actual customer data
    pendingTasks: 5, // Replace with actual task data
  }

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

      inventoryData?.forEach((item: any) => {
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

      salesData?.forEach((sale: any) => {
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
    <div className="space-y-6 p-4 lg:p-8">
      {(isDemoMode || tablesNotExist) && <DemoModeBanner isDemoMode={isDemoMode} connectionStatus={isDemoMode ? 'demo' : 'connecting'} />}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="modern-card card-plants">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="card-title">
              <Package className="card-icon" />
              Total Plants
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="card-value">{inventorySummary.totalItems}</div>
            <div className="card-description">Plant varieties</div>
          </CardContent>
        </Card>

        <Card className="modern-card card-purple">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="card-title">
              <Package className="card-icon" />
              Total Seedlings
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="card-value">{inventorySummary.totalQuantity.toLocaleString()}</div>
            <div className="card-description">Available stock</div>
          </CardContent>
        </Card>

        <Card className="modern-card card-blue">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="card-title">
              <ShoppingCart className="card-icon" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="card-value">Ksh {salesSummary.totalAmount.toLocaleString()}</div>
            <div className="card-description">All time sales</div>
          </CardContent>
        </Card>

        <Card className="modern-card card-orange">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="card-title">
              <ShoppingCart className="card-icon" />
              Today's Sales
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="card-value">{salesSummary.todaySales}</div>
            <div className="card-description">Sales today</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
        {/* Recent Sales */}
        <Card>
          <CardHeader className="px-4 py-4">
            <CardTitle className="text-lg font-semibold text-orange-600">Recent Sales</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : recentSales.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No recent sales</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-sm font-medium px-4 py-3">Date</TableHead>
                      <TableHead className="text-sm font-medium px-4 py-3">Plant</TableHead>
                      <TableHead className="text-sm font-medium px-4 py-3">Qty</TableHead>
                      <TableHead className="text-sm font-medium px-4 py-3">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="text-sm px-4 py-3">{new Date(sale.sale_date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-sm px-4 py-3">{sale.inventory?.plant_name || "Unknown"}</TableCell>
                        <TableCell className="text-sm px-4 py-3">{sale.quantity}</TableCell>
                        <TableCell className="text-sm px-4 py-3">Ksh {sale.total_amount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Items */}
        <Card>
          <CardHeader className="px-4 py-4">
            <CardTitle className="text-lg font-semibold text-orange-600">Low Stock Items</CardTitle>
            <CardDescription>Items that need restocking</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : lowStockItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No low stock items</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-sm font-medium px-4 py-3">Plant</TableHead>
                      <TableHead className="text-sm font-medium px-4 py-3">Quantity</TableHead>
                      <TableHead className="text-sm font-medium px-4 py-3">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-sm px-4 py-3">{item.plant_name}</TableCell>
                        <TableCell className="text-sm px-4 py-3">{item.quantity}</TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge variant="outline">Low Stock</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}