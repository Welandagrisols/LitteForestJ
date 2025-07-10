"use client"

import type React from "react"

import { useState } from "react"
import { supabase, isDemoMode } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useIsMobile } from "@/hooks/use-mobile"


interface AddInventoryFormProps {
  onSuccess: () => void
  onClose?: () => void
}

export function AddInventoryForm({ onSuccess, onClose }: AddInventoryFormProps) {
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
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
    })
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
      const finalFormData = { ...formData }
      if (!finalFormData.sku) {
        const prefix = finalFormData.category.substring(0, 3).toUpperCase()
        const randomNum = Math.floor(1000 + Math.random() * 9000)
        finalFormData.sku = `${prefix}${randomNum}`
      }

      // Calculate cost per seedling
      const calculatedCostPerSeedling = finalFormData.quantity > 0 ? finalFormData.batch_cost / finalFormData.quantity : 0

      const insertData = {
        plant_name: finalFormData.plant_name,
        scientific_name: finalFormData.scientific_name,
        category: finalFormData.category,
        quantity: finalFormData.quantity,
        age: finalFormData.age,
        date_planted: finalFormData.date_planted || null,
        status: finalFormData.status,
        price: finalFormData.price,
        batch_cost: finalFormData.batch_cost,
        cost_per_seedling: calculatedCostPerSeedling,
        sku: finalFormData.sku,
        section: finalFormData.section,
        row: finalFormData.row,
        source: finalFormData.source,
        item_type: 'Plant',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      console.log('Inserting data:', insertData)

      const { error } = await supabase.from("inventory").insert([insertData])

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

  const isMobile = useIsMobile()

  return (
    <div className="flex flex-col max-h-[80vh]">
      {/* Scrollable form container */}
      <div className="flex-1 overflow-y-auto px-1">
        <div className="space-y-4">
          <div className={`grid grid-cols-1 ${isMobile ? 'gap-6' : 'md:grid-cols-2 gap-4'}`}>
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


          </div>
        </div>
      </div>

      {/* Sticky action buttons */}
      <div className="border-t border-border bg-white pt-4 mt-4 flex-shrink-0">
        <div className={`flex ${isMobile ? 'flex-col gap-3' : 'justify-end space-x-2'}`}>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className={isMobile ? 'mobile-touch-target w-full' : ''}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className={isMobile ? 'mobile-touch-target w-full' : ''}
          >
            {loading ? "Adding..." : "Add Item"}
          </Button>
        </div>
      </div>
    </div>
  )
}