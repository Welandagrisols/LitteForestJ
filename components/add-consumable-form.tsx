"use client"

import type React from "react"

import { useState } from "react"
import { supabase, isDemoMode } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

interface AddConsumableFormProps {
  onSuccess: () => void
  onClose?: () => void
}

export function AddConsumableForm({ onSuccess, onClose }: AddConsumableFormProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    item_name: "",
    category: "",
    quantity: 0,
    unit: "Pieces",
    purchase_date: new Date().toISOString().split("T")[0],
    status: "Available",
    price: 0,
    sku: "",
    supplier: "",
    storage_location: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "quantity" || name === "price" ? Number(value) : value,
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
      item_name: "",
      category: "",
      quantity: 0,
      unit: "Pieces",
      purchase_date: new Date().toISOString().split("T")[0],
      status: "Available",
      price: 0,
      sku: "",
      supplier: "",
      storage_location: "",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isDemoMode) {
      toast({
        title: "Demo Mode",
        description: "Connect to Supabase and set up tables to enable adding consumables",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      // Generate SKU if not provided
      if (!formData.sku) {
        const prefix = "CONS"
        const randomNum = Math.floor(1000 + Math.random() * 9000)
        formData.sku = `${prefix}${randomNum}`
      }

      // Prepare data for insertion using only the existing schema fields
      // We'll use a naming convention in the category to distinguish consumables
      const insertData = {
        plant_name: formData.item_name, // Use plant_name field for item name
        scientific_name: `[Consumable] ${formData.unit || "Pieces"}`, // Store unit info here
        category: `Consumable: ${formData.category}`, // Prefix category to identify consumables
        quantity: formData.quantity,
        age: null, // Not applicable for consumables
        date_planted: formData.purchase_date || null, // Use for purchase date
        status: formData.status,
        price: formData.price,
        sku: formData.sku,
        section: formData.storage_location || null, // Use for storage location
        row: null, // Not applicable for consumables
        source: formData.supplier || null, // Use for supplier
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from("inventory").insert([insertData])

      if (error) throw error

      toast({
        title: "Success",
        description: "New consumable added to inventory",
      })

      // Reset form and close dialog
      resetForm()
      onSuccess()
      if (onClose) onClose()
    } catch (error: any) {
      toast({
        title: "Error adding consumable",
        description: error.message,
        variant: "destructive",
      })
      console.error("Error details:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col max-h-[80vh]">
      {/* Scrollable form container */}
      <div className="flex-1 overflow-y-auto px-1">
        <div className="space-y-6">
          <form id="add-consumable-form" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="item_name">Item Name *</Label>
              <Input id="item_name" name="item_name" value={formData.item_name} onChange={handleChange} required />
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
                  <SelectItem value="Fertilizers">Fertilizers</SelectItem>
                  <SelectItem value="Pesticides">Pesticides</SelectItem>
                  <SelectItem value="Tools">Tools & Equipment</SelectItem>
                  <SelectItem value="Pots">Pots & Containers</SelectItem>
                  <SelectItem value="Soil">Soil & Substrates</SelectItem>
                  <SelectItem value="Irrigation">Irrigation Supplies</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
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
              <Label htmlFor="unit">Unit *</Label>
              <Select value={formData.unit} onValueChange={(value) => handleSelectChange("unit", value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pieces">Pieces</SelectItem>
                  <SelectItem value="Kg">Kilograms</SelectItem>
                  <SelectItem value="Tonnes">Tonnes</SelectItem>
                  <SelectItem value="Liters">Liters</SelectItem>
                  <SelectItem value="Bags">Bags</SelectItem>
                  <SelectItem value="Sachets">Sachets</SelectItem>
                  <SelectItem value="Boxes">Boxes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase_date">Purchase Date</Label>
              <Input
                id="purchase_date"
                name="purchase_date"
                type="date"
                value={formData.purchase_date}
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
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="Low Stock">Low Stock</SelectItem>
                  <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (Ksh) *</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                value={formData.price}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU (Auto-generated if empty)</Label>
              <Input id="sku" name="sku" value={formData.sku} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="storage_location">Storage Location</Label>
              <Input
                id="storage_location"
                name="storage_location"
                placeholder="e.g. Shed A"
                value={formData.storage_location}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                name="supplier"
                placeholder="e.g. AgriSupplies Ltd"
                value={formData.supplier}
                onChange={handleChange}
              />
            </div>
          </div>
        </form>
        </div>
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
            form="add-consumable-form"
            className="bg-primary hover:bg-primary/90 text-white"
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? "Adding..." : "Add to Inventory"}
          </Button>
        </div>
      </div>
    </div>
  )
}
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

interface AddConsumableFormProps {
  onSuccess: () => void
  onClose?: () => void
}

export function AddConsumableForm({ onSuccess, onClose }: AddConsumableFormProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    plant_name: "",
    scientific_name: "",
    category: "",
    quantity: 0,
    status: "Available",
    price: 0,
    sku: "",
    section: "",
    source: "",
    unit: "Pieces",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "quantity" || name === "price" ? Number(value) : value,
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
      status: "Available",
      price: 0,
      sku: "",
      section: "",
      source: "",
      unit: "Pieces",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isDemoMode) {
      toast({
        title: "Demo Mode",
        description: "Connect to Supabase and set up tables to enable adding consumables",
        variant: "destructive",
      })
      return
    }

    // Validate required fields
    if (!formData.plant_name || !formData.category || formData.quantity <= 0 || formData.price <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields with valid values",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      // Generate SKU if not provided
      const finalFormData = { ...formData }
      if (!finalFormData.sku) {
        const prefix = finalFormData.category.replace("Consumable: ", "").substring(0, 3).toUpperCase()
        const randomNum = Math.floor(1000 + Math.random() * 9000)
        finalFormData.sku = `${prefix}${randomNum}`
      }

      const insertData = {
        plant_name: finalFormData.plant_name.trim(),
        scientific_name: `[Consumable] ${finalFormData.unit}`,
        category: finalFormData.category,
        quantity: Number(finalFormData.quantity),
        age: null,
        date_planted: null,
        status: finalFormData.status,
        price: Number(finalFormData.price),
        batch_cost: 0,
        cost_per_seedling: 0,
        sku: finalFormData.sku,
        section: finalFormData.section?.trim() || null,
        row: null,
        source: finalFormData.source?.trim() || null,
        item_type: 'Consumable',
        ready_for_sale: false,
        description: null,
        image_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      console.log('Inserting consumable data:', insertData)

      const { data, error } = await supabase.from("inventory").insert([insertData]).select()

      if (error) {
        console.error('Insert error:', error)
        throw error
      }

      toast({
        title: "Success",
        description: `New consumable added to inventory`,
      })

      // Reset form and close dialog
      resetForm()
      onSuccess()
      if (onClose) onClose()
    } catch (error: any) {
      console.error('Error adding consumable:', error)
      toast({
        title: "Error adding consumable",
        description: error.message || "Failed to add consumable to inventory",
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className={`grid grid-cols-1 ${isMobile ? 'gap-6' : 'md:grid-cols-2 gap-4'}`}>
            <div className="space-y-2">
              <Label htmlFor="plant_name">Item Name *</Label>
              <Input id="plant_name" name="plant_name" value={formData.plant_name} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit *</Label>
              <Select value={formData.unit} onValueChange={(value) => handleSelectChange("unit", value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pieces">Pieces</SelectItem>
                  <SelectItem value="Kg">Kilograms</SelectItem>
                  <SelectItem value="Liters">Liters</SelectItem>
                  <SelectItem value="Bags">Bags</SelectItem>
                  <SelectItem value="Bottles">Bottles</SelectItem>
                  <SelectItem value="Packets">Packets</SelectItem>
                </SelectContent>
              </Select>
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
                  <SelectItem value="Consumable: Fertilizers">Fertilizers</SelectItem>
                  <SelectItem value="Consumable: Pesticides">Pesticides</SelectItem>
                  <SelectItem value="Consumable: Tools">Tools & Equipment</SelectItem>
                  <SelectItem value="Consumable: Pots">Pots & Containers</SelectItem>
                  <SelectItem value="Consumable: Soil">Soil & Substrates</SelectItem>
                  <SelectItem value="Consumable: Irrigation">Irrigation Supplies</SelectItem>
                  <SelectItem value="Consumable: Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
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
              <Label htmlFor="price">Price per Unit (Ksh) *</Label>
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
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="Low Stock">Low Stock</SelectItem>
                  <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU (Auto-generated if empty)</Label>
              <Input id="sku" name="sku" value={formData.sku} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="section">Storage Location</Label>
              <Input
                id="section"
                name="section"
                placeholder="e.g. Shed A"
                value={formData.section}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Supplier</Label>
              <Input
                id="source"
                name="source"
                placeholder="e.g. AgriSupplies Ltd"
                value={formData.source}
                onChange={handleChange}
              />
            </div>
          </div>
        </form>
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
            onClick={handleSubmit}
          >
            {loading ? "Adding..." : "Add Consumable"}
          </Button>
        </div>
      </div>
    </div>
  )
}
