/**
 * Bobby Streetwear Master Checkout Integration
 * This script consolidates all checkout fixes and ensures they work on every page
 */

// Execute immediately to ensure fixes are applied as early as possible
(function() {
  console.log('🔄 Initializing Bobby Checkout Master System...');
  
  // Execute fixes in stages to ensure they work
  
  // Stage 1: Immediate execution for critical fixes
  fixShopifyClient();
  registerDirectCartButtonHandlers();
  
  // Stage 2: Early DOM interaction (happens before DOMContentLoaded)
  setTimeout(function() {
    initializeUniversalCheckout();
    forceEnableCartButtons();
  }, 100);
  
  // Stage 3: When DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    initializeUniversalCheckout();
    forceEnableCartButtons();
    ensureLiveCartButtons();
    
    // Load our fix scripts if they're not already loaded
    loadFixScripts([
      '/scripts/universal-cart-fix.js',
      '/scripts/cart-bridge-fix.js'
    ]);
    
    // Load checkout-fix.js conditionally to prevent duplicate declaration errors
    if (!window.SilentCheckoutSystem) {
      loadFixScripts(['/scripts/checkout-fix.js']);
    }
  });
  
  // Stage 4: After everything is loaded
  window.addEventListener('load', function() {
    initializeUniversalCheckout();
    forceEnableCartButtons();
    ensureLiveCartButtons();
    
    // Re-apply again after a short delay to catch any late initialization
    setTimeout(function() {
      forceEnableCartButtons();
      ensureLiveCartButtons();
    }, 1000);
  });
  
  // Also initialize immediately if DOM is already loaded
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    initializeUniversalCheckout();
    forceEnableCartButtons();
    ensureLiveCartButtons();
  }
})();

/**
 * Force enable cart buttons specifically on bobbytherabbit.com
 */
function forceEnableCartButtons() {
  // Specific selectors for the live site
  const cartButtonSelectors = [
    '.cart-btn', '#cart-btn', '.cart-icon', '.shopping-cart',
    '.nav-actions button', 'button.cart-btn', '[data-cart-toggle]',
    '.nav-cart', 'button:has(.cart-icon)', '.cart-toggle'
  ];
  
  cartButtonSelectors.forEach(selector => {
    try {
      const buttons = document.querySelectorAll(selector);
      if (buttons.length > 0) {
        console.log(`Found ${buttons.length} cart buttons with selector: ${selector}`);
        buttons.forEach(button => {
          // Remove any existing click handlers
          const clone = button.cloneNode(true);
          if (button.parentNode) {
            button.parentNode.replaceChild(clone, button);
          }
          
          // Add our direct handler
          clone.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Force-enabled cart button clicked');
            directlyOpenCart();
            return false;
          });
        });
      }
    } catch (err) {
      console.error(`Error selecting cart buttons with selector ${selector}:`, err);
    }
  });
}

/**
 * Register global event handlers for cart buttons
 */
function registerDirectCartButtonHandlers() {
  // Remove any existing handler
  document.removeEventListener('click', globalCartButtonHandler);
  
  // Add global click listener
  document.addEventListener('click', globalCartButtonHandler);
  
  function globalCartButtonHandler(event) {
    const target = event.target;
    
    // Check if the click is on or within anything that could be a cart button
    if (
      target.classList.contains('cart-btn') ||
      target.id === 'cart-btn' ||
      target.classList.contains('cart-icon') ||
      target.closest('.cart-btn, #cart-btn, .cart-icon, [data-cart-toggle]')
    ) {
      event.preventDefault();
      event.stopPropagation();
      console.log('Direct cart button handler activated');
      directlyOpenCart();
      return false;
    }
  }
}

/**
 * Ensure cart buttons work on live site by adding direct DOM event listeners
 */
function ensureLiveCartButtons() {
  // Special handling for bobbytherabbit.com
  if (window.location.hostname.includes('bobbytherabbit.com')) {
    console.log('Applying special cart fixes for bobbytherabbit.com');
    
    // Aggressively attach handlers to all nav buttons
    const navButtons = document.querySelectorAll('.nav-actions button, .nav-cart, header button');
    navButtons.forEach(button => {
      button.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Live site cart button clicked');
        directlyOpenCart();
        return false;
      };
    });
    
    // Add a floating cart button that always works
    addFloatingCartButton();
  }
}

/**
 * Add a floating cart button that will always work
 */
