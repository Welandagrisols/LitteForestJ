
// Little Forest Nursery - Website Integration Script
// Add this to your www.littleforest.co.ke website

const NURSERY_API_URL = 'https://your-repl-name.replit.app'; // Replace with your actual Replit URL

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

  // Update inventory after sale
  async updateInventory(productId, quantitySold, customerInfo) {
    try {
      const response = await fetch(`${this.apiUrl}/api/update-inventory`, {
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Clear products cache to force refresh
        this.cache.delete('products');
        return data;
      } else {
        throw new Error(data.error || 'Failed to update inventory');
      }
    } catch (error) {
      console.error('Error updating inventory:', error);
      throw error;
    }
  }

  // Get availability status badge HTML
  getAvailabilityBadge(status, quantity) {
    const badges = {
      'Available': `<span class="badge bg-success">In Stock (${quantity})</span>`,
      'Limited': `<span class="badge bg-warning text-dark">Limited Stock (${quantity})</span>`,
      'Not Available': `<span class="badge bg-danger">Out of Stock</span>`
    };
    return badges[status] || `<span class="badge bg-secondary">Unknown</span>`;
  }

  // Format price for display
  formatPrice(price) {
    return `Ksh ${price.toLocaleString()}`;
  }
}

// Initialize the API
const nurseryAPI = new LittleForestAPI();

// Shopping cart management
class ShoppingCart {
  constructor() {
    this.items = JSON.parse(localStorage.getItem('littleforest_cart') || '[]');
    this.updateDisplay();
  }

  addItem(product, quantity) {
    const existingItem = this.items.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.items.push({
        id: product.id,
        plant_name: product.plant_name,
        price: product.price,
        quantity: quantity,
        max_quantity: product.quantity
      });
    }
    
    this.saveCart();
    this.updateDisplay();
    this.showNotification(`${quantity} ${product.plant_name} added to cart!`);
  }

  removeItem(productId) {
    this.items = this.items.filter(item => item.id !== productId);
    this.saveCart();
    this.updateDisplay();
  }

  updateQuantity(productId, newQuantity) {
    const item = this.items.find(item => item.id === productId);
    if (item) {
      if (newQuantity <= 0) {
        this.removeItem(productId);
      } else {
        item.quantity = Math.min(newQuantity, item.max_quantity);
        this.saveCart();
        this.updateDisplay();
      }
    }
  }

  getTotal() {
    return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  getItemCount() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  clear() {
    this.items = [];
    this.saveCart();
    this.updateDisplay();
  }

  saveCart() {
    localStorage.setItem('littleforest_cart', JSON.stringify(this.items));
  }

  updateDisplay() {
    // Update cart badge
    const cartBadge = document.querySelector('.cart-badge');
    if (cartBadge) {
      cartBadge.textContent = this.getItemCount();
    }

    // Update cart total
    const cartTotal = document.querySelector('.cart-total');
    if (cartTotal) {
      cartTotal.textContent = nurseryAPI.formatPrice(this.getTotal());
    }

    // Update cart dropdown/modal if exists
    this.renderCartItems();
  }

  renderCartItems() {
    const cartContainer = document.querySelector('.cart-items');
    if (!cartContainer) return;

    if (this.items.length === 0) {
      cartContainer.innerHTML = '<p class="text-muted">Your cart is empty</p>';
      return;
    }

    cartContainer.innerHTML = this.items.map(item => `
      <div class="cart-item d-flex justify-content-between align-items-center mb-2 p-2 border-bottom">
        <div>
          <strong>${item.plant_name}</strong><br>
          <small>${nurseryAPI.formatPrice(item.price)} × ${item.quantity}</small>
        </div>
        <div>
          <button class="btn btn-sm btn-outline-secondary" onclick="cart.updateQuantity('${item.id}', ${item.quantity - 1})">-</button>
          <span class="mx-2">${item.quantity}</span>
          <button class="btn btn-sm btn-outline-secondary" onclick="cart.updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
          <button class="btn btn-sm btn-danger ms-2" onclick="cart.removeItem('${item.id}')">×</button>
        </div>
      </div>
    `).join('');
  }

  showNotification(message) {
    // Create a simple notification
    const notification = document.createElement('div');
    notification.className = 'alert alert-success position-fixed';
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 1050; min-width: 300px;';
    notification.innerHTML = `
      ${message}
      <button type="button" class="btn-close float-end" onclick="this.parentElement.remove()"></button>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 3000);
  }

  // Checkout process
  async checkout(customerInfo) {
    if (this.items.length === 0) {
      throw new Error('Cart is empty');
    }

    const errors = [];
    const successfulUpdates = [];

    // Process each item
    for (const item of this.items) {
      try {
        const result = await nurseryAPI.updateInventory(
          item.id, 
          item.quantity, 
          customerInfo
        );
        successfulUpdates.push(item.plant_name);
      } catch (error) {
        errors.push(`${item.plant_name}: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      throw new Error(`Some items failed to process:\n${errors.join('\n')}`);
    }

    // Clear cart on successful checkout
    this.clear();
    return successfulUpdates;
  }
}

