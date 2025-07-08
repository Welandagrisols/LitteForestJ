"use client"

import type React from "react"

import { useState } from "react"
import { supabase, isDemoMode } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Upload, X, ImageIcon } from "lucide-react"

interface AddInventoryFormProps {
  onSuccess: () => void
  onClose?: () => void
}

export function AddInventoryForm({ onSuccess, onClose }: AddInventoryFormProps) {
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    plant_name: "",
    scientific_name: "",
    category: "",
    quantity: 0,
    age: "",
    date_planted: "",
    status: "Healthy",
    price: 0, // Selling price per unit
    batch_cost: 0, // Total cost for the entire batch
    sku: "",
    section: "",
    row: "",
    source: "",
    ready_for_sale: false,
    description: "",
    image_url: "",
  })

  // Calculate cost per seedling
  const costPerSeedling = formData.quantity > 0 ? formData.batch_cost / formData.quantity : 0

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "quantity" || name === "price" || name === "batch_cost" ? Number(value) : value,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const resetForm = () => {
    setFormData({
      plant_name: "",
      scientific_name: "",
      category: "",
      quantity: 0,
      age: "",
      date_planted: "",
      status: "Healthy",
      price: 0,
      batch_cost: 0,
      sku: "",
      section: "",
      row: "",
      source: "",
      ready_for_sale: false,
      description: "",
      image_url: "",
    })
    setImageFile(null)
    setImagePreview(null)
  }

  const handleImageUpload = async (file: File): Promise<string | null> => {
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

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `plants/${fileName}`

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('plant-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Upload error:', error)
        throw error
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('plant-images')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error: any) {
      console.error('Error uploading image:', error)
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
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        })
        return
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        })
        return
      }

      setImageFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setFormData(prev => ({ ...prev, image_url: "" }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isDemoMode) {
      toast({
        title: "Demo Mode",
        description: "Connect to Supabase and set up tables to enable adding plants",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      // Generate SKU if not provided
      if (!formData.sku) {
        const prefix = formData.category.substring(0, 3).toUpperCase()
        const randomNum = Math.floor(1000 + Math.random() * 9000)
        formData.sku = `${prefix}${randomNum}`
      }

      // Upload image if selected
      let imageUrl = formData.image_url
      if (imageFile) {
        const uploadedUrl = await handleImageUpload(imageFile)
        if (uploadedUrl) {
          imageUrl = uploadedUrl
        } else {
          // If image upload fails, don't proceed with form submission
          return
        }
      }

      // Calculate cost per seedling
      const calculatedCostPerSeedling = formData.quantity > 0 ? formData.batch_cost / formData.quantity : 0

      const { error } = await supabase.from("inventory").insert([
        {
          ...formData,
          image_url: imageUrl,
          cost_per_seedling: calculatedCostPerSeedling,
          batch_cost: formData.batch_cost,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])

      if (error) throw error

      toast({
        title: "Success",
        description: `New plant batch added to inventory. Cost per seedling: Ksh ${calculatedCostPerSeedling.toFixed(2)}`,
      })

      // Reset form and close dialog
      resetForm()
      onSuccess()
      if (onClose) onClose()
    } catch (error: any) {
      toast({
        title: "Error adding plant",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[70vh] max-h-[600px]">
      {/* Scrollable form content */}
      <div className="flex-1 overflow-y-auto pr-2">
        <form id="add-inventory-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plant_name">Plant Name *</Label>
              <Input id="plant_name" name="plant_name" value={formData.plant_name} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scientific_name">Scientific Name</Label>
              <Input
                id="scientific_name"
                name="scientific_name"
                value={formData.scientific_name}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleSelectChange("category", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Indigenous Trees">Indigenous Trees</SelectItem>
                  <SelectItem value="Ornamentals">Ornamentals</SelectItem>
                  <SelectItem value="Fruit Trees">Fruit Trees</SelectItem>
                  <SelectItem value="Flowers">Flowers</SelectItem>
                  <SelectItem value="Herbs">Herbs</SelectItem>
                  <SelectItem value="Vegetables">Vegetables</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity (Number of Seedlings) *</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch_cost">Total Batch Cost (Ksh) *</Label>
              <Input
                id="batch_cost"
                name="batch_cost"
                type="number"
                min="0"
                step="0.01"
                value={formData.batch_cost}
                onChange={handleChange}
                required
                placeholder="Total cost for this entire batch"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Selling Price per Seedling (Ksh) *</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                required
                placeholder="Price you'll sell each seedling for"
              />
            </div>

            {/* Cost per seedling display */}
            {formData.quantity > 0 && formData.batch_cost > 0 && (
              <div className="space-y-2 md:col-span-2">
                <div className="p-3 bg-muted rounded-md border">
                  <div className="text-sm font-medium text-muted-foreground">Calculated Cost per Seedling:</div>
                  <div className="text-lg font-bold text-primary">Ksh {costPerSeedling.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">
                    Batch Cost: Ksh {formData.batch_cost.toLocaleString()} ÷ {formData.quantity} seedlings
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input id="age" name="age" placeholder="e.g. 6 months" value={formData.age} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_planted">Date Planted</Label>
              <Input
                id="date_planted"
                name="date_planted"
                type="date"
                value={formData.date_planted}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Healthy">Healthy</SelectItem>
                  <SelectItem value="Attention">Needs Attention</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU (Auto-generated if empty)</Label>
              <Input id="sku" name="sku" value={formData.sku} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <Input
                id="section"
                name="section"
                placeholder="e.g. A"
                value={formData.section}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="row">Row</Label>
              <Input id="row" name="row" placeholder="e.g. 3" value={formData.row} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                name="source"
                placeholder="e.g. Local nursery"
                value={formData.source}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description for Website</Label>
              <Input
                id="description"
                name="description"
                placeholder="Short description for the landing page"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Plant Image</Label>
              <div className="space-y-4">
                {/* Image Upload Area */}
                {!imagePreview && !formData.image_url ? (
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
                      <p className="text-xs text-muted-foreground">
                        Supports JPG, PNG, WebP (max 5MB)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Image Preview */}
                    <div className="relative inline-block">
                      <img
                        src={imagePreview || formData.image_url}
                        alt="Plant preview"
                        className="h-32 w-32 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 h-6 w-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs hover:bg-destructive/90"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    
                    {/* Replace Image Button */}
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

                {/* Alternative: Manual URL Input */}
                <div className="pt-4 border-t border-muted">
                  <Label htmlFor="image_url" className="text-xs text-muted-foreground">
                    Or provide image URL manually:
                  </Label>
                  <Input
                    id="image_url"
                    name="image_url"
                    placeholder="https://example.com/plant-image.jpg"
                    value={formData.image_url}
                    onChange={handleChange}
                    className="mt-1"
                    disabled={!!imageFile}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ready_for_sale" className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ready_for_sale"
                  checked={formData.ready_for_sale}
                  onChange={(e) => setFormData(prev => ({ ...prev, ready_for_sale: e.target.checked }))}
                  className="rounded"
                />
                Ready for Sale on Website
              </Label>
              <p className="text-xs text-muted-foreground">
                Check this box to make this item available on your landing page
              </p>
            </div>
          </div>
        </form>
      </div>

      {/* Sticky action buttons */}
      <div className="border-t border-border bg-white pt-4 mt-4">
        <div className="flex justify-end gap-2">
          {onClose && (
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            form="add-inventory-form"
            className="bg-primary hover:bg-primary/90 text-white"
            disabled={loading || uploadingImage}
          >
            {uploadingImage ? "Uploading Image..." : loading ? "Adding..." : "Add to Inventory"}
          </Button>
        </div>
      </div>
    </div>
  )
}
