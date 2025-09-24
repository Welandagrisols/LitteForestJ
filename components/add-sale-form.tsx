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
import { useForm } from "react-hook-form" // Import useForm
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface SaleFormData {
  inventory_id: string
  quantity: number
  sale_date: string
  customer_id?: string
  customer_name?: string
  customer_contact?: string
  customer_email?: string
  total_amount: number
}

interface AddSaleFormProps {
  onSuccess: () => void
}

export function AddSaleForm({ onSuccess }: AddSaleFormProps) {
  const [loading, setLoading] = useState(false)
  const [inventory, setInventory] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [isNewCustomer, setIsNewCustomer] = useState(false)
  const { toast } = useToast()

  // Use useForm from react-hook-form for better form management
  const { register, handleSubmit: handleFormSubmit, watch, setValue, formState: { errors } } = useForm<SaleFormData>() // Alias handleSubmit

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
      console.error("Error fetching inventory:", error)
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
      console.error("Error fetching customers:", error)
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

  const handleSubmit = async (dataFromForm: any) => { // Accept data from react-hook-form
    console.log("handleSubmit called with data:", dataFromForm)

    if (isDemoMode) {
      toast({
        title: "Demo Mode",
        description: "Connect to Supabase and set up tables to enable recording sales",
        variant: "destructive",
      })
      return
    }

    if (!dataFromForm.inventory_id || dataFromForm.quantity <= 0 || dataFromForm.total_amount <= 0) {
      toast({
        title: "Validation Error",
        description: "Please select an item and enter a valid quantity",
        variant: "destructive",
      })
      return
    }

    // Client-side validation for UX (server will also validate)
    const selectedInventoryItem = inventory.find(item => item.id === dataFromForm.inventory_id)
    if (!selectedInventoryItem) {
      toast({
        title: "Validation Error",
        description: "Selected item not found in inventory",
        variant: "destructive",
      })
      return
    }

    if (dataFromForm.quantity > selectedInventoryItem.quantity) {
      toast({
        title: "Insufficient Stock",
        description: `Cannot sell ${dataFromForm.quantity} units. Only ${selectedInventoryItem.quantity} available.`,
        variant: "destructive",
      })
      // Refresh inventory to show current quantities
      fetchInventory()
      return
    }

    if (isNewCustomer && (!dataFromForm.customer_name || !dataFromForm.customer_contact)) {
      toast({
        title: "Validation Error",
        description: "Please fill in customer name and contact for new customer",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      console.log("Starting atomic sale transaction via RPC...")

      // Call the atomic sale transaction function
      const { data, error } = await supabase.rpc('record_sale_atomic', {
        p_inventory_id: dataFromForm.inventory_id,
        p_quantity: Number(dataFromForm.quantity),
        p_sale_date: dataFromForm.sale_date,
        p_customer_id: isNewCustomer ? null : (dataFromForm.customer_id || null),
        p_customer_name: isNewCustomer ? dataFromForm.customer_name?.trim() : null,
        p_customer_contact: isNewCustomer ? dataFromForm.customer_contact?.trim() : null,
        p_customer_email: isNewCustomer ? (dataFromForm.customer_email?.trim() || null) : null,
        p_total_amount: Number(dataFromForm.total_amount)
      } as any)

      if (error) {
        console.error("RPC Error:", error)
        toast({
          title: "Database Error",
          description: `Failed to record sale: ${error.message}`,
          variant: "destructive",
        })
        return
      }

      console.log("RPC Response:", data)

      // Handle the response from the atomic function
      if (!(data as any)?.success) {
        const errorMessage = (data as any)?.message || "Unknown error occurred"

        switch ((data as any)?.error) {
          case 'ITEM_NOT_FOUND':
            toast({
              title: "Item Not Found",
              description: "The selected inventory item could not be found.",
              variant: "destructive",
            })
            break
          case 'INSUFFICIENT_STOCK':
            toast({
              title: "Insufficient Stock",
              description: `${errorMessage}. Available: ${(data as any).available_quantity || 0}`,
              variant: "destructive",
            })
            // Refresh inventory to show current quantities
            fetchInventory()
            break
          case 'AMOUNT_MISMATCH':
            toast({
              title: "Price Mismatch",
              description: errorMessage,
              variant: "destructive",
            })
            break
          default:
            toast({
              title: "Transaction Failed",
              description: errorMessage,
              variant: "destructive",
            })
        }
        return
      }

      // Success! The sale was recorded atomically
      console.log("Sale transaction completed successfully via RPC")

      toast({
        title: "Success",
        description: (data as any).message || "Sale recorded successfully",
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

      // Refresh inventory to show updated quantities
      fetchInventory()

      console.log("Calling onSuccess...")
      onSuccess()
    } catch (error: any) {
      console.error("Error calling atomic sale RPC:", error)
      toast({
        title: "Error recording sale",
        description: error.message || "Failed to record sale",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[70vh] max-h-[600px]">
      <div className="flex-1 overflow-y-auto pr-2">
        <form id="add-sale-form" onSubmit={handleFormSubmit(handleSubmit)}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inventory_id">Select Plant/Seedling *</Label>
              <Select
                value={formData.inventory_id}
                onValueChange={(value) => {
                  handleSelectChange("inventory_id", value);
                  setValue("inventory_id", value); // Update react-hook-form
                }}
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
                type="number"
                min="1"
                max={selectedItem?.quantity || 1}
                value={formData.quantity}
                {...register("quantity", { required: "Quantity is required", min: { value: 1, message: "Quantity must be at least 1" } })}
                onChange={(e) => {
                  handleChange(e);
                  setValue("quantity", Number(e.target.value)); // Update react-hook-form
                }}
                required
              />
              {selectedItem && (
                <p className="text-sm text-muted-foreground">
                  Available: {selectedItem.quantity} | Price per unit: Ksh {selectedItem.price}
                </p>
              )}
              {errors.quantity && <p className="text-red-500 text-sm">{errors.quantity.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sale_date">Sale Date *</Label>
              <Input
                id="sale_date"
                type="date"
                value={formData.sale_date}
                {...register("sale_date", { required: "Sale date is required" })}
                onChange={(e) => {
                  handleChange(e);
                  setValue("sale_date", e.target.value); // Update react-hook-form
                }}
                required
              />
              {errors.sale_date && <p className="text-red-500 text-sm">{errors.sale_date.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_amount">Total Amount (Ksh) *</Label>
              <Input
                id="total_amount"
                type="number"
                value={formData.total_amount}
                readOnly
                className="bg-muted"
                {...register("total_amount", { required: "Total amount is required" })}
              />
              {errors.total_amount && <p className="text-red-500 text-sm">{errors.total_amount.message}</p>}
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="new-customer"
                checked={isNewCustomer}
                onCheckedChange={(checked) => {
                  setIsNewCustomer(checked === true);
                }}
              />
              <Label htmlFor="new-customer">Add new customer</Label>
            </div>

            {isNewCustomer ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="customer_name">Customer Name *</Label>
                  <Input
                    id="customer_name"
                    value={formData.customer_name}
                    {...register("customer_name", { required: isNewCustomer ? "Customer name is required" : false })}
                    onChange={(e) => {
                      handleChange(e);
                      setValue("customer_name", e.target.value); // Update react-hook-form
                    }}
                    required={isNewCustomer}
                  />
                  {errors.customer_name && <p className="text-red-500 text-sm">{errors.customer_name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer_contact">Customer Contact *</Label>
                  <Input
                    id="customer_contact"
                    value={formData.customer_contact}
                    {...register("customer_contact", { required: isNewCustomer ? "Customer contact is required" : false })}
                    onChange={(e) => {
                      handleChange(e);
                      setValue("customer_contact", e.target.value); // Update react-hook-form
                    }}
                    required={isNewCustomer}
                  />
                  {errors.customer_contact && <p className="text-red-500 text-sm">{errors.customer_contact.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer_email">Customer Email</Label>
                  <Input
                    id="customer_email"
                    type="email"
                    value={formData.customer_email}
                    {...register("customer_email")}
                    onChange={(e) => {
                      handleChange(e);
                      setValue("customer_email", e.target.value); // Update react-hook-form
                    }}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="customer_id">Select Customer (Optional)</Label>
                <Select value={formData.customer_id} onValueChange={(value) => {
                  handleSelectChange("customer_id", value);
                  setValue("customer_id", value); // Update react-hook-form
                }}>
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

      <div className="border-t border-border bg-white pt-4 mt-4">
        <div className="flex justify-end gap-2">
          <Button
            type="submit"
            form="add-sale-form"
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white"
            disabled={loading || isDemoMode}
          >
            {loading ? "Recording Sale..." : "Record Sale"}
          </Button>
        </div>
      </div>
    </div>
  )
}