
"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Calculator } from "lucide-react"

interface ConsumableUsage {
  id: string
  consumable_sku: string
  consumable_name: string
  quantity_used: number
  unit: string
  unit_cost: number
  total_cost: number
}

interface AddTaskFormProps {
  onSuccess: () => void
}

export function AddTaskForm({ onSuccess }: AddTaskFormProps) {
  const [formData, setFormData] = useState({
    task_name: "",
    task_type: "",
    description: "",
    task_date: new Date().toISOString().split("T")[0],
    batch_sku: "",
    labor_hours: "",
    labor_rate: "",
    labor_cost: "",
    status: "Completed",
    assigned_to: "",
  })

  const [consumables, setConsumables] = useState<any[]>([])
  const [batches, setBatches] = useState<any[]>([])
  const [consumableUsages, setConsumableUsages] = useState<ConsumableUsage[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchConsumablesAndBatches()
  }, [])

  useEffect(() => {
    // Auto-calculate labor cost when hours or rate changes
    const hours = parseFloat(formData.labor_hours) || 0
    const rate = parseFloat(formData.labor_rate) || 0
    const laborCost = hours * rate
    setFormData((prev) => ({ ...prev, labor_cost: laborCost.toString() }))
  }, [formData.labor_hours, formData.labor_rate])

  async function fetchConsumablesAndBatches() {
    try {
      // Fetch consumables (items with item_type = 'Consumable')
      const { data: consumableData, error: consumableError } = await supabase
        .from("inventory")
        .select("sku, plant_name, price")
        .eq("item_type", "Consumable")

      if (consumableError) {
        console.error("Error fetching consumables:", consumableError)
      }

      // Fetch plant batches (items with item_type = 'Plant')
      const { data: batchData, error: batchError } = await supabase
        .from("inventory")
        .select("sku, plant_name")
        .eq("item_type", "Plant")

      if (batchError) {
        console.error("Error fetching batches:", batchError)
      }

      setConsumables(consumableData || [])
      setBatches(batchData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const addConsumableUsage = () => {
    setConsumableUsages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        consumable_sku: "",
        consumable_name: "",
        quantity_used: 0,
        unit: "",
        unit_cost: 0,
        total_cost: 0,
      },
    ])
  }

  const removeConsumableUsage = (id: string) => {
    setConsumableUsages((prev) => prev.filter((usage) => usage.id !== id))
  }

  const updateConsumableUsage = (id: string, field: string, value: any) => {
    setConsumableUsages((prev) =>
      prev.map((usage) => {
        if (usage.id === id) {
          const updatedUsage = { ...usage, [field]: value }

          // Auto-update related fields when consumable is selected
          if (field === "consumable_sku") {
            const consumable = consumables.find((c) => c.sku === value)
            if (consumable) {
              updatedUsage.consumable_name = consumable.plant_name
              updatedUsage.unit_cost = consumable.price
              updatedUsage.unit = "Pieces" // Default unit
            }
          }

          // Recalculate total cost
          if (field === "quantity_used" || field === "unit_cost") {
            updatedUsage.total_cost = updatedUsage.quantity_used * updatedUsage.unit_cost
          }

          return updatedUsage
        }
        return usage
      })
    )
  }

  const calculateTotalConsumablesCost = () => {
    return consumableUsages.reduce((sum, usage) => sum + usage.total_cost, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)

      const laborCost = parseFloat(formData.labor_cost) || 0
      const consumablesCost = calculateTotalConsumablesCost()

      // Insert task
      const { data: taskData, error: taskError } = await supabase
        .from("tasks")
        .insert({
          task_name: formData.task_name,
          task_type: formData.task_type,
          description: formData.description,
          task_date: formData.task_date,
          batch_sku: formData.batch_sku || null,
          labor_cost: laborCost,
          labor_hours: parseFloat(formData.labor_hours) || null,
          labor_rate: parseFloat(formData.labor_rate) || null,
          consumables_cost: consumablesCost,
          status: formData.status,
          assigned_to: formData.assigned_to,
        })
        .select()
        .single()

      if (taskError) throw taskError

      // Insert consumable usages
      if (consumableUsages.length > 0 && taskData) {
        const usageInserts = consumableUsages
          .filter((usage) => usage.consumable_sku && usage.quantity_used > 0)
          .map((usage) => ({
            task_id: taskData.id,
            consumable_sku: usage.consumable_sku,
            consumable_name: usage.consumable_name,
            quantity_used: usage.quantity_used,
            unit: usage.unit,
            unit_cost: usage.unit_cost,
          }))

        if (usageInserts.length > 0) {
          const { error: usageError } = await supabase.from("task_consumables").insert(usageInserts)
          if (usageError) throw usageError
        }
      }

      toast({
        title: "Success",
        description: "Task added successfully!",
      })

      onSuccess()
    } catch (error: any) {
      console.error("Error adding task:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to add task",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const taskTypes = [
    "Watering",
    "Fertilizing",
    "Pruning",
    "Planting",
    "Transplanting",
    "Pest Control",
    "Weeding",
    "Harvesting",
    "Maintenance",
    "Other",
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="task_name">Task Name *</Label>
          <Input
            id="task_name"
            name="task_name"
            value={formData.task_name}
            onChange={handleChange}
            placeholder="e.g., Watering Mango Seedlings"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="task_type">Task Type *</Label>
          <Select value={formData.task_type} onValueChange={(value) => setFormData((prev) => ({ ...prev, task_type: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select task type" />
            </SelectTrigger>
            <SelectContent>
              {taskTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="task_date">Task Date *</Label>
          <Input
            id="task_date"
            name="task_date"
            type="date"
            value={formData.task_date}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="batch_sku">Batch SKU</Label>
          <Select value={formData.batch_sku} onValueChange={(value) => setFormData((prev) => ({ ...prev, batch_sku: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select batch (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No specific batch</SelectItem>
              {batches.map((batch) => (
                <SelectItem key={batch.sku} value={batch.sku}>
                  {batch.sku} - {batch.plant_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Planned">Planned</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="assigned_to">Assigned To</Label>
          <Input
            id="assigned_to"
            name="assigned_to"
            value={formData.assigned_to}
            onChange={handleChange}
            placeholder="Person responsible"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Task details and notes"
          rows={3}
        />
      </div>

      {/* Labor Cost Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Labor Cost
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="labor_hours">Labor Hours</Label>
              <Input
                id="labor_hours"
                name="labor_hours"
                type="number"
                step="0.5"
                value={formData.labor_hours}
                onChange={handleChange}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="labor_rate">Rate per Hour (Ksh)</Label>
              <Input
                id="labor_rate"
                name="labor_rate"
                type="number"
                step="0.01"
                value={formData.labor_rate}
                onChange={handleChange}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="labor_cost">Total Labor Cost (Ksh)</Label>
              <Input
                id="labor_cost"
                name="labor_cost"
                type="number"
                step="0.01"
                value={formData.labor_cost}
                onChange={handleChange}
                placeholder="Auto-calculated"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Consumables Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            Consumables Used
            <Button type="button" onClick={addConsumableUsage} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Consumable
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {consumableUsages.map((usage) => (
            <div key={usage.id} className="flex gap-4 items-end p-4 border rounded-lg">
              <div className="grid gap-4 md:grid-cols-5 flex-1">
                <div className="space-y-2">
                  <Label>Consumable</Label>
                  <Select
                    value={usage.consumable_sku}
                    onValueChange={(value) => updateConsumableUsage(usage.id, "consumable_sku", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select consumable" />
                    </SelectTrigger>
                    <SelectContent>
                      {consumables.map((consumable) => (
                        <SelectItem key={consumable.sku} value={consumable.sku}>
                          {consumable.sku} - {consumable.plant_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Quantity Used</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={usage.quantity_used}
                    onChange={(e) => updateConsumableUsage(usage.id, "quantity_used", parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Input
                    value={usage.unit}
                    onChange={(e) => updateConsumableUsage(usage.id, "unit", e.target.value)}
                    placeholder="e.g., kg, pieces"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Unit Cost (Ksh)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={usage.unit_cost}
                    onChange={(e) => updateConsumableUsage(usage.id, "unit_cost", parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Total Cost</Label>
                  <div className="flex items-center h-10 px-3 bg-muted rounded-md">
                    <Badge variant="secondary">Ksh {usage.total_cost.toLocaleString()}</Badge>
                  </div>
                </div>
              </div>

              <Button
                type="button"
                onClick={() => removeConsumableUsage(usage.id)}
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {consumableUsages.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              No consumables added. Click "Add Consumable" to track materials used.
            </div>
          )}

          {consumableUsages.length > 0 && (
            <div className="flex justify-end">
              <div className="text-lg font-semibold">
                Total Consumables: Ksh {calculateTotalConsumablesCost().toLocaleString()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Total Cost Summary */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total Task Cost:</span>
            <span className="text-primary">
              Ksh {((parseFloat(formData.labor_cost) || 0) + calculateTotalConsumablesCost()).toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Adding Task..." : "Add Task"}
      </Button>
    </form>
  )
}
