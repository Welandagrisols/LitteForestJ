import * as XLSX from "xlsx"

export function exportToExcel(data: any[], fileName: string) {
  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new()

    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(data)

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data")

    // Generate Excel file as a binary string
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })

    // Convert buffer to Blob
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })

    // Create download link
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${fileName}.xlsx`

    // Append to body, trigger download, and clean up
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    return true
  } catch (error) {
    console.error("Error exporting to Excel:", error)
    return false
  }
}

// Helper function to check if an item is a consumable
function isConsumable(item: any) {
  return (
    (item.category && item.category.startsWith("Consumable:")) ||
    (item.scientific_name && item.scientific_name.startsWith("[Consumable]"))
  )
}

// Helper function to extract unit from scientific_name
function getConsumableUnit(item: any) {
  if (item.scientific_name && item.scientific_name.startsWith("[Consumable]")) {
    return item.scientific_name.replace("[Consumable] ", "")
  }
  return "Pieces"
}

// Helper function to extract real category from prefixed category
function getConsumableCategory(item: any) {
  if (item.category && item.category.startsWith("Consumable:")) {
    return item.category.replace("Consumable: ", "")
  }
  return item.category
}

// Update the formatInventoryForExport function to handle both plants and consumables
export function formatInventoryForExport(inventoryData: any[], isConsumablesTab = false) {
  return inventoryData.map((item) => {
    const itemIsConsumable = isConsumablesTab || isConsumable(item)

    if (itemIsConsumable) {
      return {
        "Item Name": item.plant_name,
        Category: getConsumableCategory(item),
        Quantity: item.quantity,
        Unit: getConsumableUnit(item),
        Status: item.status,
        "Price (Ksh)": item.price,
        SKU: item.sku,
        "Storage Location": item.section || "",
        Supplier: item.source || "",
        "Purchase Date": item.date_planted ? new Date(item.date_planted).toLocaleDateString() : "",
        "Last Updated": new Date(item.updated_at).toLocaleDateString(),
      }
    } else {
      return {
        "Plant Name": item.plant_name,
        "Scientific Name": item.scientific_name || "",
        Category: item.category,
        Quantity: item.quantity,
        Age: item.age || "",
        "Date Planted": item.date_planted ? new Date(item.date_planted).toLocaleDateString() : "",
        Status: item.status,
        "Price (Ksh)": item.price,
        SKU: item.sku,
        Section: item.section || "",
        Row: item.row || "",
        Source: item.source || "",
        "Last Updated": new Date(item.updated_at).toLocaleDateString(),
      }
    }
  })
}

// Format sales data for Excel export
export function formatSalesForExport(salesData: any[]) {
  return salesData.map((sale) => ({
    Date: new Date(sale.sale_date).toLocaleDateString(),
    Plant: sale.inventory?.plant_name || "Unknown",
    Category: sale.inventory?.category || "",
    Quantity: sale.quantity,
    "Unit Price (Ksh)": sale.inventory?.price || 0,
    "Total Amount (Ksh)": sale.total_amount,
    Customer: sale.customer?.name || "Walk-in Customer",
    "Customer Contact": sale.customer?.contact || "",
  }))
}
