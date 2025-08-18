"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface FinancialSummaryProps {
  inventory: any[]
  sales: any[]
}

export function FinancialSummary({ inventory, sales }: FinancialSummaryProps) {
  // Calculate total inventory value and cost
  const inventoryMetrics = inventory
    .filter((item) => !item.category?.startsWith("Consumable:"))
    .reduce(
      (acc, item) => {
        const quantity = item.quantity || 0
        const sellingPrice = item.price || 0
        const costPerSeedling = item.cost_per_seedling || 0

        acc.totalValue += quantity * sellingPrice
        acc.totalCost += quantity * costPerSeedling
        acc.totalSeedlings += quantity

        return acc
      },
      { totalValue: 0, totalCost: 0, totalSeedlings: 0 },
    )

  // Calculate sales metrics
  const salesMetrics = sales.reduce(
    (acc, sale) => {
      const costPerSeedling = sale.inventory?.cost_per_seedling || 0
      const totalCost = costPerSeedling * sale.quantity
      const profit = sale.total_amount - totalCost

      acc.totalRevenue += sale.total_amount
      acc.totalCost += totalCost
      acc.totalProfit += profit
      acc.totalSeedlingsSold += sale.quantity

      return acc
    },
    { totalRevenue: 0, totalCost: 0, totalProfit: 0, totalSeedlingsSold: 0 },
  )

  const averageProfitMargin =
    salesMetrics.totalRevenue > 0 ? ((salesMetrics.totalProfit / salesMetrics.totalRevenue) * 100).toFixed(1) : "0"

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <Card className="mobile-card warm-card hover:shadow-md transition-shadow">
        <CardHeader className="pb-1 px-3 pt-3">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Inventory Value</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="text-lg sm:text-2xl font-bold text-primary">Ksh {inventoryMetrics.totalValue.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">{inventoryMetrics.totalSeedlings} seedlings</div>
        </CardContent>
      </Card>

      <Card className="mobile-card warm-card hover:shadow-md transition-shadow">
        <CardHeader className="pb-1 px-3 pt-3">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Inventory Cost</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="text-lg sm:text-2xl font-bold text-secondary">Ksh {inventoryMetrics.totalCost.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">Production cost</div>
        </CardContent>
      </Card>

      <Card className="mobile-card warm-card hover:shadow-md transition-shadow">
        <CardHeader className="pb-1 px-3 pt-3">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Sales Profit</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="text-lg sm:text-2xl font-bold text-accent">Ksh {salesMetrics.totalProfit.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">{salesMetrics.totalSeedlingsSold} sold</div>
        </CardContent>
      </Card>

      <Card className="mobile-card warm-card hover:shadow-md transition-shadow">
        <CardHeader className="pb-1 px-3 pt-3">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Profit Margin</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="text-lg sm:text-2xl font-bold text-accent">{averageProfitMargin}%</div>
          <div className="text-xs text-muted-foreground">Average margin</div>
        </CardContent>
      </Card>
    </div>
  )
}
