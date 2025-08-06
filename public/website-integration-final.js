
// Little Forest Website Integration - Complete API
// Add this script to your www.littleforest.co.ke website

const NURSERY_API_URL = 'https://litteforest.vercel.app';

class LittleForestAPI {
  constructor() {
    this.cache = {
      products: null,
      timestamp: 0,
      duration: 5 * 60 * 1000 // 5 minutes cache
    };
  }

  // Fetch products from your nursery
  async fetchProducts() {
    try {
      // Check cache first
      const now = Date.now();
      if (this.cache.products && (now - this.cache.timestamp) < this.cache.duration) {
        return {
          success: true,
          products: this.cache.products,
          cached: true
        };
      }

      console.log('🌱 Fetching products from Little Forest nursery...');
      
      const response = await fetch(`${NURSERY_API_URL}/api/products`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.products) {
        // Update cache
        this.cache.products = data.products;
        this.cache.timestamp = now;

        console.log(`✅ Loaded ${data.products.length} products from nursery`);
        return {
          success: true,
          products: data.products,
          cached: false
        };
      } else {
        throw new Error(data.error || 'Invalid API response');
      }

    } catch (error) {
      console.error('❌ Error fetching products:', error);
      return {
        success: false,
        error: error.message,
        products: []
      };
    }
  }

