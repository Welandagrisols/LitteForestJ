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
  const { register, handleSubmit: handleFormSubmit, watch, setValue, formState: { errors } } = useForm() // Alias handleSubmit

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
      console.log("Starting sale recording...")

      let customerId = dataFromForm.customer_id

      if (isNewCustomer && dataFromForm.customer_name && dataFromForm.customer_contact) {
        const { data: newCustomer, error: customerError } = await supabase
          .from("customers")
          .insert([
            {
              name: dataFromForm.customer_name.trim(),
              contact: dataFromForm.customer_contact.trim(),
              email: dataFromForm.customer_email?.trim() || null,
              created_at: new Date().toISOString(),
            },
          ])
          .select()

        if (customerError) throw customerError

        if (newCustomer && newCustomer.length > 0) {
          customerId = newCustomer[0].id
        }
      }

      const { data, error } = await supabase.from("sales").insert([
        {
          inventory_id: dataFromForm.inventory_id,
          quantity: Number(dataFromForm.quantity),
          sale_date: dataFromForm.sale_date,
          customer_id: customerId || null,
          total_amount: Number(dataFromForm.total_amount),
          created_at: new Date().toISOString(),
        },
      ]).select() // Ensure data is returned to get saleId

      if (error) {
        console.error("Error creating sale:", error)
        toast({
          title: "Error",
          description: "Failed to create sale. Please try again.",
          variant: "destructive",
        })
        return
      }

      // Get the sale ID from the response
      const saleId = data[0].id

      // Prepare sale items data to be inserted into sale_items table
      const selectedItems = inventory.filter(item => item.id === dataFromForm.inventory_id)
      const saleItemsData = [{
        sale_id: saleId,
        inventory_id: dataFromForm.inventory_id,
        quantity: Number(dataFromForm.quantity),
        price_per_unit: selectedItems[0]?.price || 0,
        total_price: Number(dataFromForm.total_amount)
      }]


      const { error: itemsError } = await supabase
        .from("sale_items")
        .insert(saleItemsData)

      if (itemsError) {
        console.error("Error adding sale items:", itemsError)
        toast({
          title: "Error",
          description: "Failed to add sale items. Please try again.",
          variant: "destructive",
        })
        return
      }

      // Send notification for new sale
      // The notification service import was removed as per the edits.
      // If this functionality is required, the import needs to be added back.
      // await notificationService.notifyNewSale(saleWithItems)


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

      console.log("Calling onSuccess...")
      onSuccess()
    } catch (error: any) {
      console.error("Error recording sale:", error)
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