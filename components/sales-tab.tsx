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
import { Download, Loader2, Trash2 } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"

export function SalesTab() {
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [totalSales, setTotalSales] = useState(0)
  const [totalSeedlings, setTotalSeedlings] = useState(0)
  const [tableExists, setTableExists] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const { toast } = useToast()
  const isMobile = useIsMobile()

  useEffect(() => {
    async function init() {
      if (isDemoMode) {
        loadDemoSales()
        return
      }

      const exists = await checkTableExists("sales")
      setTableExists(exists)

      if (!exists) {
        loadDemoSales()
        return
      }

      fetchSales().catch((error) => {
        console.log("Falling back to demo mode due to:", error.message)
        loadDemoSales()
      })
    }

    init()
  }, [])

  function loadDemoSales() {
    setSales(demoSales)

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

  const handleAddSaleSuccess = async () => {
    console.log("handleAddSaleSuccess called")
    try {
      await fetchSales()
      setDialogOpen(false)
    } catch (error) {
      console.error("Error refreshing sales:", error)
    }
  }

  const handleExportToExcel = async () => {
    try {
      setExporting(true)

      const exportData = formatSalesForExport(sales)

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

  const handleDeleteSale = async (saleId: string) => {
    if (isDemoMode || !tableExists) {
      toast({
        title: "Cannot Delete",
        description: "Connect to Supabase to enable deleting sales",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase.from("sales").delete().eq("id", saleId)

      if (error) throw error

      toast({
        title: "Sale Deleted",
        description: "Sale record has been deleted successfully",
      })

      // Refresh the sales data
      await fetchSales()
    } catch (error: any) {
      console.error("Error deleting sale:", error)
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete sale",
        variant: "destructive",
      })
    }
  }

  return (
    <div className={`space-y-6 ${isMobile ? "mobile-content" : ""}`}>
      {(isDemoMode || !tableExists) && <DemoModeBanner isDemoMode={isDemoMode} tablesNotFound={!tableExists} />}

      <div className={`${isMobile ? "mobile-stats-grid" : "grid gap-4 md:grid-cols-3"}`}>
        <Card className={`warm-card hover:shadow-md transition-shadow ${isMobile ? "mobile-stats-card" : ""}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`${isMobile ? "text-xs" : "text-sm"} font-medium text-muted-foreground`}>
              Total Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-secondary`}>
              Ksh {totalSales.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className={`warm-card hover:shadow-md transition-shadow ${isMobile ? "mobile-stats-card" : ""}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`${isMobile ? "text-xs" : "text-sm"} font-medium text-muted-foreground`}>
              Total Seedlings Sold
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-secondary`}>
              {totalSeedlings.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card className={`warm-card hover:shadow-md transition-shadow ${isMobile ? "mobile-stats-card" : ""}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`${isMobile ? "text-xs" : "text-sm"} font-medium text-muted-foreground`}>
              Sales This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-secondary`}>
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
        <div className={`sticky top-0 z-10 bg-white border-b border-border ${isMobile ? "p-4" : "p-6"}`}>
          <div
            className={`${isMobile ? "space-y-4" : "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"}`}
          >
            <h2 className={`${isMobile ? "text-xl" : "text-2xl"} font-bold`}>Sales Records</h2>
            <div className={`${isMobile ? "mobile-button-group" : "flex flex-col sm:flex-row gap-2 w-full sm:w-auto"}`}>
              <Button
                variant="outline"
                className={`flex items-center justify-center gap-2 bg-transparent ${isMobile ? "mobile-touch-target" : "w-full sm:w-auto"}`}
                onClick={handleExportToExcel}
                disabled={exporting || sales.length === 0}
              >
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Export to Excel
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className={`bg-secondary hover:bg-secondary/90 text-white ${isMobile ? "mobile-touch-target" : "w-full sm:w-auto"}`}
                    disabled={isDemoMode || !tableExists}
                    onClick={() => {
                      console.log("Record New Sale button clicked")
                      setDialogOpen(true)
                    }}
                  >
                    Record New Sale
                  </Button>
                </DialogTrigger>
                <DialogContent className={`${isMobile ? "mobile-dialog" : "sm:max-w-[600px]"}`}>
                  <DialogHeader>
                    <DialogTitle>Record New Sale</DialogTitle>
                  </DialogHeader>
                  <AddSaleForm onSuccess={handleAddSaleSuccess} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className={isMobile ? "p-4" : "p-6"}>
          {isMobile ? (
            // Mobile card layout
            <div className="space-y-4">
              {loading ? (
                <div className="mobile-loading">
                  <div className="text-center">Loading sales records...</div>
                </div>
              ) : sales.length === 0 ? (
                <div className="mobile-empty-state">
                  <div className="text-center">No sales records found</div>
                </div>
              ) : (
                sales.map((sale) => (
                  <div key={sale.id} className="mobile-product-card border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{sale.inventory?.plant_name || "Unknown Plant"}</div>
                        <div className="text-sm text-muted-foreground">{sale.inventory?.category || ""}</div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteSale(sale.id)}
                        disabled={isDemoMode || !tableExists}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Date:</span>
                        <p className="font-medium">{new Date(sale.sale_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Quantity:</span>
                        <p className="font-medium">{sale.quantity}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Amount:</span>
                        <p className="font-medium">Ksh {sale.total_amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Customer:</span>
                        <p className="font-medium">{sale.customer ? sale.customer.name : "Walk-in Customer"}</p>
                      </div>
                    </div>

                    {sale.customer && (
                      <div className="pt-2 border-t text-xs text-muted-foreground">
                        Contact: {sale.customer.contact}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            // Desktop table layout
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="sage-header hover:bg-muted/50">
                    <TableHead>Date</TableHead>
                    <TableHead>Plant</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Loading sales records...
                      </TableCell>
                    </TableRow>
                  ) : sales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
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
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteSale(sale.id)}
                            disabled={isDemoMode || !tableExists}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
