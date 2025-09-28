
"use client"

import { useState, useEffect } from "react"
import { supabase, isDemoMode, checkTableExists } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { EditInventoryForm } from "@/components/edit-inventory-form"
import { AddImpactStoryForm } from "@/components/add-impact-story-form"
import { EditImpactStoryForm } from "@/components/edit-impact-story-form"
import { demoInventory } from "@/components/demo-data"
import { DemoModeBanner } from "@/components/demo-mode-banner"
import { LoadingSpinner } from "@/components/loading-spinner"
import { 
  Globe, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Package, 
  Loader2,
  Droplets,
  Wheat,
  Trees,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ImpactStory {
  id: string
  title: string
  text: string
  media_urls: string[] | null
  category: 'water' | 'food_security' | 'beautification'
  display_order: number
  is_published: boolean
  created_at: string
  updated_at: string
}

export function WebsiteIntegrationTab() {
  const [inventory, setInventory] = useState<any[]>([])
  const [stories, setStories] = useState<ImpactStory[]>([])
  const [loading, setLoading] = useState(true)
  const [storiesLoading, setStoriesLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All Categories")
  const [statusFilter, setStatusFilter] = useState("all")
  const [editItem, setEditItem] = useState<any>(null)
  const [tableExists, setTableExists] = useState(true)
  const [storiesTableExists, setStoriesTableExists] = useState(false)
  const [activeTab, setActiveTab] = useState("products")
  const { toast } = useToast()

  useEffect(() => {
    async function init() {
      if (isDemoMode) {
        setInventory(demoInventory)
        setStories([])
        setLoading(false)
        setStoriesLoading(false)
        return
      }

      const [inventoryExists, storiesExists] = await Promise.all([
        checkTableExists("inventory"),
        checkTableExists("impact_stories")
      ])
      
      setTableExists(inventoryExists)
      setStoriesTableExists(storiesExists)

      if (!inventoryExists) {
        setInventory(demoInventory)
        setLoading(false)
      } else {
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

      if (storiesExists) {
        fetchStories().catch((error) => {
          console.log("Error loading stories:", error.message)
          setStories([])
          setStoriesLoading(false)
        })
      } else {
        setStories([])
        setStoriesLoading(false)
      }
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
      const { error } = await (supabase.from("inventory") as any)
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

  async function fetchStories() {
    try {
      setStoriesLoading(true)
      const { data, error } = await supabase
        .from('impact_stories')
        .select('*')
        .order('category', { ascending: true })
        .order('display_order', { ascending: true })

      if (error) throw error
      setStories(data || [])
    } catch (error: any) {
      console.error('Error loading stories:', error)
      throw error
    } finally {
      setStoriesLoading(false)
    }
  }

  const handleStoryAdded = (newStory: ImpactStory) => {
    setStories(prev => [...prev, newStory])
    toast({
      title: "Success",
      description: "Impact story added successfully",
    })
  }

  const handleStoryUpdated = (updatedStory: ImpactStory) => {
    setStories(prev => prev.map(story => 
      story.id === updatedStory.id ? updatedStory : story
    ))
    toast({
      title: "Success",
      description: "Impact story updated successfully",
    })
  }

  const toggleStoryPublished = async (story: ImpactStory) => {
    if (isDemoMode || !storiesTableExists) {
      toast({
        title: "Demo Mode",
        description: "Connect to Supabase to manage story visibility",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await (supabase as any)
        .from('impact_stories')
        .update({ is_published: !story.is_published, updated_at: new Date().toISOString() })
        .eq('id', story.id)

      if (error) throw error

      setStories(prev => prev.map(s => 
        s.id === story.id ? { ...s, is_published: !s.is_published } : s
      ))

      toast({
        title: "Success",
        description: `Story ${!story.is_published ? 'published' : 'hidden'}`,
      })
    } catch (error: any) {
      console.error('Error toggling published status:', error)
      toast({
        title: "Error",
        description: "Failed to update story status",
        variant: "destructive",
      })
    }
  }

  const updateStoryOrder = async (storyId: string, newOrder: number) => {
    if (isDemoMode || !storiesTableExists) {
      toast({
        title: "Demo Mode",
        description: "Connect to Supabase to reorder stories",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await (supabase as any)
        .from('impact_stories')
        .update({ display_order: newOrder, updated_at: new Date().toISOString() })
        .eq('id', storyId)

      if (error) throw error

      await fetchStories()
      toast({
        title: "Success",
        description: "Story order updated",
      })
    } catch (error: any) {
      console.error('Error updating order:', error)
      toast({
        title: "Error",
        description: "Failed to update story order",
        variant: "destructive",
      })
    }
  }

  const deleteStory = async (storyId: string) => {
    if (isDemoMode || !storiesTableExists) {
      toast({
        title: "Demo Mode",
        description: "Connect to Supabase to delete stories",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase
        .from('impact_stories')
        .delete()
        .eq('id', storyId)

      if (error) throw error

      setStories(prev => prev.filter(story => story.id !== storyId))
      toast({
        title: "Success",
        description: "Story deleted successfully",
      })
    } catch (error: any) {
      console.error('Error deleting story:', error)
      toast({
        title: "Error",
        description: "Failed to delete story",
        variant: "destructive",
      })
    }
  }

  const getStoriesByCategory = (category: string) => {
    return stories.filter(story => story.category === category)
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
    ...Array.from(new Set(websiteProducts.map(item => item.category).filter(Boolean)))
  ]

  const listedCount = websiteProducts.filter(item => item.ready_for_sale).length
  const unlistedCount = websiteProducts.filter(item => !item.ready_for_sale).length

  const storyStats = {
    total: stories.length,
    published: stories.filter(s => s.is_published).length,
    water: getStoriesByCategory('water').length,
    food_security: getStoriesByCategory('food_security').length,
    beautification: getStoriesByCategory('beautification').length,
  }

  return (
    <div className="space-y-6">
      {(isDemoMode || !tableExists || !storiesTableExists) && (
        <div className="p-6 border-b">
          <DemoModeBanner isDemoMode={isDemoMode} connectionStatus={isDemoMode ? 'demo' : 'connected'} />
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="h-6 w-6" />
            Website Management
          </h2>
          <p className="text-muted-foreground">Manage products and content visible on your website</p>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-auto">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="impact" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Impact Stories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-6 mt-6">

      {/* Products Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="mobile-card bg-blue-50 border-blue-200">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-blue-600 rounded-full">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-blue-800">Total Products</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-900">{websiteProducts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mobile-card bg-green-50 border-green-200">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-green-600 rounded-full">
                <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-green-800">Listed</p>
                <p className="text-lg sm:text-2xl font-bold text-green-900">{listedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mobile-card bg-gray-50 border-gray-200">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-gray-600 rounded-full">
                <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-800">Hidden</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{unlistedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mobile-card bg-purple-50 border-purple-200">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-purple-600 rounded-full">
                <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-purple-800">Visibility Rate</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-900">
                  {websiteProducts.length > 0 ? Math.round((listedCount / websiteProducts.length) * 100) : 0}%
                </p>
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
      </TabsContent>

      <TabsContent value="impact" className="space-y-6 mt-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">Our Impact Page Content</h3>
            <p className="text-muted-foreground">Manage the stories that appear in the "Our Impact" section of your About Us page</p>
          </div>

          {/* Impact Stories Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Stories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{storyStats.total}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Published</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{storyStats.published}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Water</CardTitle>
                <Droplets className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{storyStats.water}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Food Security</CardTitle>
                <Wheat className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{storyStats.food_security}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Beautification</CardTitle>
                <Trees className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{storyStats.beautification}</div>
              </CardContent>
            </Card>
          </div>

          {/* Impact Stories Category Tabs */}
          <Tabs defaultValue="water" className="w-full">
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
              <TabsList className="grid w-full grid-cols-3 md:w-auto">
                <TabsTrigger value="water" className="flex items-center gap-2">
                  <Droplets className="h-4 w-4" />
                  Water
                </TabsTrigger>
                <TabsTrigger value="food_security" className="flex items-center gap-2">
                  <Wheat className="h-4 w-4" />
                  Food Security
                </TabsTrigger>
                <TabsTrigger value="beautification" className="flex items-center gap-2">
                  <Trees className="h-4 w-4" />
                  Beautification
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="water" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-800">
                    {getStoriesByCategory('water').length} stories
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Springs rehabilitation stories
                  </span>
                </div>
                {storiesTableExists && (
                  <AddImpactStoryForm 
                    category="water"
                    onStoryAdded={handleStoryAdded}
                  />
                )}
              </div>
              <StoryList 
                stories={getStoriesByCategory('water')}
                onTogglePublished={toggleStoryPublished}
                onUpdateOrder={updateStoryOrder}
                onDelete={deleteStory}
                onStoryUpdated={handleStoryUpdated}
                isDemo={isDemoMode || !storiesTableExists}
              />
            </TabsContent>

            <TabsContent value="food_security" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800">
                    {getStoriesByCategory('food_security').length} stories
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Food security impact stories
                  </span>
                </div>
                {storiesTableExists && (
                  <AddImpactStoryForm 
                    category="food_security"
                    onStoryAdded={handleStoryAdded}
                  />
                )}
              </div>
              <StoryList 
                stories={getStoriesByCategory('food_security')}
                onTogglePublished={toggleStoryPublished}
                onUpdateOrder={updateStoryOrder}
                onDelete={deleteStory}
                onStoryUpdated={handleStoryUpdated}
                isDemo={isDemoMode || !storiesTableExists}
              />
            </TabsContent>

            <TabsContent value="beautification" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-100 text-purple-800">
                    {getStoriesByCategory('beautification').length} stories
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Community beautification projects
                  </span>
                </div>
                {storiesTableExists && (
                  <AddImpactStoryForm 
                    category="beautification"
                    onStoryAdded={handleStoryAdded}
                  />
                )}
              </div>
              <StoryList 
                stories={getStoriesByCategory('beautification')}
                onTogglePublished={toggleStoryPublished}
                onUpdateOrder={updateStoryOrder}
                onDelete={deleteStory}
                onStoryUpdated={handleStoryUpdated}
                isDemo={isDemoMode || !storiesTableExists}
              />
            </TabsContent>
          </Tabs>
        </div>
      </TabsContent>
      </Tabs>
    </div>
  )
}

interface StoryListProps {
  stories: ImpactStory[]
  onTogglePublished: (story: ImpactStory) => void
  onUpdateOrder: (storyId: string, newOrder: number) => void
  onDelete: (storyId: string) => void
  onStoryUpdated: (story: ImpactStory) => void
  isDemo: boolean
}

function StoryList({ stories, onTogglePublished, onUpdateOrder, onDelete, onStoryUpdated, isDemo }: StoryListProps) {
  if (stories.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-medium">No stories yet</h3>
            <p className="text-muted-foreground">
              Add your first impact story to get started
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {stories.map((story, index) => (
        <Card key={story.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold">{story.title}</h3>
                  <Badge variant={story.is_published ? "default" : "secondary"}>
                    {story.is_published ? "Published" : "Draft"}
                  </Badge>
                  {story.media_urls && story.media_urls.length > 0 && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <ImageIcon className="h-3 w-3" />
                      {story.media_urls.length} media
                    </Badge>
                  )}
                </div>
                
                <p className="text-muted-foreground line-clamp-3">
                  {story.text}
                </p>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Order: {story.display_order}</span>
                  <span>•</span>
                  <span>Updated: {new Date(story.updated_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                {/* Order controls */}
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onUpdateOrder(story.id, story.display_order - 1)}
                    disabled={index === 0 || isDemo}
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onUpdateOrder(story.id, story.display_order + 1)}
                    disabled={index === stories.length - 1 || isDemo}
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>

                {/* Visibility toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onTogglePublished(story)}
                  disabled={isDemo}
                >
                  {story.is_published ? (
                    <Eye className="h-4 w-4 text-green-600" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  )}
                </Button>

                {/* Edit button */}
                <EditImpactStoryForm 
                  story={story}
                  onStoryUpdated={onStoryUpdated}
                />

                {/* Delete button */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" disabled={isDemo}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Story</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{story.title}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(story.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