  // Update inventory after purchase
  async updateInventory(productId, quantitySold, customerInfo) {
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
        console.log('✅ Inventory updated successfully');
        // Clear cache to force refresh
        this.cache.products = null;
        return data;
      } else {
        console.error('❌ Error updating inventory:', data.error);
        return null;
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      return null;
    }
  }

  // Format price in Kenyan Shillings
  formatPrice(price) {
    return `KSh ${parseInt(price).toLocaleString('en-KE')}`;
  }

  // Get availability badge
  getAvailabilityBadge(product) {
    const quantity = parseInt(product.quantity) || 0;
    
    if (quantity >= 50) {
      return `<span class="badge bg-success">In Stock (${quantity})</span>`;
    } else if (quantity >= 10) {
      return `<span class="badge bg-warning text-dark">Limited Stock (${quantity})</span>`;
    } else if (quantity > 0) {
      return `<span class="badge bg-warning text-dark">Few Left (${quantity})</span>`;
    } else {
      return `<span class="badge bg-danger">Out of Stock</span>`;
    }
  }

  // Create product card HTML
  createProductCard(product) {
    const isAvailable = parseInt(product.quantity) > 0;
    const price = this.formatPrice(product.price);
    const imageUrl = product.image_url || 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop';

    return `
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="card h-100 product-card shadow-sm">
          <div class="position-relative">
            <img src="${imageUrl}" 
                 class="card-img-top" 
                 alt="${product.plant_name}"
                 style="height: 250px; object-fit: cover;"
                 onerror="this.src='https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop'">
            ${!isAvailable ? '<div class="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style="background: rgba(0,0,0,0.7);"><span class="text-white fw-bold">OUT OF STOCK</span></div>' : ''}
          </div>
          
          <div class="card-body d-flex flex-column">
            <h5 class="card-title text-success fw-bold">${product.plant_name}</h5>
            ${product.scientific_name ? `<p class="text-muted small fst-italic mb-2">${product.scientific_name}</p>` : ''}
            
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="h5 mb-0 text-primary fw-bold">${price}</span>
              ${this.getAvailabilityBadge(product)}
            </div>

            <p class="card-text flex-grow-1">${product.description || 'Beautiful plant perfect for your garden.'}</p>
            
            <div class="mt-auto">
              ${isAvailable ? `
                <div class="input-group mb-2">
                  <label class="input-group-text">Qty</label>
                  <select class="form-select" id="qty-${product.id}">
                    ${Array.from({length: Math.min(product.quantity, 10)}, (_, i) => 
                      `<option value="${i + 1}">${i + 1}</option>`
                    ).join('')}
                  </select>
                </div>
                <button class="btn btn-success w-100" onclick="littleForestAPI.addToCart('${product.id}', '${product.plant_name}', ${product.price})">
                  <i class="fas fa-cart-plus me-2"></i>Add to Cart
                </button>
              ` : `
                <button class="btn btn-secondary w-100" disabled>
                  <i class="fas fa-times me-2"></i>Currently Unavailable
                </button>
              `}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Display products in container
  async displayProducts(containerId = 'products-container') {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`❌ Container '${containerId}' not found`);
      return;
    }

    // Show loading
    container.innerHTML = `
      <div class="col-12 text-center py-5">
        <div class="spinner-border text-success" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3 text-muted">Loading plants from nursery...</p>
      </div>
    `;

    const result = await this.fetchProducts();

    if (result.success && result.products.length > 0) {
      const productsHtml = result.products
        .filter(product => product.ready_for_sale)
        .map(product => this.createProductCard(product))
        .join('');

      container.innerHTML = productsHtml;
      console.log(`✅ Displayed ${result.products.length} products`);
    } else {
      container.innerHTML = `
        <div class="col-12 text-center py-5">
          <h4>No plants available at the moment</h4>
          <p class="text-muted">Please check back later or contact us directly.</p>
          ${result.error ? `<p class="text-danger small">Error: ${result.error}</p>` : ''}
        </div>
      `;
    }
  }

  // Simple cart functionality
  addToCart(productId, plantName, price) {
    const quantitySelect = document.getElementById(`qty-${productId}`);
    const quantity = quantitySelect ? parseInt(quantitySelect.value) : 1;

    // Get existing cart
    let cart = JSON.parse(localStorage.getItem('littleforest_cart') || '[]');
    
    // Check if item exists
    const existingItem = cart.find(item => item.productId === productId);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({
        productId,
        plantName,
        price,
        quantity
      });
    }

    // Save cart
    localStorage.setItem('littleforest_cart', JSON.stringify(cart));
    
    // Show notification
    this.showNotification(`${quantity} ${plantName} added to cart!`, 'success');
    this.updateCartDisplay();
  }

  // Update cart display
  updateCartDisplay() {
    const cart = JSON.parse(localStorage.getItem('littleforest_cart') || '[]');
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

    // Update cart badge
    const cartBadge = document.querySelector('.cart-badge');
    if (cartBadge) {
      cartBadge.textContent = cartCount;
      cartBadge.style.display = cartCount > 0 ? 'inline' : 'none';
    }

    // Update cart total
    const cartTotalElement = document.querySelector('.cart-total');
    if (cartTotalElement) {
      cartTotalElement.textContent = this.formatPrice(cartTotal);
    }
  }

  // Show notifications
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      min-width: 300px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    notification.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }

  // Process checkout
  async processCheckout(customerInfo) {
    const cart = JSON.parse(localStorage.getItem('littleforest_cart') || '[]');
    
    if (cart.length === 0) {
      this.showNotification('Your cart is empty', 'error');
      return false;
    }

    let allSuccessful = true;
    
    for (const item of cart) {
      const result = await this.updateInventory(item.productId, item.quantity, customerInfo);
      
      if (!result) {
        allSuccessful = false;
        this.showNotification(`Failed to process ${item.plantName}`, 'error');
        break;
      }
    }

    if (allSuccessful) {
      // Clear cart
      localStorage.removeItem('littleforest_cart');
      this.updateCartDisplay();
      
      // Refresh products
      await this.displayProducts();
      
      this.showNotification('Order processed successfully! We will contact you soon.', 'success');
      return true;
    }
    
    return false;
  }
}

// Create global instance
window.littleForestAPI = new LittleForestAPI();

// Auto-load on DOM ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('🌱 Little Forest API Integration loaded');
  
  // Auto-display if container exists
  if (document.getElementById('products-container')) {
    littleForestAPI.displayProducts();
  }
  
  // Update cart display
  littleForestAPI.updateCartDisplay();
});

// Auto-refresh every 10 minutes
setInterval(() => {
  console.log('🔄 Auto-refreshing products...');
  if (document.getElementById('products-container')) {
    littleForestAPI.displayProducts();
  }
}, 10 * 60 * 1000);
