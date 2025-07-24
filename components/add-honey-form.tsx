
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
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface AddHoneyFormProps {
  onSuccess: () => void
  onClose?: () => void
}

export function AddHoneyForm({ onSuccess, onClose }: AddHoneyFormProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    product_name: "",
    honey_type: "Raw Honey",
    quantity: 0,
    unit: "kg",
    price: 0,
    batch_cost: 0,
    sku: "",
    packaging_type: "Glass Jar",
    packaging_size: "500g",
    source_hives: "",
    harvest_date: "",
    expiry_date: "",
    description: "",
    ready_for_sale: false,
  })

  const [apiaryData, setApiaryData] = useState({
    number_of_hives: 0,
    cost_per_hive: 0,
    purchase_date: "",
    apiary_construction_cost: 0,
    other_equipment_cost: 0,
  })

  const costPerUnit = formData.quantity > 0 ? formData.batch_cost / formData.quantity : 0
  const totalApiaryInvestment = (apiaryData.number_of_hives * apiaryData.cost_per_hive) + 
                                apiaryData.apiary_construction_cost + 
                                apiaryData.other_equipment_cost

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "quantity" || name === "price" || name === "batch_cost" ? Number(value) : value,
    }))
  }

  const handleApiaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setApiaryData((prev) => ({
      ...prev,
      [name]: name.includes("cost") || name === "number_of_hives" ? Number(value) : value,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async () => {
    if (isDemoMode) {
      toast({
        title: "Demo Mode",
        description: "Connect to Supabase and set up tables to enable adding honey products",
        variant: "destructive",
      })
      return
    }

    if (!formData.product_name || formData.quantity <= 0 || formData.price <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields with valid values",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      const finalFormData = { ...formData }
      if (!finalFormData.sku) {
        const prefix = "HON"
        const randomNum = Math.floor(1000 + Math.random() * 9000)
        finalFormData.sku = `${prefix}${randomNum}`
      }

      const calculatedCostPerUnit = finalFormData.quantity > 0 ? finalFormData.batch_cost / finalFormData.quantity : 0

      // Insert honey product into inventory
      const insertData = {
        plant_name: finalFormData.product_name.trim(),
        scientific_name: finalFormData.honey_type,
        category: "Organic Honey",
        quantity: Number(finalFormData.quantity),
        unit: finalFormData.unit,
        age: finalFormData.packaging_size,
        date_planted: finalFormData.harvest_date || null,
        status: finalFormData.ready_for_sale ? "Ready" : "Processing",
        price: Number(finalFormData.price),
        batch_cost: Number(finalFormData.batch_cost),
        cost_per_seedling: calculatedCostPerUnit,
        sku: finalFormData.sku,
        section: finalFormData.packaging_type,
        row: finalFormData.source_hives,
        source: "Apiary Production",
        item_type: "Honey",
        ready_for_sale: finalFormData.ready_for_sale,
        description: finalFormData.description || `Premium ${finalFormData.honey_type} - ${finalFormData.packaging_size}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase.from("inventory").insert([insertData]).select()

      if (error) {
        console.error("Insert error:", error)
        throw error
      }

      // If apiary data is provided, insert into tasks table for tracking
      if (apiaryData.number_of_hives > 0) {
        const apiaryTaskData = {
          task_name: "Apiary Setup & Hive Investment",
          description: `Initial setup: ${apiaryData.number_of_hives} hives at ${apiaryData.cost_per_hive} each. Construction: ${apiaryData.apiary_construction_cost}. Equipment: ${apiaryData.other_equipment_cost}`,
          batch_sku: finalFormData.sku,
          task_date: apiaryData.purchase_date || new Date().toISOString().split('T')[0],
          total_cost: totalApiaryInvestment,
          status: "Completed",
          category: "Infrastructure",
        }

        await supabase.from("tasks").insert([apiaryTaskData])
      }

      toast({
        title: "Success",
        description: `Honey product added successfully! Cost per ${finalFormData.unit}: Ksh ${calculatedCostPerUnit.toFixed(2)}`,
      })

      // Reset form
      setFormData({
        product_name: "",
        honey_type: "Raw Honey",
        quantity: 0,
        unit: "kg",
        price: 0,
        batch_cost: 0,
        sku: "",
        packaging_type: "Glass Jar",
        packaging_size: "500g",
        source_hives: "",
        harvest_date: "",
        expiry_date: "",
        description: "",
        ready_for_sale: false,
      })

      setApiaryData({
        number_of_hives: 0,
        cost_per_hive: 0,
        purchase_date: "",
        apiary_construction_cost: 0,
        other_equipment_cost: 0,
      })

      onSuccess()
      if (onClose) onClose()

    } catch (error: any) {
      console.error("Error adding honey product:", error)
      toast({
        title: "Error adding honey product",
        description: error.message || "Failed to add honey product to inventory",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const isMobile = useIsMobile()

  return (
    <div className="flex flex-col max-h-[80vh]">
      <div className="flex-1 overflow-y-auto px-1">
        <div className="space-y-6">
          {/* Product Information */}
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`grid grid-cols-1 ${isMobile ? "gap-6" : "md:grid-cols-2 gap-4"}`}>
                <div className="space-y-2">
                  <Label htmlFor="product_name">Product Name *</Label>
                  <Input 
                    id="product_name" 
                    name="product_name" 
                    value={formData.product_name} 
                    onChange={handleChange} 
                    placeholder="e.g., Organic Wildflower Honey"
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="honey_type">Honey Type *</Label>
                  <Select value={formData.honey_type} onValueChange={(value) => handleSelectChange("honey_type", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select honey type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Raw Honey">Raw Honey</SelectItem>
                      <SelectItem value="Wildflower Honey">Wildflower Honey</SelectItem>
                      <SelectItem value="Acacia Honey">Acacia Honey</SelectItem>
                      <SelectItem value="Clover Honey">Clover Honey</SelectItem>
                      <SelectItem value="Manuka Honey">Manuka Honey</SelectItem>
                      <SelectItem value="Multi-floral Honey">Multi-floral Honey</SelectItem>
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
                    step="0.1"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select value={formData.unit} onValueChange={(value) => handleSelectChange("unit", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">Kilograms (kg)</SelectItem>
                      <SelectItem value="liters">Liters</SelectItem>
                      <SelectItem value="jars">Jars</SelectItem>
                      <SelectItem value="bottles">Bottles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="packaging_type">Packaging Type</Label>
                  <Select value={formData.packaging_type} onValueChange={(value) => handleSelectChange("packaging_type", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select packaging" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Glass Jar">Glass Jar</SelectItem>
                      <SelectItem value="Plastic Container">Plastic Container</SelectItem>
                      <SelectItem value="Squeeze Bottle">Squeeze Bottle</SelectItem>
                      <SelectItem value="Bulk Container">Bulk Container</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="packaging_size">Package Size</Label>
                  <Input
                    id="packaging_size"
                    name="packaging_size"
                    value={formData.packaging_size}
                    onChange={handleChange}
                    placeholder="e.g., 500g, 1kg, 250ml"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="batch_cost">Total Production Cost (Ksh) *</Label>
                  <Input
                    id="batch_cost"
                    name="batch_cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.batch_cost}
                    onChange={handleChange}
                    required
                    placeholder="Total cost for this batch"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Selling Price per {formData.unit} (Ksh) *</Label>
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
                  <Label htmlFor="harvest_date">Harvest Date</Label>
                  <Input
                    id="harvest_date"
                    name="harvest_date"
                    type="date"
                    value={formData.harvest_date}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="source_hives">Source Hives</Label>
                  <Input
                    id="source_hives"
                    name="source_hives"
                    value={formData.source_hives}
                    onChange={handleChange}
                    placeholder="e.g., Hive 1-5, Block A"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Product Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe the honey for your website customers..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">SKU (Auto-generated if empty)</Label>
                  <Input id="sku" name="sku" value={formData.sku} onChange={handleChange} />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="ready_for_sale"
                    checked={formData.ready_for_sale}
                    onChange={(e) => setFormData(prev => ({ ...prev, ready_for_sale: e.target.checked }))}
                  />
                  <Label htmlFor="ready_for_sale">Ready for Sale on Website</Label>
                </div>

                {formData.quantity > 0 && formData.batch_cost > 0 && (
                  <div className="space-y-2 md:col-span-2">
                    <div className="p-3 bg-muted rounded-md border">
                      <div className="text-sm font-medium text-muted-foreground">Cost Analysis:</div>
                      <div className="text-lg font-bold text-primary">Cost per {formData.unit}: Ksh {costPerUnit.toFixed(2)}</div>
                      <div className="text-sm text-green-600">Profit per {formData.unit}: Ksh {(formData.price - costPerUnit).toFixed(2)}</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Apiary Investment Tracking */}
          <Card>
            <CardHeader>
              <CardTitle>Apiary Investment Tracking (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`grid grid-cols-1 ${isMobile ? "gap-6" : "md:grid-cols-2 gap-4"}`}>
                <div className="space-y-2">
                  <Label htmlFor="number_of_hives">Number of Hives</Label>
                  <Input
                    id="number_of_hives"
                    name="number_of_hives"
                    type="number"
                    min="0"
                    value={apiaryData.number_of_hives}
                    onChange={handleApiaryChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost_per_hive">Cost per Hive (Ksh)</Label>
                  <Input
                    id="cost_per_hive"
                    name="cost_per_hive"
                    type="number"
                    min="0"
                    step="0.01"
                    value={apiaryData.cost_per_hive}
                    onChange={handleApiaryChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchase_date">Purchase Date</Label>
                  <Input
                    id="purchase_date"
                    name="purchase_date"
                    type="date"
                    value={apiaryData.purchase_date}
                    onChange={handleApiaryChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiary_construction_cost">Apiary Construction Cost (Ksh)</Label>
                  <Input
                    id="apiary_construction_cost"
                    name="apiary_construction_cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={apiaryData.apiary_construction_cost}
                    onChange={handleApiaryChange}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="other_equipment_cost">Other Equipment Cost (Ksh)</Label>
                  <Input
                    id="other_equipment_cost"
                    name="other_equipment_cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={apiaryData.other_equipment_cost}
                    onChange={handleApiaryChange}
                    placeholder="Smokers, suits, extractors, etc."
                  />
                </div>

                {totalApiaryInvestment > 0 && (
                  <div className="space-y-2 md:col-span-2">
                    <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                      <div className="text-sm font-medium text-blue-700">Total Apiary Investment:</div>
                      <div className="text-xl font-bold text-blue-800">Ksh {totalApiaryInvestment.toLocaleString()}</div>
                      <div className="text-xs text-blue-600">
                        Hives: Ksh {(apiaryData.number_of_hives * apiaryData.cost_per_hive).toLocaleString()} | 
                        Construction: Ksh {apiaryData.apiary_construction_cost.toLocaleString()} | 
                        Equipment: Ksh {apiaryData.other_equipment_cost.toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="border-t border-border bg-white pt-4 mt-4 flex-shrink-0">
        <div className={`flex ${isMobile ? "flex-col gap-3" : "justify-end space-x-2"}`}>
          {onClose && (
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className={isMobile ? "mobile-touch-target w-full" : ""}
            >
              Cancel
            </Button>
          )}
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className={`bg-primary hover:bg-primary/90 text-white ${isMobile ? "mobile-touch-target w-full" : ""}`}
          >
            {loading ? "Adding..." : "Add Honey Product"}
          </Button>
        </div>
      </div>
    </div>
  )
}
