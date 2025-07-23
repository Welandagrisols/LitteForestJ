"use client"

import { useState, useEffect } from "react"
import { supabase, isDemoMode, checkTableExists } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  const [addPlantDialogOpen, setAddPlantDialogOpen] = useState(false)
  const [addConsumableDialogOpen, setAddConsumableDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    async function init() {
      if (isDemoMode) {
        setInventory(demoInventory)
        setLoading(false)
        return
      }

      const exists = await checkTableExists("inventory")
      setTableExists(exists)

      if (!exists) {
        setInventory(demoInventory)
        setLoading(false)
        return
      }

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
        description: "Connect to Supabase to enable deleting items",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase.from("inventory").delete().eq("id", id)

      if (error) {
        console.error("Delete error:", error)
        throw error
      }

      toast({
        title: "Success",
        description: "Item deleted successfully",
      })

      await fetchInventory()
    } catch (error: any) {
      console.error("Error deleting item:", error)
      toast({
        title: "Error deleting item",
        description: error.message || "Failed to delete item",
        variant: "destructive",
      })
    }
  }

  const handleAddSuccess = async () => {
    console.log("handleAddSuccess called")
    try {
      await fetchInventory()
      setAddPlantDialogOpen(false)
      setAddConsumableDialogOpen(false)
    } catch (error) {
      console.error("Error refreshing inventory:", error)
    }
  }

  const isConsumable = (item: any) => {
    return (
      (item.category && item.category.startsWith("Consumable:")) ||
      (item.scientific_name && item.scientific_name.startsWith("[Consumable]"))
    )
  }

  const getConsumableUnit = (item: any) => {
    if (item.scientific_name && item.scientific_name.startsWith("[Consumable]")) {
      return item.scientific_name.replace("[Consumable] ", "")
    }
    return "Pieces"
  }

  const getConsumableCategory = (item: any) => {
    if (item.category && item.category.startsWith("Consumable:")) {
      return item.category.replace("Consumable: ", "")
    }
    return item.category
  }

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

  const plantCategories = [
    "All Categories",
    ...new Set(inventory.filter((item) => !isConsumable(item) && item.category).map((item) => item.category)),
  ].filter(Boolean)

  const consumableCategories = [
    "All Categories",
    ...new Set(
      inventory
        .filter((item) => isConsumable(item))
        .map((item) => getConsumableCategory(item))
        .filter(Boolean),
    ),
  ].filter(Boolean)

  const categories = activeTab === "plants" ? plantCategories : consumableCategories

  const handleExportToExcel = async () => {
    try {
      setExporting(true)

      const dataToExport = activeTab === "plants" ? filteredPlants : filteredConsumables
      const exportData = formatInventoryForExport(dataToExport, activeTab === "consumables")

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
    <div className="warm-card rounded-lg shadow-sm overflow-hidden">
      {(isDemoMode || !tableExists) && (
        <div className="p-6 border-b">
          <DemoModeBanner isDemoMode={isDemoMode} tablesNotFound={!tableExists} />
        </div>
      )}

      <div className="p-6 border-b border-border bg-white">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-2xl font-bold">Inventory Management</h2>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {activeTab === "plants" ? (
                <Dialog open={addPlantDialogOpen} onOpenChange={setAddPlantDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="bg-primary hover:bg-primary/90 text-white flex items-center justify-center gap-2 h-12 text-base font-medium shadow-lg w-full sm:w-auto"
                      disabled={isDemoMode || !tableExists}
                      onClick={() => {
                        console.log("Add Plant button clicked")
                        setAddPlantDialogOpen(true)
                      }}
                    >
                      <Plus className="h-5 w-5" /> Add New Plant
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Plant to Inventory</DialogTitle>
                    </DialogHeader>
                    <AddInventoryForm onSuccess={handleAddSuccess} onClose={() => setAddPlantDialogOpen(false)} />
                  </DialogContent>
                </Dialog>
              ) : (
                <Dialog open={addConsumableDialogOpen} onOpenChange={setAddConsumableDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="bg-primary hover:bg-primary/90 text-white flex items-center justify-center gap-2 h-12 text-base font-medium shadow-lg w-full sm:w-auto"
                      disabled={isDemoMode || !tableExists}
                      onClick={() => {
                        console.log("Add Consumable button clicked")
                        setAddConsumableDialogOpen(true)
                      }}
                    >
                      <Plus className="h-5 w-5" /> Add New Consumable
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Consumable to Inventory</DialogTitle>
                    </DialogHeader>
                    <AddConsumableForm onSuccess={handleAddSuccess} onClose={() => setAddConsumableDialogOpen(false)} />
                  </DialogContent>
                </Dialog>
              )}

              <Button
                variant="outline"
                className="flex items-center justify-center gap-2 h-12 text-base font-medium border-2 hover:bg-accent/10 w-full sm:w-auto bg-transparent"
                onClick={handleExportToExcel}
                disabled={
                  exporting || (activeTab === "plants" ? filteredPlants.length === 0 : filteredConsumables.length === 0)
                }
              >
                {exporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                Export to Excel
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
        </div>
      </div>

      <div className="p-6">
        <Tabs defaultValue="plants" onValueChange={setActiveTab}>
          <TabsList className="mb-4 bg-muted">
            <TabsTrigger value="plants" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Plants & Trees
            </TabsTrigger>
            <TabsTrigger value="consumables" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              Nursery Consumables
            </TabsTrigger>
          </TabsList>

          <TabsContent value="plants">
            {loading ? (
              <div className="text-center py-8">Loading inventory...</div>
            ) : filteredPlants.length === 0 ? (
              <div className="text-center py-8">No plants found</div>
            ) : (
              <div className="space-y-4">
                {filteredPlants.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg border border-border p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="font-medium text-foreground">{item.plant_name}</div>
                        <div className="text-sm text-muted-foreground">{item.scientific_name}</div>
                        <div className="text-xs text-muted-foreground">SKU: {item.sku}</div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Category:</span> {item.category}
                        </div>
                        {item.section && (
                          <div className="text-sm text-muted-foreground">
                            Section {item.section}
                            {item.row ? `, Row ${item.row}` : ""}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Quantity:</span> {item.quantity}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Age:</span> {item.age || "-"}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Date Planted:</span>{" "}
                          {item.date_planted ? new Date(item.date_planted).toLocaleDateString() : "-"}
                        </div>
                        {item.source && <div className="text-sm text-muted-foreground">Source: {item.source}</div>}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Status:</span>
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
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Price:</span> Ksh {item.price.toLocaleString()}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Website:</span>
                          <Badge
                            variant={item.ready_for_sale ? "default" : "outline"}
                            className={item.ready_for_sale ? "bg-primary hover:bg-primary" : "bg-muted hover:bg-muted"}
                          >
                            {item.ready_for_sale ? "Listed" : "Not Listed"}
                          </Badge>
                        </div>
                        {item.ready_for_sale && (
                          <Badge
                            variant="outline"
                            className={
                              item.quantity >= 100
                                ? "bg-green-50 text-green-700 border-green-200"
                                : item.quantity >= 10
                                  ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                  : "bg-red-50 text-red-700 border-red-200"
                            }
                          >
                            {item.quantity >= 100 ? "Available" : item.quantity >= 10 ? "Limited" : "Not Available"}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditItem(item)}
                            disabled={isDemoMode || !tableExists}
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
                        className="border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive bg-transparent"
                        disabled={isDemoMode || !tableExists}
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this item?")) {
                            deleteInventoryItem(item.id)
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="consumables">
            {loading ? (
              <div className="text-center py-8">Loading consumables...</div>
            ) : filteredConsumables.length === 0 ? (
              <div className="text-center py-8">No consumables found</div>
            ) : (
              <div className="space-y-4">
                {filteredConsumables.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg border border-border p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="font-medium text-foreground">{item.plant_name}</div>
                        <div className="text-xs text-muted-foreground">SKU: {item.sku}</div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Category:</span> {getConsumableCategory(item)}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Quantity:</span> {item.quantity}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Unit:</span> {getConsumableUnit(item)}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Purchase Date:</span>{" "}
                          {item.date_planted ? new Date(item.date_planted).toLocaleDateString() : "-"}
                        </div>
                        {item.source && <div className="text-sm text-muted-foreground">Supplier: {item.source}</div>}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Status:</span>
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
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Price:</span> Ksh {item.price.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditItem(item)}
                            disabled={isDemoMode || !tableExists}
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
                        className="border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive bg-transparent"
                        disabled={isDemoMode || !tableExists}
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this item?")) {
                            deleteInventoryItem(item.id)
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
