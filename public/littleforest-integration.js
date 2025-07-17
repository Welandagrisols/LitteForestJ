// Little Forest Nursery - Website Integration Script
// Add this to your www.littleforest.co.ke website

const NURSERY_API_URL = 'https://litteforest.vercel.app'; // Your Vercel deployment URL

class LittleForestAPI {
  constructor() {
    this.apiUrl = NURSERY_API_URL;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Fetch available products from nursery
  async fetchProducts() {
    const cacheKey = 'products';
    const cached = this.cache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await fetch(`${this.apiUrl}/api/products`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Cache the results
        this.cache.set(cacheKey, {
          data: data.products,
          timestamp: Date.now()
        });
        return data.products;
      } else {
        console.error('API Error:', data.error);
        return [];
      }
    } catch (error) {
      console.error('Network error fetching products:', error);
      return [];
    }
  }

  // Get availability status badge
  getAvailabilityBadge(status, quantity) {
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
}

// Initialize API
const nurseryAPI = new LittleForestAPI();

// Shopping cart management
let shoppingCart = [];

// Load and display products on page load
document.addEventListener('DOMContentLoaded', async function() {
  const products = await nurseryAPI.fetchProducts();
  displayProducts(products);
});

function displayProducts(products) {
  const productContainer = document.getElementById('products-container');

  if (!productContainer) {
    console.error('Products container not found - add <div id="products-container"></div> to your HTML');
    return;
  }

  productContainer.innerHTML = '';

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
      <img src="${product.image_url || '/placeholder.jpg'}" class="card-img-top" alt="${product.plant_name}" style="height: 200px; object-fit: cover;">
      <div class="card-body">
        <h5 class="card-title">${product.plant_name}</h5>
        <p class="card-text">${product.description || 'Beautiful plant for your garden'}</p>
        <p class="text-muted">${product.scientific_name || ''}</p>
        <p class="fw-bold">Ksh ${product.price.toLocaleString()}</p>
        ${nurseryAPI.getAvailabilityBadge(product.availability_status, product.quantity)}
        <div class="mt-3">
          <input type="number" class="form-control mb-2" id="qty-${product.id}" min="1" max="${product.quantity}" value="1" ${product.availability_status === 'Not Available' ? 'disabled' : ''}>
          <button class="btn btn-primary w-100" onclick="addToCart('${product.id}', '${product.plant_name}', ${product.price})" ${product.availability_status === 'Not Available' ? 'disabled' : ''}>
            ${product.availability_status === 'Not Available' ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  `;

  return card;
}

function addToCart(productId, plantName, price) {
  const quantityInput = document.getElementById(`qty-${productId}`);
  const quantity = parseInt(quantityInput.value);

  if (quantity <= 0) {
    alert('Please enter a valid quantity');
    return;
  }

  // Add to cart array
  const existingItem = shoppingCart.find(item => item.productId === productId);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    shoppingCart.push({
      productId,
      plantName,
      price,
      quantity
    });
  }

  updateCartDisplay();
  alert(`${quantity} ${plantName} added to cart!`);
  quantityInput.value = 1; // Reset quantity
}

function updateCartDisplay() {
  const cartCount = shoppingCart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = shoppingCart.reduce((total, item) => total + (item.price * item.quantity), 0);

  // Update cart badge
  const cartBadge = document.querySelector('.cart-badge');
  if (cartBadge) {
    cartBadge.textContent = cartCount;
  }

  // Update cart total
  const cartTotalElement = document.querySelector('.cart-total');
  if (cartTotalElement) {
    cartTotalElement.textContent = `Ksh ${cartTotal.toLocaleString()}`;
  }
}

// Remove item from cart
function removeFromCart(productId) {
  shoppingCart = shoppingCart.filter(item => item.productId !== productId);
  updateCartDisplay();
  displayCart();
}

// Display cart contents
function displayCart() {
  const cartContainer = document.getElementById('cart-container');
  if (!cartContainer) return;

  if (shoppingCart.length === 0) {
    cartContainer.innerHTML = '<p>Your cart is empty</p>';
    return;
  }

  cartContainer.innerHTML = shoppingCart.map(item => `
    <div class="cart-item d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
      <div>
        <strong>${item.plantName}</strong><br>
        <small>Qty: ${item.quantity} × Ksh ${item.price.toLocaleString()}</small>
      </div>
      <div>
        <span class="fw-bold">Ksh ${(item.price * item.quantity).toLocaleString()}</span>
        <button class="btn btn-sm btn-danger ms-2" onclick="removeFromCart('${item.productId}')">Remove</button>
      </div>
    </div>
  `).join('');
}

// Checkout process
async function processCheckout() {
  if (shoppingCart.length === 0) {
    alert('Your cart is empty');
    return;
  }

  // Get customer information
  const customerName = document.getElementById('customer-name')?.value || 'Website Customer';
  const customerContact = document.getElementById('customer-contact')?.value || '';
  const customerEmail = document.getElementById('customer-email')?.value || '';

  if (!customerName || !customerContact) {
    alert('Please provide your name and contact information');
    return;
  }

  const customerInfo = {
    name: customerName,
    contact: customerContact,
    email: customerEmail,
    source: 'Website'
  };

  // Handle purchase (display only - no inventory update)
    try {
        // For now, just show a message since only the app should update inventory
        alert(`Thank you for your interest in purchasing. Please contact us directly to complete your order.`);

        // Optional: You could send an email notification or log the interest
        console.log('Purchase interest:', { shoppingCart, customerInfo });
    } catch (error) {
        console.error('Purchase error:', error);
        alert('Something went wrong. Please try again.');
    }

  // Clear cart and refresh products
  shoppingCart = [];
  updateCartDisplay();

  // Refresh product list to show updated quantities
  const products = await nurseryAPI.fetchProducts();
  displayProducts(products);

  alert('Thank you for your order request! We will contact you soon to arrange delivery.');

  // Clear form
  if (document.getElementById('customer-name')) document.getElementById('customer-name').value = '';
  if (document.getElementById('customer-contact')) document.getElementById('customer-contact').value = '';
  if (document.getElementById('customer-email')) document.getElementById('customer-email').value = '';
}

// Auto-refresh products every 5 minutes
setInterval(async () => {
  const products = await nurseryAPI.fetchProducts();
  displayProducts(products);
}, 5 * 60 * 1000);