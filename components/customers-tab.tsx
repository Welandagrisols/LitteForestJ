"use client"

import { useState, useEffect } from "react"
import { supabase, isDemoMode, checkTableExists } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AddCustomerForm } from "@/components/add-customer-form"
import { useToast } from "@/components/ui/use-toast"
import { demoCustomers, demoInventory } from "@/components/demo-data"
import { DemoModeBanner } from "@/components/demo-mode-banner"
import { exportToExcel } from "@/lib/excel-export"
import {
  Download,
  Loader2,
  MessageSquare,
  Send,
  Users,
  Phone,
  Mail,
  Calendar,
  Copy,
  Trash2,
  Search,
} from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"

interface Customer {
  id: string
  name: string
  contact: string
  email: string | null
  created_at: string
}

interface Plant {
  id: string
  plant_name: string
  quantity: number
  price: number
  status: string
}

export function CustomersTab() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [plants, setPlants] = useState<Plant[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [tableExists, setTableExists] = useState(true)
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [customMessage, setCustomMessage] = useState("")
  const [sendingMessages, setSendingMessages] = useState(false)
  const { toast } = useToast()
  const isMobile = useIsMobile()

  useEffect(() => {
    async function init() {
      if (isDemoMode) {
        setCustomers(demoCustomers)
        setPlants(demoInventory.filter((plant) => plant.status === "Current"))
        setLoading(false)
        return
      }

      // Check if the customers table exists
      const exists = await checkTableExists("customers")
      setTableExists(exists)

      if (!exists) {
        setCustomers(demoCustomers)
        setPlants(demoInventory.filter((plant) => plant.status === "Current"))
        setLoading(false)
        return
      }

      // If table exists, fetch data
      try {
        await Promise.all([fetchCustomers(), fetchPlants()])
      } catch (error) {
        console.log("Falling back to demo mode due to:", error)
        setCustomers(demoCustomers)
        setPlants(demoInventory.filter((plant) => plant.status === "Current"))
        setLoading(false)
      }
    }

    init()
  }, [])

  async function fetchCustomers() {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("customers").select("*").order("name", { ascending: true })

      if (error) throw error
      setCustomers(data || [])
    } catch (error: any) {
      console.error("Error fetching customers:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  async function fetchPlants() {
    try {
      const { data, error } = await supabase
        .from("inventory")
        .select("id, plant_name, quantity, price, status")
        .eq("status", "Current")
        .gt("quantity", 0)
        .order("plant_name", { ascending: true })

      if (error) throw error
      setPlants(data || [])
    } catch (error: any) {
      console.error("Error fetching plants:", error)
      // Don't throw here, just use empty array
      setPlants([])
    }
  }

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const handleExportToExcel = async () => {
    try {
      setExporting(true)

      const exportData = filteredCustomers.map((customer) => ({
        Name: customer.name,
        Contact: customer.contact,
        Email: customer.email || "",
        "Date Added": new Date(customer.created_at).toLocaleDateString(),
      }))

      const success = exportToExcel(exportData, `Customers_Export_${new Date().toISOString().split("T")[0]}`)

      if (success) {
        toast({
          title: "Export Successful",
          description: `${exportData.length} customers exported to Excel`,
        })
      } else {
        throw new Error("Export failed")
      }
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "An error occurred during export",
        variant: "destructive",
      })
    } finally {
      setExporting(false)
    }
  }

  const generateProductMessage = () => {
    if (plants.length === 0) return "No products currently available."

    const productList = plants
      .slice(0, 10) // Limit to first 10 products
      .map((plant) => `• ${plant.plant_name} (${plant.quantity} available) - KSh ${plant.price}`)
      .join("\n")

    return `Hi [FIRST_NAME], We have the following ready for planting:\n\n${productList}\n\nVisit our website www.littleforest.co.ke to view and make your order.`
  }

  const handleCustomerSelection = (customerId: string, checked: boolean) => {
    if (checked) {
      setSelectedCustomers((prev) => [...prev, customerId])
    } else {
      setSelectedCustomers((prev) => prev.filter((id) => id !== customerId))
    }
  }

  const selectAllCustomers = () => {
    setSelectedCustomers(filteredCustomers.map((c) => c.id))
  }

  const clearSelection = () => {
    setSelectedCustomers([])
  }

  const sendWhatsAppMessage = (phoneNumber: string, message: string) => {
    // Clean phone number (remove spaces, dashes, etc.)
    const cleanNumber = phoneNumber.replace(/\D/g, "")

    // Add Kenya country code if not present
    let formattedNumber = cleanNumber
    if (cleanNumber.startsWith("0")) {
      formattedNumber = "254" + cleanNumber.substring(1)
    } else if (cleanNumber.startsWith("7") || cleanNumber.startsWith("1")) {
      formattedNumber = "254" + cleanNumber
    }

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message)

    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodedMessage}`

    // Open in new tab
    window.open(whatsappUrl, "_blank")
  }

  const handleSendProductMessages = async () => {
    if (selectedCustomers.length === 0) {
      toast({
        title: "No Customers Selected",
        description: "Please select customers to send messages to",
        variant: "destructive",
      })
      return
    }

    setSendingMessages(true)
    const baseMessage = generateProductMessage()
    let successCount = 0

    try {
      for (const customerId of selectedCustomers) {
        const customer = customers.find((c) => c.id === customerId)
        if (customer) {
          const firstName = customer.name.split(" ")[0]
          const personalizedMessage = baseMessage.replace("[FIRST_NAME]", firstName)

          // Small delay between messages to avoid overwhelming
          await new Promise((resolve) => setTimeout(resolve, 500))

          sendWhatsAppMessage(customer.contact, personalizedMessage)
          successCount++
        }
      }

      toast({
        title: "Messages Sent",
        description: `${successCount} WhatsApp messages opened successfully`,
      })
    } catch (error: any) {
      toast({
        title: "Error Sending Messages",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSendingMessages(false)
    }
  }

  const handleSendCustomMessages = async () => {
    if (selectedCustomers.length === 0) {
      toast({
        title: "No Customers Selected",
        description: "Please select customers to send messages to",
        variant: "destructive",
      })
      return
    }

    if (!customMessage.trim()) {
      toast({
        title: "No Message",
        description: "Please enter a custom message to send",
        variant: "destructive",
      })
      return
    }

    setSendingMessages(true)
    let successCount = 0

    try {
      for (const customerId of selectedCustomers) {
        const customer = customers.find((c) => c.id === customerId)
        if (customer) {
          const firstName = customer.name.split(" ")[0]
          const personalizedMessage = customMessage.replace(/\[FIRST_NAME\]/g, firstName)

          // Small delay between messages
          await new Promise((resolve) => setTimeout(resolve, 500))

          sendWhatsAppMessage(customer.contact, personalizedMessage)
          successCount++
        }
      }

      toast({
        title: "Custom Messages Sent",
        description: `${successCount} WhatsApp messages opened successfully`,
      })

      setCustomMessage("")
    } catch (error: any) {
      toast({
        title: "Error Sending Messages",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSendingMessages(false)
    }
  }

  const copyMessage = (message: string) => {
    navigator.clipboard.writeText(message)
    toast({
      title: "Message Copied",
      description: "Message copied to clipboard",
    })
  }

  const handleDeleteCustomer = async (customerId: string, customerName: string) => {
    if (isDemoMode || !tableExists) {
      toast({
        title: "Cannot Delete",
        description: "Connect to Supabase to enable deleting customers",
        variant: "destructive",
      })
      return
    }

    // Confirm deletion
    if (!window.confirm(`Are you sure you want to delete customer "${customerName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const { error } = await supabase.from("customers").delete().eq("id", customerId)

      if (error) throw error

      toast({
        title: "Customer Deleted",
        description: `Customer "${customerName}" has been deleted successfully`,
      })

      // Refresh the customers data
      await fetchCustomers()

      // Remove from selected customers if it was selected
      setSelectedCustomers((prev) => prev.filter((id) => id !== customerId))
    } catch (error: any) {
      console.error("Error deleting customer:", error)
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete customer",
        variant: "destructive",
      })
    }
  }

  return (
    <div className={`space-y-6 ${isMobile ? "mobile-content" : ""}`}>
      {(isDemoMode || !tableExists) && <DemoModeBanner isDemoMode={isDemoMode} tablesNotFound={!tableExists} />}

      <Tabs defaultValue="directory" className={`w-full ${isMobile ? "mobile-tabs" : ""}`}>
        <TabsList className={`grid w-full grid-cols-2 ${isMobile ? "mb-4" : ""}`}>
          <TabsTrigger value="directory" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {isMobile ? "Directory" : "Customer Directory"}
          </TabsTrigger>
          <TabsTrigger value="messaging" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            {isMobile ? "Messaging" : "WhatsApp Messaging"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="directory" className="space-y-6">
          <Card>
            <CardHeader>
              <div
                className={`${isMobile ? "space-y-4" : "flex flex-col md:flex-row justify-between items-start md:items-center gap-4"}`}
              >
                <div>
                  <CardTitle className={`${isMobile ? "text-xl" : "text-2xl"}`}>Customer Directory</CardTitle>
                  <CardDescription className={isMobile ? "text-sm" : ""}>
                    Manage your customer database and contact information
                  </CardDescription>
                </div>
                <div className={`${isMobile ? "mobile-button-group" : "flex gap-2"}`}>
                  <Button
                    variant="outline"
                    className={`flex items-center gap-2 bg-transparent ${isMobile ? "mobile-touch-target" : ""}`}
                    onClick={handleExportToExcel}
                    disabled={exporting || filteredCustomers.length === 0}
                  >
                    {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Export to Excel
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        className={`bg-green-600 hover:bg-green-700 text-white ${isMobile ? "mobile-touch-target" : ""}`}
                        disabled={isDemoMode || !tableExists}
                        title={
                          isDemoMode || !tableExists
                            ? "Connect to Supabase and set up tables to enable adding customers"
                            : "Add new customer"
                        }
                      >
                        Add New Customer
                      </Button>
                    </DialogTrigger>
                    <DialogContent className={`${isMobile ? "mobile-dialog" : "sm:max-w-[500px]"}`}>
                      <DialogHeader>
                        <DialogTitle>Add New Customer</DialogTitle>
                      </DialogHeader>
                      <AddCustomerForm onSuccess={() => fetchCustomers()} />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`${isMobile ? "mb-4" : "mb-6"}`}>
                <div className={isMobile ? "relative" : ""}>
                  {isMobile && (
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  )}
                  <Input
                    placeholder="Search customers by name, contact or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`${isMobile ? "pl-10 mobile-touch-target" : "max-w-md"}`}
                  />
                </div>
              </div>

              {isMobile ? (
                // Mobile card layout
                <div className="space-y-4">
                  {loading ? (
                    <div className="mobile-loading">
                      <div className="text-center">Loading customers...</div>
                    </div>
                  ) : filteredCustomers.length === 0 ? (
                    <div className="mobile-empty-state">
                      <div className="text-center">No customers found</div>
                    </div>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <div key={customer.id} className="mobile-customer-item">
                        <div className="flex-1">
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {customer.contact}
                          </div>
                          {customer.email && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {customer.email}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(customer.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="mobile-action-buttons">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              sendWhatsAppMessage(
                                customer.contact,
                                `Hi ${customer.name.split(" ")[0]}, thank you for being our valued customer!`,
                              )
                            }
                            className="flex items-center gap-1"
                          >
                            <MessageSquare className="h-3 w-3" />
                            WhatsApp
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCustomer(customer.id, customer.name)}
                            disabled={isDemoMode || !tableExists}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                // Desktop table layout
                <div className="rounded-md border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Added On</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            Loading customers...
                          </TableCell>
                        </TableRow>
                      ) : filteredCustomers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            No customers found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCustomers.map((customer) => (
                          <TableRow key={customer.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{customer.name}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                {customer.contact}
                              </div>
                            </TableCell>
                            <TableCell>
                              {customer.email ? (
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-muted-foreground" />
                                  {customer.email}
                                </div>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {new Date(customer.created_at).toLocaleDateString()}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    sendWhatsAppMessage(
                                      customer.contact,
                                      `Hi ${customer.name.split(" ")[0]}, thank you for being our valued customer!`,
                                    )
                                  }
                                  className="flex items-center gap-1"
                                >
                                  <MessageSquare className="h-3 w-3" />
                                  WhatsApp
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteCustomer(customer.id, customer.name)}
                                  disabled={isDemoMode || !tableExists}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messaging" className="space-y-6">
          <div className={`${isMobile ? "space-y-6" : "grid grid-cols-1 lg:grid-cols-2 gap-6"}`}>
            {/* Customer Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Select Customers
                </CardTitle>
                <CardDescription className={isMobile ? "text-sm" : ""}>
                  Choose customers to send WhatsApp messages to
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className={`${isMobile ? "mobile-button-group" : "flex gap-2"}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllCustomers}
                      disabled={filteredCustomers.length === 0}
                      className={isMobile ? "mobile-touch-target" : ""}
                    >
                      Select All ({filteredCustomers.length})
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearSelection}
                      disabled={selectedCustomers.length === 0}
                      className={isMobile ? "mobile-touch-target" : ""}
                    >
                      Clear Selection
                    </Button>
                  </div>

                  {selectedCustomers.length > 0 && (
                    <Badge variant="secondary" className="mb-2">
                      {selectedCustomers.length} customer(s) selected
                    </Badge>
                  )}

                  <div className={`${isMobile ? "mobile-scroll-container" : "max-h-64 overflow-y-auto"} space-y-2`}>
                    {filteredCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        className={`${isMobile ? "mobile-customer-item" : "flex items-center space-x-2 p-2 rounded border"}`}
                      >
                        <input
                          type="checkbox"
                          id={customer.id}
                          checked={selectedCustomers.includes(customer.id)}
                          onChange={(e) => handleCustomerSelection(customer.id, e.target.checked)}
                          className={`rounded ${isMobile ? "w-5 h-5" : ""}`}
                        />
                        <label htmlFor={customer.id} className="flex-1 cursor-pointer">
                          <div className="font-medium">{customer.name}</div>
                          <div className={`${isMobile ? "text-xs" : "text-sm"} text-muted-foreground`}>
                            {customer.contact}
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Message Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Message Templates
                </CardTitle>
                <CardDescription className={isMobile ? "text-sm" : ""}>
                  Send product updates or custom messages
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Product Availability Message */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-medium ${isMobile ? "text-sm" : ""}`}>Product Availability Message</h4>
                    <Button variant="ghost" size="sm" onClick={() => copyMessage(generateProductMessage())}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className={`${isMobile ? "mobile-message-preview" : "p-3 bg-muted rounded-md text-sm"}`}>
                    <div className="whitespace-pre-wrap">{generateProductMessage()}</div>
                  </div>
                  <Button
                    onClick={handleSendProductMessages}
                    disabled={selectedCustomers.length === 0 || sendingMessages || plants.length === 0}
                    className={`w-full bg-green-600 hover:bg-green-700 ${isMobile ? "mobile-touch-target" : ""}`}
                  >
                    {sendingMessages ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Send Product Updates ({selectedCustomers.length})
                  </Button>
                </div>

                <Separator />

                {/* Custom Message */}
                <div className="space-y-3">
                  <h4 className={`font-medium ${isMobile ? "text-sm" : ""}`}>Custom Message</h4>
                  <Textarea
                    placeholder="Write your custom message here... Use [FIRST_NAME] to personalize with customer's first name."
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={isMobile ? 3 : 4}
                    className={isMobile ? "mobile-touch-target" : ""}
                  />
                  <div className={`${isMobile ? "text-xs" : "text-xs"} text-muted-foreground`}>
                    Tip: Use [FIRST_NAME] in your message to automatically insert each customer's first name
                  </div>
                  <Button
                    onClick={handleSendCustomMessages}
                    disabled={selectedCustomers.length === 0 || sendingMessages || !customMessage.trim()}
                    className={`w-full bg-blue-600 hover:bg-blue-700 ${isMobile ? "mobile-touch-target" : ""}`}
                  >
                    {sendingMessages ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Send Custom Message ({selectedCustomers.length})
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Available Products Summary */}
          <Card>
            <CardHeader>
              <CardTitle className={isMobile ? "text-lg" : ""}>Available Products ({plants.length})</CardTitle>
              <CardDescription className={isMobile ? "text-sm" : ""}>
                Current inventory ready for planting that will be included in product messages
              </CardDescription>
            </CardHeader>
            <CardContent>
              {plants.length === 0 ? (
                <div className={`${isMobile ? "mobile-empty-state" : "text-center py-8 text-muted-foreground"}`}>
                  No products currently available for messaging
                </div>
              ) : (
                <div
                  className={`${isMobile ? "mobile-plant-grid" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"}`}
                >
                  {plants.slice(0, 12).map((plant) => (
                    <div key={plant.id} className={`${isMobile ? "mobile-product-card" : "p-3 border rounded-lg"}`}>
                      <div className={`font-medium ${isMobile ? "text-sm" : ""}`}>{plant.plant_name}</div>
                      <div className={`${isMobile ? "text-xs" : "text-sm"} text-muted-foreground`}>
                        {plant.quantity} available • KSh {plant.price}
                      </div>
                    </div>
                  ))}
                  {plants.length > 12 && (
                    <div
                      className={`${isMobile ? "mobile-product-card border-dashed" : "p-3 border rounded-lg border-dashed"} flex items-center justify-center text-muted-foreground`}
                    >
                      +{plants.length - 12} more products
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
