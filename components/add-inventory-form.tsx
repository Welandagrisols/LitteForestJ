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
    price: 0,
    sku: "",
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

  const generateSKU = async (plantName: string) => {
    // Generate initials from plant name
    const words = plantName.trim().split(/\s+/)
    let initials = ""
    
    if (words.length === 1) {
      // Single word: take first 3 characters
      initials = words[0].substring(0, 3).toUpperCase()
    } else if (words.length === 2) {
      // Two words: take first 2 chars of first word + first char of second
      initials = (words[0].substring(0, 2) + words[1].substring(0, 1)).toUpperCase()
    } else {
      // Three or more words: take first char of first 3 words
      initials = words.slice(0, 3).map(word => word.charAt(0)).join("").toUpperCase()
    }

    // Get next batch number for this plant type
    const { data: existingSKUs } = await supabase
      .from("inventory")
      .select("sku")
      .like("sku", `${initials}%`)
      .order("sku", { ascending: false })

    let batchNumber = 1
    if (existingSKUs && existingSKUs.length > 0) {
      // Find the highest batch number
      const highestBatch = existingSKUs.reduce((max, item) => {
        if (item.sku && item.sku.startsWith(initials)) {
          const batchPart = item.sku.replace(initials, "")
          const batchNum = parseInt(batchPart) || 0
          return Math.max(max, batchNum)
        }
        return max
      }, 0)
      batchNumber = highestBatch + 1
    }

    return `${initials}${batchNumber.toString().padStart(2, "0")}`
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
      if (!formData.sku && formData.plant_name) {
        formData.sku = await generateSKU(formData.plant_name)
      }

      const { error } = await supabase.from("inventory").insert([
        {
          ...formData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])

      if (error) throw error

      toast({
        title: "Success",
        description: "New plant added to inventory",
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
        sku: "",
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
              <Label htmlFor="sku">SKU (Auto-generated from plant name)</Label>
              <Input 
                id="sku" 
                name="sku" 
                value={formData.sku} 
                onChange={handleChange}
                placeholder="Auto-generated based on plant name"
              />
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