// Initialize shopping cart
const cart = new ShoppingCart();

// Product display functions
async function loadProducts() {
  const productsContainer = document.querySelector('#products-container');
  if (!productsContainer) {
    console.warn('Products container (#products-container) not found');
    return;
  }

  // Show loading
  productsContainer.innerHTML = '<div class="text-center p-4"><div class="spinner-border" role="status"></div><p>Loading products...</p></div>';

  try {
    const products = await nurseryAPI.fetchProducts();
    displayProducts(products);
  } catch (error) {
    console.error('Error loading products:', error);
    productsContainer.innerHTML = '<div class="alert alert-danger">Failed to load products. Please try again later.</div>';
  }
}

function displayProducts(products) {
  const productsContainer = document.querySelector('#products-container');
  if (!productsContainer) return;

  if (products.length === 0) {
    productsContainer.innerHTML = '<div class="alert alert-info">No products available at the moment.</div>';
    return;
  }

  productsContainer.innerHTML = products.map(product => createProductCard(product)).join('');
}

function createProductCard(product) {
  const isAvailable = product.availability_status !== 'Not Available';
  
  return `
    <div class="col-lg-4 col-md-6 mb-4">
      <div class="card h-100 product-card">
        <img src="${product.image_url || '/placeholder.jpg'}" class="card-img-top" alt="${product.plant_name}" style="height: 200px; object-fit: cover;">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${product.plant_name}</h5>
          <p class="card-text flex-grow-1">${product.description || 'High quality seedling perfect for your garden'}</p>
          ${product.scientific_name ? `<p class="text-muted small">${product.scientific_name}</p>` : ''}
          <div class="mt-auto">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <strong class="text-primary">${nurseryAPI.formatPrice(product.price)}</strong>
              ${nurseryAPI.getAvailabilityBadge(product.availability_status, product.quantity)}
            </div>
            ${isAvailable ? `
              <div class="input-group mb-2">
                <input type="number" class="form-control" id="qty-${product.id}" min="1" max="${product.quantity}" value="1">
                <button class="btn btn-outline-secondary" type="button" onclick="adjustQuantity('${product.id}', -1)">-</button>
                <button class="btn btn-outline-secondary" type="button" onclick="adjustQuantity('${product.id}', 1)">+</button>
              </div>
              <button class="btn btn-success w-100" onclick="addToCart('${product.id}')">
                Add to Cart
              </button>
            ` : `
              <button class="btn btn-secondary w-100" disabled>Out of Stock</button>
            `}
          </div>
        </div>
      </div>
    </div>
  `;
}

// Utility functions
function adjustQuantity(productId, change) {
  const input = document.getElementById(`qty-${productId}`);
  if (input) {
    const newValue = Math.max(1, Math.min(parseInt(input.max), parseInt(input.value) + change));
    input.value = newValue;
  }
}

function addToCart(productId) {
  const quantityInput = document.getElementById(`qty-${productId}`);
  const quantity = parseInt(quantityInput.value);
  
  // Find the product
  nurseryAPI.fetchProducts().then(products => {
    const product = products.find(p => p.id === productId);
    if (product) {
      cart.addItem(product, quantity);
    }
  });
}

// Checkout modal functions
function showCheckoutModal() {
  const modal = document.getElementById('checkoutModal');
  if (modal) {
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
  }
}

async function processCheckout() {
  const customerName = document.getElementById('customerName')?.value || 'Website Customer';
  const customerPhone = document.getElementById('customerPhone')?.value || '';
  const customerEmail = document.getElementById('customerEmail')?.value || '';
  
  const customerInfo = {
    name: customerName,
    contact: customerPhone,
    email: customerEmail
  };

  try {
    const processButton = document.querySelector('#processCheckout');
    if (processButton) {
      processButton.disabled = true;
      processButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Processing...';
    }

    const successfulItems = await cart.checkout(customerInfo);
    
    // Show success message
    alert(`Order processed successfully!\n\nItems purchased:\n• ${successfulItems.join('\n• ')}\n\nThank you for your purchase!`);
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('checkoutModal'));
    if (modal) modal.hide();
    
    // Refresh products to show updated quantities
    await loadProducts();
    
  } catch (error) {
    alert(`Checkout failed: ${error.message}`);
  } finally {
    const processButton = document.querySelector('#processCheckout');
    if (processButton) {
      processButton.disabled = false;
      processButton.innerHTML = 'Complete Purchase';
    }
  }
}

// Auto-refresh products every 5 minutes
setInterval(loadProducts, 5 * 60 * 1000);

// Load products when page loads
document.addEventListener('DOMContentLoaded', loadProducts);

// Export for global access
window.nurseryAPI = nurseryAPI;
window.cart = cart;
window.loadProducts = loadProducts;
window.addToCart = addToCart;
window.adjustQuantity = adjustQuantity;
window.showCheckoutModal = showCheckoutModal;
window.processCheckout = processCheckout;
