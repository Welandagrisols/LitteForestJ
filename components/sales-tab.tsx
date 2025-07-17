"use client"

import { useState, useEffect } from "react"
import { supabase, isDemoMode, checkTableExists } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AddSaleForm } from "@/components/add-sale-form"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { demoSales } from "@/components/demo-data"
import { DemoModeBanner } from "@/components/demo-mode-banner"
import { exportToExcel, formatSalesForExport } from "@/lib/excel-export"
import { Download, Loader2 } from "lucide-react"

export function SalesTab() {
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [totalSales, setTotalSales] = useState(0)
  const [totalSeedlings, setTotalSeedlings] = useState(0)
  const [tableExists, setTableExists] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    async function init() {
      if (isDemoMode) {
        loadDemoSales()
        return
      }

      // Check if the sales table exists
      const exists = await checkTableExists("sales")
      setTableExists(exists)

      if (!exists) {
        loadDemoSales()
        return
      }

      // If table exists, fetch data
      fetchSales().catch((error) => {
        console.log("Falling back to demo mode due to:", error.message)
        loadDemoSales()
      })
    }

    init()
  }, [])

  function loadDemoSales() {
    setSales(demoSales)

    // Calculate totals
    let salesTotal = 0
    let seedlingsTotal = 0

    demoSales.forEach((sale) => {
      salesTotal += sale.total_amount
      seedlingsTotal += sale.quantity
    })

    setTotalSales(salesTotal)
    setTotalSeedlings(seedlingsTotal)
    setLoading(false)
  }

  async function fetchSales() {
    try {
      setLoading(true)

      // Fetch sales with inventory and customer details
      const { data, error } = await supabase
        .from("sales")
        .select(`
          *,
          inventory:inventory_id (plant_name, category, price),
          customer:customer_id (name, contact)
        `)
        .order("sale_date", { ascending: false })

      if (error) throw error

      setSales(data || [])

      // Calculate totals
      let salesTotal = 0
      let seedlingsTotal = 0

      data?.forEach((sale) => {
        salesTotal += sale.total_amount
        seedlingsTotal += sale.quantity
      })

      setTotalSales(salesTotal)
      setTotalSeedlings(seedlingsTotal)
    } catch (error: any) {
      console.error("Error fetching sales:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const handleExportToExcel = async () => {
    try {
      setExporting(true)

      // Format the data for export
      const exportData = formatSalesForExport(sales)

      // Export to Excel
      const success = exportToExcel(exportData, `Sales_Export_${new Date().toISOString().split("T")[0]}`)

      if (success) {
        toast({
          title: "Export Successful",
          description: `${exportData.length} sales records exported to Excel`,
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

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="warm-card hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">Ksh {totalSales.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="warm-card hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Seedlings Sold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">{totalSeedlings.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="warm-card hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sales This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">
              {
                sales.filter((sale) => {
                  const saleDate = new Date(sale.sale_date)
                  const now = new Date()
                  return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear()
                }).length
              }
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="warm-card rounded-lg shadow-sm overflow-hidden">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-border p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-2xl font-bold">Sales Records</h2>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                className="flex items-center justify-center gap-2 w-full sm:w-auto"
                onClick={handleExportToExcel}
                disabled={exporting || sales.length === 0}
              >
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Export to Excel
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-secondary hover:bg-secondary/90 text-white w-full sm:w-auto"
                    disabled={isDemoMode || !tableExists}
                    title={
                      isDemoMode || !tableExists
                        ? "Connect to Supabase and set up tables to enable recording sales"
                        : "Record new sale"
                    }
                  >
                    Record New Sale
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Record New Sale</DialogTitle>
                  </DialogHeader>
                  <AddSaleForm onSuccess={() => {
                    fetchSales()
                    setDialogOpen(false)
                  }} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6">
          <div className="rounded-md border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="sage-header hover:bg-muted/50">
                <TableHead>Date</TableHead>
                <TableHead>Plant</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Customer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading sales records...
                  </TableCell>
                </TableRow>
              ) : sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No sales records found
                  </TableCell>
                </TableRow>
              ) : (
                sales.map((sale) => (
                  <TableRow key={sale.id} className="hover:bg-muted/50">
                    <TableCell>{new Date(sale.sale_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="font-medium">{sale.inventory?.plant_name || "Unknown Plant"}</div>
                      <div className="text-sm text-muted-foreground">{sale.inventory?.category || ""}</div>
                    </TableCell>
                    <TableCell>{sale.quantity}</TableCell>
                    <TableCell>Ksh {sale.total_amount.toLocaleString()}</TableCell>
                    <TableCell>
                      {sale.customer ? (
                        <>
                          <div>{sale.customer.name}</div>
                          <div className="text-sm text-muted-foreground">{sale.customer.contact}</div>
                        </>
                      ) : (
                        "Walk-in Customer"
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </div>
      </div>
    </div>
  )
}