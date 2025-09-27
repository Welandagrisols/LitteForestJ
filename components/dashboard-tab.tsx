"use client"

import { useState, useEffect } from "react"
import { supabase, isDemoMode, checkTableExists } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Package, ShoppingCart, Users, CheckSquare } from "lucide-react"
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
    <div className="space-y-6 p-4 lg:p-8 bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen">
      {(isDemoMode || tablesNotExist) && <DemoModeBanner isDemoMode={isDemoMode} connectionStatus={isDemoMode ? 'demo' : 'connecting'} />}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="border-0 bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 hover:shadow-lg hover:shadow-emerald-100/50 transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs sm:text-sm font-semibold text-emerald-700 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Total Plants
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-emerald-800 mb-1">{inventorySummary.totalItems}</div>
            <div className="text-xs text-emerald-600">Active inventory items</div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100 hover:shadow-lg hover:shadow-blue-100/50 transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs sm:text-sm font-semibold text-blue-700 flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Total Seedlings
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-800 mb-1">{inventorySummary.totalQuantity.toLocaleString()}</div>
            <div className="text-xs text-blue-600">Plants in stock</div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 hover:shadow-lg hover:shadow-orange-100/50 transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs sm:text-sm font-semibold text-orange-700 flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Total Sales
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-800 mb-1">Ksh {salesSummary.totalAmount.toLocaleString()}</div>
            <div className="text-xs text-orange-600">All time revenue</div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-purple-50 via-violet-50 to-purple-100 hover:shadow-lg hover:shadow-purple-100/50 transition-all duration-300 transform hover:-translate-y-1">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs sm:text-sm font-semibold text-purple-700 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Today's Sales
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-purple-800 mb-1">{salesSummary.todaySales}</div>
            <div className="text-xs text-purple-600">Sales today</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
        {/* Recent Sales */}
        <Card className="border-0 bg-white shadow-lg shadow-gray-100/50 overflow-hidden hover:shadow-xl transition-all duration-300">
          <CardHeader className="px-4 py-4 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100/50">
            <CardTitle className="text-lg font-bold text-orange-800 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
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
                    <TableRow style={{ background: '#F5F5F5', color: '#333333' }}>
                      <TableHead className="text-xs sm:text-sm font-medium px-2 sm:px-4 py-2 sm:py-3">Date</TableHead>
                      <TableHead className="text-xs sm:text-sm font-medium px-2 sm:px-4 py-2 sm:py-3">Plant</TableHead>
                      <TableHead className="text-xs sm:text-sm font-medium px-2 sm:px-4 py-2 sm:py-3">Qty</TableHead>
                      <TableHead className="text-xs sm:text-sm font-medium px-2 sm:px-4 py-2 sm:py-3">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentSales.map((sale) => (
                      <TableRow key={sale.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3" style={{ color: '#333333' }}>{new Date(sale.sale_date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3 font-medium" style={{ color: '#333333' }}>{sale.inventory?.plant_name || "Unknown"}</TableCell>
                        <TableCell className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3" style={{ color: '#333333' }}>{sale.quantity}</TableCell>
                        <TableCell className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3 font-semibold" style={{ color: '#4CB76F' }}>Ksh {sale.total_amount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Items */}
        <Card className="border-0 bg-white shadow-lg shadow-gray-100/50 overflow-hidden hover:shadow-xl transition-all duration-300">
          <CardHeader className="px-4 py-4 bg-gradient-to-r from-red-50 to-pink-50 border-b border-red-100/50">
            <CardTitle className="text-lg font-bold text-red-800 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Low Stock Items
            </CardTitle>
            <CardDescription className="text-red-600">
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
                    <TableRow style={{ background: '#F5F5F5', color: '#333333' }}>
                      <TableHead className="text-xs sm:text-sm font-medium px-2 sm:px-4 py-2 sm:py-3">Plant</TableHead>
                      <TableHead className="text-xs sm:text-sm font-medium px-2 sm:px-4 py-2 sm:py-3">Quantity</TableHead>
                      <TableHead className="text-xs sm:text-sm font-medium px-2 sm:px-4 py-2 sm:py-3">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockItems.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3 font-medium" style={{ color: '#333333' }}>{item.plant_name}</TableCell>
                        <TableCell className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3" style={{ color: '#333333' }}>{item.quantity}</TableCell>
                        <TableCell className="px-2 sm:px-4 py-2 sm:py-3">
                          <Badge variant="outline" style={{ background: '#FF7A291A', color: '#FF7A29', border: '#FF7A2940' }} className="text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
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