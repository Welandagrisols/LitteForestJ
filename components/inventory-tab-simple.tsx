"use client"

import { useState, useEffect } from "react"
import { supabase, isDemoMode, checkTableExists } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { demoInventory } from "@/components/demo-data"
import { DemoModeBanner } from "@/components/demo-mode-banner"
import { Package } from "lucide-react"

export function InventoryTab() {
  const [inventory, setInventory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tableExists, setTableExists] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    async function init() {
      if (isDemoMode) {
        setInventory(demoInventory)
        setLoading(false)
        return
      }

      try {
        const exists = await checkTableExists("inventory")
        setTableExists(exists)
        
        if (!exists) {
          setInventory(demoInventory)
          setLoading(false)
          return
        }

        await fetchInventory()
      } catch (error) {
        console.log("Using demo data due to error:", error)
        setInventory(demoInventory)
        setLoading(false)
      }
    }

    init()
  }, [])

  async function fetchInventory() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      setInventory(data || [])
    } catch (error: any) {
      console.error("Error fetching inventory:", error)
      setInventory(demoInventory)
    } finally {
      setLoading(false)
    }
  }

  const currentPlants = inventory.filter((item) => !item.category?.startsWith("Consumable:"))
  const totalConsumables = inventory.filter((item) => item.category?.startsWith("Consumable:"))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="h-8 w-8 animate-pulse mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">Loading inventory...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {(isDemoMode || !tableExists) && (
        <DemoModeBanner isDemoMode={isDemoMode} connectionStatus={tableExists ? 'connected' : 'demo'} />
      )}

      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Inventory Management</h1>
        <p className="text-muted-foreground">Manage your plants, consumables, and honey products inventory</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Plants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentPlants.length}</div>
            <p className="text-sm text-muted-foreground">Active plant varieties</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Consumables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConsumables.length}</div>
            <p className="text-sm text-muted-foreground">Supply items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Total Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventory.length}</div>
            <p className="text-sm text-muted-foreground">All inventory items</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Recent Items</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {inventory.slice(0, 6).map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <h3 className="font-medium truncate">{item.plant_name}</h3>
                <p className="text-sm text-muted-foreground truncate">{item.category}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.status}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}