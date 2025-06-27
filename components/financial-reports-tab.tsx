
"use client"

import { useState, useEffect } from "react"
import { supabase, isDemoMode, checkTableExists } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { DemoModeBanner } from "@/components/demo-mode-banner"
import { demoSales, demoInventory } from "@/components/demo-data"
import { exportToExcel } from "@/lib/excel-export"
import { TrendingUp, DollarSign, Percent, Target, Download, Loader2 } from "lucide-react"

interface ProfitData {
  plantName: string
  category: string
  totalRevenue: number
  totalCost: number
  profit: number
  profitMargin: number
  quantitySold: number
  profitPerUnit: number
}

export function FinancialReportsTab() {
  const [profitData, setProfitData] = useState<ProfitData[]>([])
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalCost, setTotalCost] = useState(0)
  const [totalProfit, setTotalProfit] = useState(0)
  const [overallProfitMargin, setOverallProfitMargin] = useState(0)
  const [loading, setLoading] = useState(true)
  const [tableExists, setTableExists] = useState(true)
  const [exporting, setExporting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    async function init() {
      if (isDemoMode) {
        loadDemoFinancialData()
        return
      }

      // Check if tables exist
      const salesExists = await checkTableExists("sales")
      const inventoryExists = await checkTableExists("inventory")
      setTableExists(salesExists && inventoryExists)

      if (!salesExists || !inventoryExists) {
        loadDemoFinancialData()
        return
      }

      // If tables exist, fetch data
      fetchFinancialData().catch((error) => {
        console.log("Falling back to demo mode due to:", error.message)
        loadDemoFinancialData()
      })
    }

    init()
  }, [])

  function loadDemoFinancialData() {
    setLoading(true)

    // Calculate profit data from demo data
    const profitMap = new Map<string, ProfitData>()

    demoSales.forEach((sale) => {
      const inventory = demoInventory.find(item => item.id === sale.inventory_id)
      if (!inventory) return

      const plantKey = inventory.plant_name
      const revenue = sale.total_amount
      const cost = inventory.price * sale.quantity
      const profit = revenue - cost
      const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0

      if (profitMap.has(plantKey)) {
        const existing = profitMap.get(plantKey)!
        existing.totalRevenue += revenue
        existing.totalCost += cost
        existing.profit += profit
        existing.quantitySold += sale.quantity
        existing.profitMargin = existing.totalRevenue > 0 ? (existing.profit / existing.totalRevenue) * 100 : 0
        existing.profitPerUnit = existing.quantitySold > 0 ? existing.profit / existing.quantitySold : 0
      } else {
        profitMap.set(plantKey, {
          plantName: inventory.plant_name,
          category: inventory.category,
          totalRevenue: revenue,
          totalCost: cost,
          profit,
          profitMargin,
          quantitySold: sale.quantity,
          profitPerUnit: profit / sale.quantity
        })
      }
    })

    const profitArray = Array.from(profitMap.values())
    setProfitData(profitArray.sort((a, b) => b.profitMargin - a.profitMargin))

    // Calculate totals
    const revenue = profitArray.reduce((sum, item) => sum + item.totalRevenue, 0)
    const cost = profitArray.reduce((sum, item) => sum + item.totalCost, 0)
    const profit = revenue - cost

    setTotalRevenue(revenue)
    setTotalCost(cost)
    setTotalProfit(profit)
    setOverallProfitMargin(revenue > 0 ? (profit / revenue) * 100 : 0)
    setLoading(false)
  }

  async function fetchFinancialData() {
    try {
      setLoading(true)

      // Fetch sales with inventory details
      const { data: salesData, error } = await supabase
        .from("sales")
        .select(`
          *,
          inventory:inventory_id (plant_name, category, price)
        `)

      if (error) throw error

      // Calculate profit data
      const profitMap = new Map<string, ProfitData>()

      salesData?.forEach((sale) => {
        if (!sale.inventory) return

        const plantKey = sale.inventory.plant_name
        const revenue = sale.total_amount
        const cost = sale.inventory.price * sale.quantity
        const profit = revenue - cost
        const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0

        if (profitMap.has(plantKey)) {
          const existing = profitMap.get(plantKey)!
          existing.totalRevenue += revenue
          existing.totalCost += cost
          existing.profit += profit
          existing.quantitySold += sale.quantity
          existing.profitMargin = existing.totalRevenue > 0 ? (existing.profit / existing.totalRevenue) * 100 : 0
          existing.profitPerUnit = existing.quantitySold > 0 ? existing.profit / existing.quantitySold : 0
        } else {
          profitMap.set(plantKey, {
            plantName: sale.inventory.plant_name,
            category: sale.inventory.category,
            totalRevenue: revenue,
            totalCost: cost,
            profit,
            profitMargin,
            quantitySold: sale.quantity,
            profitPerUnit: profit / sale.quantity
          })
        }
      })

      const profitArray = Array.from(profitMap.values())
      setProfitData(profitArray.sort((a, b) => b.profitMargin - a.profitMargin))

      // Calculate totals
      const revenue = profitArray.reduce((sum, item) => sum + item.totalRevenue, 0)
      const cost = profitArray.reduce((sum, item) => sum + item.totalCost, 0)
      const profit = revenue - cost

      setTotalRevenue(revenue)
      setTotalCost(cost)
      setTotalProfit(profit)
      setOverallProfitMargin(revenue > 0 ? (profit / revenue) * 100 : 0)
    } catch (error: any) {
      console.error("Error fetching financial data:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const top5Profitable = profitData.slice(0, 5)

  const handleExportToExcel = async () => {
    try {
      setExporting(true)

      // Format the profit data for export
      const exportData = profitData.map((item, index) => ({
        Rank: index + 1,
        "Plant Name": item.plantName,
        Category: item.category,
        "Units Sold": item.quantitySold,
        "Revenue (Ksh)": item.totalRevenue,
        "Cost (Ksh)": item.totalCost,
        "Profit (Ksh)": item.profit,
        "Margin %": item.profitMargin.toFixed(1),
        "Profit per Unit (Ksh)": item.profitPerUnit.toFixed(0),
      }))

      // Export to Excel
      const success = exportToExcel(exportData, `Financial_Report_${new Date().toISOString().split("T")[0]}`)

      if (success) {
        toast({
          title: "Export Successful",
          description: `Financial report with ${exportData.length} items exported to Excel`,
        })
      } else {
        throw new Error("Export failed")
      }
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "An error occurred during export",
        variant: "destructive",
      })
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {(isDemoMode || !tableExists) && <DemoModeBanner isDemoMode={isDemoMode} tablesNotFound={!tableExists} />}

      {/* Overall Financial Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="warm-card hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Ksh {totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="warm-card hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Total Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">Ksh {totalCost.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="warm-card hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Ksh {totalProfit.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className="warm-card hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Profit Margin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${overallProfitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {overallProfitMargin.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top 5 Most Profitable Seedlings */}
      <div className="warm-card rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-green-600" />
          Top 5 Most Profitable Seedlings
        </h2>
        
        {loading ? (
          <div className="text-center py-8">Loading financial data...</div>
        ) : top5Profitable.length === 0 ? (
          <div className="text-center py-8">No sales data available for profit calculation</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {top5Profitable.map((item, index) => (
              <Card key={item.plantName} className="warm-card hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Badge variant="secondary">{index + 1}</Badge>
                    {item.plantName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm text-muted-foreground">{item.category}</div>
                  <div className="text-lg font-bold text-green-600">
                    Ksh {item.profitPerUnit.toFixed(0)} per unit
                  </div>
                  <div className="text-sm">
                    Margin: <span className={`font-semibold ${item.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.profitMargin.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.quantitySold} units sold
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Detailed Profit Margins Table */}
      <div className="warm-card rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Profit Margins by Seedling</h2>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleExportToExcel}
            disabled={exporting || profitData.length === 0}
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export to Excel
          </Button>
        </div>
        
        <div className="rounded-md border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="sage-header hover:bg-muted/50">
                <TableHead>Rank</TableHead>
                <TableHead>Plant Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Units Sold</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Profit</TableHead>
                <TableHead>Margin %</TableHead>
                <TableHead>Profit/Unit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Loading profit data...
                  </TableCell>
                </TableRow>
              ) : profitData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    No sales data available for profit calculation
                  </TableCell>
                </TableRow>
              ) : (
                profitData.map((item, index) => (
                  <TableRow key={item.plantName} className="hover:bg-muted/50">
                    <TableCell>
                      <Badge variant={index < 5 ? "default" : "secondary"}>
                        {index + 1}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{item.plantName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.category}</TableCell>
                    <TableCell>{item.quantitySold}</TableCell>
                    <TableCell className="text-green-600">Ksh {item.totalRevenue.toLocaleString()}</TableCell>
                    <TableCell className="text-red-600">Ksh {item.totalCost.toLocaleString()}</TableCell>
                    <TableCell className={item.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                      Ksh {item.profit.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.profitMargin >= 20 ? "default" : item.profitMargin >= 0 ? "secondary" : "destructive"}>
                        {item.profitMargin.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className={item.profitPerUnit >= 0 ? 'text-green-600' : 'text-red-600'}>
                      Ksh {item.profitPerUnit.toFixed(0)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
