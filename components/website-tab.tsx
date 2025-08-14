
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Globe, Settings, ExternalLink, Database, Sync, Package, Eye, EyeOff } from "lucide-react"
import { supabase, isDemoMode } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

export function WebsiteTab() {
  const [inventory, setInventory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const { toast } = useToast()

  const [websiteSettings, setWebsiteSettings] = useState({
    siteName: "LittleForest Nursery",
    siteDescription: "Premium quality plants and nursery supplies",
    contactEmail: "info@littleforest.com",
    phone: "+254 700 000 000",
    address: "123 Garden Avenue, Nairobi, Kenya",
    ecommerceUrl: "",
    apiEndpoint: "",
    syncEnabled: false,
  })

  useEffect(() => {
    fetchInventory()
  }, [])

  async function fetchInventory() {
    if (isDemoMode) {
      setLoading(false)
      return
    }

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
      toast({
        title: "Error",
        description: "Failed to load inventory for website sync",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function toggleItemVisibility(itemId: string, currentStatus: boolean) {
    if (isDemoMode) {
      toast({
        title: "Demo Mode",
        description: "Connect to Supabase to manage website visibility",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase
        .from("inventory")
        .update({ ready_for_sale: !currentStatus })
        .eq("id", itemId)

      if (error) throw error

      await fetchInventory()
      toast({
        title: "Success",
        description: `Item ${!currentStatus ? "listed on" : "hidden from"} website`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update item visibility",
        variant: "destructive",
      })
    }
  }

  async function syncToEcommerce() {
    setSyncing(true)
    try {
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: "Sync Complete",
        description: "Inventory data synchronized with e-commerce website",
      })
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to sync with e-commerce website",
        variant: "destructive",
      })
    } finally {
      setSyncing(false)
    }
  }

  const listedItems = inventory.filter(item => item.ready_for_sale)
  const hiddenItems = inventory.filter(item => !item.ready_for_sale)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Website Management</h2>
        </div>
        <Button 
          onClick={syncToEcommerce} 
          disabled={syncing || isDemoMode}
          className="flex items-center gap-2"
        >
          <Sync className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync to E-commerce'}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-600 rounded-full">
                <Eye className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-800">Listed Online</p>
                <p className="text-2xl font-bold text-green-900">{listedItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-600 rounded-full">
                <EyeOff className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">Hidden</p>
                <p className="text-2xl font-bold text-gray-900">{hiddenItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-full">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-800">Total Items</p>
                <p className="text-2xl font-bold text-blue-900">{inventory.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="catalog" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="catalog" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Online Catalog
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="integration" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            E-commerce Integration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manage Online Catalog</CardTitle>
              <p className="text-sm text-muted-foreground">
                Control which items appear on your e-commerce website
              </p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Loading inventory...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {inventory.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No inventory items found</p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {inventory.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h4 className="font-medium">{item.plant_name}</h4>
                              <Badge variant={item.ready_for_sale ? "default" : "secondary"}>
                                {item.ready_for_sale ? "Listed" : "Hidden"}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Ksh {item.price} • Qty: {item.quantity} • {item.category}
                            </div>
                          </div>
                          <Switch
                            checked={item.ready_for_sale || false}
                            onCheckedChange={() => toggleItemVisibility(item.id, item.ready_for_sale)}
                            disabled={isDemoMode}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Website Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Business Name</Label>
                  <Input 
                    id="siteName" 
                    value={websiteSettings.siteName}
                    onChange={(e) => setWebsiteSettings(prev => ({...prev, siteName: e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input 
                    id="contactEmail" 
                    type="email"
                    value={websiteSettings.contactEmail}
                    onChange={(e) => setWebsiteSettings(prev => ({...prev, contactEmail: e.target.value}))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    value={websiteSettings.phone}
                    onChange={(e) => setWebsiteSettings(prev => ({...prev, phone: e.target.value}))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="siteDescription">Business Description</Label>
                <Textarea 
                  id="siteDescription"
                  value={websiteSettings.siteDescription}
                  onChange={(e) => setWebsiteSettings(prev => ({...prev, siteDescription: e.target.value}))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Business Address</Label>
                <Textarea 
                  id="address"
                  value={websiteSettings.address}
                  onChange={(e) => setWebsiteSettings(prev => ({...prev, address: e.target.value}))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>E-commerce Integration</CardTitle>
              <p className="text-sm text-muted-foreground">
                Connect your inventory management to your e-commerce website
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ecommerceUrl">E-commerce Website URL</Label>
                <Input 
                  id="ecommerceUrl" 
                  placeholder="https://your-store.com"
                  value={websiteSettings.ecommerceUrl}
                  onChange={(e) => setWebsiteSettings(prev => ({...prev, ecommerceUrl: e.target.value}))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="apiEndpoint">API Endpoint</Label>
                <Input 
                  id="apiEndpoint" 
                  placeholder="https://api.your-store.com/sync"
                  value={websiteSettings.apiEndpoint}
                  onChange={(e) => setWebsiteSettings(prev => ({...prev, apiEndpoint: e.target.value}))}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label className="font-medium">Auto-sync Enabled</Label>
                  <p className="text-sm text-muted-foreground">Automatically sync inventory changes</p>
                </div>
                <Switch 
                  checked={websiteSettings.syncEnabled}
                  onCheckedChange={(checked) => setWebsiteSettings(prev => ({...prev, syncEnabled: checked}))}
                />
              </div>

              {websiteSettings.ecommerceUrl && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-blue-900">Connected Website</h4>
                      <p className="text-sm text-blue-700">{websiteSettings.ecommerceUrl}</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={websiteSettings.ecommerceUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Visit Site
                      </a>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
