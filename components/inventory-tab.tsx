"use client"

import { useState, useEffect } from "react"
import { supabase, isDemoMode, checkTableExists } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AddInventoryForm } from "@/components/add-inventory-form"
import { EditInventoryForm } from "@/components/edit-inventory-form"
import { useToast } from "@/components/ui/use-toast"
import { demoInventory } from "@/components/demo-data"
import { DemoModeBanner } from "@/components/demo-mode-banner"
import { exportToExcel, formatInventoryForExport } from "@/lib/excel-export"
import { Download, Loader2, Plus, Edit, Trash2, Package, FileText, TrendingUp, Search } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useIsMobile } from "@/hooks/use-mobile"

export function InventoryTab() {
  const [inventory, setInventory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All Categories")
  const [editItem, setEditItem] = useState<any>(null)
  const [tableExists, setTableExists] = useState(true)
  const [addPlantDialogOpen, setAddPlantDialogOpen] = useState(false)
  const { toast } = useToast()
  const [plantStatusFilter, setPlantStatusFilter] = useState("all")
  const [filteredInventory, setFilteredInventory] = useState<any[]>([])
  const isMobile = useIsMobile()

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
      const { data, error } = await supabase.from("inventory").select("*").order("created_at", { ascending: false })

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

  useEffect(() => {
    let filtered = inventory

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.plant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.scientific_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.sku?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (categoryFilter !== "All Categories") {
      filtered = filtered.filter((item) => item.category === categoryFilter)
    }

    // Filter by plant status (Current vs Future)
    if (plantStatusFilter !== "all") {
      if (plantStatusFilter === "current") {
        filtered = filtered.filter((item) => item.ready_for_sale === true)
      } else if (plantStatusFilter === "future") {
        filtered = filtered.filter((item) => item.ready_for_sale === false)
      }
    }

    setFilteredInventory(filtered)
  }, [inventory, searchTerm, categoryFilter, plantStatusFilter])

  const filteredPlants = filteredInventory.filter((item) => !isConsumable(item))

  const plantCategories = [
    "All Categories",
    ...new Set(inventory.filter((item) => !isConsumable(item) && item.category).map((item) => item.category)),
  ].filter(Boolean)

  const handleExportToExcel = async () => {
    try {
      setExporting(true)

      const exportData = formatInventoryForExport(filteredPlants, false)
      const fileName = `Plants_Export_${new Date().toISOString().split("T")[0]}`

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

  const currentPlants = inventory.filter((item) => !isConsumable(item) && item.ready_for_sale === true)
  const futurePlants = inventory.filter((item) => !isConsumable(item) && item.ready_for_sale === false)

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${isMobile ? "mobile-loading" : ""}`}>
        <div className="text-center">
          <Package className={`${isMobile ? "h-8 w-8" : "h-8 w-8"} animate-pulse mx-auto mb-2 text-muted-foreground`} />
          <p className="text-muted-foreground">Loading plants...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${isMobile ? "mobile-content" : ""}`}>
      {(isDemoMode || !tableExists) && (
        <div className={`${isMobile ? "mobile-section" : "p-6 border-b"}`}>
          <DemoModeBanner isDemoMode={isDemoMode} tablesNotFound={!tableExists} />
        </div>
      )}

      {/* Header */}
      <div
        className={`${isMobile ? "mobile-section" : "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"}`}
      >
        <div className={isMobile ? "mb-4" : ""}>
          <h2 className={`${isMobile ? "text-xl" : "text-2xl"} font-bold`}>Plant Inventory</h2>
          <p className={`text-muted-foreground ${isMobile ? "text-sm" : ""}`}>
            Manage your current nursery stock and future planting plans
          </p>
        </div>
        <div className={`${isMobile ? "mobile-button-group" : "flex gap-3"}`}>
          <Dialog open={addPlantDialogOpen} onOpenChange={setAddPlantDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className={`bg-primary hover:bg-primary/90 ${isMobile ? "mobile-touch-target" : ""}`}
                disabled={isDemoMode || !tableExists}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Plant
              </Button>
            </DialogTrigger>
            <DialogContent
              className={`${isMobile ? "mobile-dialog" : "sm:max-w-[600px] max-h-[90vh] overflow-y-auto"}`}
            >
              <DialogHeader>
                <DialogTitle>Add New Plant</DialogTitle>
              </DialogHeader>
              <div className={isMobile ? "mobile-dialog-content" : ""}>
                <AddInventoryForm onSuccess={handleAddSuccess} onClose={() => setAddPlantDialogOpen(false)} />
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            onClick={handleExportToExcel}
            disabled={exporting || filteredPlants.length === 0}
            className={isMobile ? "mobile-touch-target" : ""}
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={`${isMobile ? "mobile-stats-grid" : "grid grid-cols-1 md:grid-cols-3 gap-4"}`}>
        <Card className={`bg-green-50 border-green-200 ${isMobile ? "mobile-stats-card" : ""}`}>
          <CardContent className={isMobile ? "p-4" : "p-4"}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-600 rounded-full">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className={`${isMobile ? "text-xs" : "text-sm"} font-medium text-green-800`}>In Nursery</p>
                <p className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-green-900`}>
                  {currentPlants.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-blue-50 border-blue-200 ${isMobile ? "mobile-stats-card" : ""}`}>
          <CardContent className={isMobile ? "p-4" : "p-4"}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-full">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className={`${isMobile ? "text-xs" : "text-sm"} font-medium text-blue-800`}>Future Plans</p>
                <p className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-blue-900`}>{futurePlants.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gray-50 border-gray-200 ${isMobile ? "mobile-stats-card" : ""}`}>
          <CardContent className={isMobile ? "p-4" : "p-4"}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-600 rounded-full">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className={`${isMobile ? "text-xs" : "text-sm"} font-medium text-gray-800`}>Total Plants</p>
                <p className={`${isMobile ? "text-xl" : "text-2xl"} font-bold text-gray-900`}>
                  {inventory.filter((item) => !isConsumable(item)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className={isMobile ? "mobile-search-container" : ""}>
        <CardContent className={isMobile ? "p-4" : "p-4"}>
          <div className={`${isMobile ? "mobile-filter-row" : "flex flex-col sm:flex-row gap-4"}`}>
            <div className={`${isMobile ? "relative" : "flex-1"}`}>
              {isMobile && (
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              )}
              <Input
                placeholder="Search plants by name, scientific name, or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${isMobile ? "pl-10 mobile-touch-target" : "w-full"}`}
              />
            </div>
            <div className={`${isMobile ? "grid grid-cols-2 gap-2" : "flex gap-2"}`}>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className={`${isMobile ? "mobile-touch-target" : "w-40"}`}>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {plantCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={plantStatusFilter} onValueChange={setPlantStatusFilter}>
                <SelectTrigger className={`${isMobile ? "mobile-touch-target" : "w-32"}`}>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plants</SelectItem>
                  <SelectItem value="current">In Nursery</SelectItem>
                  <SelectItem value="future">Future Plans</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plant Grid */}
      {filteredPlants.length === 0 ? (
        <div className={`${isMobile ? "mobile-empty-state" : "text-center py-12"}`}>
          <Package className={`${isMobile ? "h-12 w-12" : "h-12 w-12"} mx-auto text-muted-foreground mb-4`} />
          <h3 className={`${isMobile ? "text-lg" : "text-lg"} font-semibold mb-2`}>No plants found</h3>
          <p className={`text-muted-foreground mb-4 ${isMobile ? "text-sm" : ""}`}>
            {searchTerm || categoryFilter !== "All Categories" || plantStatusFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Start by adding your first plant"}
          </p>
          <Dialog open={addPlantDialogOpen} onOpenChange={setAddPlantDialogOpen}>
            <DialogTrigger asChild>
              <Button className={isMobile ? "mobile-touch-target" : ""}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Plant
              </Button>
            </DialogTrigger>
            <DialogContent className={`${isMobile ? "mobile-dialog" : "sm:max-w-[600px]"}`}>
              <DialogHeader>
                <DialogTitle>Add New Plant</DialogTitle>
              </DialogHeader>
              <AddInventoryForm onSuccess={handleAddSuccess} onClose={() => setAddPlantDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <div className={`${isMobile ? "mobile-plant-grid" : "grid gap-4 md:grid-cols-2 lg:grid-cols-3"}`}>
          {filteredPlants.map((item) => {
            const isCurrentPlant = item.ready_for_sale === true

            return (
              <Card
                key={item.id}
                className={`transition-all hover:shadow-md ${
                  isCurrentPlant ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"
                } ${isMobile ? "mobile-product-card" : ""}`}
              >
                <CardContent className={isMobile ? "p-4" : "p-4"}>
                  {/* Status Badge */}
                  <div className={`${isMobile ? "product-header" : "flex justify-between items-start"} mb-3`}>
                    <Badge
                      className={
                        isCurrentPlant
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }
                    >
                      {isCurrentPlant ? "🌱 In Nursery" : "📋 Future Plan"}
                    </Badge>
                    <div className={`${isMobile ? "product-actions" : "flex gap-1"}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditItem(item)}
                        className={`${isMobile ? "flex-1" : "h-8 w-8 p-0"}`}
                      >
                        <Edit className="h-4 w-4" />
                        {isMobile && <span className="ml-1">Edit</span>}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this plant?")) {
                            deleteInventoryItem(item.id)
                          }
                        }}
                        className={`${isMobile ? "flex-1 text-destructive hover:text-destructive" : "h-8 w-8 p-0 text-destructive hover:text-destructive"}`}
                      >
                        <Trash2 className="h-4 w-4" />
                        {isMobile && <span className="ml-1">Delete</span>}
                      </Button>
                    </div>
                  </div>

                  {/* Plant Info */}
                  <div className="space-y-3">
                    <div>
                      <h3 className={`${isMobile ? "text-base" : "text-lg"} font-semibold`}>{item.plant_name}</h3>
                      {item.scientific_name && (
                        <p className={`${isMobile ? "text-xs" : "text-sm"} text-muted-foreground italic`}>
                          {item.scientific_name}
                        </p>
                      )}
                    </div>

                    <div className={`grid grid-cols-2 gap-2 ${isMobile ? "text-xs" : "text-sm"}`}>
                      <div>
                        <span className="text-muted-foreground">Quantity:</span>
                        <p className="font-medium">{item.quantity}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Price:</span>
                        <p className="font-medium">Ksh {item.price}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Category:</span>
                        <p className={`font-medium ${isMobile ? "text-xs" : "text-xs"}`}>{item.category}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge
                          variant="outline"
                          className={`ml-2 ${
                            item.status === "Healthy"
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-yellow-100 text-yellow-800 border-yellow-200"
                          }`}
                        >
                          {item.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Additional Info */}
                    {(item.age || item.section || item.source) && (
                      <div
                        className={`pt-2 border-t ${isMobile ? "text-xs" : "text-xs"} text-muted-foreground space-y-1`}
                      >
                        {item.age && <p>Age: {item.age}</p>}
                        {item.section && (
                          <p>
                            Location: Section {item.section}
                            {item.row ? `, Row ${item.row}` : ""}
                          </p>
                        )}
                        {item.source && <p>Source: {item.source}</p>}
                      </div>
                    )}

                    {/* Description */}
                    {item.description && (
                      <div className="pt-2 border-t">
                        <p className={`${isMobile ? "text-xs" : "text-xs"} text-muted-foreground line-clamp-2`}>
                          {item.description}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Edit Dialog */}
      {editItem && (
        <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
          <DialogContent className={`${isMobile ? "mobile-dialog" : "max-w-2xl"}`}>
            <DialogHeader>
              <DialogTitle>Edit {editItem.plant_name}</DialogTitle>
            </DialogHeader>
            <EditInventoryForm
              item={editItem}
              onSuccess={() => {
                setEditItem(null)
                fetchInventory()
              }}
              onCancel={() => setEditItem(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
