"use client"

import type React from "react"

import { useState } from "react"
import { supabase, isDemoMode } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

interface AddInventoryFormProps {
  onSuccess: () => void
}

export function AddInventoryForm({ onSuccess }: AddInventoryFormProps) {
  const [loading, setLoading] = useState(false)
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

      // Calculate cost per seedling
      const calculatedCostPerSeedling = formData.quantity > 0 ? formData.batch_cost / formData.quantity : 0

      const { error } = await supabase.from("inventory").insert([
        {
          ...formData,
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

      onSuccess()

      // Reset form
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
          </div>
        </form>
      </div>

      {/* Sticky action buttons */}
      <div className="border-t border-border bg-white pt-4 mt-4">
        <div className="flex justify-end gap-2">
          <Button
            type="submit"
            form="add-inventory-form"
            className="bg-primary hover:bg-primary/90 text-white"
            disabled={loading}
          >
            {loading ? "Adding..." : "Add to Inventory"}
          </Button>
        </div>
      </div>
    </div>
  )
}
