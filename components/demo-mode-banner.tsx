import { AlertCircle, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface DemoModeBannerProps {
  isDemoMode: boolean
  tablesNotFound?: boolean
}

export function DemoModeBanner({ isDemoMode, tablesNotFound }: DemoModeBannerProps) {
  return (
    <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-accent" />
        <span className="text-accent font-medium">Demo Mode</span>
      </div>
      <p className="text-accent/80 text-sm mt-1">
        {isDemoMode
          ? "You're viewing demo data. Connect to Supabase to enable full functionality."
          : "Database tables not found. Please run the setup script to create the necessary tables."}
      </p>
      <div className="mt-2 flex gap-2">
        <Button size="sm" className="bg-accent hover:bg-accent/90 text-white" asChild>
          <Link href="/setup">
            <Database className="h-4 w-4 mr-1" />
            View Setup Guide
          </Link>
        </Button>
      </div>
    </div>
  )
}
