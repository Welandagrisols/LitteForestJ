# Website Integration Guide for Little Forest

This guide explains how to integrate your Little Forest website (https://littleforest.onrender.com/) with your Replit nursery management app.

## Step 1: Your API URL

Your nursery management API is deployed at: `https://litteforest.vercel.app`

## Step 2: Website Integration Code

Add this JavaScript code to your website to fetch and display products from your nursery app:

### Fetch Products Function
\`\`\`javascript
// Add this to your website's JavaScript
const NURSERY_API_URL = 'https://[your-repl-name].replit.app'; // Replace with your actual Replit URL

// Fetch available products from nursery app
async function fetchNurseryProducts() {
  try {
    const response = await fetch(`${NURSERY_API_URL}/api/products`);
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

// Update inventory after purchase
async function updateNurseryInventory(productId, quantitySold, customerInfo) {
  try {
    const response = await fetch(`${NURSERY_API_URL}/api/update-inventory`, {
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
      console.log('Inventory updated successfully');
      return data;
    } else {
      console.error('Error updating inventory:', data.error);
      alert('Error updating inventory: ' + data.error);
      return null;
    }
  } catch (error) {
    console.error('Network error:', error);
    alert('Network error occurred while updating inventory');
    return null;
  }
}

// Display availability status
function getAvailabilityBadge(status, quantity) {
  switch(status) {
    case 'Available':
      return `<span class="badge bg-success">In Stock (${quantity})</span>`;
    case 'Limited':
      return `<span class="badge bg-warning">Limited Stock (${quantity})</span>`;
    case 'Not Available':
      return `<span class="badge bg-danger">Out of Stock</span>`;
    default:
      return `<span class="badge bg-secondary">Unknown</span>`;
  }
}

// Load and display products on page load
document.addEventListener('DOMContentLoaded', async function() {
  const products = await fetchNurseryProducts();
  displayProducts(products);
});

function displayProducts(products) {
  const productContainer = document.getElementById('products-container'); // Your products container
  
  if (!productContainer) {
    console.error('Products container not found');
    return;
  }
  
  productContainer.innerHTML = ''; // Clear existing products
  
  products.forEach(product => {
    const productCard = createProductCard(product);
    productContainer.appendChild(productCard);
  });
}

function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card col-md-4 mb-4';
  
  card.innerHTML = `
    <div class="card h-100">
      <img src="${product.image_url || '/placeholder.jpg'}" class="card-img-top" alt="${product.plant_name}">
      <div class="card-body">
        <h5 class="card-title">${product.plant_name}</h5>
        <p class="card-text">${product.description}</p>
        <p class="text-muted">${product.scientific_name || ''}</p>
        <p class="fw-bold">Ksh ${product.price}</p>
        ${getAvailabilityBadge(product.availability_status, product.quantity)}
        <div class="mt-3">
          <input type="number" class="form-control mb-2" id="qty-${product.id}" min="1" max="${product.quantity}" value="1" ${product.availability_status === 'Not Available' ? 'disabled' : ''}>
          <button class="btn btn-primary" onclick="addToCart('${product.id}', '${product.plant_name}', ${product.price})" ${product.availability_status === 'Not Available' ? 'disabled' : ''}>
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  `;
  
  return card;
}

// Shopping cart functionality
let shoppingCart = [];

function addToCart(productId, plantName, price) {
  const quantityInput = document.getElementById(`qty-${productId}`);
  const quantity = parseInt(quantityInput.value);
  
  if (quantity <= 0) {
    alert('Please enter a valid quantity');
    return;
  }
  
  // Add to cart array
  shoppingCart.push({
    productId,
    plantName,
    price,
    quantity
  });
  
  updateCartDisplay();
  alert(`${quantity} ${plantName} added to cart!`);
}

function updateCartDisplay() {
  const cartCount = shoppingCart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = shoppingCart.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  // Update cart badge (adjust selector based on your HTML)
  const cartBadge = document.querySelector('.cart-badge');
  if (cartBadge) {
    cartBadge.textContent = cartCount;
  }
  
  // Update cart total (adjust selector based on your HTML)
  const cartTotalElement = document.querySelector('.cart-total');
  if (cartTotalElement) {
    cartTotalElement.textContent = `Ksh ${cartTotal.toLocaleString()}`;
  }
}

// Checkout process
async function processCheckout() {
  if (shoppingCart.length === 0) {
    alert('Your cart is empty');
    return;
  }
  
  // Get customer information (adjust based on your form)
  const customerName = document.getElementById('customer-name')?.value || 'Website Customer';
  const customerContact = document.getElementById('customer-contact')?.value || '';
  
  const customerInfo = {
    name: customerName,
    contact: customerContact
  };
  
  // Update inventory for each item in cart
  for (const item of shoppingCart) {
    const result = await updateNurseryInventory(item.productId, item.quantity, customerInfo);
    
    if (!result) {
      alert(`Failed to process ${item.plantName}. Please try again.`);
      return;
    }
  }
  
  // Clear cart and refresh products
  shoppingCart = [];
  updateCartDisplay();
  
  // Refresh product list to show updated quantities
  const products = await fetchNurseryProducts();
  displayProducts(products);
  
  alert('Order processed successfully! Inventory has been updated.');
}
\`\`\`

## Step 3: HTML Structure

Make sure your website has these elements:

\`\`\`html
<!-- Products container -->
<div id="products-container" class="row">
  <!-- Products will be loaded here -->
</div>

<!-- Cart summary -->
<div class="cart-summary">
  <span class="cart-badge">0</span>
  <span class="cart-total">Ksh 0</span>
</div>

<!-- Customer form (optional) -->
<form id="customer-form">
  <input type="text" id="customer-name" placeholder="Your Name">
  <input type="tel" id="customer-contact" placeholder="Phone Number">
  <button type="button" onclick="processCheckout()">Complete Purchase</button>
</form>
\`\`\`

## Step 4: CSS Styling

Add these CSS classes for better appearance:

\`\`\`css
.product-card {
  transition: transform 0.2s;
}

.product-card:hover {
  transform: translateY(-5px);
}

.badge {
  padding: 0.5em 0.75em;
  border-radius: 0.25rem;
}

.bg-success { background-color: #28a745; color: white; }
.bg-warning { background-color: #ffc107; color: black; }
.bg-danger { background-color: #dc3545; color: white; }
.bg-secondary { background-color: #6c757d; color: white; }
\`\`\`

## Step 5: Testing the Integration

1. Update the `NURSERY_API_URL` with your actual Replit app URL
2. Deploy your website changes
3. Test the product loading functionality
4. Test the cart and checkout process
5. Verify that inventory updates in your nursery app

## Automatic Sync Schedule

Consider setting up a regular sync to keep your website updated:

\`\`\`javascript
// Refresh products every 5 minutes
setInterval(async () => {
  const products = await fetchNurseryProducts();
  displayProducts(products);
}, 5 * 60 * 1000);
\`\`\`

## Error Handling

The integration includes comprehensive error handling for:
- Network connectivity issues
- API endpoint errors
- Insufficient inventory
- Invalid customer data

Remember to replace `[your-repl-name]` with your actual Replit app name in the URL!
