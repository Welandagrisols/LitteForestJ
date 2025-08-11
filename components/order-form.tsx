
"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { notificationService } from '@/lib/notification-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { isDemoMode } from '@/lib/supabase'

interface OrderItem {
  id: string
  plant_name: string
  price: number
  quantity: number
  image_url?: string
  description?: string
}

export function OrderForm() {
  const [loading, setLoading] = useState(false)
  const [inventory, setInventory] = useState<any[]>([])
  const [cart, setCart] = useState<OrderItem[]>([])
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  })
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

  const addToCart = (item: any, quantity: number) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id)
    
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + quantity }
          : cartItem
      ))
    } else {
      setCart([...cart, {
        id: item.id,
        plant_name: item.plant_name,
        price: item.price,
        quantity: quantity,
        image_url: item.image_url,
        description: item.description
      }])
    }

    toast({
      title: 'Added to cart',
      description: `${quantity} ${item.plant_name}(s) added to your order`,
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId))
  }

  const updateCartQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId)
      return
    }

    setCart(cart.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    ))
  }

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isDemoMode) {
      toast({
        title: 'Demo Mode',
        description: 'Connect to Supabase to enable order placement',
        variant: 'destructive',
      })
      return
    }

    if (cart.length === 0) {
      toast({
        title: 'Empty Cart',
        description: 'Please add items to your cart before placing an order',
        variant: 'destructive',
      })
      return
    }

    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in your name, email, and phone number',
        variant: 'destructive',
      })
      return
    }

    try {
      setLoading(true)

      // Create customer if doesn't exist
      let customerId = null
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('email', customerInfo.email)
        .single()

      if (existingCustomer) {
        customerId = existingCustomer.id
      } else {
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert([{
            name: customerInfo.name,
            contact: customerInfo.phone,
            email: customerInfo.email,
            address: customerInfo.address || null
          }])
          .select()

        if (customerError) throw customerError
        customerId = newCustomer[0].id
      }

      // Create order
      const orderData = {
        customer_id: customerId,
        total_amount: getTotalAmount(),
        order_status: 'pending',
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
        customer_address: customerInfo.address,
        notes: customerInfo.notes,
        created_at: new Date().toISOString()
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()

      if (orderError) throw orderError

      // Create order items
      const orderItems = cart.map(item => ({
        order_id: order[0].id,
        inventory_id: item.id,
        quantity: item.quantity,
        price_per_unit: item.price,
        total_price: item.price * item.quantity
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      // Send notification
      const orderWithItems = {
        ...order[0],
        items: cart
      }
      await notificationService.notifyNewOrder(orderWithItems)

      toast({
        title: 'Order Placed Successfully!',
        description: 'We will contact you shortly to confirm your order.',
      })

      // Reset form
      setCart([])
      setCustomerInfo({
        name: '',
        email: '',
        phone: '',
        address: '',
        notes: ''
      })

    } catch (error: any) {
      console.error('Error placing order:', error)
      toast({
        title: 'Error placing order',
        description: error.message || 'Failed to place order',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-green-800">Little Forest Nursery</h1>
        <p className="text-gray-600 mt-2">Order your plants and seedlings online</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Products Section */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Available Plants</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {inventory.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.plant_name}</h3>
                      <p className="text-sm text-gray-600">{item.description}</p>
                      <p className="text-lg font-bold text-green-600">Ksh {item.price}</p>
                      <p className="text-sm text-gray-500">{item.quantity} available</p>
                    </div>
                    <Button
                      onClick={() => addToCart(item, 1)}
                      disabled={item.quantity <= 0}
                      size="sm"
                    >
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Cart & Order Form */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Your Order</h2>
          
          {/* Cart Items */}
          <div className="space-y-2 mb-6">
            {cart.length === 0 ? (
              <p className="text-gray-500">Your cart is empty</p>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div className="flex-1">
                    <h4 className="font-medium">{item.plant_name}</h4>
                    <p className="text-sm text-gray-600">Ksh {item.price} each</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      min="0"
                      value={item.quantity}
                      onChange={(e) => updateCartQuantity(item.id, parseInt(e.target.value) || 0)}
                      className="w-20"
                    />
                    <Button
                      onClick={() => removeFromCart(item.id)}
                      variant="destructive"
                      size="sm"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))
            )}
            
            {cart.length > 0 && (
              <div className="text-right text-lg font-semibold">
                Total: Ksh {getTotalAmount().toFixed(2)}
              </div>
            )}
          </div>

          {/* Customer Information Form */}
          <form onSubmit={handleSubmitOrder} className="space-y-4">
            <h3 className="text-lg font-semibold">Customer Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Delivery Address</Label>
              <Textarea
                id="address"
                value={customerInfo.address}
                onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                placeholder="Enter your delivery address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Special Notes</Label>
              <Textarea
                id="notes"
                value={customerInfo.notes}
                onChange={(e) => setCustomerInfo({...customerInfo, notes: e.target.value})}
                placeholder="Any special requests or notes"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || cart.length === 0}
              className="w-full"
            >
              {loading ? 'Placing Order...' : 'Place Order'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