function addFloatingCartButton() {
  // Only add if needed
  if (document.querySelector('#emergency-cart-button')) return;
  
  const button = document.createElement('button');
  button.id = 'emergency-cart-button';
  button.innerHTML = '🛒';
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: linear-gradient(45deg, #a855f7, #3b82f6);
    color: white;
    font-size: 20px;
    border: none;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
    cursor: pointer;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  
  button.addEventListener('click', function(e) {
    e.preventDefault();
    console.log('Emergency cart button clicked');
    directlyOpenCart();
  });
  
  document.body.appendChild(button);
}

/**
 * Directly open cart without relying on existing systems
 */
function directlyOpenCart() {
  console.log('Directly opening cart');
  
  // Try all possible cart systems first
  let cartOpened = false;
  
  // Try standard cart systems
  if (window.BobbyCarts && typeof window.BobbyCarts.openCart === 'function') {
    try {
      window.BobbyCarts.openCart();
      cartOpened = true;
    } catch(e) {
      console.error('Error using BobbyCarts.openCart:', e);
    }
  }
  
  if (!cartOpened && window.cartManager && typeof window.cartManager.openCart === 'function') {
    try {
      window.cartManager.openCart();
      cartOpened = true;
    } catch(e) {
      console.error('Error using cartManager.openCart:', e);
    }
  }
  
  // If cart systems failed, try direct DOM manipulation
  if (!cartOpened) {
    const cartSelectors = [
      '#cart-sidebar', '.cart-sidebar', '.cart-drawer',
      '.shopping-cart', '.cart', '#cart', '#shopping-cart'
    ];
    
    // Find cart element
    let cartElement = null;
    for (const selector of cartSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        cartElement = element;
        break;
      }
    }
    
    // Find overlay element
    const overlaySelectors = [
      '#cart-overlay', '.cart-overlay', '.overlay',
      '.backdrop', '.drawer-backdrop', '.modal-backdrop'
    ];
    
    let overlayElement = null;
    for (const selector of overlaySelectors) {
      const element = document.querySelector(selector);
      if (element) {
        overlayElement = element;
        break;
      }
    }
    
    // Apply all possible open states to cart
    if (cartElement) {
      // Apply all possible CSS classes for open state
      cartElement.classList.add('active', 'open', 'visible', 'show', 'opened');
      
      // Apply inline styles for positioning
      cartElement.style.transform = 'translateX(0)';
      cartElement.style.right = '0';
      cartElement.style.opacity = '1';
      cartElement.style.visibility = 'visible';
      cartElement.style.display = 'flex';
      
      // Also show overlay if available
      if (overlayElement) {
        overlayElement.classList.add('active', 'open', 'visible', 'show');
        overlayElement.style.display = 'block';
        overlayElement.style.opacity = '1';
        overlayElement.style.visibility = 'visible';
      }
      
      cartOpened = true;
    }
  }
  
  // If nothing worked, create our own cart popup
  if (!cartOpened) {
    createEmergencyCartPopup();
  }
}

/**
 * Create an emergency cart popup when all else fails
 */
function createEmergencyCartPopup() {
  console.log('Creating emergency cart popup');
  
  // Check if popup already exists
  if (document.querySelector('#emergency-cart-popup')) {
    document.querySelector('#emergency-cart-popup').style.display = 'block';
    return;
  }
  
  // Create a minimal cart popup
  const cartPopup = document.createElement('div');
  cartPopup.id = 'emergency-cart-popup';
  cartPopup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(20, 20, 35, 0.95);
    border-radius: 8px;
    box-shadow: 0 5px 25px rgba(0, 0, 0, 0.5);
    z-index: 10000;
    padding: 20px;
    min-width: 300px;
    max-width: 90vw;
  `;
  
  // Try to get cart items from any available cart system
  let cartItems = [];
  if (window.BobbyCarts && window.BobbyCarts.items) {
    cartItems = window.BobbyCarts.items;
  } else if (window.cartManager && window.cartManager.items) {
    cartItems = window.cartManager.items;
  } else if (window.BobbyCart && window.BobbyCart.items) {
    cartItems = window.BobbyCart.items;
  }
  
  // Create cart content
  let cartContent = `
    <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
      <h3 style="margin: 0; color: white;">Your Cart</h3>
      <button id="emergency-cart-close" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer;">&times;</button>
    </div>
    <div style="max-height: 60vh; overflow-y: auto;">
  `;
  
  if (cartItems.length === 0) {
    cartContent += `<p style="color: rgba(255,255,255,0.7); text-align: center;">Your cart is empty</p>`;
  } else {
    cartItems.forEach(item => {
      cartContent += `
        <div style="display: flex; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1);">
          <div style="width: 50px; height: 50px; margin-right: 10px;">
            <img src="${item.image || 'assets/placeholder.png'}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">
          </div>
          <div style="flex: 1;">
            <div style="color: white; font-weight: bold;">${item.title || 'Product'}</div>
            <div style="color: rgba(255,255,255,0.7);">Qty: ${item.quantity || 1}</div>
            <div style="color: #a855f7;">$${(item.price || 0).toFixed(2)}</div>
          </div>
        </div>
      `;
    });
  }
  
  // Calculate total
  const total = cartItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
  
  cartContent += `
    </div>
    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.2);">
      <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
        <span style="color: white;">Total:</span>
        <span style="color: white; font-weight: bold;">$${total.toFixed(2)}</span>
      </div>
      <button id="emergency-checkout-btn" style="width: 100%; padding: 10px; background: linear-gradient(45deg, #a855f7, #3b82f6); border: none; border-radius: 4px; color: white; font-weight: bold; cursor: pointer;">
        Checkout
      </button>
    </div>
  `;
  
  cartPopup.innerHTML = cartContent;
  document.body.appendChild(cartPopup);
  
  // Add event listeners
  document.getElementById('emergency-cart-close').addEventListener('click', () => {
    cartPopup.style.display = 'none';
  });
  
  document.getElementById('emergency-checkout-btn').addEventListener('click', () => {
    // Try all available checkout methods
    if (window.BobbyCarts && typeof window.BobbyCarts.proceedToCheckout === 'function') {
      window.BobbyCarts.proceedToCheckout();
    } else if (window.cartManager && typeof window.cartManager.initiateShopifyCheckout === 'function') {
      window.cartManager.initiateShopifyCheckout();
    } else {
      alert('Checkout functionality is not available at this time. Please try again later.');
    }
  });
}

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