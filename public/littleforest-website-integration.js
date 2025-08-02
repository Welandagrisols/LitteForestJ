
// Little Forest Website Integration
// Add this to your www.littleforest.co.ke website

const NURSERY_API_URL = 'https://litteforest.vercel.app';

// Fetch available products from nursery app
async function fetchNurseryProducts() {
  try {
    const response = await fetch(`${NURSERY_API_URL}/api/products`);
    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ Successfully loaded ${data.products.length} products from nursery`);
      return data.products.filter(product => product.ready_for_sale);
    } else {
      console.error('❌ Error fetching products:', data.error);
      showNotification('Unable to load products from nursery. Please try again later.', 'error');
      return [];
    }
  } catch (error) {
    console.error('Network error:', error);
    showNotification('Network error occurred while loading products', 'error');
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
      console.log('✅ Inventory updated successfully');
      showNotification('Order processed successfully!', 'success');
      return data;
    } else {
      console.error('❌ Error updating inventory:', data.error);
      showNotification('Error processing order: ' + data.error, 'error');
      return null;
    }
  } catch (error) {
    console.error('❌ Network error:', error);
    showNotification('Network error occurred while processing order', 'error');
    return null;
  }
}

// Display availability status with Kenyan styling
function getAvailabilityBadge(status, quantity) {
  switch(status) {
    case 'Available':
      return `<span class="badge bg-success">In Stock (${quantity} available)</span>`;
    case 'Limited':
      return `<span class="badge bg-warning text-dark">Limited Stock (${quantity} left)</span>`;
    case 'Not Available':
      return `<span class="badge bg-danger">Out of Stock</span>`;
    default:
      return `<span class="badge bg-secondary">Check Availability</span>`;
  }
}

// Format price in Kenyan Shillings
function formatKenyanPrice(price) {
  return `KSh ${price.toLocaleString('en-KE')}`;
}

// Show notifications to users
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show notification-toast`;
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
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 5000);
}

// Load and display products on page load
document.addEventListener('DOMContentLoaded', async function() {
  console.log('🌱 Loading Little Forest products...');
  const products = await fetchNurseryProducts();
  displayProducts(products);
});

function displayProducts(products) {
  const productContainer = document.getElementById('products-container');
  
  if (!productContainer) {
    console.error('❌ Products container not found. Add <div id="products-container"></div> to your HTML');
    return;
  }
  
  if (products.length === 0) {
    productContainer.innerHTML = `
      <div class="col-12 text-center py-5">
        <h4>No products available at the moment</h4>
        <p class="text-muted">Please check back later or contact us directly.</p>
      </div>
    `;
    return;
  }
  
  productContainer.innerHTML = ''; // Clear existing products
  
  products.forEach(product => {
    const productCard = createProductCard(product);
    productContainer.appendChild(productCard);
  });
  
  console.log(`✅ Displayed ${products.length} products on website`);
}

