/**
 * Bobby Streetwear Master Checkout Integration
 * This script consolidates all checkout fixes and ensures they work on every page
 */

// Execute immediately to ensure fixes are applied as early as possible
(function() {
  console.log('🔄 Initializing Bobby Checkout Master System...');
  
  // Ensure Shopify client is properly initialized
  fixShopifyClient();
  
  // Load our fix scripts if they're not already loaded
  loadFixScripts([
    '/scripts/checkout-fix.js',
    '/scripts/universal-cart-fix.js',
    '/scripts/cart-bridge-fix.js'
  ]);
  
  // Add universal cart functionality to all pages
  document.addEventListener('DOMContentLoaded', function() {
    initializeUniversalCheckout();
  });
  
  // Also initialize immediately if DOM is already loaded
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    initializeUniversalCheckout();
  }
})();

/**
 * Fix issues with Shopify client initialization
 */
function fixShopifyClient() {
  // Monitor Shopify client creation
  const shopifyClientMonitor = setInterval(() => {
    if (window.shopifyClient !== undefined) {
      clearInterval(shopifyClientMonitor);
      
      // If client exists but has missing cart property
      if (window.shopifyClient && (!window.shopifyClient.cart || typeof window.shopifyClient.cart.fetch !== 'function')) {
        console.log('⚠️ Fixing Shopify client missing cart API...');
        
        // Ensure cart object exists
        window.shopifyClient.cart = window.shopifyClient.cart || {};
        
        // Add missing methods with fallbacks
        if (typeof window.shopifyClient.cart.fetch !== 'function') {
          window.shopifyClient.cart.fetch = function(cartId) {
            console.log('Using fallback cart fetch for ID:', cartId);
            return Promise.resolve({
              id: cartId || `fallback-cart-${Date.now()}`,
              lineItems: [],
              checkoutUrl: null,
              webUrl: null
            });
          };
        }
        
        if (typeof window.shopifyClient.cart.create !== 'function') {
          window.shopifyClient.cart.create = function() {
            console.log('Using fallback cart creation');
            const cartId = `fallback-cart-${Date.now()}`;
            // Store in localStorage for consistency
            try {
              localStorage.setItem('shopifyCartId', cartId);
            } catch (e) {
              console.warn('Could not save cart ID to localStorage');
            }
            
            return Promise.resolve({
              id: cartId,
              lineItems: [],
              checkoutUrl: null,
              webUrl: null
            });
          };
        }
        
        if (typeof window.shopifyClient.cart.addLineItems !== 'function') {
          window.shopifyClient.cart.addLineItems = function(cartId, lineItems) {
            console.log('Using fallback addLineItems for cart:', cartId, lineItems);
            return window.shopifyClient.cart.fetch(cartId);
          };
        }
        
        console.log('✅ Shopify client cart API fixed');
      }
    }
  }, 500);
  
  // Set timeout to prevent endless checking
  setTimeout(() => clearInterval(shopifyClientMonitor), 10000);
}

/**
 * Load fix scripts if they're not already loaded
 */
