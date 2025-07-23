"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { supabase, isDemoMode, checkTableExists } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Upload, X, ImageIcon, Globe, Eye, Copy, ExternalLink, Loader2, Trash2 } from "lucide-react"
import { DemoModeBanner } from "@/components/demo-mode-banner"

interface InventoryItem {
  id: string
  plant_name: string
  scientific_name: string
  category: string
  quantity: number
  price: number
  ready_for_sale: boolean
  description: string
  image_url: string
  sku: string
}

export function WebsiteIntegrationTab() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [tableExists, setTableExists] = useState(true)
  const { toast } = useToast()
  const [isMobile, setIsMobile] = useState(false)

  const apiUrl = `https://litteforest.vercel.app/api/products`

  useEffect(() => {
    async function init() {
      if (isDemoMode) {
        // Demo data with some items ready for sale
        const demoData = [
          {
            id: "1",
            plant_name: "African Olive",
            scientific_name: "Olea europaea subsp. cuspidata",
            category: "Indigenous Trees",
            quantity: 45,
            price: 1200,
            ready_for_sale: true,
            description: "Beautiful indigenous tree perfect for landscaping",
            image_url: "",
            sku: "IND001",
          },
          {
            id: "2",
            plant_name: "Moringa Seedling",
            scientific_name: "Moringa oleifera",
            category: "Ornamentals",
            quantity: 120,
            price: 350,
            ready_for_sale: false,
            description: "",
            image_url: "",
            sku: "ORN002",
          },
        ]
        setInventory(demoData)
        setLoading(false)
        return
      }

      const exists = await checkTableExists("inventory")
      setTableExists(exists)

      if (!exists) {
        setLoading(false)
        return
      }

      fetchInventory()
    }

    init()

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768) // Adjust the breakpoint as needed
    }

    handleResize() // Set initial value

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  async function fetchInventory() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("inventory")
        .select(
          "id, plant_name, scientific_name, category, quantity, price, ready_for_sale, description, image_url, sku",
        )
        .order("plant_name", { ascending: true })

      if (error) throw error
      setInventory(data || [])
    } catch (error: any) {
      console.error("Error fetching inventory:", error)
      toast({
        title: "Error fetching inventory",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function updateWebsiteSettings(id: string, updates: Partial<InventoryItem>) {
    if (isDemoMode || !tableExists) {
      toast({
        title: "Demo Mode",
        description: "Connect to Supabase to enable website integration",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase
        .from("inventory")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Website settings updated successfully",
      })

      fetchInventory()
    } catch (error: any) {
      toast({
        title: "Error updating settings",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  async function handleImageUpload(file: File): Promise<string | null> {
    if (isDemoMode) {
      toast({
        title: "Demo Mode",
        description: "Connect to Supabase to enable image uploads",
        variant: "destructive",
      })
      return null
    }

    try {
      setUploadingImage(true)

      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `plants/${fileName}`

      const { data, error } = await supabase.storage.from("plant-images").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (error) {
        console.error("Upload error:", error)
        throw error
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("plant-images").getPublicUrl(filePath)

      return publicUrl
    } catch (error: any) {
      console.error("Error uploading image:", error)
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      })
      return null
    } finally {
      setUploadingImage(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        })
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        })
        return
      }

      setImageFile(file)

      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveWebsiteSettings = async () => {
    if (!editingItem) return

    let imageUrl = editingItem.image_url

    if (imageFile) {
      const uploadedUrl = await handleImageUpload(imageFile)
      if (uploadedUrl) {
        imageUrl = uploadedUrl
      } else {
        return
      }
    }

    await updateWebsiteSettings(editingItem.id, {
      description: editingItem.description,
      image_url: imageUrl,
      ready_for_sale: editingItem.ready_for_sale,
    })

    setEditingItem(null)
    setImageFile(null)
    setImagePreview(null)
  }

  const toggleReadyForSale = async (item: InventoryItem) => {
    await updateWebsiteSettings(item.id, {
      ready_for_sale: !item.ready_for_sale,
    })
  }

  const deleteInventoryItem = async (item: InventoryItem) => {
    if (isDemoMode || !tableExists) {
      toast({
        title: "Demo Mode",
        description: "Connect to Supabase to enable deleting items",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase.from("inventory").delete().eq("id", item.id)

      if (error) throw error

      toast({
        title: "Success",
        description: `${item.plant_name} has been deleted from inventory`,
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

  const copyApiUrl = () => {
    navigator.clipboard.writeText(apiUrl)
    toast({
      title: "API URL copied",
      description: "The API URL has been copied to your clipboard",
    })
  }

  const getAvailabilityStatus = (quantity: number) => {
    if (quantity >= 100) return { status: "Available", color: "bg-green-500" }
    if (quantity >= 10) return { status: "Limited", color: "bg-yellow-500" }
    return { status: "Not Available", color: "bg-red-500" }
  }

  const readyForSaleItems = inventory.filter((item) => item.ready_for_sale)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {isDemoMode && <DemoModeBanner />}

      {/* API Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Website Integration API
          </CardTitle>
          <CardDescription>Use this API endpoint to integrate your inventory with your website</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Label>API URL:</Label>
              <div className="flex-1 flex items-center gap-2">
                <Input value={apiUrl} readOnly className="font-mono text-sm" />
                <Button variant="outline" size="sm" onClick={copyApiUrl}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={apiUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>This endpoint returns all products marked as "ready for sale" with their availability status.</p>
              <p>
                See the <code>API_INTEGRATION.md</code> file for full documentation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Website Products Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Website Products ({readyForSaleItems.length})</CardTitle>
          <CardDescription>Products currently available on your website</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}>
            {readyForSaleItems.map((item) => {
              const availability = getAvailabilityStatus(item.quantity)
              return (
                <div key={item.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">{item.plant_name}</h3>
                    <Badge className={`${availability.color} text-white`}>{availability.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.scientific_name}</p>
                  <p className="text-sm">{item.description || "No description"}</p>
                  <div className="flex justify-between items-center">
                    <span className="font-bold">Ksh {item.price}</span>
                    <span className="text-sm text-muted-foreground">{item.quantity} available</span>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Inventory Management for Website */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Website Listings</CardTitle>
          <CardDescription>Configure which products appear on your website and their details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plant Name</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Website Status</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((item) => {
                  const availability = getAvailabilityStatus(item.quantity)
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.plant_name}</div>
                          <div className="text-sm text-muted-foreground">{item.scientific_name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{item.quantity}</span>
                          <Badge variant="outline" className={`${availability.color} text-white`}>
                            {availability.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>Ksh {item.price}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={item.ready_for_sale}
                            onCheckedChange={() => toggleReadyForSale(item)}
                            disabled={isDemoMode || !tableExists}
                          />
                          <span className="text-sm">{item.ready_for_sale ? "Listed" : "Not Listed"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">{item.description || "No description"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingItem(item)
                                  setImagePreview(item.image_url || null)
                                  setImageFile(null)
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                              <DialogHeader className="flex-shrink-0">
                                <DialogTitle>Edit Website Listing - {item.plant_name}</DialogTitle>
                              </DialogHeader>
                              {editingItem && (
                                <>
                                  {/* Scrollable content area */}
                                  <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                                    <div
                                      className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}
                                    >
                                      <div>
                                        <Label>Plant Name</Label>
                                        <Input value={editingItem.plant_name} disabled />
                                      </div>
                                      <div>
                                        <Label>Price (Ksh)</Label>
                                        <Input value={editingItem.price} disabled />
                                      </div>
                                    </div>

                                    <div>
                                      <Label htmlFor="description">Website Description</Label>
                                      <Textarea
                                        id="description"
                                        placeholder="Enter a description for your website..."
                                        value={editingItem.description}
                                        onChange={(e) =>
                                          setEditingItem({
                                            ...editingItem,
                                            description: e.target.value,
                                          })
                                        }
                                        rows={3}
                                      />
                                    </div>

                                    <div>
                                      <Label>Plant Image</Label>
                                      <div className="space-y-4">
                                        {!imagePreview ? (
                                          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                                            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                                            <div className="space-y-2">
                                              <p className="text-sm text-muted-foreground">Upload a plant image</p>
                                              <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileSelect}
                                                className="hidden"
                                                id="image-upload"
                                                disabled={uploadingImage || isDemoMode}
                                              />
                                              <label
                                                htmlFor="image-upload"
                                                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md cursor-pointer transition-colors ${
                                                  uploadingImage || isDemoMode
                                                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                                                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                                                }`}
                                              >
                                                <Upload className="h-4 w-4" />
                                                {uploadingImage ? "Uploading..." : "Choose Image"}
                                              </label>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="space-y-3">
                                            <div className="relative inline-block">
                                              <img
                                                src={imagePreview || "/placeholder.svg"}
                                                alt="Plant preview"
                                                className="h-32 w-auto max-w-32 object-contain rounded-lg border bg-gray-50"
                                              />
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setImagePreview(null)
                                                  setImageFile(null)
                                                  setEditingItem({
                                                    ...editingItem,
                                                    image_url: "",
                                                  })
                                                }}
                                                className="absolute -top-2 -right-2 h-6 w-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs hover:bg-destructive/90"
                                              >
                                                <X className="h-3 w-3" />
                                              </button>
                                            </div>

                                            <div>
                                              <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileSelect}
                                                className="hidden"
                                                id="image-replace"
                                                disabled={uploadingImage || isDemoMode}
                                              />
                                              <label
                                                htmlFor="image-replace"
                                                className={`inline-flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                                                  uploadingImage || isDemoMode
                                                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                                                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                                }`}
                                              >
                                                <Upload className="h-3 w-3" />
                                                {uploadingImage ? "Uploading..." : "Replace Image"}
                                              </label>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <Switch
                                        checked={editingItem.ready_for_sale}
                                        onCheckedChange={(checked) =>
                                          setEditingItem({
                                            ...editingItem,
                                            ready_for_sale: checked,
                                          })
                                        }
                                        disabled={isDemoMode || !tableExists}
                                      />
                                      <Label>List on Website</Label>
                                    </div>
                                  </div>

                                  {/* Fixed action buttons */}
                                  <div className="flex-shrink-0 border-t pt-4 mt-4 flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setEditingItem(null)
                                        setImageFile(null)
                                        setImagePreview(null)
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      onClick={handleSaveWebsiteSettings}
                                      disabled={uploadingImage || isDemoMode || !tableExists}
                                    >
                                      {uploadingImage ? "Uploading..." : "Save Changes"}
                                    </Button>
                                  </div>
                                </>
                              )}
                            </DialogContent>
                          </Dialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 bg-transparent"
                                disabled={isDemoMode || !tableExists}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete {item.plant_name}?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete "{item.plant_name}" from
                                  your inventory and remove it from your website if it's currently listed.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteInventoryItem(item)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
