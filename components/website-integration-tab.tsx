
"use client"

import { useState, useEffect } from "react"
import { supabase, isDemoMode, checkTableExists } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { EditInventoryForm } from "@/components/edit-inventory-form"
import { demoInventory } from "@/components/demo-data"
import { DemoModeBanner } from "@/components/demo-mode-banner"
import { Globe, Edit, Trash2, Eye, EyeOff, Package, Loader2 } from "lucide-react"

export function WebsiteIntegrationTab() {
  const [inventory, setInventory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All Categories")
  const [statusFilter, setStatusFilter] = useState("all")
  const [editItem, setEditItem] = useState<any>(null)
  const [tableExists, setTableExists] = useState(true)
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
        toast({
          title: "Connection Issue",
          description: "Unable to connect to database. Using demo data.",
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
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setInventory(data || [])
    } catch (error: any) {
      console.error("Error fetching inventory:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  async function toggleWebsiteListing(itemId: string, currentStatus: boolean) {
    if (isDemoMode || !tableExists) {
      toast({
        title: "Demo Mode",
        description: "Connect to Supabase to enable website listing management",
        variant: "destructive",
      })
      return
    }

    try {
      setUpdating(itemId)
      const { error } = await supabase
        .from("inventory")
        .update({ 
          ready_for_sale: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", itemId)

      if (error) throw error

      toast({
        title: "Success",
        description: `Product ${!currentStatus ? 'listed on' : 'hidden from'} website`,
      })

      await fetchInventory()
    } catch (error: any) {
      console.error("Error updating listing status:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update listing status",
        variant: "destructive",
      })
    } finally {
      setUpdating(null)
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

      if (error) throw error

      toast({
        title: "Success",
        description: "Product deleted successfully",
      })

      await fetchInventory()
    } catch (error: any) {
      console.error("Error deleting item:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete item",
        variant: "destructive",
      })
    }
  }

  // Filter products that can be listed on website (excluding consumables marked with internal categories)
  const websiteProducts = inventory.filter(item => {
    // Include plants, honey, and consumables that are not marked as internal-only
    return !item.category?.startsWith("[Internal]") && 
           item.quantity > 0 // Only show items in stock
  })

  const filteredProducts = websiteProducts.filter((item) => {
    const matchesSearch = 
      item.plant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.scientific_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = categoryFilter === "All Categories" || item.category === categoryFilter
    
    const matchesStatus = 
      statusFilter === "all" || 
      (statusFilter === "listed" && item.ready_for_sale) ||
      (statusFilter === "unlisted" && !item.ready_for_sale)

    return matchesSearch && matchesCategory && matchesStatus
  })

  const categories = [
    "All Categories",
    ...new Set(websiteProducts.map(item => item.category).filter(Boolean))
  ]

  const listedCount = websiteProducts.filter(item => item.ready_for_sale).length
  const unlistedCount = websiteProducts.filter(item => !item.ready_for_sale).length

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
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="h-6 w-6" />
            Website Management
          </h2>
          <p className="text-muted-foreground">Manage which products are visible on your website</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-full">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800">Total Products</p>
                <p className="text-2xl font-bold text-blue-900">{websiteProducts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-600 rounded-full">
                <Eye className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-800">Listed</p>
                <p className="text-2xl font-bold text-green-900">{listedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-600 rounded-full">
                <EyeOff className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Hidden</p>
                <p className="text-2xl font-bold text-gray-900">{unlistedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search products..."
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
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="listed">Listed</SelectItem>
                  <SelectItem value="unlisted">Hidden</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Package className="h-8 w-8 animate-pulse mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No products found</h3>
          <p className="text-muted-foreground">
            {searchTerm || categoryFilter !== "All Categories" || statusFilter !== "all"
              ? "Try adjusting your search or filters"
              : "No products available for website listing"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((item) => (
            <Card key={item.id} className="transition-all hover:shadow-md h-fit max-w-sm mx-auto w-full">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <Badge variant="outline" className="text-xs truncate max-w-[140px]">
                    {item.category}
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
                        if (confirm("Are you sure you want to delete this product?")) {
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

                {/* Product Image */}
                {item.image_url && (
                  <div className="mb-3">
                    <img 
                      src={item.image_url} 
                      alt={item.plant_name}
                      className="w-full h-32 object-cover rounded-md border border-gray-200"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-base leading-tight line-clamp-2">{item.plant_name}</h3>
                    {item.scientific_name && (
                      <p className="text-xs text-muted-foreground italic truncate">{item.scientific_name}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block">Stock:</span>
                      <p className="font-medium truncate">{item.quantity}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Price:</span>
                      <p className="font-medium truncate">Ksh {item.price}</p>
                    </div>
                    {item.sku && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground block">SKU:</span>
                        <p className="font-medium text-xs truncate">{item.sku}</p>
                      </div>
                    )}
                  </div>

                  {/* Website Listing Toggle */}
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">List on Website</span>
                        {item.ready_for_sale ? (
                          <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-200">
                            <Eye className="h-3 w-3 mr-1" />
                            Visible
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-gray-100 text-gray-800 border-gray-200">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Hidden
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center">
                        {updating === item.id && (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        )}
                        <Switch
                          checked={item.ready_for_sale || false}
                          onCheckedChange={() => toggleWebsiteListing(item.id, item.ready_for_sale)}
                          disabled={isDemoMode || !tableExists || updating === item.id}
                        />
                      </div>
                    </div>
                  </div>

                  {item.description && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      {editItem && (
        <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Product: {editItem.plant_name}</DialogTitle>
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