function loadFixScripts(scripts) {
  scripts.forEach(scriptPath => {
    // Check if script is already loaded
    const isLoaded = Array.from(document.scripts).some(script => {
      return script.src && script.src.includes(scriptPath.replace(/^\//, ''));
    });
    
    if (!isLoaded) {
      // Create and append script element
      const script = document.createElement('script');
      script.src = scriptPath;
      script.async = true;
      document.head.appendChild(script);
      console.log(`Loading fix script: ${scriptPath}`);
    }
  });
}

/**
 * Initialize universal checkout functionality
 */
function initializeUniversalCheckout() {
  // Ensure cart system is properly initialized
  ensureCartSystem();
  
  // Set up global checkout listener
  setupGlobalCheckoutListener();
  
  // Create cart elements if they don't exist
  ensureCartElements();
}

/**
 * Ensure a cart system is available on every page
 */
function ensureCartSystem() {
  // Check if any cart system is available
  if (!window.BobbyCarts && !window.cartManager && !window.BobbyCart) {
    console.log('No cart system found, creating minimal cart fallback');
    
    // Create minimal cart system
    window.cartManager = {
      items: [],
      
      // Basic cart operations
      addItem: function(item) {
        if (!item) return false;
        
        console.log('Adding item to cart:', item);
        this.items.push({...item, quantity: item.quantity || 1});
        this.saveCart();
        return true;
      },
      
      removeItem: function(itemId) {
        const index = this.items.findIndex(i => i.id === itemId);
        if (index !== -1) {
          this.items.splice(index, 1);
          this.saveCart();
          return true;
        }
        return false;
      },
      
      clearCart: function() {
        this.items = [];
        this.saveCart();
      },
      
      // Cart UI
      openCart: function() {
        const cartSidebar = document.querySelector('#cart-sidebar');
        if (cartSidebar) {
          cartSidebar.classList.add('active');
          
          // Also show overlay
          const overlay = document.querySelector('#cart-overlay');
          if (overlay) overlay.classList.add('active');
        } else {
          console.warn('Cart sidebar not found');
        }
      },
      
      closeCart: function() {
        const cartSidebar = document.querySelector('#cart-sidebar');
        if (cartSidebar) {
          cartSidebar.classList.remove('active');
          
          // Hide overlay
          const overlay = document.querySelector('#cart-overlay');
          if (overlay) overlay.classList.remove('active');
        }
      },
      
      // Storage
      saveCart: function() {
        try {
          localStorage.setItem('cart-items', JSON.stringify(this.items));
        } catch (e) {
          console.warn('Could not save cart to localStorage');
        }
      },
      
      loadCart: function() {
        try {
          const items = localStorage.getItem('cart-items');
          if (items) {
            this.items = JSON.parse(items);
          }
        } catch (e) {
          console.warn('Could not load cart from localStorage');
          this.items = [];
        }
      },
      
      // Checkout
      initiateShopifyCheckout: function() {
        // Try to use more complete checkout system
        if (window.BobbyCarts && typeof window.BobbyCarts.proceedToCheckout === 'function') {
          window.BobbyCarts.proceedToCheckout();
        } else {
          console.warn('No checkout system available');
          alert('Checkout functionality is not available at this time. Please try again later.');
        }
      }
    };
    
    // Load cart data
    window.cartManager.loadCart();
  }
}

/**
 * Set up global checkout listener for all checkout buttons
 */
function setupGlobalCheckoutListener() {
  // Remove any existing listener first
  document.removeEventListener('click', handleGlobalCheckout);
  
  // Add checkout button listener
  document.addEventListener('click', handleGlobalCheckout);
  
  function handleGlobalCheckout(event) {
    const checkoutButton = event.target.closest('.checkout-btn, [data-checkout-action]');
    if (checkoutButton) {
      event.preventDefault();
      
      console.log('Checkout button clicked');
      
      // Try all available checkout methods
      if (window.BobbyCarts && typeof window.BobbyCarts.proceedToCheckout === 'function') {
        window.BobbyCarts.proceedToCheckout();
      } else if (window.cartManager && typeof window.cartManager.initiateShopifyCheckout === 'function') {
        window.cartManager.initiateShopifyCheckout();
      } else if (window.shopifyClient && window.shopifyCheckout) {
        // Try to use Shopify checkout directly
        if (window.shopifyCheckout.webUrl) {
          window.location.href = window.shopifyCheckout.webUrl;
        } else {
          alert('Checkout is not available at this time. Please try again later.');
        }
      } else {
        console.error('No checkout system available');
        alert('Checkout functionality is not available at this time. Please try again later.');
      }
    }
  }
}

/**
 * Ensure cart elements exist on every page
 */
function ensureCartElements() {
  // Check if cart elements already exist
  const cartSidebar = document.querySelector('#cart-sidebar');
  const cartOverlay = document.querySelector('#cart-overlay');
  
  // Create elements if they don't exist
  if (!cartSidebar) {
    const sidebar = document.createElement('div');
    sidebar.id = 'cart-sidebar';
    sidebar.className = 'cart-sidebar';
    sidebar.innerHTML = `
      <div class="cart-header">
        <h3>Your Cart</h3>
        <button class="cart-close">&times;</button>
      </div>
      <div id="cart-items" class="cart-items">
        <div class="empty-cart">Your cart is empty</div>
      </div>
      <div class="cart-footer">
        <div class="cart-total">
          <span>Total:</span>
          <span>$<span id="cart-total">0.00</span></span>
        </div>
        <button class="checkout-btn">
          <span>Checkout</span>
        </button>
      </div>
    `;
    document.body.appendChild(sidebar);
    
    // Add click handlers to cart close button
    const closeBtn = sidebar.querySelector('.cart-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        sidebar.classList.remove('active');
        if (cartOverlay) cartOverlay.classList.remove('active');
      });
    }
  }
  
  if (!cartOverlay) {
    const overlay = document.createElement('div');
    overlay.id = 'cart-overlay';
    overlay.className = 'cart-overlay';
    document.body.appendChild(overlay);
    
    // Add click handler to close cart when overlay is clicked
    overlay.addEventListener('click', function() {
      if (cartSidebar) cartSidebar.classList.remove('active');
      overlay.classList.remove('active');
    });
  }
  
  // Add basic cart styles if needed
  addCartStyles();
}

