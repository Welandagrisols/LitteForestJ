"use client"

import type React from "react"

import { useState } from "react"
import { supabase, isDemoMode } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

interface EditInventoryFormProps {
  item: any
  onSuccess: () => void
}

export function EditInventoryForm({ item, onSuccess }: EditInventoryFormProps) {
  const [loading, setLoading] = useState(false)
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
  })

  // Calculate cost per seedling for plants (not consumables)
  const costPerSeedling = !isConsumable && formData.quantity > 0 ? formData.batch_cost / formData.quantity : 0

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
        description: "Connect to Supabase and set up tables to enable editing items",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      // Calculate cost per seedling for plants
      const calculatedCostPerSeedling =
        !isConsumable && formData.quantity > 0 ? formData.batch_cost / formData.quantity : item.cost_per_seedling || 0

      const updateData = {
        ...formData,
        cost_per_seedling: calculatedCostPerSeedling,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from("inventory").update(updateData).eq("id", item.id)

      if (error) throw error

      toast({
        title: "Success",
        description: isConsumable
          ? "Consumable updated"
          : `Plant batch updated. Cost per seedling: Ksh ${calculatedCostPerSeedling.toFixed(2)}`,
      })

      onSuccess()
    } catch (error: any) {
      toast({
        title: "Error updating item",
        description: error.message,
        variant: "destructive",
      })
      console.error("Error details:", error)
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
