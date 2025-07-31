// Little Forest Nursery API Integration
// Add this script to your https://www.littleforest.co.ke/ website

const NURSERY_API_URL = 'https://litteforest.vercel.app';

// Fetch available products from nursery management app
async function fetchNurseryProducts() {
  try {
    console.log('Fetching products from:', `${NURSERY_API_URL}/api/products`);

    const response = await fetch(`${NURSERY_API_URL}/api/products`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      console.log(`✅ Successfully loaded ${data.products.length} products from nursery`);
      return data.products;
    } else {
      console.error('❌ Error fetching products:', data.error);
      return [];
    }
  } catch (error) {
    console.error('Network error fetching products:', error);
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
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        product_id: productId,
        quantity_sold: quantitySold,
        customer_info: customerInfo
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      console.log('✅ Inventory updated successfully');
      return data;
    } else {
      console.error('❌ Error updating inventory:', data.error);
      return null;
    }
  } catch (error) {
    console.error('Network error updating inventory:', error);
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

// Shopping cart functionality
let shoppingCart = [];

function addToCart(productId, plantName, price) {
  const quantityInput = document.getElementById(`qty-${productId}`);
  const quantity = parseInt(quantityInput.value);

  if (quantity <= 0) {
    alert('Please enter a valid quantity');
    return;
  }

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

  const cartBadge = document.querySelector('.cart-badge');
  if (cartBadge) {
    cartBadge.textContent = cartCount;
  }

  const cartTotalElement = document.querySelector('.cart-total');
  if (cartTotalElement) {
    cartTotalElement.textContent = `Ksh ${cartTotal.toLocaleString()}`;
  }
}

// Create product card HTML
function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card col-md-4 mb-4';

  card.innerHTML = `
    <div class="card h-100">
      <img src="${product.image_url || '/placeholder.jpg'}" class="card-img-top" alt="${product.plant_name}" style="height: 200px; object-fit: cover;">
      <div class="card-body d-flex flex-column">
        <h5 class="card-title">${product.plant_name}</h5>
        <p class="card-text">${product.description || 'No description available'}</p>
        <p class="text-muted small">${product.scientific_name || ''}</p>
        <p class="fw-bold text-success">Ksh ${product.price ? product.price.toLocaleString() : 'Price not set'}</p>
        <div class="mt-auto">
          ${getAvailabilityBadge(product.availability_status, product.quantity)}
          <div class="mt-3">
            <input type="number" class="form-control mb-2" id="qty-${product.id}" min="1" max="${product.quantity}" value="1" ${product.availability_status === 'Not Available' ? 'disabled' : ''}>
            <button class="btn btn-primary w-100" onclick="addToCart('${product.id}', '${product.plant_name}', ${product.price || 0})" ${product.availability_status === 'Not Available' ? 'disabled' : ''}>
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  return card;
}

// Display products in container
function displayProducts(products) {
  const productContainer = document.getElementById('products-container');

  if (!productContainer) {
    console.error('Products container (#products-container) not found');
    return;
  }

  productContainer.innerHTML = '';

  if (products.length === 0) {
    productContainer.innerHTML = '<div class="col-12"><p class="text-center">No products available at the moment.</p></div>';
    return;
  }

  products.forEach(product => {
    const productCard = createProductCard(product);
    productContainer.appendChild(productCard);
  });
}

// Checkout process
async function processCheckout() {
  if (shoppingCart.length === 0) {
    alert('Your cart is empty');
    return;
  }

  const customerName = document.getElementById('customer-name')?.value || 'Website Customer';
  const customerContact = document.getElementById('customer-contact')?.value || '';

  const customerInfo = {
    name: customerName,
    contact: customerContact,
    source: 'littleforest.co.ke'
  };

  // Process each item in cart
  for (const item of shoppingCart) {
    const result = await updateNurseryInventory(item.productId, item.quantity, customerInfo);

    if (!result) {
      alert(`Failed to process ${item.plantName}. Please try again.`);
      return;
    }
  }

  // Clear cart and refresh
  shoppingCart = [];
  updateCartDisplay();

  const products = await fetchNurseryProducts();
  displayProducts(products);

  alert('Order processed successfully! Thank you for your purchase.');
}

// Load products when page loads
document.addEventListener('DOMContentLoaded', async function() {
  console.log('Loading Little Forest products...');
  const products = await fetchNurseryProducts();
  displayProducts(products);
});

// Auto-refresh products every 5 minutes
setInterval(async () => {
  const products = await fetchNurseryProducts();
  displayProducts(products);
}, 5 * 60 * 1000);

// Function to display notifications
function showNotification(message, type = 'info') {
  const notificationDiv = document.createElement('div');
  notificationDiv.className = `notification notification-${type}`;
  notificationDiv.textContent = message;

  // Style based on type
  switch (type) {
    case 'success':
      notificationDiv.style.backgroundColor = '#4CAF50';
      notificationDiv.style.color = 'white';
      break;
    case 'info':
      notificationDiv.style.backgroundColor = '#2196F3';
      notificationDiv.style.color = 'white';
      break;
    case 'warning':
      notificationDiv.style.backgroundColor = '#ff9800';
      notificationDiv.style.color = 'black';
      break;
    case 'error':
      notificationDiv.style.backgroundColor = '#f44336';
      notificationDiv.style.color = 'white';
      break;
    default:
      notificationDiv.style.backgroundColor = '#9e9e9e';
      notificationDiv.style.color = 'white';
  }

  // Add some padding and margin for better visibility
  notificationDiv.style.padding = '10px';
  notificationDiv.style.margin = '10px 0';
  notificationDiv.style.borderRadius = '5px';
  notificationDiv.style.position = 'fixed';
  notificationDiv.style.top = '20px';
  notificationDiv.style.right = '20px';
  notificationDiv.style.zIndex = '1000';

  document.body.appendChild(notificationDiv);

  // Remove notification after 3 seconds
  setTimeout(() => {
    notificationDiv.remove();
  }, 3000);
}