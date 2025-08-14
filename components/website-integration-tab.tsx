
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Globe, Settings, Code, Database, Zap, ExternalLink } from "lucide-react"

export function WebsiteIntegrationTab() {
  const [apiKey, setApiKey] = useState("")
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [autoSync, setAutoSync] = useState(false)
  const { toast } = useToast()

  const handleConnect = () => {
    if (apiKey && websiteUrl) {
      setIsConnected(true)
      toast({
        title: "Website Connected",
        description: "Successfully connected to your website.",
      })
    } else {
      toast({
        title: "Connection Failed",
        description: "Please provide both API key and website URL.",
        variant: "destructive",
      })
    }
  }

  const handleDisconnect = () => {
    setIsConnected(false)
    toast({
      title: "Website Disconnected",
      description: "Website integration has been disconnected.",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Website Integration</h2>
          <p className="text-muted-foreground">
            Connect your inventory to your website for real-time updates
          </p>
        </div>
        <Badge variant={isConnected ? "default" : "secondary"}>
          {isConnected ? "Connected" : "Disconnected"}
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Website Status</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isConnected ? "Online" : "Offline"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isConnected ? "Connected to website" : "Not connected"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sync Status</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {autoSync ? "Auto" : "Manual"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Synchronization mode
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last Update</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--</div>
                <p className="text-xs text-muted-foreground">
                  No updates yet
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Manage your website integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Button 
                  onClick={() => toast({ title: "Sync initiated", description: "Inventory data is being synced to website." })}
                  disabled={!isConnected}
                >
                  Sync Now
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.open(websiteUrl || "#", "_blank")}
                  disabled={!isConnected || !websiteUrl}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Website
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connection Settings</CardTitle>
              <CardDescription>
                Configure your website connection details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="website-url">Website URL</Label>
                <Input
                  id="website-url"
                  placeholder="https://your-website.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder="Enter your API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Sync</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically sync inventory changes
                  </p>
                </div>
                <Switch
                  checked={autoSync}
                  onCheckedChange={setAutoSync}
                />
              </div>

              <div className="flex space-x-2">
                {!isConnected ? (
                  <Button onClick={handleConnect}>
                    Connect Website
                  </Button>
                ) : (
                  <Button variant="destructive" onClick={handleDisconnect}>
                    Disconnect
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Documentation</CardTitle>
              <CardDescription>
                Integration endpoints and examples
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Available Endpoints:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">GET</Badge>
                    <code className="text-xs">/api/inventory</code>
                    <span className="text-muted-foreground">- Fetch all inventory</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">POST</Badge>
                    <code className="text-xs">/api/inventory/sync</code>
                    <span className="text-muted-foreground">- Sync inventory data</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">PUT</Badge>
                    <code className="text-xs">/api/inventory/:id</code>
                    <span className="text-muted-foreground">- Update specific item</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Example Request:</h4>
                <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
{`curl -X GET \\
  ${websiteUrl || 'https://your-website.com'}/api/inventory \\
  -H "Authorization: Bearer ${apiKey || 'YOUR_API_KEY'}" \\
  -H "Content-Type: application/json"`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
