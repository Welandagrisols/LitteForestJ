"use client"

import { useState, useEffect } from "react"
import { supabase, isDemoMode, checkTableExists } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AddInventoryForm } from "@/components/add-inventory-form"
import { AddConsumableForm } from "@/components/add-consumable-form"
import { AddHoneyForm } from "@/components/add-honey-form"
import { EditInventoryForm } from "@/components/edit-inventory-form"
import { useToast } from "@/components/ui/use-toast"
import { demoInventory } from "@/components/demo-data"
import { DemoModeBanner } from "@/components/demo-mode-banner"
import { exportToExcel, formatInventoryForExport } from "@/lib/excel-export"
import { Download, Loader2, Plus, Edit, Trash2, Package, FileText, TrendingUp, ShoppingCart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
  const [addHoneyDialogOpen, setAddHoneyDialogOpen] = useState(false)
  const { toast } = useToast()
  const [plantStatusFilter, setPlantStatusFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

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
        toast({
          title: "Connection Issue",
          description: "Unable to connect to database. Using demo data. Check your internet connection and Supabase settings.",
          variant: "destructive",
        })
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
      setAddConsumableDialogOpen(false)
      setAddHoneyDialogOpen(false)
    } catch (error) {
      console.error("Error refreshing inventory:", error)
    }
  }

  const isConsumable = (item: any) => {
    return (
      (item.category && item.category.startsWith("Consumable:")) ||
      (item.scientific_name && item.scientific_name.startsWith("[Consumable]")) ||
      item.item_type === "Consumable"
    )
  }

  const getConsumableUnit = (item: any) => {
    if (item.scientific_name && item.scientific_name.startsWith("[Consumable]")) {
      return item.scientific_name.replace("[Consumable] ", "")
    }
    return item.unit || "Pieces"
  }

  const getConsumableCategory = (item: any) => {
    if (item.category && item.category.startsWith("Consumable:")) {
      return item.category.replace("Consumable: ", "")
    }
    return item.category
  }

  // Filter functions
  const filteredPlants = inventory
    .filter((item) => !isConsumable(item))
    .filter((item) => {
      const matchesSearch =
        item.plant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.scientific_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory = categoryFilter === "All Categories" || item.category === categoryFilter
      const matchesStatus = statusFilter === "all" || item.status === statusFilter

      let matchesPlantStatus = true
      if (plantStatusFilter === "current") {
        matchesPlantStatus = item.ready_for_sale === true
      } else if (plantStatusFilter === "nursery-not-ready") {
        // Plants in nursery but not ready for sale (not future plans)
        matchesPlantStatus = item.ready_for_sale === false && 
          (item.source !== 'Future Plants List' && 
           item.source !== 'Future Plans' &&
           !item.source?.toLowerCase().includes('future'))
      } else if (plantStatusFilter === "future") {
        // Future plans only
        matchesPlantStatus = item.ready_for_sale === false && 
          (item.source === 'Future Plants List' || 
           item.source === 'Future Plans' ||
           item.source?.toLowerCase().includes('future'))
      }

      return matchesSearch && matchesCategory && matchesStatus && matchesPlantStatus
    })
    .sort((a, b) => {
      // First sort by ready_for_sale status (ready plants first)
      if (a.ready_for_sale !== b.ready_for_sale) {
        return b.ready_for_sale ? 1 : -1
      }
      // Then sort alphabetically by plant name
      return a.plant_name.localeCompare(b.plant_name)
    })

  const filteredConsumables = inventory
    .filter((item) => isConsumable(item))
    .filter((item) => {
      const matchesSearch =
        item.plant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()))

      const actualCategory = getConsumableCategory(item)
      const matchesCategory = categoryFilter === "All Categories" || actualCategory === categoryFilter
      const matchesStatus = statusFilter === "all" || item.status === statusFilter

      return matchesSearch && matchesCategory && matchesStatus
    })

  const filteredHoneyProducts = inventory
    .filter(item => item.item_type === "Honey")
    .filter(item => {
      const matchesSearch = !searchTerm || 
        item.plant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.scientific_name?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory = categoryFilter === "All Categories" || item.category === categoryFilter
      const matchesStatus = statusFilter === "all" || item.status === statusFilter

      return matchesSearch && matchesCategory && matchesStatus
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

  // Summary calculations
  const currentPlants = inventory.filter((item) => !isConsumable(item) && item.ready_for_sale === true)
  const nurseryNotReady = inventory.filter((item) => !isConsumable(item) && item.ready_for_sale === false && 
    (item.source !== 'Future Plants List' && item.source !== 'Future Plans' && !item.source?.toLowerCase().includes('future')))
  const futurePlants = inventory.filter((item) => !isConsumable(item) && item.ready_for_sale === false && 
    (item.source === 'Future Plants List' || item.source === 'Future Plans' || item.source?.toLowerCase().includes('future')))
  const totalConsumables = inventory.filter((item) => isConsumable(item))

  return (
    <div className="space-y-6">
      {(isDemoMode || !tableExists) && (
        <div className="p-6 border-b">
          <DemoModeBanner isDemoMode={isDemoMode} tablesNotFound={!tableExists} />
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Inventory Management</h2>
          <p className="text-muted-foreground">Manage your plants and consumables inventory</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-600 rounded-full">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-800">Ready Plants</p>
                <p className="text-2xl font-bold text-green-900">{currentPlants.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-600 rounded-full">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-800">In Nursery (Not Ready)</p>
                <p className="text-2xl font-bold text-amber-900">{nurseryNotReady.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-full">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800">Future Plans</p>
                <p className="text-2xl font-bold text-blue-900">{futurePlants.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-600 rounded-full">
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-800">Consumables</p>
                <p className="text-2xl font-bold text-purple-900">{totalConsumables.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-600 rounded-full">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{inventory.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Inventory Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="plants" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Plants ({filteredPlants.length})
            </TabsTrigger>
            <TabsTrigger value="honey" className="flex items-center gap-2">
              🍯
              Honey ({filteredHoneyProducts.length})
            </TabsTrigger>
            <TabsTrigger value="consumables" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Consumables ({filteredConsumables.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Dialog open={addPlantDialogOpen} onOpenChange={setAddPlantDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant={activeTab === "plants" ? "default" : "outline"}
                  disabled={isDemoMode || !tableExists || activeTab !== "plants"}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Plant
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Plant</DialogTitle>
                </DialogHeader>
                <AddInventoryForm onSuccess={handleAddSuccess} onClose={() => setAddPlantDialogOpen(false)} />
              </DialogContent>
            </Dialog>

            <Dialog open={addConsumableDialogOpen} onOpenChange={setAddConsumableDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant={activeTab === "consumables" ? "default" : "outline"}
                  disabled={isDemoMode || !tableExists || activeTab !== "consumables"}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Consumable
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Consumable</DialogTitle>
                </DialogHeader>
                <AddConsumableForm onSuccess={handleAddSuccess} onClose={() => setAddConsumableDialogOpen(false)} />
              </DialogContent>
            </Dialog>

             <Dialog open={addHoneyDialogOpen} onOpenChange={setAddHoneyDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant={activeTab === "honey" ? "default" : "outline"}
                  disabled={isDemoMode || !tableExists || activeTab !== "honey"}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Honey
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Honey Product</DialogTitle>
                </DialogHeader>
                <AddHoneyForm onSuccess={handleAddSuccess} onClose={() => setAddHoneyDialogOpen(false)} />
              </DialogContent>
            </Dialog>

            <Button variant="outline" onClick={handleExportToExcel} disabled={exporting}>
              {exporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
              Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder={`Search ${activeTab === "plants" ? "plants" : "consumables"}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(activeTab === "plants" ? plantCategories : consumableCategories).map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {activeTab === "plants" && (
                  <Select value={plantStatusFilter} onValueChange={setPlantStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Plants</SelectItem>
                      <SelectItem value="current">Ready for Sale</SelectItem>
                      <SelectItem value="nursery-not-ready">In Nursery (Not Ready)</SelectItem>
                      <SelectItem value="future">Future Plans</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {activeTab === "plants" ? (
                      <>
                        <SelectItem value="Healthy">Healthy</SelectItem>
                        <SelectItem value="Attention">Needs Attention</SelectItem>
                        <SelectItem value="Critical">Critical</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="Available">Available</SelectItem>
                        <SelectItem value="Low Stock">Low Stock</SelectItem>
                        <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plants Tab */}
        <TabsContent value="plants" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Package className="h-8 w-8 animate-pulse mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">Loading plants...</p>
              </div>
            </div>
          ) : filteredPlants.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No plants found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || categoryFilter !== "All Categories" || plantStatusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Start by adding your first plant"}
              </p>
              <Dialog open={addPlantDialogOpen} onOpenChange={setAddPlantDialogOpen}>
                <DialogTrigger asChild>
                  <Button disabled={isDemoMode || !tableExists}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Plant
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Add New Plant</DialogTitle>
                  </DialogHeader>
                  <AddInventoryForm onSuccess={handleAddSuccess} onClose={() => setAddPlantDialogOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredPlants.map((item) => {
                const isCurrentPlant = item.ready_for_sale === true
                const isNurseryNotReady = item.ready_for_sale === false && 
                  (item.source !== 'Future Plants List' && item.source !== 'Future Plans' && !item.source?.toLowerCase().includes('future'))
                const isFuturePlan = item.ready_for_sale === false && !isNurseryNotReady

                return (
                  <Card
                    key={item.id}
                    className={`transition-all hover:shadow-md h-fit max-w-sm mx-auto w-full ${
                      isCurrentPlant ? "bg-green-50 border-green-200" : 
                      isNurseryNotReady ? "bg-amber-50 border-amber-200" : 
                      "bg-blue-50 border-blue-200"
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <Badge
                          className={`text-xs truncate max-w-[140px] ${
                            isCurrentPlant
                              ? "bg-green-600 hover:bg-green-700 text-white"
                              : isNurseryNotReady
                              ? "bg-amber-600 hover:bg-amber-700 text-white"
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                          }`}
                        >
                          {isCurrentPlant ? "🌱 Ready" : isNurseryNotReady ? "🚧 In Nursery" : "📋 Future"}
                        </Badge>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setEditItem(item)} 
                            className="h-7 w-7 p-0"
                            disabled={isDemoMode || !tableExists}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this plant?")) {
                                deleteInventoryItem(item.id)
                              }
                            }}
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            disabled={isDemoMode || !tableExists}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-base leading-tight line-clamp-2">{item.plant_name}</h3>
                          {item.scientific_name && (
                            <p className="text-xs text-muted-foreground italic truncate">{item.scientific_name}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground block">Qty:</span>
                            <p className="font-medium truncate">{item.quantity}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground block">Price:</span>
                            <p className="font-medium truncate">Ksh {item.price}</p>
                          </div>
                          <div className="col-span-2">
                            <span className="text-muted-foreground block">Category:</span>
                            <p className="font-medium text-xs truncate">{item.category}</p>
                          </div>
                          <div className="col-span-2">
                            <span className="text-muted-foreground block">Status:</span>
                            <Badge
                              variant="outline"
                              className={`text-xs h-5 ${
                                item.status === "Healthy"
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : "bg-yellow-100 text-yellow-800 border-yellow-200"
                              }`}
                            >
                              {item.status}
                            </Badge>
                          </div>
                        </div>

                        {(item.age || item.section || item.source) && (
                          <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
                            {item.age && <p className="truncate">Age: {item.age}</p>}
                            {item.section && (
                              <p className="truncate">
                                Location: Section {item.section}
                                {item.row ? `, Row ${item.row}` : ""}
                              </p>
                            )}
                            {item.source && <p className="truncate">Source: {item.source}</p>}
                          </div>
                        )}

                        {item.description && (
                          <div className="pt-2 border-t">
                            <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
         {/* Honey Tab */}
         <TabsContent value="honey" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <ShoppingCart className="h-8 w-8 animate-pulse mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">Loading Honey Products...</p>
              </div>
            </div>
          ) : filteredHoneyProducts.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Honey Products found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || categoryFilter !== "All Categories"
                  ? "Try adjusting your search or filters"
                  : "Start by adding your first Honey Product"}
              </p>
              <Dialog open={addHoneyDialogOpen} onOpenChange={setAddHoneyDialogOpen}>
                <DialogTrigger asChild>
                  <Button disabled={isDemoMode || !tableExists}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Honey Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Add New Honey Product</DialogTitle>
                  </DialogHeader>
                  <AddHoneyForm onSuccess={handleAddSuccess} onClose={() => setAddHoneyDialogOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredHoneyProducts.map((item) => (
                <Card key={item.id} className="transition-all hover:shadow-md bg-purple-50 border-purple-200 h-fit max-w-sm mx-auto w-full">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <Badge className="bg-purple-600 hover:bg-purple-700 text-white text-xs truncate max-w-[140px]">
                        🍯 Honey
                      </Badge>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setEditItem(item)} 
                          className="h-7 w-7 p-0"
                          disabled={isDemoMode || !tableExists}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this Honey Product?")) {
                              deleteInventoryItem(item.id)
                            }
                          }}
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          disabled={isDemoMode || !tableExists}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-base leading-tight line-clamp-2">{item.plant_name}</h3>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground block">Qty:</span>
                          <p className="font-medium truncate">{item.quantity}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Price/Unit:</span>
                          <p className="font-medium truncate">Ksh {item.price}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground block">SKU:</span>
                          <p className="font-medium text-xs truncate">{item.sku}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground block">Status:</span>
                          <Badge
                            variant="outline"
                            className={`text-xs h-5 ${
                              item.status === "Available"
                                ? "bg-green-100 text-green-800 border-green-200"
                                : item.status === "Low Stock"
                                ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                : "bg-red-100 text-red-800 border-red-200"
                            }`}
                          >
                            {item.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        {/* Consumables Tab */}
        <TabsContent value="consumables" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <ShoppingCart className="h-8 w-8 animate-pulse mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">Loading consumables...</p>
              </div>
            </div>
          ) : filteredConsumables.length === 0 ?```text
(
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No consumables found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || categoryFilter !== "All Categories"
                  ? "Try adjusting your search or filters"
                  : "Start by adding your first consumable"}
              </p>
              <Dialog open={addConsumableDialogOpen} onOpenChange={setAddConsumableDialogOpen}>
                <DialogTrigger asChild>
                  <Button disabled={isDemoMode || !tableExists}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Consumable
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Add New Consumable</DialogTitle>
                  </DialogHeader>
                  <AddConsumableForm onSuccess={handleAddSuccess} onClose={() => setAddConsumableDialogOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredConsumables.map((item) => (
                <Card key={item.id} className="transition-all hover:shadow-md bg-purple-50 border-purple-200 h-fit max-w-sm mx-auto w-full">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <Badge className="bg-purple-600 hover:bg-purple-700 text-white text-xs truncate max-w-[140px]">
                        🛒 {getConsumableCategory(item)}
                      </Badge>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setEditItem(item)} 
                          className="h-7 w-7 p-0"
                          disabled={isDemoMode || !tableExists}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this consumable?")) {
                              deleteInventoryItem(item.id)
                            }
                          }}
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          disabled={isDemoMode || !tableExists}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-base leading-tight line-clamp-2">{item.plant_name}</h3>
                        <p className="text-xs text-muted-foreground truncate">Unit: {getConsumableUnit(item)}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground block">Qty:</span>
                          <p className="font-medium truncate">{item.quantity}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Price/Unit:</span>
                          <p className="font-medium truncate">Ksh {item.price}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground block">SKU:</span>
                          <p className="font-medium text-xs truncate">{item.sku}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground block">Status:</span>
                          <Badge
                            variant="outline"
                            className={`text-xs h-5 ${
                              item.status === "Available"
                                ? "bg-green-100 text-green-800 border-green-200"
                                : item.status === "Low Stock"
                                ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                : "bg-red-100 text-red-800 border-red-200"
                            }`}
                          >
                            {item.status}
                          </Badge>
                        </div>
                      </div>

                      {(item.section || item.source) && (
                        <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
                          {item.section && <p className="truncate">Storage: {item.section}</p>}
                          {item.source && <p className="truncate">Supplier: {item.source}</p>}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      {editItem && (
        <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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