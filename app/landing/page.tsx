import { supabase, isDemoMode } from "@/lib/supabase"
import Image from "next/image"
import Link from "next/link"

export const revalidate = 60 // Revalidate this page every 60 seconds

async function getInventorySummary() {
  if (isDemoMode) {
    return { totalItems: 3, totalQuantity: 180 }
  }

  try {
    const { data: inventory, error } = await supabase.from("inventory").select("*")

    if (error) {
      console.error("Error fetching inventory:", error)
      return { totalItems: 0, totalQuantity: 0 }
    }

    const totalItems = inventory?.length || 0
    let totalQuantity = 0

    inventory?.forEach((item) => {
      totalQuantity += item.quantity
    })

    return { totalItems, totalQuantity }
  } catch (error) {
    console.error("Error in getInventorySummary:", error)
    return { totalItems: 0, totalQuantity: 0 }
  }
}

async function getSalesSummary() {
  if (isDemoMode) {
    return { totalSales: 2, totalSeedlingsSold: 15 }
  }

  try {
    const { data: sales, error } = await supabase.from("sales").select("*")

    if (error) {
      console.error("Error fetching sales:", error)
      return { totalSales: 0, totalSeedlingsSold: 0 }
    }

    const totalSales = sales?.length || 0
    let totalSeedlingsSold = 0

    sales?.forEach((sale) => {
      totalSeedlingsSold += sale.quantity
    })

    return { totalSales, totalSeedlingsSold }
  } catch (error) {
    console.error("Error in getSalesSummary:", error)
    return { totalSales: 0, totalSeedlingsSold: 0 }
  }
}

export default async function LandingPage() {
  const inventorySummary = await getInventorySummary()
  const salesSummary = await getSalesSummary()

  return (
    <div className="min-h-screen">
      <header className="warm-header">
        <div className="container mx-auto px-4 py-8 flex flex-col items-center text-center">
          <Image
            src="/images/littleforest-logo.png"
            alt="LittleForest Logo"
            width={300}
            height={80}
            className="h-16 w-auto mb-2"
            priority
          />
          <p className="text-primary text-lg font-medium">Agrisols Farm Management System</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-center mb-4">Welcome to Little Forest Nursery</h1>
        <p className="text-xl text-muted-foreground text-center mb-12">Powered by Agrisols Farm Management System</p>

        <div className="max-w-4xl mx-auto mb-16">
          <div className="flex flex-col md:flex-row justify-center items-center gap-8 mb-12">
            <div className="flex flex-col items-center">
              <div className="step-indicator step-indicator-1 mb-4">1</div>
              <h2 className="text-xl font-semibold mb-2">Manage Inventory</h2>
              <p className="text-center text-muted-foreground max-w-xs">
                Track all your plants, seedlings, and nursery supplies in one place.
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="step-indicator step-indicator-2 mb-4">2</div>
              <h2 className="text-xl font-semibold mb-2">Record Sales</h2>
              <p className="text-center text-muted-foreground max-w-xs">
                Keep track of all sales transactions and customer information.
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="step-indicator step-indicator-3 mb-4">3</div>
              <h2 className="text-xl font-semibold mb-2">Analyze Data</h2>
              <p className="text-center text-muted-foreground max-w-xs">
                Get insights into your nursery business with detailed reports.
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <Link
              href="/"
              className="bg-secondary hover:bg-secondary/90 text-white px-6 py-3 rounded-md font-medium shadow-lg transition-all hover:shadow-xl hover:-translate-y-1"
            >
              Get Started
            </Link>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
          <div className="warm-card rounded-lg shadow-lg p-6 text-center card-hover">
            <h2 className="text-xl font-semibold mb-2">Current Inventory</h2>
            <div className="text-4xl font-bold text-primary mb-2">{inventorySummary.totalQuantity}</div>
            <p className="text-muted-foreground">Seedlings Available</p>
          </div>

          <div className="warm-card rounded-lg shadow-lg p-6 text-center card-hover">
            <h2 className="text-xl font-semibold mb-2">Total Seedlings Sold</h2>
            <div className="text-4xl font-bold text-secondary mb-2">{salesSummary.totalSeedlingsSold}</div>
            <p className="text-muted-foreground">Happy Plants in New Homes</p>
          </div>
        </div>
      </main>

      <footer className="warm-header border-t border-border mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Little Forest Nursery. All rights reserved.</p>
          <p className="text-sm mt-1">Powered by Agrisols Farm Management System</p>
        </div>
      </footer>
    </div>
  )
}
