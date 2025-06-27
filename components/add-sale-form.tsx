"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { isDemoMode } from "@/lib/supabase"

interface AddSaleFormProps {
  onSuccess: () => void
  onClose?: () => void
}

export function AddSaleForm({ onSuccess, onClose }: AddSaleFormProps) {
  const [loading, setLoading] = useState(false)
  const [inventory, setInventory] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [isNewCustomer, setIsNewCustomer] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    inventory_id: "",
    quantity: 1,
    sale_date: new Date().toISOString().split("T")[0],
    customer_id: "",
    customer_name: "",
    customer_contact: "",
    customer_email: "",
    total_amount: 0,
  })

  useEffect(() => {
    fetchInventory()
    fetchCustomers()
  }, [])

  async function fetchInventory() {
    try {
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .gt("quantity", 0)
        .order("plant_name", { ascending: true })

      if (error) throw error
      setInventory(data || [])
    } catch (error: any) {
      toast({
        title: "Error fetching inventory",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  async function fetchCustomers() {
    try {
      const { data, error } = await supabase.from("customers").select("*").order("name", { ascending: true })

      if (error) throw error
      setCustomers(data || [])
    } catch (error: any) {
      toast({
        title: "Error fetching customers",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (name === "quantity") {
      const quantity = Number(value)
      const price = selectedItem?.price || 0

      setFormData((prev) => ({
        ...prev,
        quantity,
        total_amount: quantity * price,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    if (name === "inventory_id") {
      const item = inventory.find((item) => item.id === value)
      setSelectedItem(item)

      setFormData((prev) => ({
        ...prev,
        inventory_id: value,
        total_amount: prev.quantity * (item?.price || 0),
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isDemoMode) {
      toast({
        title: "Demo Mode",
        description: "Connect to Supabase and set up tables to enable recording sales",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      let customerId = formData.customer_id

      // Create new customer if needed
      if (isNewCustomer && formData.customer_name && formData.customer_contact) {
        const { data: newCustomer, error: customerError } = await supabase
          .from("customers")
          .insert([
            {
              name: formData.customer_name,
              contact: formData.customer_contact,
              email: formData.customer_email || null,
              created_at: new Date().toISOString(),
            },
          ])
          .select()

        if (customerError) throw customerError

        if (newCustomer && newCustomer.length > 0) {
          customerId = newCustomer[0].id
        }
      }

      // Record the sale
      const { error: saleError } = await supabase.from("sales").insert([
        {
          inventory_id: formData.inventory_id,
          quantity: formData.quantity,
          sale_date: formData.sale_date,
          customer_id: customerId || null,
          total_amount: formData.total_amount,
          created_at: new Date().toISOString(),
        },
      ])

      if (saleError) throw saleError

      // Update inventory quantity
      if (selectedItem) {
        const newQuantity = selectedItem.quantity - formData.quantity

        const { error: inventoryError } = await supabase
          .from("inventory")
          .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
          .eq("id", formData.inventory_id)

        if (inventoryError) throw inventoryError
      }

      toast({
        title: "Success",
        description: "Sale recorded successfully",
      })

      // Reset form
      setFormData({
        inventory_id: "",
        quantity: 1,
        sale_date: new Date().toISOString().split("T")[0],
        customer_id: "",
        customer_name: "",
        customer_contact: "",
        customer_email: "",
        total_amount: 0,
      })
      setSelectedItem(null)
      setIsNewCustomer(false)

      onSuccess()
      onClose?.()
    } catch (error: any) {
      toast({
        title: "Error recording sale",
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
        <form id="add-sale-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inventory_id">Select Plant/Seedling *</Label>
              <Select
                value={formData.inventory_id}
                onValueChange={(value) => handleSelectChange("inventory_id", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select plant from inventory" />
                </SelectTrigger>
                <SelectContent>
                  {inventory.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.plant_name} - {item.quantity} available - Ksh {item.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                max={selectedItem?.quantity || 1}
                value={formData.quantity}
                onChange={handleChange}
                required
              />
              {selectedItem && (
                <p className="text-sm text-muted-foreground">
                  Available: {selectedItem.quantity} | Price per unit: Ksh {selectedItem.price}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sale_date">Sale Date *</Label>
              <Input
                id="sale_date"
                name="sale_date"
                type="date"
                value={formData.sale_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_amount">Total Amount (Ksh) *</Label>
              <Input
                id="total_amount"
                name="total_amount"
                type="number"
                value={formData.total_amount}
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="new-customer"
                checked={isNewCustomer}
                onCheckedChange={(checked) => setIsNewCustomer(checked === true)}
              />
              <Label htmlFor="new-customer">Add new customer</Label>
            </div>

            {isNewCustomer ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="customer_name">Customer Name *</Label>
                  <Input
                    id="customer_name"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleChange}
                    required={isNewCustomer}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer_contact">Customer Contact *</Label>
                  <Input
                    id="customer_contact"
                    name="customer_contact"
                    value={formData.customer_contact}
                    onChange={handleChange}
                    required={isNewCustomer}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer_email">Customer Email</Label>
                  <Input
                    id="customer_email"
                    name="customer_email"
                    type="email"
                    value={formData.customer_email}
                    onChange={handleChange}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="customer_id">Select Customer (Optional)</Label>
                <Select
                  value={formData.customer_id}
                  onValueChange={(value) => handleSelectChange("customer_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select existing customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} - {customer.contact}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Sticky action buttons */}
      <div className="border-t border-border bg-white pt-4 mt-4">
        <div className="flex justify-end gap-2">
          <Button
            type="submit"
            form="add-sale-form"
            className="bg-secondary hover:bg-secondary/90 text-white"
            disabled={loading}
          >
            {loading ? "Recording..." : "Record Sale"}
          </Button>
        </div>
      </div>
    </div>
  )
}
