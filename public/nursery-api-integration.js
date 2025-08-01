
/**
 * Little Forest Nursery API Integration
 * This code fetches products from your nursery management system
 * with proper image handling and error management
 */

class NurseryAPIIntegration {
  constructor(apiBaseUrl = 'https://litteforest.vercel.app') {
    this.apiBaseUrl = apiBaseUrl;
    this.cache = {
      products: null,
      timestamp: 0,
      duration: 2 * 60 * 1000 // 2 minutes cache
    };
  }

  /**
   * Fetch products from nursery API with caching
   */
  async fetchProducts() {
    try {
      // Check cache first
      const now = Date.now();
      if (this.cache.products && (now - this.cache.timestamp) < this.cache.duration) {
        console.log('📦 Using cached products data');
        return {
          success: true,
          products: this.cache.products,
          cached: true
        };
      }

      console.log('🔄 Fetching fresh products from nursery API...');
      
      const response = await fetch(`${this.apiBaseUrl}/api/products`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        cache: 'no-cache'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.products) {
        // Update cache
        this.cache.products = data.products;
        this.cache.timestamp = now;

        console.log(`✅ Successfully loaded ${data.products.length} products from nursery`);
        
        // Log image statistics
        const withImages = data.products.filter(p => p.has_image).length;
        console.log(`📸 Products with images: ${withImages}/${data.products.length}`);

        return {
          success: true,
          products: data.products,
          cached: false,
          total: data.products.length,
          withImages: withImages
        };
      } else {
        throw new Error(data.error || 'Invalid API response format');
      }

    } catch (error) {
      console.error('❌ Error fetching nursery products:', error);
      return {
        success: false,
        error: error.message,
        products: []
      };
    }
  }

  /**
   * Get availability status badge HTML
   */
  getAvailabilityBadge(product) {
    const quantity = parseInt(product.quantity) || 0;
    let status, className, bgColor;

    if (quantity >= 100) {
      status = 'In Stock';
      className = 'badge-success';
      bgColor = '#28a745';
    } else if (quantity >= 10) {
      status = 'Limited Stock';
      className = 'badge-warning';
      bgColor = '#ffc107';
    } else if (quantity > 0) {
      status = 'Few Left';
      className = 'badge-warning';
      bgColor = '#fd7e14';
    } else {
      status = 'Out of Stock';
      className = 'badge-danger';
      bgColor = '#dc3545';
    }

    return {
      status,
      className,
      bgColor,
      html: `<span class="badge ${className}" style="background-color: ${bgColor}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px;">${status}</span>`
    };
  }

  /**
   * Handle image loading with fallback
   */
  getImageHtml(product, width = 300, height = 200) {
    const fallbackImage = 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop&crop=center&auto=format&q=80';
    const imageUrl = product.display_image_url || product.image_url || fallbackImage;
    
    return `
      <img 
        src="${imageUrl}" 
        alt="${product.plant_name}"
        style="width: ${width}px; height: ${height}px; object-fit: cover; border-radius: 8px; transition: transform 0.2s;"
        onerror="this.onerror=null; this.src='${fallbackImage}'; console.log('Image failed to load: ${imageUrl}');"
        onload="console.log('Image loaded successfully: ${product.plant_name}');"
        onmouseover="this.style.transform='scale(1.05)'"
        onmouseout="this.style.transform='scale(1)'"
      />
    `;
  }

