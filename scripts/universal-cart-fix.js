/**
 * Universal Cart Fix - Ensures cart functionality works on all pages
 * This script initializes cart buttons across the entire site
 */

// Execute when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('🛒 Initializing universal cart functionality...');
  
  // Initialize cart button on any page
  initializeCartButtons();
  
  // Set up cart observers for dynamically added content
  observeCartElements();
});

// Initialize immediately if DOM is already loaded
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  console.log('🛒 DOM already loaded, initializing universal cart immediately...');
  initializeCartButtons();
  observeCartElements();
}

/**
 * Initialize all cart buttons on the page
 */
function initializeCartButtons() {
  // Find all cart buttons/icons - expanded selector to catch more possible elements
  const cartButtons = document.querySelectorAll(
    '.cart-btn, .cart-icon, #cart-btn, [data-cart-toggle], .nav-actions .cart-btn, .header-cart, ' +
    'button:has(.cart-icon), .shopping-cart-btn, #shopping-cart, .btn-cart, .cart-toggle, ' +
    '[data-action="open-cart"], [aria-label*="cart"], [aria-label*="Cart"]'
  );
  
  if (cartButtons.length > 0) {
    console.log(`Found ${cartButtons.length} cart buttons/icons to initialize`);
    
    // Add click handlers to all cart buttons
    cartButtons.forEach(button => {
      // Remove any existing handlers to prevent duplicates
      button.removeEventListener('click', handleCartButtonClick);
      // Add new handler
      button.addEventListener('click', handleCartButtonClick);
      // Add visual indicator that button is now working
      button.classList.add('cart-initialized');
    });
  } else {
    console.log('No cart buttons found on this page. Will observe for future additions.');
  }
}

/**
 * Handle cart button clicks
 */
function handleCartButtonClick(event) {
  event.preventDefault();
  console.log('Cart button clicked');
  
  // Flag to track if any cart system was activated
  let cartOpened = false;
  
  // Try to open cart using all known cart systems
  if (window.BobbyCarts && typeof window.BobbyCarts.openCart === 'function') {
    console.log('Opening cart using BobbyCarts system');
    window.BobbyCarts.openCart();
    cartOpened = true;
  } else if (window.BobbyCart && typeof window.BobbyCart.openCart === 'function') {
    console.log('Opening cart using BobbyCart system');
    window.BobbyCart.openCart();
    cartOpened = true;
  } else if (window.cartManager && typeof window.cartManager.openCart === 'function') {
    console.log('Opening cart using cartManager');
    window.cartManager.openCart();
    cartOpened = true;
  }
  
  // If none of the above worked, try direct DOM manipulation
  if (!cartOpened) {
    console.warn('No cart system found. Trying direct cart element manipulation.');
    
    // Try to find the cart sidebar and show it directly
    const cartSidebar = document.querySelector('#cart-sidebar, .cart-sidebar, .shopping-cart-sidebar');
    const cartOverlay = document.querySelector('#cart-overlay, .cart-overlay, .cart-backdrop');
    
    if (cartSidebar) {
      console.log('Found cart sidebar, opening it directly');
      cartSidebar.classList.add('active', 'open', 'visible', 'show');
      cartSidebar.style.transform = 'translateX(0)';
      cartSidebar.style.display = 'flex';
      
      if (cartOverlay) {
        cartOverlay.classList.add('active', 'open', 'visible', 'show');
        cartOverlay.style.display = 'block';
      }
      
      cartOpened = true;
    }
    
    // Dispatch a custom event that other cart systems might listen for
    document.dispatchEvent(new CustomEvent('toggleCart', {
      detail: { source: 'universal-cart-fix' }
    }));
    
    // Try jQuery if available
    if (!cartOpened && window.jQuery) {
      console.log('Trying jQuery to open cart');
      try {
        window.jQuery('#cart-sidebar, .cart-sidebar').addClass('active open visible show');
        window.jQuery('#cart-overlay, .cart-overlay').addClass('active open visible show');
        cartOpened = true;
      } catch (e) {
        console.error('jQuery attempt failed:', e);
      }
    }
    
    // As a last resort, try to find and click any cart toggle elements
    if (!cartOpened) {
      const cartToggle = document.querySelector(
        '#cart-toggle, .cart-toggle, [data-toggle="cart"], #cart-sidebar-toggle, .toggle-cart'
      );
      
      if (cartToggle) {
        console.log('Found cart toggle element, clicking it');
        cartToggle.click();
        cartOpened = true;
      }
    }
    
    // Create a simple cart popup if nothing else worked
    if (!cartOpened) {
      createEmergencyCartPopup();
    }
  }
}

/**
 * Create an emergency cart popup if all other methods fail
 */
function createEmergencyCartPopup() {
  console.log('Creating emergency cart popup');
  
  // Check if we already have a cart in the DOM
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
 * Observe DOM for dynamically added cart elements
 */
function observeCartElements() {
  // Create mutation observer to watch for added cart buttons
  const observer = new MutationObserver(mutations => {
    let shouldReinitialize = false;
    
    mutations.forEach(mutation => {
      // Check if new nodes were added
      if (mutation.addedNodes.length) {
        for (let i = 0; i < mutation.addedNodes.length; i++) {
          const node = mutation.addedNodes[i];
          
          // Check if the added node is an element
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Use the same expanded selector as in initializeCartButtons
            const cartSelector =
              '.cart-btn, .cart-icon, #cart-btn, [data-cart-toggle], .nav-actions .cart-btn, .header-cart, ' +
              'button:has(.cart-icon), .shopping-cart-btn, #shopping-cart, .btn-cart, .cart-toggle, ' +
              '[data-action="open-cart"], [aria-label*="cart"], [aria-label*="Cart"]';
            
            // Check if the element or any of its children is a cart button
            if (
              (node.matches && node.matches(cartSelector)) ||
              (node.querySelector && node.querySelector(cartSelector))
            ) {
              shouldReinitialize = true;
              break;
            }
            
            // Also check for potential cart buttons by other detection methods
            if (
              // Check for elements that have text containing "cart"
              (node.textContent && node.textContent.toLowerCase().includes('cart')) ||
              // Check for button elements
              node.tagName === 'BUTTON' ||
              // Check for nav elements that might contain cart buttons
              node.tagName === 'NAV' ||
              node.classList.contains('nav') ||
              node.classList.contains('header')
            ) {
              setTimeout(() => {
                console.log('Potential cart element detected, reinitializing buttons');
                initializeCartButtons();
              }, 100);
              break;
            }
          }
        }
      }
    });
    
    if (shouldReinitialize) {
      console.log('New cart elements detected, reinitializing cart buttons');
      initializeCartButtons();
    }
  });
  
  // Start observing the entire document with all subtree changes
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  console.log('Cart element observer started');
}