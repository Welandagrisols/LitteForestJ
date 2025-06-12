// Demo data for when Supabase is not configured
export const demoInventory = [
  {
    id: "1",
    plant_name: "African Olive",
    scientific_name: "Olea europaea subsp. cuspidata",
    category: "Indigenous Trees",
    quantity: 45,
    age: "6 months",
    date_planted: "2024-05-11",
    status: "Healthy",
    price: 1200,
    batch_cost: 22500, // Total cost for 45 seedlings
    cost_per_seedling: 500, // 22500 / 45 = 500
    sku: "IND001",
    section: "A",
    row: "3",
    source: "Local nursery",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    plant_name: "Moringa Seedling",
    scientific_name: "Moringa oleifera",
    category: "Ornamentals",
    quantity: 120,
    age: "3 months",
    date_planted: "2025-01-15",
    status: "Healthy",
    price: 350,
    batch_cost: 24000, // Total cost for 120 seedlings
    cost_per_seedling: 200, // 24000 / 120 = 200
    sku: "ORN002",
    section: "B",
    row: "2",
    source: "Own propagation",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "3",
    plant_name: "Baobab Tree",
    scientific_name: "Adansonia digitata",
    category: "Indigenous Trees",
    quantity: 15,
    age: "12 months",
    date_planted: "2024-04-10",
    status: "Attention",
    price: 2500,
    batch_cost: 30000, // Total cost for 15 seedlings
    cost_per_seedling: 2000, // 30000 / 15 = 2000
    sku: "IND003",
    section: "C",
    row: "1",
    source: "Seeds from Kilifi region",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  // Consumables (no cost per seedling calculation)
  {
    id: "4",
    plant_name: "Organic Fertilizer",
    scientific_name: "[Consumable] Bags",
    category: "Consumable: Fertilizers",
    quantity: 25,
    date_planted: "2024-05-01", // Used as purchase date
    status: "Available",
    price: 850,
    batch_cost: 21250, // Total cost for 25 bags
    cost_per_seedling: null, // Not applicable for consumables
    sku: "CONS001",
    section: "Storage Room A", // Used as storage location
    source: "AgriSupplies Ltd", // Used as supplier
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "5",
    plant_name: "Plastic Pots (Medium)",
    scientific_name: "[Consumable] Pieces",
    category: "Consumable: Pots",
    quantity: 200,
    date_planted: "2024-04-15", // Used as purchase date
    status: "Available",
    price: 45,
    batch_cost: 7000, // Total cost for 200 pieces
    cost_per_seedling: null, // Not applicable for consumables
    sku: "CONS002",
    section: "Shed B", // Used as storage location
    source: "Garden Supplies Kenya", // Used as supplier
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "6",
    plant_name: "Potting Soil Mix",
    scientific_name: "[Consumable] Bags",
    category: "Consumable: Soil",
    quantity: 15,
    date_planted: "2024-05-05", // Used as purchase date
    status: "Low Stock",
    price: 550,
    batch_cost: 6750, // Total cost for 15 bags
    cost_per_seedling: null, // Not applicable for consumables
    sku: "CONS003",
    section: "Storage Room A", // Used as storage location
    source: "Local Supplier", // Used as supplier
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
]

export const demoSales = [
  {
    id: "1",
    inventory_id: "1",
    quantity: 5,
    sale_date: "2024-06-08",
    customer_id: "1",
    total_amount: 6000,
    created_at: "2024-06-08T00:00:00Z",
    inventory: { plant_name: "African Olive", category: "Indigenous Trees", price: 1200, cost_per_seedling: 500 },
    customer: { name: "John Doe", contact: "+254712345678" },
  },
  {
    id: "2",
    inventory_id: "2",
    quantity: 10,
    sale_date: "2024-06-07",
    customer_id: "2",
    total_amount: 3500,
    created_at: "2024-06-07T00:00:00Z",
    inventory: { plant_name: "Moringa Seedling", category: "Ornamentals", price: 350, cost_per_seedling: 200 },
    customer: { name: "Jane Smith", contact: "+254723456789" },
  },
]

export const demoCustomers = [
  {
    id: "1",
    name: "John Doe",
    contact: "+254712345678",
    email: "john@example.com",
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Jane Smith",
    contact: "+254723456789",
    email: "jane@example.com",
    created_at: "2024-01-15T00:00:00Z",
  },
]