  /**
   * Create a complete product card HTML
   */
  createProductCard(product) {
    const availability = this.getAvailabilityBadge(product);
    const imageHtml = this.getImageHtml(product);
    const price = parseFloat(product.price) || 0;
    const formattedPrice = price.toLocaleString('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    });

    return `
      <div class="product-card" style="
        border: 1px solid #e0e0e0;
        border-radius: 12px;
        padding: 16px;
        margin: 16px;
        background: white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        transition: transform 0.2s, box-shadow 0.2s;
        max-width: 320px;
      " onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 4px 16px rgba(0,0,0,0.15)';" 
         onmouseout="this.style.transform='translateY(0px)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)';">
        
        <!-- Product Image -->
        <div style="margin-bottom: 12px; text-align: center;">
          ${imageHtml}
        </div>

        <!-- Product Info -->
        <div style="text-align: left;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #333; line-height: 1.3; flex: 1;">
              ${product.plant_name}
            </h3>
            ${availability.html}
          </div>

          ${product.scientific_name ? `
            <p style="margin: 4px 0 8px 0; font-style: italic; color: #666; font-size: 14px;">
              ${product.scientific_name}
            </p>
          ` : ''}

          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 20px; font-weight: 700; color: #2c5530;">
              ${formattedPrice}
            </span>
            <span style="font-size: 14px; color: #666;">
              Qty: ${product.quantity}
            </span>
          </div>

          <div style="margin-bottom: 12px;">
            <span style="background: #f0f8f0; color: #2c5530; padding: 4px 8px; border-radius: 6px; font-size: 12px;">
              ${product.category}
            </span>
          </div>

          ${product.description ? `
            <p style="margin: 8px 0; color: #666; font-size: 14px; line-height: 1.4;">
              ${product.description.substring(0, 100)}${product.description.length > 100 ? '...' : ''}
            </p>
          ` : ''}

          <!-- Action Buttons -->
          <div style="margin-top: 16px; display: flex; gap: 8px;">
            <button 
              onclick="nursery.addToCart('${product.id}')" 
              style="
                flex: 1;
                background: #2c5530;
                color: white;
                border: none;
                padding: 10px 16px;
                border-radius: 6px;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.2s;
              "
              onmouseover="this.style.background='#1a3a1e'"
              onmouseout="this.style.background='#2c5530'"
              ${parseInt(product.quantity) === 0 ? 'disabled style="background: #ccc; cursor: not-allowed;"' : ''}
            >
              ${parseInt(product.quantity) === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
            
            <button 
              onclick="nursery.viewDetails('${product.id}')"
              style="
                background: transparent;
                color: #2c5530;
                border: 2px solid #2c5530;
                padding: 10px 16px;
                border-radius: 6px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
              "
              onmouseover="this.style.background='#2c5530'; this.style.color='white'"
              onmouseout="this.style.background='transparent'; this.style.color='#2c5530'"
            >
              Details
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Display products in a container
   */
  async displayProducts(containerId = 'products-container') {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`❌ Container with ID '${containerId}' not found`);
      return false;
    }

    // Show loading state
    container.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #2c5530; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <p style="margin-top: 16px; color: #666;">Loading plants from nursery...</p>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;

    try {
      const result = await this.fetchProducts();

      if (result.success && result.products.length > 0) {
        // Create grid layout
        const productsHtml = result.products.map(product => this.createProductCard(product)).join('');
        
        container.innerHTML = `
          <div style="margin-bottom: 20px; text-align: center;">
            <h2 style="color: #2c5530;">Available Plants (${result.products.length})</h2>
            <p style="color: #666;">Fresh from Little Forest Nursery ${result.cached ? '(Cached)' : ''}</p>
          </div>
          <div style="
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            justify-items: center;
            max-width: 1200px;
            margin: 0 auto;
          ">
            ${productsHtml}
          </div>
        `;

        return true;
      } else {
        container.innerHTML = `
          <div style="text-align: center; padding: 40px;">
            <h3 style="color: #666;">No Plants Available</h3>
            <p style="color: #999;">Please check back later or contact the nursery directly.</p>
            <p style="color: #dc3545; font-size: 14px;">Error: ${result.error || 'Unknown error'}</p>
          </div>
        `;
        return false;
      }
    } catch (error) {
      console.error('❌ Error displaying products:', error);
      container.innerHTML = `
        <div style="text-align: center; padding: 40px;">
          <h3 style="color: #dc3545;">Failed to Load Plants</h3>
          <p style="color: #666;">Unable to connect to nursery system.</p>
          <button onclick="nursery.displayProducts('${containerId}')" style="
            background: #2c5530;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            margin-top: 16px;
          ">Try Again</button>
        </div>
      `;
      return false;
    }
  }

  /**
   * Placeholder functions for cart and details
   */
  addToCart(productId) {
    console.log(`Adding product ${productId} to cart`);
    alert(`Product ${productId} added to cart! (Implement your cart logic here)`);
  }

  viewDetails(productId) {
    console.log(`Viewing details for product ${productId}`);
    alert(`Viewing details for product ${productId} (Implement your details modal here)`);
  }
}

// Create global nursery instance
window.nursery = new NurseryAPIIntegration();

// Auto-load products when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('🌱 Little Forest Nursery API Integration loaded');
  
  // Auto-display products if container exists
  if (document.getElementById('products-container')) {
    nursery.displayProducts('products-container');
  }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NurseryAPIIntegration;
}
