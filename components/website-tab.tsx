
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Globe, Settings, Palette, Store, BarChart3 } from "lucide-react"

export function WebsiteTab() {
  const [websiteSettings, setWebsiteSettings] = useState({
    siteName: "LittleForest Nursery",
    siteDescription: "Premium quality plants and nursery supplies",
    contactEmail: "info@littleforest.com",
    phone: "+254 700 000 000",
    address: "123 Garden Avenue, Nairobi, Kenya",
    isOnline: false,
    showPrices: true,
    allowOrders: false,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Globe className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Website Management</h2>
      </div>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="catalog" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            Online Catalog
          </TabsTrigger>
          <TabsTrigger value="design" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Design
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Website Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
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
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea 
                  id="siteDescription"
                  value={websiteSettings.siteDescription}
                  onChange={(e) => setWebsiteSettings(prev => ({...prev, siteDescription: e.target.value}))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea 
                  id="address"
                  value={websiteSettings.address}
                  onChange={(e) => setWebsiteSettings(prev => ({...prev, address: e.target.value}))}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label htmlFor="isOnline" className="font-medium">Website Status</Label>
                  <p className="text-sm text-muted-foreground">Make your website visible to customers</p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    id="isOnline"
                    checked={websiteSettings.isOnline}
                    onCheckedChange={(checked) => setWebsiteSettings(prev => ({...prev, isOnline: checked}))}
                  />
                  <Badge variant={websiteSettings.isOnline ? "default" : "secondary"}>
                    {websiteSettings.isOnline ? "Live" : "Offline"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="catalog" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Online Plant Catalog</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label className="font-medium">Show Prices Online</Label>
                  <p className="text-sm text-muted-foreground">Display plant prices on your website</p>
                </div>
                <Switch 
                  checked={websiteSettings.showPrices}
                  onCheckedChange={(checked) => setWebsiteSettings(prev => ({...prev, showPrices: checked}))}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label className="font-medium">Accept Online Orders</Label>
                  <p className="text-sm text-muted-foreground">Allow customers to place orders online</p>
                </div>
                <Switch 
                  checked={websiteSettings.allowOrders}
                  onCheckedChange={(checked) => setWebsiteSettings(prev => ({...prev, allowOrders: checked}))}
                />
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Catalog Integration</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Your inventory will automatically sync with your online catalog. Plants with available stock will be displayed to customers.
                </p>
                <Button variant="outline" className="bg-white">
                  Preview Catalog
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="design" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Website Design</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Palette className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Design Customization</h3>
                <p className="text-muted-foreground mb-4">Customize your website's appearance and branding</p>
                <Button variant="outline">
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Website Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Website Analytics</h3>
                <p className="text-muted-foreground mb-4">Track your website visitors and performance</p>
                <Button variant="outline">
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
