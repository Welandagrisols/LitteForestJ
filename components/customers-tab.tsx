"use client"

import { useState, useEffect } from "react"
import { supabase, isDemoMode, checkTableExists } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AddCustomerForm } from "@/components/add-customer-form"
import { useToast } from "@/components/ui/use-toast"
import { demoCustomers } from "@/components/demo-data"
import { DemoModeBanner } from "@/components/demo-mode-banner"

export function CustomersTab() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [tableExists, setTableExists] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    async function init() {
      if (isDemoMode) {
        setCustomers(demoCustomers)
        setLoading(false)
        return
      }

      // Check if the customers table exists
      const exists = await checkTableExists("customers")
      setTableExists(exists)

      if (!exists) {
        setCustomers(demoCustomers)
        setLoading(false)
        return
      }

      // If table exists, fetch data
      fetchCustomers().catch((error) => {
        console.log("Falling back to demo mode due to:", error.message)
        setCustomers(demoCustomers)
        setLoading(false)
      })
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

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  return (
    <div className="warm-card rounded-lg shadow-sm p-6">
      {(isDemoMode || !tableExists) && <DemoModeBanner isDemoMode={isDemoMode} tablesNotFound={!tableExists} />}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold">Customer Directory</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button
              className="bg-accent hover:bg-accent/90 text-white"
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
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
            </DialogHeader>
            <AddCustomerForm onSuccess={() => fetchCustomers()} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search customers by name, contact or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="rounded-md border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="sage-header hover:bg-muted/50">
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
                  <TableCell>{customer.contact}</TableCell>
                  <TableCell>{customer.email || "-"}</TableCell>
                  <TableCell>{new Date(customer.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" disabled={isDemoMode || !tableExists}>
                      View History
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
