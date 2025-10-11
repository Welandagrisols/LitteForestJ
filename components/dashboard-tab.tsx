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
    <div className="space-y-6 p-4 lg:p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
      {(isDemoMode || tablesNotExist) && <DemoModeBanner isDemoMode={isDemoMode} connectionStatus={isDemoMode ? 'demo' : 'connecting'} />}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="px-4 pt-3 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Plants</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-1">
            <div className="text-2xl sm:text-3xl font-bold">{inventorySummary.totalItems}</div>
            <p className="text-xs text-muted-foreground mt-1">Active inventory items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-4 pt-3 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Seedlings</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-1">
            <div className="text-2xl sm:text-3xl font-bold">{inventorySummary.totalQuantity.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Plants in stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-4 pt-3 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-1">
            <div className="text-2xl sm:text-3xl font-bold">Ksh {salesSummary.totalAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">All time revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-4 pt-3 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Sales</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-1">
            <div className="text-2xl sm:text-3xl font-bold">{salesSummary.todaySales}</div>
            <p className="text-xs text-muted-foreground mt-1">Sales today</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
        {/* Recent Sales */}
        <Card className="border border-slate-700/50 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-lg shadow-2xl shadow-black/20 overflow-hidden hover:shadow-3xl transition-all duration-300 hover:border-orange-500/30">
          <CardHeader className="px-6 py-5 bg-gradient-to-r from-orange-900/30 to-amber-900/30 border-b border-orange-500/20">
            <CardTitle className="text-xl font-bold text-orange-400 flex items-center gap-3">
              <ShoppingCart className="h-6 w-6 drop-shadow-lg" />
              Recent Sales
            </CardTitle>
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
                    <TableRow style={{ background: 'rgba(30, 41, 59, 0.8)', color: '#e2e8f0' }}>
                      <TableHead className="text-sm font-bold px-4 py-4 text-slate-300">Date</TableHead>
                      <TableHead className="text-sm font-bold px-4 py-4 text-slate-300">Plant</TableHead>
                      <TableHead className="text-sm font-bold px-4 py-4 text-slate-300">Qty</TableHead>
                      <TableHead className="text-sm font-bold px-4 py-4 text-slate-300">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentSales.map((sale) => (
                      <TableRow key={sale.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="text-sm px-4 py-4 text-slate-300 font-medium">{new Date(sale.sale_date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-sm px-4 py-4 font-bold text-white">{sale.inventory?.plant_name || "Unknown"}</TableCell>
                        <TableCell className="text-sm px-4 py-4 text-slate-300 font-medium">{sale.quantity}</TableCell>
                        <TableCell className="text-sm px-4 py-4 font-bold text-green-400">Ksh {sale.total_amount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Items */}
        <Card className="border border-slate-700/50 bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-lg shadow-2xl shadow-black/20 overflow-hidden hover:shadow-3xl transition-all duration-300 hover:border-red-500/30">
          <CardHeader className="px-6 py-5 bg-gradient-to-r from-red-900/30 to-pink-900/30 border-b border-red-500/20">
            <CardTitle className="text-xl font-bold text-red-400 flex items-center gap-3">
              <AlertCircle className="h-6 w-6 drop-shadow-lg" />
              Low Stock Items
            </CardTitle>
            <CardDescription className="text-red-300 font-semibold">
              Items that need restocking
            </CardDescription>
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
                    <TableRow style={{ background: 'rgba(30, 41, 59, 0.8)', color: '#e2e8f0' }}>
                      <TableHead className="text-sm font-bold px-4 py-4 text-slate-300">Plant</TableHead>
                      <TableHead className="text-sm font-bold px-4 py-4 text-slate-300">Quantity</TableHead>
                      <TableHead className="text-sm font-bold px-4 py-4 text-slate-300">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockItems.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="text-sm px-4 py-4 font-bold text-white">{item.plant_name}</TableCell>
                        <TableCell className="text-sm px-4 py-4 text-slate-300 font-medium">{item.quantity}</TableCell>
                        <TableCell className="px-4 py-4">
                          <Badge variant="outline" className="bg-red-900/30 text-red-400 border-red-500/40 text-sm font-bold">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Low Stock
                          </Badge>
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