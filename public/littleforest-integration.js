// Little Forest Nursery - Website Integration Script
// Add this to your www.littleforest.co.ke website

const NURSERY_API_URL = 'https://litteforest.vercel.app/api'

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  backoffMultiplier: 2
}

// Enhanced error handling
class NurseryAPIError extends Error {
  constructor(message, code, status) {
    super(message)
    this.name = 'NurseryAPIError'
    this.code = code
    this.status = status
  }
}

// Retry function with exponential backoff
async function retryWithBackoff(fn, retries = RETRY_CONFIG.maxRetries) {
  try {
    return await fn()
  } catch (error) {
    if (retries > 0 && (error.status >= 500 || error.code === 'NETWORK_ERROR')) {
      console.log(`Retrying... ${RETRY_CONFIG.maxRetries - retries + 1}/${RETRY_CONFIG.maxRetries}`)
      await new Promise(resolve => 
        setTimeout(resolve, RETRY_CONFIG.retryDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, RETRY_CONFIG.maxRetries - retries))
      )
      return retryWithBackoff(fn, retries - 1)
    }
    throw error
  }
}

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

// Cache for products
let productCache = {
  data: null,
  timestamp: 0,
  duration: 2 * 60 * 1000 // 2 minutes
}

// Function to fetch all available plants with caching
async function fetchNurseryProducts(useCache = true) {
  // Check cache first
  if (useCache && productCache.data && (Date.now() - productCache.timestamp) < productCache.duration) {
    console.log('Using cached products data')
    return productCache.data
  }

  return retryWithBackoff(async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch(`${NURSERY_API_URL}/products`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new NurseryAPIError(
          errorData.error || `HTTP error! status: ${response.status}`,
          errorData.code || 'HTTP_ERROR',
          response.status
        )
      }

      const data = await response.json()

      if (!data.success) {
        throw new NurseryAPIError(
          data.error || 'API returned unsuccessful response',
          data.code || 'API_ERROR',
          response.status
        )
      }

      if (!Array.isArray(data.products)) {
        throw new NurseryAPIError(
          'Invalid response format - products should be an array',
          'INVALID_FORMAT',
          200
        )
      }

      // Cache the results
      productCache.data = data.products
      productCache.timestamp = Date.now()

      console.log('Successfully fetched', data.products.length, 'products from nursery')

      // Show success notification if products were fetched
      if (data.products.length > 0) {
        showNotification(`✅ Loaded ${data.products.length} plants from nursery`, 'success')
      } else {
        showNotification('ℹ️ No plants currently available in nursery', 'info')
      }

      return data.products

    } catch (error) {
      console.error('Error fetching nursery products:', error)

      // Show user-friendly error message
      if (error.name === 'AbortError') {
        showNotification('⚠️ Request timed out. Please check your connection.', 'error')
      } else if (error instanceof NurseryAPIError) {
        showNotification(`❌ Nursery API Error: ${error.message}`, 'error')
      } else {
        showNotification('❌ Unable to connect to nursery system. Please try again later.', 'error')
      }

      // Return cached data if available as fallback
      if (productCache.data && productCache.data.length > 0) {
        console.log('Returning cached data as fallback')
        showNotification('📦 Showing cached nursery data', 'warning')
        return productCache.data
      }

      return []
    }
  })
}

// Function to purchase a product (updates inventory) with validation
async function purchaseProduct(productId, quantity, customerInfo = {}) {
  // Input validation
  if (!productId) {
    return {
      success: false,
      error: 'Product ID is required',
      code: 'MISSING_PRODUCT_ID'
    }
  }

  if (!quantity || !Number.isInteger(quantity) || quantity < 1) {
    return {
      success: false,
      error: 'Quantity must be a positive integer',
      code: 'INVALID_QUANTITY'
    }
  }

  if (quantity > 1000) {
    return {
      success: false,
      error: 'Quantity cannot exceed 1000 items per order',
      code: 'QUANTITY_TOO_HIGH'
    }
  }

  // Validate customer info
  if (customerInfo) {
    if (customerInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email)) {
      return {
        success: false,
        error: 'Invalid email format',
        code: 'INVALID_EMAIL'
      }
    }

    if (customerInfo.phone && !/^[\d\s\-\+\(\)]+$/.test(customerInfo.phone)) {
      return {
        success: false,
        error: 'Invalid phone number format',
        code: 'INVALID_PHONE'
      }
    }
  }

  return retryWithBackoff(async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout for purchases

      const response = await fetch(`${NURSERY_API_URL}/update-inventory`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          productId,
          quantity,
          customerInfo
        })
      })

      clearTimeout(timeoutId)

      const data = await response.json()

      if (!response.ok) {
        throw new NurseryAPIError(
          data.error || `HTTP error! status: ${response.status}`,
          data.code || 'HTTP_ERROR',
          response.status
        )
      }

      if (!data.success) {
        return {
          success: false,
          error: data.error || 'Purchase failed',
          code: data.code || 'PURCHASE_FAILED',
          availableQuantity: data.availableQuantity
        }
      }

      console.log('Purchase successful:', data)

      // Clear product cache to force refresh
      productCache.data = null

      return {
        success: true,
        message: data.message || 'Purchase completed successfully',
        data: data.data,
        responseTime: data.responseTime
      }

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new NurseryAPIError('Request timeout', 'TIMEOUT_ERROR', 408)
      }

      if (error instanceof NurseryAPIError) {
        return {
          success: false,
          error: error.message,
          code: error.code,
          status: error.status
        }
      }

      return {
        success: false,
        error: 'Network error or server unavailable',
        code: 'NETWORK_ERROR'
      }
    }
  })
}
// Initialize API
const nurseryAPI = new LittleForestAPI();

// Shopping cart management
let shoppingCart = [];

// Load and display products on page load
document.addEventListener('DOMContentLoaded', async function() {
  const products = await nurseryAPI.fetchProducts();
  displayProducts(products);

  // Auto-refresh products every 30 seconds for real-time updates
  setInterval(async () => {
    console.log('Auto-refreshing products...');
    const updatedProducts = await nurseryAPI.fetchProducts();
    displayProducts(updatedProducts);
  }, 30000); // 30 seconds

  // Optional: Check for changes every 5 seconds for faster updates
  let lastProductCount = products.length;
  setInterval(async () => {
    const quickCheck = await nurseryAPI.fetchProducts();
    if (quickCheck.length !== lastProductCount) {
      console.log('Product count changed, refreshing...');
      displayProducts(quickCheck);
      lastProductCount = quickCheck.length;
    }
  }, 5000); // 5 seconds for quick updates
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