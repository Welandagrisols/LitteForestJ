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

interface EditInventoryFormProps {
  item: any
  onSuccess: () => void
  onCancel?: () => void
}

export function EditInventoryForm({ item, onSuccess, onCancel }: EditInventoryFormProps) {
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const { toast } = useToast()

  const isConsumable =
    (item.category && item.category.startsWith("Consumable:")) ||
    (item.scientific_name && item.scientific_name.startsWith("[Consumable]"))

  const [formData, setFormData] = useState({
    plant_name: item.plant_name || "",
    scientific_name: item.scientific_name || "",
    category: item.category || "",
    quantity: item.quantity || 0,
    age: item.age || "",
    date_planted: item.date_planted ? new Date(item.date_planted).toISOString().split("T")[0] : "",
    status: item.status || (isConsumable ? "Available" : "Healthy"),
    price: item.price || 0,
    batch_cost: item.batch_cost || 0,
    sku: item.sku || "",
    section: item.section || "",
    row: item.row || "",
    source: item.source || "",
    description: item.description || "",
    image_url: item.image_url || "",
    ready_for_sale: item.ready_for_sale || false,
  })

  // Calculate cost per seedling for plants (not consumables)
  const costPerSeedling = !isConsumable && formData.quantity > 0 ? formData.batch_cost / formData.quantity : 0

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "quantity" || name === "price" || name === "batch_cost" ? Number(value) : value,
    }))

    // Auto-fill description and image when plant name or scientific name changes
    if (name === "plant_name" && value.length > 2) {
      autoFillFromExisting(value, formData.scientific_name)
    } else if (name === "scientific_name" && value.length > 2) {
      autoFillFromExisting(formData.plant_name, value)
    }
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
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `plants/${fileName}`

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage.from("plant-images").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (error) {
        console.error("Upload error:", error)
        throw error
      }

      // Get public URL
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
      // Validate file type
      if (!file.type.startsWith("image/")) {
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
    setFormData((prev) => ({ ...prev, image_url: "" }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const autoFillFromExisting = async (plantName: string, scientificName: string) => {
    // Fetch data from Supabase based on plantName or scientificName
    let query = supabase.from("inventory").select("description, image_url").limit(1)

    if (plantName) {
      query = query.ilike("plant_name", plantName)
    } else if (scientificName) {
      query = query.ilike("scientific_name", scientificName)
    } else {
      return // Don't run query if both are empty
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching similar entries:", error)
      toast({
        title: "Error auto-filling data",
        description: error.message,
        variant: "destructive",
      })
      return
    }

    if (data && data.length > 0) {
      const { description, image_url } = data[0]
      setFormData((prev) => ({
        ...prev,
        description: description || "",
        image_url: image_url || "",
      }))
    } else {
      // Reset description and image URL if no matching entries are found
      setFormData((prev) => ({
        ...prev,
        description: "",
        image_url: "",
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isDemoMode) {
      toast({
        title: "Demo Mode",
        description: "Connect to Supabase and set up tables to enable editing items",
        variant: "destructive",
      })
      return
    }

    // Validate required fields
    if (!formData.plant_name || !formData.category || formData.quantity < 0 || formData.price < 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields with valid values",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      // Calculate cost per seedling for plants
      const calculatedCostPerSeedling =
        !isConsumable && formData.quantity > 0 ? formData.batch_cost / formData.quantity : item.cost_per_seedling || 0

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

      const updateData = {
        plant_name: formData.plant_name.trim(),
        scientific_name: formData.scientific_name?.trim() || null,
        category: formData.category,
        quantity: Number(formData.quantity),
        age: formData.age?.trim() || null,
        date_planted: formData.date_planted || null,
        status: formData.status,
        price: Number(formData.price),
        batch_cost: Number(formData.batch_cost),
        cost_per_seedling: calculatedCostPerSeedling,
        sku: formData.sku,
        section: formData.section?.trim() || null,
        row: formData.row?.trim() || null,
        source: formData.source?.trim() || null,
        description: formData.description?.trim() || null,
        image_url: imageUrl,
        ready_for_sale: formData.ready_for_sale,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from("inventory").update(updateData).eq("id", item.id)

      if (error) {
        console.error("Update error:", error)
        throw error
      }

      toast({
        title: "Success",
        description: isConsumable
          ? "Consumable updated successfully"
          : `Plant updated successfully. Cost per seedling: Ksh ${calculatedCostPerSeedling.toFixed(2)}`,
      })

      onSuccess()
    } catch (error: any) {
      console.error("Error updating item:", error)
      toast({
        title: "Error updating item",
        description: error.message || "Failed to update item",
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
        <form id="edit-inventory-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plant_name">{isConsumable ? "Item Name" : "Plant Name"} *</Label>
              <Input id="plant_name" name="plant_name" value={formData.plant_name} onChange={handleChange} required />
            </div>

            {!isConsumable && (
              <div className="space-y-2">
                <Label htmlFor="scientific_name">Scientific Name</Label>
                <Input
                  id="scientific_name"
                  name="scientific_name"
                  value={formData.scientific_name}
                  onChange={handleChange}
                />
              </div>
            )}

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
                  {isConsumable ? (
                    <>
                      <SelectItem value="Consumable: Fertilizers">Fertilizers</SelectItem>
                      <SelectItem value="Consumable: Pesticides">Pesticides</SelectItem>
                      <SelectItem value="Consumable: Tools">Tools & Equipment</SelectItem>
                      <SelectItem value="Consumable: Pots">Pots & Containers</SelectItem>
                      <SelectItem value="Consumable: Soil">Soil & Substrates</SelectItem>
                      <SelectItem value="Consumable: Irrigation">Irrigation Supplies</SelectItem>
                      <SelectItem value="Consumable: Other">Other</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="Indigenous Trees">Indigenous Trees</SelectItem>
                      <SelectItem value="Ornamentals">Ornamentals</SelectItem>
                      <SelectItem value="Fruit Trees">Fruit Trees</SelectItem>
                      <SelectItem value="Flowers">Flowers</SelectItem>
                      <SelectItem value="Herbs">Herbs</SelectItem>
                      <SelectItem value="Vegetables">Vegetables</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">{isConsumable ? "Quantity" : "Quantity (Number of Seedlings)"} *</Label>
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

            {!isConsumable && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="batch_cost">Total Batch Cost (Ksh)</Label>
                  <Input
                    id="batch_cost"
                    name="batch_cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.batch_cost}
                    onChange={handleChange}
                    placeholder="Total cost for this entire batch"
                  />
                </div>

                {/* Cost per seedling display for plants */}
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
              </>
            )}

            {!isConsumable && (
              <>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description for Website</Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="Short description for the landing page (auto-filled from existing entries)"
                    value={formData.description}
                    onChange={handleChange}
                  />
                  {formData.description && (
                    <p className="text-xs text-muted-foreground">
                      💡 This description was auto-filled from similar entries
                    </p>
                  )}
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
                          <p className="text-xs text-muted-foreground">Supports JPG, PNG, WebP (max 5MB)</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Image Preview */}
                        <div className="relative inline-block">
                          <img
                            src={imagePreview || formData.image_url}
                            alt="Plant preview"
                            className="h-32 w-auto max-w-32 object-contain rounded-lg border bg-gray-50"
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
                        Or provide image URL manually (auto-filled from existing entries):
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
                      {formData.image_url && !imageFile && (
                        <p className="text-xs text-muted-foreground mt-1">
                          💡 This image URL was auto-filled from similar entries
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ready_for_sale" className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="ready_for_sale"
                      checked={formData.ready_for_sale}
                      onChange={(e) => setFormData((prev) => ({ ...prev, ready_for_sale: e.target.checked }))}
                      className="rounded"
                    />
                    Ready for Sale on Website
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Check this box to make this item available on your landing page
                  </p>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {isConsumable ? (
                    <>
                      <SelectItem value="Available">Available</SelectItem>
                      <SelectItem value="Low Stock">Low Stock</SelectItem>
                      <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="Healthy">Healthy</SelectItem>
                      <SelectItem value="Attention">Needs Attention</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">{isConsumable ? "Price per Unit" : "Selling Price per Seedling"} (Ksh) *</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" name="sku" value={formData.sku} onChange={handleChange} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="section">{isConsumable ? "Storage Location" : "Section"}</Label>
              <Input
                id="section"
                name="section"
                placeholder={isConsumable ? "e.g. Shed A" : "e.g. A"}
                value={formData.section}
                onChange={handleChange}
              />
            </div>

            {!isConsumable && (
              <div className="space-y-2">
                <Label htmlFor="row">Row</Label>
                <Input id="row" name="row" placeholder="e.g. 3" value={formData.row} onChange={handleChange} />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="source">{isConsumable ? "Supplier" : "Source"}</Label>
              <Input
                id="source"
                name="source"
                placeholder={isConsumable ? "e.g. AgriSupplies Ltd" : "e.g. Local nursery"}
                value={formData.source}
                onChange={handleChange}
              />
            </div>
          </div>
        </form>
      </div>

      {/* Sticky action buttons */}
      <div className="border-t border-border bg-white pt-4 mt-4">
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            form="edit-inventory-form"
            className="bg-primary hover:bg-primary/90 text-white"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Item"}
          </Button>
        </div>
      </div>
    </div>
  )
}
