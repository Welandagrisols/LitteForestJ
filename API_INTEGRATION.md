# Website Integration API Documentation

This document explains how to integrate your nursery inventory management app with your landing page website.

## Base URL
Production deployment: `https://litteforest.vercel.app`
For local development: `http://localhost:5000`

## API Endpoints

### 1. Get Available Products
**Endpoint:** `GET /api/products`

**Description:** Fetches all products that are marked as "ready for sale" with their availability status.

**Response:**
\`\`\`json
{
  "success": true,
  "products": [
    {
      "id": "uuid",
      "plant_name": "African Olive",
      "scientific_name": "Olea europaea subsp. cuspidata",
      "category": "Indigenous Trees",
      "quantity": 45,
      "price": 1200,
      "description": "Beautiful indigenous tree perfect for landscaping",
      "image_url": "https://example.com/african-olive.jpg",
      "availability_status": "Limited", // "Available" (100+), "Limited" (10-99), "Not Available" (<10)
      "ready_for_sale": true,
      "sku": "IND001"
    }
  ],
  "total_count": 1
}
\`\`\`

### 2. Update Inventory After Sale
**Endpoint:** `POST /api/update-inventory`

**Description:** Updates inventory quantity when a sale is made on the website.

**Request Body:**
\`\`\`json
{
  "product_id": "uuid",
  "quantity_sold": 5,
  "customer_info": {
    "name": "John Doe",
    "contact": "+254700000000"
  }
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "message": "Inventory updated successfully",
  "new_quantity": 40,
  "availability_status": "Limited"
}
\`\`\`

## Integration Steps for Your Landing Page

### 1. Fetch Products
Use this JavaScript code to fetch available products:

\`\`\`javascript
async function fetchProducts() {
  try {
    const response = await fetch('https://your-repl-name.replit.app/api/products');
    const data = await response.json();
    
    if (data.success) {
      return data.products;
    } else {
      console.error('Error fetching products:', data.error);
      return [];
    }
  } catch (error) {
    console.error('Network error:', error);
    return [];
  }
}
\`\`\`

### 2. Update Inventory After Purchase
\`\`\`javascript
async function updateInventoryAfterSale(productId, quantitySold, customerInfo) {
  try {
    const response = await fetch('https://your-repl-name.replit.app/api/update-inventory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: productId,
        quantity_sold: quantitySold,
        customer_info: customerInfo
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Inventory updated:', data.message);
      return data;
    } else {
      console.error('Error updating inventory:', data.error);
      return null;
    }
  } catch (error) {
    console.error('Network error:', error);
    return null;
  }
}
\`\`\`

### 3. Display Availability Status
Use the `availability_status` field to show customers the stock level:

\`\`\`javascript
function getStatusBadge(status) {
  switch(status) {
    case 'Available':
      return '<span class="badge badge-success">In Stock</span>';
    case 'Limited':
      return '<span class="badge badge-warning">Limited Stock</span>';
    case 'Not Available':
      return '<span class="badge badge-danger">Out of Stock</span>';
    default:
      return '<span class="badge badge-secondary">Unknown</span>';
  }
}
\`\`\`

## Managing Products in the Nursery App

### Ready for Sale Toggle
- In the inventory tab, use the "List"/"Unlist" button to control which items appear on your website
- Only items marked as "ready for sale" will be returned by the API
- This allows you to control what's available for online purchase vs. what's still being prepared

### Automatic Stock Status
- **Available (Green)**: 100+ items in stock
- **Limited (Yellow)**: 10-99 items in stock  
- **Not Available (Red)**: Less than 10 items in stock

### Adding New Products
When adding new inventory items:
1. Fill in all product details
2. Add a description for the website
3. Provide an image URL (optional)
4. Check "Ready for Sale on Website" when the item is ready to be sold online

## CORS Configuration
If you encounter CORS issues, the API endpoints are configured to accept requests from your landing page domain.

## Error Handling
Always check the `success` field in API responses and handle errors appropriately on your landing page.