function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'col-md-6 col-lg-4 mb-4';
  
  const isAvailable = product.availability_status === 'Available' || product.availability_status === 'Limited';
  const maxQuantity = Math.min(product.quantity, 10); // Limit max order to 10
  
  card.innerHTML = `
    <div class="card h-100 product-card" data-product-id="${product.id}">
      <div class="position-relative">
        <img src="${product.image_url}" class="card-img-top product-image" alt="${product.plant_name}" 
             style="height: 250px; object-fit: cover;" 
             onerror="this.src='/images/placeholder.jpg'">
        ${!isAvailable ? '<div class="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style="background: rgba(0,0,0,0.7);"><span class="text-white fw-bold">OUT OF STOCK</span></div>' : ''}
      </div>
      <div class="card-body d-flex flex-column">
        <h5 class="card-title text-success fw-bold">${product.plant_name}</h5>
        ${product.scientific_name ? `<p class="text-muted small fst-italic mb-2">${product.scientific_name}</p>` : ''}
        <p class="card-text flex-grow-1">${product.description || 'Beautiful plant perfect for your garden.'}</p>
        
        <div class="mt-auto">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="h5 mb-0 text-primary fw-bold">${formatKenyanPrice(product.price)}</span>
            ${getAvailabilityBadge(product.availability_status, product.quantity)}
          </div>
          
          ${isAvailable ? `
            <div class="input-group mb-2">
              <span class="input-group-text">Qty</span>
              <select class="form-select" id="qty-${product.id}" ${!isAvailable ? 'disabled' : ''}>
                ${Array.from({length: maxQuantity}, (_, i) => 
                  `<option value="${i + 1}">${i + 1}</option>`
                ).join('')}
              </select>
            </div>
            <button class="btn btn-success w-100" onclick="addToCart('${product.id}', '${product.plant_name}', ${product.price})">
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
  `;
  
  return card;
}

// Shopping cart functionality
let shoppingCart = JSON.parse(localStorage.getItem('littleforest_cart')) || [];

function addToCart(productId, plantName, price) {
  const quantitySelect = document.getElementById(`qty-${productId}`);
  const quantity = parseInt(quantitySelect.value);
  
  if (quantity <= 0) {
    showNotification('Please select a valid quantity', 'error');
    return;
  }
  
  // Check if item already in cart
  const existingItem = shoppingCart.find(item => item.productId === productId);
  
  if (existingItem) {
    existingItem.quantity += quantity;
    showNotification(`Updated ${plantName} quantity in cart`, 'info');
  } else {
    shoppingCart.push({
      productId,
      plantName,
      price,
      quantity
    });
    showNotification(`${quantity} ${plantName} added to cart!`, 'success');
  }
  
  // Save cart to localStorage
  localStorage.setItem('littleforest_cart', JSON.stringify(shoppingCart));
  updateCartDisplay();
}

function updateCartDisplay() {
  const cartCount = shoppingCart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = shoppingCart.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  // Update cart badge
  const cartBadge = document.querySelector('.cart-badge');
  if (cartBadge) {
    cartBadge.textContent = cartCount;
    cartBadge.style.display = cartCount > 0 ? 'inline' : 'none';
  }
  
  // Update cart total
  const cartTotalElement = document.querySelector('.cart-total');
  if (cartTotalElement) {
    cartTotalElement.textContent = formatKenyanPrice(cartTotal);
  }
  
  // Update cart items display if modal exists
  updateCartModal();
}

function updateCartModal() {
  const cartItemsContainer = document.getElementById('cart-items');
  if (!cartItemsContainer) return;
  
  if (shoppingCart.length === 0) {
    cartItemsContainer.innerHTML = '<p class="text-center text-muted py-4">Your cart is empty</p>';
    return;
  }
  
  cartItemsContainer.innerHTML = shoppingCart.map(item => `
    <div class="d-flex justify-content-between align-items-center border-bottom py-2">
      <div>
        <h6 class="mb-0">${item.plantName}</h6>
        <small class="text-muted">Qty: ${item.quantity}</small>
      </div>
      <div class="text-end">
        <div>${formatKenyanPrice(item.price * item.quantity)}</div>
        <button class="btn btn-sm btn-outline-danger" onclick="removeFromCart('${item.productId}')">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `).join('');
}

function removeFromCart(productId) {
  shoppingCart = shoppingCart.filter(item => item.productId !== productId);
  localStorage.setItem('littleforest_cart', JSON.stringify(shoppingCart));
  updateCartDisplay();
  showNotification('Item removed from cart', 'info');
}

function clearCart() {
  shoppingCart = [];
  localStorage.removeItem('littleforest_cart');
  updateCartDisplay();
  showNotification('Cart cleared', 'info');
}

// Checkout process
async function processCheckout() {
  if (shoppingCart.length === 0) {
    showNotification('Your cart is empty', 'error');
    return;
  }
  
  // Get customer information
  const customerName = document.getElementById('customer-name')?.value || 'Website Customer';
  const customerContact = document.getElementById('customer-contact')?.value || '';
  const customerEmail = document.getElementById('customer-email')?.value || '';
  
  if (!customerContact && !customerEmail) {
    showNotification('Please provide your contact information', 'error');
    return;
  }
  
  const customerInfo = {
    name: customerName,
    contact: customerContact,
    email: customerEmail,
    source: 'website'
  };
  
  // Show processing message
  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.disabled = true;
    checkoutBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';
  }
  
  // Update inventory for each item in cart
  let allSuccessful = true;
  for (const item of shoppingCart) {
    const result = await updateNurseryInventory(item.productId, item.quantity, customerInfo);
    
    if (!result) {
      allSuccessful = false;
      showNotification(`Failed to process ${item.plantName}. Please try again.`, 'error');
      break;
    }
  }
  
  if (allSuccessful) {
    // Clear cart and refresh products
    clearCart();
    
    // Refresh product list to show updated quantities
    const products = await fetchNurseryProducts();
    displayProducts(products);
    
    showNotification('Order processed successfully! We will contact you soon.', 'success');
    
    // Close modal if exists
    const cartModal = document.getElementById('cartModal');
    if (cartModal && window.bootstrap) {
      const modal = bootstrap.Modal.getInstance(cartModal);
      if (modal) modal.hide();
    }
  }
  
  // Re-enable checkout button
  if (checkoutBtn) {
    checkoutBtn.disabled = false;
    checkoutBtn.innerHTML = '<i class="fas fa-credit-card me-2"></i>Complete Order';
  }
}

// Auto-refresh products every 10 minutes
setInterval(async () => {
  console.log('🔄 Auto-refreshing products...');
  const products = await fetchNurseryProducts();
  displayProducts(products);
}, 10 * 60 * 1000);

// Initialize cart display on load
document.addEventListener('DOMContentLoaded', function() {
  updateCartDisplay();
});
