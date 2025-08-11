"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { isDemoMode } from '@/lib/supabase'
import { Package } from 'lucide-react'

export function OrderForm() {
  const [loading, setLoading] = useState(false)
  const [inventory, setInventory] = useState<any[]>([])
  const { toast } = useToast()

  useEffect(() => {
    fetchInventory()
  }, [])

  async function fetchInventory() {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('ready_for_sale', true)
        .gt('quantity', 0)
        .order('plant_name', { ascending: true })

      if (error) throw error
      setInventory(data || [])
    } catch (error: any) {
      console.error('Error fetching inventory:', error)
      toast({
        title: 'Error loading products',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-green-800">Little Forest Nursery</h1>
        <p className="text-gray-600 mt-2">Available Plants Catalog</p>
        <p className="text-sm text-muted-foreground mt-1">
          This is an internal view for farm managers to see what's available for sale
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Plants Ready for Sale
          </CardTitle>
          <CardDescription>
            Current inventory available for customer orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <Package className="h-8 w-8 animate-pulse mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">Loading available plants...</p>
              </div>
            </div>
          ) : inventory.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No plants available for sale</h3>
              <p className="text-muted-foreground">
                Mark plants as "ready for sale" in the inventory tab to display them here
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {inventory.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    {item.image_url && (
                      <div className="mb-3">
                        <img 
                          src={item.image_url} 
                          alt={item.plant_name}
                          className="w-full h-32 object-cover rounded-md border border-gray-200"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <h3 className="font-semibold text-base">{item.plant_name}</h3>
                      {item.scientific_name && (
                        <p className="text-xs text-muted-foreground italic">{item.scientific_name}</p>
                      )}
                      <p className="text-sm text-gray-600">{item.description}</p>
                      <div className="flex justify-between items-center">
                        <p className="text-lg font-bold text-green-600">Ksh {item.price}</p>
                        <p className="text-sm text-gray-500">{item.quantity} available</p>
                      </div>
                      <p className="text-xs text-gray-500">Category: {item.category}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {inventory.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Summary</h4>
              <p className="text-sm text-blue-800">
                Total plants available: <strong>{inventory.length}</strong> varieties
              </p>
              <p className="text-sm text-blue-800">
                Total seedlings: <strong>{inventory.reduce((sum, item) => sum + item.quantity, 0)}</strong>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {isDemoMode && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <p className="text-sm text-amber-800">
              <strong>Demo Mode:</strong> This is showing sample data. Connect to Supabase to see your actual inventory.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}