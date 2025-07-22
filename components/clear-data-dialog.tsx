
"use client"

import { useState } from "react"
import { supabase, isDemoMode } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Trash2, Loader2 } from "lucide-react"

export function ClearDataDialog() {
  const [isClearing, setIsClearing] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const { toast } = useToast()

  async function clearAllData() {
    if (isDemoMode) {
      toast({
        title: "Demo Mode",
        description: "Connect to Supabase to clear real data",
        variant: "destructive",
      })
      return
    }

    if (confirmText !== "CLEAR ALL DATA") {
      toast({
        title: "Confirmation Required",
        description: "Please type 'CLEAR ALL DATA' to confirm",
        variant: "destructive",
      })
      return
    }

    try {
      setIsClearing(true)

      // Clear sales first (due to foreign key constraints)
      const { error: salesError } = await supabase
        .from("sales")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000") // Delete all records

      if (salesError) throw salesError

      // Clear customers
      const { error: customersError } = await supabase
        .from("customers")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000") // Delete all records

      if (customersError) throw customersError

      // Clear inventory
      const { error: inventoryError } = await supabase
        .from("inventory")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000") // Delete all records

      if (inventoryError) throw inventoryError

      // Clear tasks (if table exists)
      try {
        const { error: tasksError } = await supabase
          .from("tasks")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000") // Delete all records

        // Ignore error if tasks table doesn't exist
        if (tasksError && !tasksError.message.includes("does not exist")) {
          throw tasksError
        }
      } catch (error) {
        // Tasks table might not exist, that's okay
        console.log("Tasks table might not exist, skipping...")
      }

      toast({
        title: "Success",
        description: "All test data has been cleared from the database",
      })

      // Reset confirmation text
      setConfirmText("")

      // Refresh the page to show empty state
      window.location.reload()

    } catch (error: any) {
      console.error("Error clearing data:", error)
      toast({
        title: "Error clearing data",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="h-4 w-4 mr-2" />
          Clear All Test Data
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear All Test Data</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              This will permanently delete ALL data from your database including:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>All inventory items (plants and consumables)</li>
              <li>All sales records</li>
              <li>All customer records</li>
              <li>All tasks and operations data</li>
            </ul>
            <p className="font-semibold text-red-600">
              This action CANNOT be undone!
            </p>
            <div className="space-y-2">
              <Label htmlFor="confirm-text">
                Type "CLEAR ALL DATA" to confirm:
              </Label>
              <Input
                id="confirm-text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="CLEAR ALL DATA"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={clearAllData}
            disabled={isClearing || confirmText !== "CLEAR ALL DATA"}
            className="bg-red-600 hover:bg-red-700"
          >
            {isClearing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Clearing...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Data
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
