"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Search, Package } from "lucide-react"
import { AddTaskForm } from "./add-task-form"

export function TasksTab() {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All Status")
  const [typeFilter, setTypeFilter] = useState("All Types")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchTasks()
  }, [])

  async function fetchTasks() {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("task_date", { ascending: false })

      if (error) throw error

      setTasks(data || [])
    } catch (error: any) {
      console.error("Error fetching tasks:", error)
      toast({
        title: "Error",
        description: "Failed to fetch tasks. Please ensure the tasks table exists.",
        variant: "destructive",
      })
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  // Get unique task types for filter
  const taskTypes = ["All Types", ...Array.from(new Set(tasks.map((task) => task.task_type)))]
  const statusOptions = ["All Status", "Planned", "In Progress", "Completed"]

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.task_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.batch_sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.assigned_to?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "All Status" || task.status === statusFilter
    const matchesType = typeFilter === "All Types" || task.task_type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  // Calculate summary metrics
  const totalTasks = tasks.length
  const totalCost = tasks.reduce((sum, task) => sum + (task.total_cost || 0), 0)
  const completedTasks = tasks.filter((task) => task.status === "Completed").length
  const averageCost = totalTasks > 0 ? totalCost / totalTasks : 0

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Completed":
        return "default"
      case "In Progress":
        return "secondary"
      case "Planned":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="mobile-card bg-green-50 border-green-200">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-green-600 rounded-full">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-green-800">Total Tasks</p>
                <p className="text-lg sm:text-2xl font-bold text-green-900">{totalTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mobile-card bg-purple-50 border-purple-200">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-purple-600 rounded-full">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-purple-800">Total Cost</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-900">Ksh {totalCost.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mobile-card bg-blue-50 border-blue-200">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-blue-600 rounded-full">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-blue-800">Completed</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-900">{completedTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mobile-card bg-orange-50 border-orange-200">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-orange-600 rounded-full">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-orange-800">Average Cost</p>
                <p className="text-lg sm:text-2xl font-bold text-orange-900">Ksh {averageCost.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Add Button */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search tasks, SKU, or assignee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by type" />
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
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
            </DialogHeader>
            <AddTaskForm
              onSuccess={() => {
                setIsAddDialogOpen(false)
                fetchTasks()
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading tasks...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {tasks.length === 0 ? "No tasks found. Add your first task!" : "No tasks match your filters."}
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Task Details</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="min-w-[120px]">Cost & Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Assigned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => (
                  <TableRow key={task.id} className="hover:bg-muted/50">
                    <TableCell className="min-w-[200px]">
                      <div className="space-y-1">
                        <div className="font-medium">{task.task_name}</div>
                        <div className="flex flex-wrap gap-2 text-sm">
                          <Badge variant="secondary" className="text-xs">{task.task_type}</Badge>
                          {task.batch_sku && (
                            <Badge variant="outline" className="font-mono text-xs">
                              {task.batch_sku}
                            </Badge>
                          )}
                        </div>
                        <div className="md:hidden text-sm text-muted-foreground">
                          {new Date(task.task_date).toLocaleDateString()}
                        </div>
                        {task.description && (
                          <div className="text-sm text-muted-foreground truncate max-w-[180px]">
                            {task.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="text-sm">
                        {new Date(task.task_date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[120px]">
                      <div className="space-y-2">
                        <div className="font-medium text-primary">
                          Ksh {task.total_cost?.toLocaleString() || 0}
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>Labor: Ksh {task.labor_cost?.toLocaleString() || 0}</div>
                          <div>Materials: Ksh {task.consumables_cost?.toLocaleString() || 0}</div>
                          {task.labor_hours && (
                            <div>Hours: {task.labor_hours}h</div>
                          )}
                        </div>
                        <Badge variant={getStatusBadgeVariant(task.status)} className="text-xs">
                          {task.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="text-sm">{task.assigned_to || "-"}</div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
