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
  // Find all cart buttons/icons
  const cartButtons = document.querySelectorAll(
    '.cart-btn, .cart-icon, #cart-btn, [data-cart-toggle], .nav-actions .cart-btn, .header-cart'
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
  
  // Try to open cart using all known cart systems
  if (window.BobbyCarts && typeof window.BobbyCarts.openCart === 'function') {
    console.log('Opening cart using BobbyCarts system');
    window.BobbyCarts.openCart();
  } else if (window.BobbyCart && typeof window.BobbyCart.openCart === 'function') {
    console.log('Opening cart using BobbyCart system');
    window.BobbyCart.openCart();
  } else if (window.cartManager && typeof window.cartManager.openCart === 'function') {
    console.log('Opening cart using cartManager');
    window.cartManager.openCart();
  } else {
    console.warn('No cart system found. Will trigger cart toggle event instead.');
    
    // Dispatch a custom event that other cart systems might listen for
    document.dispatchEvent(new CustomEvent('toggleCart', {
      detail: { source: 'universal-cart-fix' }
    }));
    
    // As a last resort, try to find and click any cart toggle elements
    const cartToggle = document.querySelector(
      '#cart-toggle, .cart-toggle, [data-toggle="cart"], #cart-sidebar-toggle'
    );
    
    if (cartToggle) {
      console.log('Found cart toggle element, clicking it');
      cartToggle.click();
    }
  }
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
            // Check if the element or any of its children is a cart button
            if (
              node.matches('.cart-btn, .cart-icon, #cart-btn, [data-cart-toggle]') ||
              node.querySelector('.cart-btn, .cart-icon, #cart-btn, [data-cart-toggle]')
            ) {
              shouldReinitialize = true;
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