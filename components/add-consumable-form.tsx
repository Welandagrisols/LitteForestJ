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
    plant_name: "",
    category: "",
    quantity: 0,
    unit: "Pieces",
    date_planted: "",
    status: "Available",
    price: 0,
    sku: "",
    section: "",
    source: "",
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
      category: "",
      quantity: 0,
      unit: "Pieces",
      date_planted: "",
      status: "Available",
      price: 0,
      sku: "",
      section: "",
      source: "",
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
        finalFormData.sku = `CON${prefix}${randomNum}`
      }

      const insertData = {
        plant_name: finalFormData.plant_name.trim(),
        scientific_name: `[Consumable] ${finalFormData.unit}`,
        category: finalFormData.category,
        quantity: Number(finalFormData.quantity),
        age: null,
        date_planted: finalFormData.date_planted || null,
        status: finalFormData.status,
        price: Number(finalFormData.price),
        batch_cost: 0,
        cost_per_seedling: 0,
        sku: finalFormData.sku,
        section: finalFormData.section?.trim() || null,
        row: null,
        source: finalFormData.source?.trim() || null,
        item_type: "Consumable",
        ready_for_sale: false,
        description: null,
        image_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase.from("inventory").insert([insertData]).select()

      if (error) {
        console.error("Insert error:", error)
        throw error
      }

      toast({
        title: "Success",
        description: "New consumable added to inventory",
      })

      // Reset form and close dialog
      resetForm()
      onSuccess()
      if (onClose) onClose()
    } catch (error: any) {
      console.error("Error adding consumable:", error)
      toast({
        title: "Error adding consumable",
        description: error.message || "Failed to add consumable to inventory",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[70vh] max-h-[600px]">
      <div className="flex-1 overflow-y-auto pr-2">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plant_name">Item Name *</Label>
              <Input id="plant_name" name="plant_name" value={formData.plant_name} onChange={handleChange} required />
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
              <Label htmlFor="unit">Unit *</Label>
              <Select value={formData.unit} onValueChange={(value) => handleSelectChange("unit", value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pieces">Pieces</SelectItem>
                  <SelectItem value="Kilograms">Kilograms</SelectItem>
                  <SelectItem value="Grams">Grams</SelectItem>
                  <SelectItem value="Litres">Litres</SelectItem>
                  <SelectItem value="Millilitres">Millilitres</SelectItem>
                  <SelectItem value="Packets">Packets</SelectItem>
                  <SelectItem value="Bottles">Bottles</SelectItem>
                  <SelectItem value="Bags">Bags</SelectItem>
                </SelectContent>
              </Select>
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
              <Label htmlFor="date_planted">Purchase Date</Label>
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
                placeholder="e.g. Warehouse A"
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

      <div className="border-t border-border bg-white pt-4 mt-4">
        <div className="flex justify-end gap-2">
          {onClose && (
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            onClick={handleSubmit}
            className="bg-primary hover:bg-primary/90 text-white"
            disabled={loading}
          >
            {loading ? "Adding..." : "Add Consumable"}
          </Button>
        </div>
      </div>
    </div>
  )
}
