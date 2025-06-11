/**
 * Simple Cart System
 * A clean, reliable cart implementation for Bobby Streetwear
 *
 * Version: 1.3.0 - Added Shopify Storefront API integration and fixed initialization issues
 */

// Prevent duplicate declarations
if (window.BobbyCartSystem) {
  console.log('BobbyCartSystem already initialized, using existing instance');
} else {
  // Create cart system with safer initialization
  const BobbyCartSystem = (function() {
  // Cart state
  let items = [];
  let isCartOpen = false;
  let isInitialized = false;
  let initializationAttempts = 0;
  const MAX_INIT_ATTEMPTS = 5;
  
  // DOM elements cache
  let cartDrawer = null;
  let cartOverlay = null;
  let cartItemsContainer = null;
  let cartTotalElement = null;
  
  // Initialize the cart system with safeguards
  function init() {
    // Prevent multiple initializations
    if (isInitialized) {
      console.log('Cart system already initialized');
      return;
    }
    
    if (initializationAttempts >= MAX_INIT_ATTEMPTS) {
      console.warn('Max initialization attempts reached, aborting cart setup');
      return;
    }
    
    initializationAttempts++;
    console.log(`Initializing simple cart system (attempt ${initializationAttempts})`);
    
    try {
      // Load cart data from storage
      loadCartData();
      
      // Only proceed with DOM operations if document.body exists
      if (!document.body) {
        console.log('Body not available yet, retrying initialization in 200ms');
        setTimeout(init, 200);
        return;
      }
      
      // Create cart elements if they don't exist
      createCartElements();
      
      // Set up event listeners
      setupEventListeners();
      
      // Update cart UI
      updateCartUI();
      
      // Mark as initialized
      isInitialized = true;
      console.log('Cart system initialized successfully');
    } catch (err) {
      console.error('Error during cart initialization:', err);
      
      // Retry initialization with exponential backoff
      if (initializationAttempts < MAX_INIT_ATTEMPTS) {
        const delay = Math.min(1000 * Math.pow(1.5, initializationAttempts), 5000);
        console.log(`Retrying cart initialization in ${delay}ms`);
        setTimeout(init, delay);
      }
    }
  }
  
  // Create cart drawer and overlay if they don't exist - with error handling
  function createCartElements() {
    try {
      if (!document.body) {
        throw new Error('Document body not available');
      }
      
      // Create cart drawer if it doesn't exist
      if (!document.getElementById('simple-cart-drawer')) {
        const drawer = document.createElement('div');
        drawer.id = 'simple-cart-drawer';
        drawer.className = 'cart-drawer';
        drawer.innerHTML = `
          <div class="cart-header">
            <h3>Your Cart</h3>
            <button class="cart-close">&times;</button>
          </div>
          <div class="cart-items-container">
            <div id="cart-items" class="cart-items"></div>
          </div>
          <div class="cart-footer">
            <div class="cart-total">
              <span>Total:</span>
              <span>$<span id="cart-total-amount">0.00</span></span>
            </div>
            <button class="cart-checkout-btn">
              <span>Checkout</span>
            </button>
          </div>
        `;
        document.body.appendChild(drawer);
        cartDrawer = drawer;
      } else {
        cartDrawer = document.getElementById('simple-cart-drawer');
      }
      
      // Create cart overlay if it doesn't exist
      if (!document.getElementById('simple-cart-overlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'simple-cart-overlay';
        overlay.className = 'cart-overlay';
        document.body.appendChild(overlay);
        cartOverlay = overlay;
      } else {
        cartOverlay = document.getElementById('simple-cart-overlay');
      }
      
      // Cache other elements
      cartItemsContainer = document.getElementById('cart-items');
      cartTotalElement = document.getElementById('cart-total-amount');
      
      // Add cart styles
      addCartStyles();
    } catch (err) {
      console.error('Error creating cart elements:', err);
      throw err; // Re-throw to trigger retry in init
    }
  }
  
  // Set up event listeners with error handling
  function setupEventListeners() {
    try {
      if (!cartDrawer) {
        console.warn('Cart drawer not available for event setup');
        return;
      }
      
      // Add event listeners to cart drawer close button
      const closeButton = cartDrawer.querySelector('.cart-close');
      if (closeButton) {
        // Use event delegation with try/catch for safety
        closeButton.addEventListener('click', function(e) {
          try {
            e.preventDefault();
            closeCart();
          } catch (err) {
            console.error('Error in close button handler:', err);
          }
        });
      }
      
      // Add event listener to overlay
      if (cartOverlay) {
        cartOverlay.addEventListener('click', function(e) {
          try {
            e.preventDefault();
            closeCart();
          } catch (err) {
            console.error('Error in overlay click handler:', err);
          }
        });
      }
      
      // Add event listener to checkout button
      const checkoutButton = cartDrawer.querySelector('.cart-checkout-btn');
      if (checkoutButton) {
        checkoutButton.addEventListener('click', function(e) {
          try {
            e.preventDefault();
            proceedToCheckout();
          } catch (err) {
            console.error('Error in checkout button handler:', err);
            alert('An error occurred during checkout. Please try again.');
          }
        });
      }
      
      // Find and set up all cart buttons on the page
      setupCartButtons();
    } catch (err) {
      console.error('Error setting up cart event listeners:', err);
    }
  }
  
  // Find and set up cart buttons more safely - avoid DOM replacement that can cause issues
  function setupCartButtons() {
    try {
      // Find all cart buttons using various selectors
      const cartButtons = document.querySelectorAll('.cart-btn, #cart-btn, .cart-icon, [data-cart-toggle]');
      
      if (cartButtons.length === 0) {
        console.log('No cart buttons found to set up');
        return;
      }
      
      console.log(`Setting up ${cartButtons.length} cart buttons`);
      
      cartButtons.forEach(button => {
        // Skip if already set up
        if (button.dataset.cartHandlerAttached === 'true') {
          return;
        }
        
        // Add our click handler without replacing the element
        button.addEventListener('click', function(event) {
          try {
            event.preventDefault();
            event.stopPropagation();
            openCart();
          } catch (err) {
            console.error('Error in cart button click handler:', err);
          }
        });
        
        // Mark as set up
        button.dataset.cartHandlerAttached = 'true';
      });
    } catch (err) {
      console.error('Error setting up cart buttons:', err);
    }
  }
  
  // Open the cart with error handling
  function openCart() {
    try {
      if (!cartDrawer || !cartOverlay) {
        console.warn('Cannot open cart: cart elements not initialized');
        return;
      }
      
      cartDrawer.classList.add('open');
      cartOverlay.classList.add('open');
      isCartOpen = true;
      
      // Ensure the cart content is up to date
      updateCartUI();
    } catch (err) {
      console.error('Error opening cart:', err);
    }
  }
  
  // Close the cart
  function closeCart() {
    if (cartDrawer && cartOverlay) {
      cartDrawer.classList.remove('open');
      cartOverlay.classList.remove('open');
      isCartOpen = false;
    }
  }
  
  // Add an item to the cart
  function addItem(product) {
    if (!product || !product.id) return;
    
    console.log(`Adding to cart: ${product.title} (ID: ${product.id}, Quantity: ${product.quantity || 1})`);
    
    // Preserve the original Shopify variant ID if present
    let shopifyVariantId = null;
    
    // Check if the product already has a valid Shopify variant ID
    if (product.id && product.id.startsWith('gid://shopify/ProductVariant/')) {
      shopifyVariantId = product.id;
      console.log(`Using existing Shopify variant ID: ${shopifyVariantId}`);
    } else if (product.variantId && product.variantId.startsWith('gid://shopify/ProductVariant/')) {
      shopifyVariantId = product.variantId;
      console.log(`Using product.variantId as Shopify variant ID: ${shopifyVariantId}`);
    }
    
    // Create a variant-specific ID that combines product ID with color and size
    const color = product.selectedColor || '';
    const size = product.selectedSize || '';
    const variantId = `${product.id}-${color}-${size}`;
    
    console.log(`Generated cart item ID: ${variantId}`);
    
    // Check if this specific variant already exists in cart
    const existingItemIndex = items.findIndex(item =>
      item.id === variantId ||
      (item.productId === product.id &&
       item.selectedColor === color &&
       item.selectedSize === size)
    );
    
    if (existingItemIndex >= 0) {
      // Increment quantity if this variant already exists
      const newQuantity = items[existingItemIndex].quantity + (product.quantity || 1);
      console.log(`Item already exists in cart, increasing quantity from ${items[existingItemIndex].quantity} to ${newQuantity}`);
      items[existingItemIndex].quantity = newQuantity;
      
      // Update image if a better one is provided
      if (product.image && product.image !== 'assets/placeholder.png') {
        console.log(`Updating image for existing cart item: ${product.title}`);
        items[existingItemIndex].image = product.image;
      }
      
      // Ensure Shopify variant ID is saved if available
      if (shopifyVariantId && !items[existingItemIndex].variantId) {
        console.log(`Adding Shopify variant ID to existing cart item: ${shopifyVariantId}`);
        items[existingItemIndex].variantId = shopifyVariantId;
      }
    } else {
      // Add new item with default quantity of 1 at the top of the cart
      console.log(`Adding new item to cart: ${product.title} (${color}/${size})`);
      items.unshift({
        id: variantId,
        productId: product.productId || product.id, // Store original product ID
        variantId: shopifyVariantId, // Store the Shopify variant ID if available
        title: product.title || 'Product',
        price: product.price || 0,
        image: product.image || 'assets/placeholder.png',
        quantity: product.quantity || 1,
        variant: product.variantTitle || product.variant || '',
        selectedColor: color,
        selectedSize: size
      });
      
      // Log whether we have a valid Shopify variant ID for checkout
      if (shopifyVariantId) {
        console.log(`Item added with valid Shopify variant ID: ${shopifyVariantId}`);
      } else {
        console.warn(`Item added without a valid Shopify variant ID. This may cause checkout issues.`);
      }
    }
    
    // Save cart data
    saveCartData();
    
    // Update cart UI
    updateCartUI();
    
    // Open the cart
    openCart();
  }
  
  // Remove an item from the cart
  function removeItem(itemId) {
    items = items.filter(item => item.id !== itemId);
    
    // Save cart data
    saveCartData();
    
    // Update cart UI
    updateCartUI();
  }
  
  // Update item quantity
  function updateQuantity(itemId, quantity) {
    const itemIndex = items.findIndex(item => item.id === itemId);
    
    if (itemIndex >= 0) {
      if (quantity <= 0) {
        // Remove item if quantity is 0 or less
        removeItem(itemId);
      } else {
        // Update quantity
        items[itemIndex].quantity = quantity;
        
        // Save cart data
        saveCartData();
        
        // Update cart UI
        updateCartUI();
      }
    }
  }
  
  // Clear the cart
  function clearCart() {
    items = [];
    
    // Save cart data
    saveCartData();
    
    // Update cart UI
    updateCartUI();
  }
  
  // Update the cart UI
  function updateCartUI() {
    // Update cart count badge
    updateCartBadge();
    
    // Update cart items
    if (cartItemsContainer) {
      if (items.length === 0) {
        cartItemsContainer.innerHTML = '<div class="empty-cart-message">Your cart is empty</div>';
      } else {
        cartItemsContainer.innerHTML = items.map(item => `
          <div class="cart-item" data-item-id="${item.id}">
            <div class="cart-item-image">
              <img src="${item.image}" alt="${item.title}" onerror="this.src='assets/placeholder.png'">
            </div>
            <div class="cart-item-details">
              <div class="cart-item-title">${item.title}</div>
              <div class="cart-item-variant">${item.variant || (item.selectedColor && item.selectedSize) ?
                `${item.selectedColor || ''} / ${item.selectedSize === 'One Size' ? 'OS' : item.selectedSize || ''}` :
                ''}</div>
              <div class="cart-item-price">$${(item.price).toFixed(2)}</div>
              <div class="cart-item-quantity">
                <button class="quantity-decrease" data-item-id="${item.id}">-</button>
                <span class="quantity-value">${item.quantity}</span>
                <button class="quantity-increase" data-item-id="${item.id}">+</button>
              </div>
            </div>
            <button class="cart-item-remove" data-item-id="${item.id}">&times;</button>
          </div>
        `).join('');
        
        // Add event listeners to quantity buttons and remove buttons
        addCartItemEventListeners();
      }
    }
    
    // Update cart total
    if (cartTotalElement) {
      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      cartTotalElement.textContent = total.toFixed(2);
    }
  }
  
  // Add event listeners to cart item buttons
  function addCartItemEventListeners() {
    // Add event listeners to quantity decrease buttons
    const decreaseButtons = cartItemsContainer.querySelectorAll('.quantity-decrease');
    decreaseButtons.forEach(button => {
      button.addEventListener('click', function() {
        const itemId = this.getAttribute('data-item-id');
        const itemIndex = items.findIndex(item => item.id === itemId);
        if (itemIndex >= 0) {
          updateQuantity(itemId, items[itemIndex].quantity - 1);
        }
      });
    });
    
    // Add event listeners to quantity increase buttons
    const increaseButtons = cartItemsContainer.querySelectorAll('.quantity-increase');
    increaseButtons.forEach(button => {
      button.addEventListener('click', function() {
        const itemId = this.getAttribute('data-item-id');
        const itemIndex = items.findIndex(item => item.id === itemId);
        if (itemIndex >= 0) {
          updateQuantity(itemId, items[itemIndex].quantity + 1);
        }
      });
    });
    
    // Add event listeners to remove buttons
    const removeButtons = cartItemsContainer.querySelectorAll('.cart-item-remove');
    removeButtons.forEach(button => {
      button.addEventListener('click', function() {
        const itemId = this.getAttribute('data-item-id');
        removeItem(itemId);
      });
    });
  }
  
  // Update cart badge count
  function updateCartBadge() {
    const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
    
    // Find all cart count elements
    const cartCountElements = document.querySelectorAll('.cart-count');
    cartCountElements.forEach(element => {
      element.textContent = cartCount;
      
      // Show/hide based on count
      if (cartCount > 0) {
        element.style.display = 'flex';
      } else {
        element.style.display = 'none';
      }
    });
  }
  
  // Save cart data to local storage
  function saveCartData() {
    try {
      localStorage.setItem('bobby-cart-items', JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save cart data:', error);
    }
  }
  
  // Load cart data from local storage
  function loadCartData() {
    try {
      const savedItems = localStorage.getItem('bobby-cart-items');
      if (savedItems) {
        items = JSON.parse(savedItems);
      }
    } catch (error) {
      console.error('Failed to load cart data:', error);
      items = [];
    }
  }
  
  // Proceed to checkout using Storefront API
  function proceedToCheckout() {
    if (items.length === 0) {
      alert('Your cart is empty');
      return;
    }
    
    // Check if Storefront API checkout is available
    if (window.BobbyCheckoutStorefront && typeof window.BobbyCheckoutStorefront.processCheckout === 'function') {
      // Show loading state on checkout button if available
      const checkoutBtn = document.querySelector('.cart-checkout-btn');
      if (checkoutBtn) {
        checkoutBtn.innerHTML = '<span>PROCESSING...</span>';
        checkoutBtn.disabled = true;
      }
      
      // Use Storefront API for checkout
      window.BobbyCheckoutStorefront.processCheckout(items)
        .then(success => {
          if (success) {
            // Clear cart after successful checkout creation
            clearCart();
          } else {
            // Reset checkout button if process failed
            if (checkoutBtn) {
              checkoutBtn.innerHTML = '<span>Checkout</span>';
              checkoutBtn.disabled = false;
            }
          }
        })
        .catch(error => {
          console.error('Checkout error:', error);
          alert('There was an error processing your checkout. Please try again.');
          
          // Reset checkout button
          if (checkoutBtn) {
            checkoutBtn.innerHTML = '<span>Checkout</span>';
            checkoutBtn.disabled = false;
          }
        });
    } else {
      // Fallback to Netlify function approach if Storefront API not available
      
      // Only use items with valid Shopify variant IDs and filter out invalid ones
      const checkoutItems = items
        .filter(item => {
          // Check if this is already a valid Shopify GID
          if (item.id.startsWith('gid://shopify/ProductVariant/')) {
            return true;
          }
          
          // Check if there's a separate variantId property that's a valid Shopify GID
          if (item.variantId && item.variantId.startsWith('gid://shopify/ProductVariant/')) {
            return true;
          }
          
          // If this is not a valid Shopify variant ID, log a warning
          console.warn(`Skipping item with invalid Shopify variant ID: ${item.id}`);
          return false;
        })
        .map(item => {
          // Use the variantId property if it exists, otherwise use the id
          const variantId = (item.variantId && item.variantId.startsWith('gid://shopify/ProductVariant/'))
            ? item.variantId
            : item.id;
            
          return {
            variantId: variantId,
            quantity: item.quantity
          };
        });
      
      // Alert if all items were filtered out due to invalid IDs
      if (checkoutItems.length === 0) {
        console.error('No valid Shopify variant IDs found in cart');
        alert('Unable to checkout: Your cart contains products with invalid Shopify variant IDs. Please refresh the page and try again with products loaded directly from Shopify.');
        return;
      }
      
      // Call fixed Netlify function for checkout
      fetch('/.netlify/functions/create-checkout-fixed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: checkoutItems
        })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Checkout creation failed: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.error) {
          throw new Error(data.error);
        }
        
        if (data.checkoutUrl) {
          // Clear cart after successful checkout creation
          clearCart();
          
          // Redirect to Shopify checkout
          window.location.href = data.checkoutUrl;
        } else {
          throw new Error('No checkout URL received');
        }
      })
      .catch(error => {
        console.error('Checkout error:', error);
        alert('There was an error processing your checkout. Please try again.');
      });
    }
  }
  
  // Add cart styles
  function addCartStyles() {
    // Check if styles are already added
    if (document.getElementById('simple-cart-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'simple-cart-styles';
    style.textContent = `
      /* Cart drawer */
      .cart-drawer {
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
        overflow: hidden;
      }
      
      .cart-drawer.open {
        transform: translateX(0);
      }
      
      /* Cart overlay */
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
      
      .cart-overlay.open {
        display: block;
        opacity: 1;
      }
      
      /* Cart header */
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
        font-size: 18px;
      }
      
      .cart-close {
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
      }
      
      /* Cart items container */
      .cart-items-container {
        flex: 1;
        overflow-y: auto;
      }
      
      .cart-items {
        padding: 15px;
      }
      
      /* Empty cart message */
      .empty-cart-message {
        text-align: center;
        padding: 30px 0;
        color: rgba(255, 255, 255, 0.7);
      }
      
      /* Cart item */
      .cart-item {
        display: flex;
        margin-bottom: 15px;
        padding-bottom: 15px;
        border-bottom: 1px solid rgba(120, 119, 198, 0.2);
        position: relative;
      }
      
      .cart-item-image {
        width: 60px;
        height: 60px;
        margin-right: 15px;
      }
      
      .cart-item-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 4px;
      }
      
      .cart-item-details {
        flex: 1;
      }
      
      .cart-item-title {
        color: white;
        font-weight: bold;
        margin-bottom: 5px;
      }
      
      .cart-item-variant {
        color: rgba(255, 255, 255, 0.7);
        font-size: 12px;
        margin-bottom: 5px;
      }
      
      .cart-item-price {
        color: #a855f7;
        font-weight: bold;
        margin-bottom: 10px;
      }
      
      .cart-item-quantity {
        display: flex;
        align-items: center;
      }
      
      .quantity-decrease,
      .quantity-increase {
        width: 24px;
        height: 24px;
        background: rgba(120, 119, 198, 0.2);
        border: none;
        border-radius: 4px;
        color: white;
        font-size: 14px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .quantity-value {
        margin: 0 10px;
        color: white;
      }
      
      .cart-item-remove {
        position: absolute;
        top: 0;
        right: 0;
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.7);
        font-size: 16px;
        cursor: pointer;
      }
      
      /* Cart footer */
      .cart-footer {
        padding: 15px;
        border-top: 1px solid rgba(120, 119, 198, 0.3);
      }
      
      .cart-total {
        display: flex;
        justify-content: space-between;
        margin-bottom: 15px;
        color: white;
        font-weight: bold;
      }
      
      .cart-checkout-btn {
        width: 100%;
        padding: 12px;
        background: linear-gradient(45deg, #a855f7, #3b82f6);
        border: none;
        border-radius: 4px;
        color: white;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .cart-checkout-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(120, 119, 198, 0.4);
      }
    `;
    
    document.head.appendChild(style);
  }
  
  // Initialize with window.load instead of DOMContentLoaded for better reliability
  // This ensures all resources are fully loaded
  window.addEventListener('load', function() {
    try {
      console.log('Window loaded, initializing cart system');
      setTimeout(init, 300); // Delay initialization to ensure DOM is stable
    } catch (err) {
      console.error('Error during cart load handler:', err);
    }
  });
  
  // Create observer for mutation events
  let mutationObserver = null;
  let observerSetupAttempts = 0;
  const MAX_OBSERVER_ATTEMPTS = 3;
  
  // Set up the observer after init with better error handling and fewer retries
  function setupCartButtonObserver() {
    // Only create one observer
    if (mutationObserver) return;
    
    // Limit retry attempts
    if (observerSetupAttempts >= MAX_OBSERVER_ATTEMPTS) {
      console.warn('Max observer setup attempts reached');
      return;
    }
    
    observerSetupAttempts++;
    
    try {
      // Make sure body exists
      if (document.body) {
        console.log('Setting up cart button observer');
        
        // Create a throttled version of setupCartButtons to prevent too many updates
        let throttleTimeout = null;
        const throttledSetupButtons = function() {
          if (throttleTimeout) return;
          
          throttleTimeout = setTimeout(function() {
            try {
              setupCartButtons();
              throttleTimeout = null;
            } catch (err) {
              console.error('Error in throttled setup buttons:', err);
              throttleTimeout = null;
            }
          }, 200);
        };
        
        // Create observer with error handling
        mutationObserver = new MutationObserver(function(mutations) {
          try {
            // Only respond to meaningful DOM changes
            const shouldUpdate = mutations.some(mutation =>
              mutation.addedNodes.length > 0 ||
              mutation.type === 'childList'
            );
            
            if (shouldUpdate) {
              throttledSetupButtons();
            }
          } catch (err) {
            console.error('Error in mutation observer callback:', err);
          }
        });
        
        // Start observing with error handling
        try {
          mutationObserver.observe(document.body, {
            childList: true,
            subtree: true
          });
          console.log('Cart button observer started');
        } catch (err) {
          console.error('Error starting mutation observer:', err);
          mutationObserver = null;
        }
      } else {
        // Retry if body not available yet, with increasing delay
        const delay = Math.min(200 * Math.pow(1.5, observerSetupAttempts), 2000);
        console.log(`Body not available for observer, retrying in ${delay}ms`);
        setTimeout(setupCartButtonObserver, delay);
      }
    } catch (err) {
      console.error("Error setting up cart button observer:", err);
      
      // Retry with delay
      if (observerSetupAttempts < MAX_OBSERVER_ATTEMPTS) {
        setTimeout(setupCartButtonObserver, 500 * observerSetupAttempts);
      }
    }
  }
  
  // Delay observer setup to avoid racing conditions
  setTimeout(function() {
    try {
      setupCartButtonObserver();
    } catch (err) {
      console.error('Failed to setup cart button observer:', err);
    }
  }, 500);
  
  // Public API with error handling wrappers
  return {
    openCart: function() {
      try {
        openCart();
      } catch (err) {
        console.error('Error in openCart API call:', err);
      }
    },
    closeCart: function() {
      try {
        closeCart();
      } catch (err) {
        console.error('Error in closeCart API call:', err);
      }
    },
    addItem: function(product) {
      try {
        if (!product) {
          console.warn('Attempted to add undefined product to cart');
          return;
        }
        addItem(product);
      } catch (err) {
        console.error('Error in addItem API call:', err);
      }
    },
    removeItem: function(itemId) {
      try {
        removeItem(itemId);
      } catch (err) {
        console.error('Error in removeItem API call:', err);
      }
    },
    updateQuantity: function(itemId, quantity) {
      try {
        updateQuantity(itemId, quantity);
      } catch (err) {
        console.error('Error in updateQuantity API call:', err);
      }
    },
    clearCart: function() {
      try {
        clearCart();
      } catch (err) {
        console.error('Error in clearCart API call:', err);
      }
    },
    getItems: function() {
      try {
        return items.slice(); // Return a copy of the items array
      } catch (err) {
        console.error('Error in getItems API call:', err);
        return [];
      }
    },
    getItemCount: function() {
      try {
        return items.reduce((sum, item) => sum + item.quantity, 0);
      } catch (err) {
        console.error('Error in getItemCount API call:', err);
        return 0;
      }
    }
  };
})();

// Make cart globally available with correct naming
window.BobbyCart = BobbyCartSystem;

// Make cart compatible with existing code (but don't overwrite existing cart manager)
if (!window.cartManager) {
  console.log('Setting up cartManager compatibility reference to BobbyCart');
  window.cartManager = window.BobbyCart;
} else {
  console.log('cartManager already exists, not overwriting');
}

// Export the cart for module compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BobbyCartSystem;
}

// Log successful initialization
console.log('BobbyCart system initialized successfully');
}