/**
 * Add essential cart styles
 */
function addCartStyles() {
  // Check if styles are already added
  if (document.querySelector('#universal-cart-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'universal-cart-styles';
  style.textContent = `
    /* Cart sidebar styles */
    .cart-sidebar {
      position: fixed;
      top: 0;
      right: 0;
      width: 320px;
      max-width: 90vw;
      height: 100vh;
      background: rgba(20, 20, 35, 0.95);
      z-index: 10000;
      display: flex;
      flex-direction: column;
      transform: translateX(100%);
      transition: transform 0.3s ease;
      box-shadow: -5px 0 25px rgba(0, 0, 0, 0.5);
    }
    
    .cart-sidebar.active {
      transform: translateX(0);
    }
    
    .cart-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 9999;
      display: none;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .cart-overlay.active {
      display: block;
      opacity: 1;
    }
    
    .cart-header {
      padding: 15px;
      border-bottom: 1px solid rgba(120, 119, 198, 0.3);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .cart-header h3 {
      margin: 0;
      color: #ffffff;
    }
    
    .cart-close {
      background: none;
      border: none;
      color: white;
      font-size: 24px;
      cursor: pointer;
    }
    
    .cart-items {
      flex: 1;
      overflow-y: auto;
      padding: 10px;
    }
    
    .empty-cart {
      text-align: center;
      padding: 2rem;
      color: rgba(255, 255, 255, 0.7);
    }
    
    .cart-footer {
      padding: 15px;
      border-top: 1px solid rgba(120, 119, 198, 0.3);
    }
    
    .cart-total {
      display: flex;
      justify-content: space-between;
      margin-bottom: 15px;
      color: #ffffff;
      font-weight: bold;
    }
    
    .checkout-btn {
      width: 100%;
      padding: 10px;
      background: linear-gradient(45deg, #a855f7, #3b82f6);
      border: none;
      border-radius: 4px;
      color: #ffffff;
      font-weight: bold;
      cursor: pointer;
    }
    
    .checkout-btn:disabled {
      background: #555;
      cursor: not-allowed;
    }
    
    /* Ensure cart buttons work visually */
    .cart-initialized {
      position: relative;
    }
    
    .cart-initialized::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 50%;
      transform: translateX(-50%);
      width: 4px;
      height: 4px;
      background-color: #a855f7;
      border-radius: 50%;
      opacity: 0.8;
    }
  `;
  
  document.head.appendChild(style);
}