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
    <div className="space-y-3 sm:space-y-6 p-2 sm:p-4 lg:p-6" style={{ background: '#FFFFFF' }}>
      {(isDemoMode || tablesNotExist) && <DemoModeBanner isDemoMode={isDemoMode} tablesNotFound={tablesNotExist} />}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="brand-card" style={{ background: '#FFFFFF', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <CardHeader className="pb-1 px-3 pt-3">
            <CardTitle className="text-xs sm:text-sm font-medium" style={{ color: '#333333' }}>Total Plants</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-lg sm:text-2xl lg:text-3xl font-bold" style={{ color: '#4CB76F' }}>{inventorySummary.totalItems}</div>
          </CardContent>
        </Card>
        <Card className="brand-card" style={{ background: '#FFFFFF', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <CardHeader className="pb-1 px-3 pt-3">
            <CardTitle className="text-xs sm:text-sm font-medium" style={{ color: '#333333' }}>Total Seedlings</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-lg sm:text-2xl lg:text-3xl font-bold" style={{ color: '#4CB76F' }}>{inventorySummary.totalQuantity}</div>
          </CardContent>
        </Card>
        <Card className="brand-card" style={{ background: '#FFFFFF', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <CardHeader className="pb-1 px-3 pt-3">
            <CardTitle className="text-xs sm:text-sm font-medium" style={{ color: '#333333' }}>Total Sales</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-sm sm:text-xl lg:text-2xl font-bold" style={{ color: '#FF7A29' }}>Ksh {salesSummary.totalAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="brand-card" style={{ background: '#FFFFFF', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <CardHeader className="pb-1 px-3 pt-3">
            <CardTitle className="text-xs sm:text-sm font-medium" style={{ color: '#333333' }}>Today's Sales</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-lg sm:text-2xl lg:text-3xl font-bold" style={{ color: '#FF7A29' }}>{salesSummary.todaySales}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
        {/* Recent Sales */}
        <Card className="brand-card overflow-hidden" style={{ background: '#FFFFFF', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <CardHeader className="px-3 py-3 sm:px-4 sm:py-4" style={{ background: '#F5F5F5' }}>
            <CardTitle className="text-base sm:text-lg font-semibold brand-section-heading" style={{ color: '#FF7A29' }}>Recent Sales</CardTitle>
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
        <Card className="brand-card overflow-hidden" style={{ background: '#FFFFFF', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <CardHeader className="px-3 py-3 sm:px-4 sm:py-4" style={{ background: '#F5F5F5' }}>
            <CardTitle className="text-base sm:text-lg font-semibold brand-section-heading" style={{ color: '#FF7A29' }}>Low Stock Items</CardTitle>
            <CardDescription style={{ color: '#666666' }}>
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