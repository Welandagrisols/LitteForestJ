"use client"

import { useState, useEffect } from "react"
import { supabase, isDemoMode, checkTableExists } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AddInventoryForm } from "@/components/add-inventory-form"
import { AddConsumableForm } from "@/components/add-consumable-form"
import { EditInventoryForm } from "@/components/edit-inventory-form"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { demoInventory } from "@/components/demo-data"
import { DemoModeBanner } from "@/components/demo-mode-banner"
import { exportToExcel, formatInventoryForExport } from "@/lib/excel-export"
import { Download, Loader2, Plus } from "lucide-react"

export function InventoryTab() {
  const [inventory, setInventory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All Categories")
  const [editItem, setEditItem] = useState<any>(null)
  const [tableExists, setTableExists] = useState(true)
  const [activeTab, setActiveTab] = useState("plants")
  const { toast } = useToast()

  useEffect(() => {
    async function init() {
      if (isDemoMode) {
        setInventory(demoInventory)
        setLoading(false)
        return
      }

      // Check if the inventory table exists
      const exists = await checkTableExists("inventory")
      setTableExists(exists)

      if (!exists) {
        setInventory(demoInventory)
        setLoading(false)
        return
      }

      // If table exists, fetch data
      fetchInventory().catch((error) => {
        console.log("Falling back to demo mode due to:", error.message)
        setInventory(demoInventory)
        setLoading(false)
      })
    }

    init()
  }, [])

  async function fetchInventory() {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("inventory").select("*").order("plant_name", { ascending: true })

      if (error) throw error
      setInventory(data || [])
    } catch (error: any) {
      console.error("Error fetching inventory:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  async function deleteInventoryItem(id: string) {
    if (isDemoMode || !tableExists) {
      toast({
        title: "Demo Mode",
        description: "Connect to Supabase and set up tables to enable editing functionality",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase.from("inventory").delete().eq("id", id)

      if (error) throw error

      toast({
        title: "Item deleted",
        description: "Inventory item has been removed",
      })

      fetchInventory()
    } catch (error: any) {
      toast({
        title: "Error deleting item",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  // Helper function to determine if an item is a consumable
  const isConsumable = (item: any) => {
    // Check if category starts with "Consumable:" or if scientific_name starts with "[Consumable]"
    return (
      (item.category && item.category.startsWith("Consumable:")) ||
      (item.scientific_name && item.scientific_name.startsWith("[Consumable]"))
    )
  }

  // Extract unit from scientific_name if it's a consumable
  const getConsumableUnit = (item: any) => {
    if (item.scientific_name && item.scientific_name.startsWith("[Consumable]")) {
      return item.scientific_name.replace("[Consumable] ", "")
    }
    return "Pieces"
  }

  // Extract real category from prefixed category
  const getConsumableCategory = (item: any) => {
    if (item.category && item.category.startsWith("Consumable:")) {
      return item.category.replace("Consumable: ", "")
    }
    return item.category
  }

  // Filter inventory based on item type and search/category filters
  const filteredPlants = inventory
    .filter((item) => !isConsumable(item))
    .filter((item) => {
      const matchesSearch =
        item.plant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesCategory = categoryFilter === "All Categories" || item.category === categoryFilter
      return matchesSearch && matchesCategory
    })

  const filteredConsumables = inventory
    .filter((item) => isConsumable(item))
    .filter((item) => {
      const matchesSearch =
        item.plant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()))
      const actualCategory = getConsumableCategory(item)
      const matchesCategory = categoryFilter === "All Categories" || actualCategory === categoryFilter
      return matchesSearch && matchesCategory
    })

  // Get all unique categories for the filter dropdown
  const plantCategories = [
    "All Categories",
    ...new Set(inventory.filter((item) => !isConsumable(item)).map((item) => item.category)),
  ]

  const consumableCategories = [
    "All Categories",
    ...new Set(inventory.filter((item) => isConsumable(item)).map((item) => getConsumableCategory(item))),
  ]

  const categories = activeTab === "plants" ? plantCategories : consumableCategories

  const handleExportToExcel = async () => {
    try {
      setExporting(true)

      // Format the data for export based on active tab
      const dataToExport = activeTab === "plants" ? filteredPlants : filteredConsumables
      const exportData = formatInventoryForExport(dataToExport, activeTab === "consumables")

      // Export to Excel
      const fileName =
        activeTab === "plants"
          ? `Plants_Export_${new Date().toISOString().split("T")[0]}`
          : `Consumables_Export_${new Date().toISOString().split("T")[0]}`

      const success = exportToExcel(exportData, fileName)

      if (success) {
        toast({
          title: "Export Successful",
          description: `${exportData.length} items exported to Excel`,
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
    <div className="warm-card rounded-lg shadow-sm p-6">
      {(isDemoMode || !tableExists) && <DemoModeBanner isDemoMode={isDemoMode} tablesNotFound={!tableExists} />}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold">Inventory Management</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleExportToExcel}
            disabled={
              exporting || (activeTab === "plants" ? filteredPlants.length === 0 : filteredConsumables.length === 0)
            }
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export to Excel
          </Button>

          {activeTab === "plants" ? (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  className="bg-primary hover:bg-primary/90 text-white"
                  disabled={isDemoMode || !tableExists}
                  title={
                    isDemoMode || !tableExists
                      ? "Connect to Supabase and set up tables to enable adding plants"
                      : "Add new plant"
                  }
                >
                  <Plus className="h-4 w-4 mr-1" /> Add New Plant
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Add New Plant to Inventory</DialogTitle>
                </DialogHeader>
                <AddInventoryForm onSuccess={() => fetchInventory()} />
              </DialogContent>
            </Dialog>
          ) : (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  className="bg-primary hover:bg-primary/90 text-white"
                  disabled={isDemoMode || !tableExists}
                  title={
                    isDemoMode || !tableExists
                      ? "Connect to Supabase and set up tables to enable adding consumables"
                      : "Add new consumable"
                  }
                >
                  <Plus className="h-4 w-4 mr-1" /> Add New Consumable
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Add New Consumable to Inventory</DialogTitle>
                </DialogHeader>
                <AddConsumableForm onSuccess={() => fetchInventory()} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid gap-4 mb-6 md:grid-cols-2">
        <div>
          <Input
            placeholder={
              activeTab === "plants" ? "Search plants by name or SKU..." : "Search consumables by name or SKU..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="plants" onValueChange={setActiveTab}>
        <TabsList className="mb-4 bg-muted">
          <TabsTrigger value="plants" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            Plants & Trees
          </TabsTrigger>
          <TabsTrigger value="consumables" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            Nursery Consumables
          </TabsTrigger>
        </TabsList>

        {/* Plants Tab */}
        <TabsContent value="plants">
          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="sage-header hover:bg-muted/50">
                  <TableHead>Plant Information</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Date Planted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Price (Ksh)</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading inventory...
                    </TableCell>
                  </TableRow>
                ) : filteredPlants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No plants found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPlants.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="font-medium">{item.plant_name}</div>
                        <div className="text-sm text-muted-foreground">{item.scientific_name}</div>
                        <div className="text-xs text-muted-foreground">SKU: {item.sku}</div>
                      </TableCell>
                      <TableCell>
                        <div>{item.category}</div>
                        {item.section && (
                          <div className="text-xs text-muted-foreground">
                            Section {item.section}
                            {item.row ? `, Row ${item.row}` : ""}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.age || "-"}</TableCell>
                      <TableCell>
                        {item.date_planted ? new Date(item.date_planted).toLocaleDateString() : "-"}
                        {item.source && <div className="text-xs text-muted-foreground">Source: {item.source}</div>}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={item.status === "Healthy" ? "default" : "outline"}
                          className={
                            item.status === "Healthy"
                              ? "bg-primary hover:bg-primary"
                              : item.status === "Attention"
                                ? "bg-secondary hover:bg-secondary"
                                : "bg-destructive hover:bg-destructive"
                          }
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.price.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditItem(item)}
                                disabled={isDemoMode || !tableExists}
                                title={
                                  isDemoMode || !tableExists
                                    ? "Connect to Supabase and set up tables to enable editing"
                                    : "Edit plant"
                                }
                              >
                                Edit
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px]">
                              <DialogHeader>
                                <DialogTitle>Edit Plant</DialogTitle>
                              </DialogHeader>
                              {editItem && <EditInventoryForm item={editItem} onSuccess={() => fetchInventory()} />}
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            disabled={isDemoMode || !tableExists}
                            title={
                              isDemoMode || !tableExists
                                ? "Connect to Supabase and set up tables to enable deleting"
                                : "Delete plant"
                            }
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this item?")) {
                                deleteInventoryItem(item.id)
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Consumables Tab */}
        <TabsContent value="consumables">
          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="sage-header hover:bg-muted/50">
                  <TableHead>Item Information</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Purchase Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Price (Ksh)</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading consumables...
                    </TableCell>
                  </TableRow>
                ) : filteredConsumables.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No consumables found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredConsumables.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="font-medium">{item.plant_name}</div>
                        <div className="text-xs text-muted-foreground">SKU: {item.sku}</div>
                      </TableCell>
                      <TableCell>
                        <div>{getConsumableCategory(item)}</div>
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{getConsumableUnit(item)}</TableCell>
                      <TableCell>
                        {item.date_planted ? new Date(item.date_planted).toLocaleDateString() : "-"}
                        {item.source && <div className="text-xs text-muted-foreground">Supplier: {item.source}</div>}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={item.status === "Available" ? "default" : "outline"}
                          className={
                            item.status === "Available"
                              ? "bg-primary hover:bg-primary"
                              : item.status === "Low Stock"
                                ? "bg-secondary hover:bg-secondary"
                                : "bg-destructive hover:bg-destructive"
                          }
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.price.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditItem(item)}
                                disabled={isDemoMode || !tableExists}
                                title={
                                  isDemoMode || !tableExists
                                    ? "Connect to Supabase and set up tables to enable editing"
                                    : "Edit consumable"
                                }
                              >
                                Edit
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px]">
                              <DialogHeader>
                                <DialogTitle>Edit Consumable</DialogTitle>
                              </DialogHeader>
                              {editItem && <EditInventoryForm item={editItem} onSuccess={() => fetchInventory()} />}
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            disabled={isDemoMode || !tableExists}
                            title={
                              isDemoMode || !tableExists
                                ? "Connect to Supabase and set up tables to enable deleting"
                                : "Delete consumable"
                            }
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this item?")) {
                                deleteInventoryItem(item.id)
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
