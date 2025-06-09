/**
 * Simple Cart System
 * A clean, reliable cart implementation for Bobby Streetwear
 */

// Create and initialize our cart system immediately
const BobbyCart = (function() {
  // Cart state
  let items = [];
  let isCartOpen = false;
  
  // DOM elements cache
  let cartDrawer = null;
  let cartOverlay = null;
  let cartItemsContainer = null;
  let cartTotalElement = null;
  
  // Initialize the cart system
  function init() {
    console.log('Initializing simple cart system');
    
    // Load cart data from storage
    loadCartData();
    
    // Create cart elements if they don't exist
    createCartElements();
    
    // Set up event listeners
    setupEventListeners();
    
    // Update cart UI
    updateCartUI();
  }
  
  // Create cart drawer and overlay if they don't exist
  function createCartElements() {
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
  }
  
  // Set up event listeners
  function setupEventListeners() {
    // Add event listeners to cart drawer close button
    const closeButton = cartDrawer.querySelector('.cart-close');
    if (closeButton) {
      closeButton.addEventListener('click', closeCart);
    }
    
    // Add event listener to overlay
    if (cartOverlay) {
      cartOverlay.addEventListener('click', closeCart);
    }
    
    // Add event listener to checkout button
    const checkoutButton = cartDrawer.querySelector('.cart-checkout-btn');
    if (checkoutButton) {
      checkoutButton.addEventListener('click', proceedToCheckout);
    }
    
    // Find and set up all cart buttons on the page
    setupCartButtons();
  }
  
  // Find and set up all cart buttons
  function setupCartButtons() {
    // Find all cart buttons using various selectors
    const cartButtons = document.querySelectorAll('.cart-btn, #cart-btn, .cart-icon, [data-cart-toggle]');
    
    cartButtons.forEach(button => {
      // Remove any existing click handlers
      const newButton = button.cloneNode(true);
      
      // Replace with our new button
      if (button.parentNode) {
        button.parentNode.replaceChild(newButton, button);
      }
      
      // Add our clean click handler
      newButton.addEventListener('click', function(event) {
        event.preventDefault();
        openCart();
      });
    });
  }
  
  // Open the cart
  function openCart() {
    if (cartDrawer && cartOverlay) {
      cartDrawer.classList.add('open');
      cartOverlay.classList.add('open');
      isCartOpen = true;
      
      // Ensure the cart content is up to date
      updateCartUI();
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
    
    // Check if item already exists in cart
    const existingItemIndex = items.findIndex(item => item.id === product.id);
    
    if (existingItemIndex >= 0) {
      // Update quantity if item exists
      items[existingItemIndex].quantity += (product.quantity || 1);
    } else {
      // Add new item with default quantity of 1
      items.push({
        id: product.id,
        title: product.title || 'Product',
        price: product.price || 0,
        image: product.image || 'assets/placeholder.png',
        quantity: product.quantity || 1,
        variant: product.variant || ''
      });
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
              <div class="cart-item-variant">${item.variant || ''}</div>
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
  
  // Proceed to checkout
  function proceedToCheckout() {
    if (items.length === 0) {
      alert('Your cart is empty');
      return;
    }
    
    // Prepare checkout items
    const checkoutItems = items.map(item => ({
      variantId: item.id,
      quantity: item.quantity
    }));
    
    // Call Netlify function to create checkout
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
  
  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Create observer for mutation events
  let mutationObserver = null;
  
  // Set up the observer after init
  function setupCartButtonObserver() {
    // Only create one observer
    if (mutationObserver) return;
    
    try {
      // Make sure body exists
      if (document.body) {
        mutationObserver = new MutationObserver(function() {
          // Check for new cart buttons
          setupCartButtons();
        });
        
        mutationObserver.observe(document.body, {
          childList: true,
          subtree: true
        });
      } else {
        // Retry if body not available yet
        setTimeout(setupCartButtonObserver, 100);
      }
    } catch (e) {
      console.error("Error setting up cart button observer:", e);
    }
  }
  
  // Run setup after a small delay to ensure DOM is ready
  setTimeout(setupCartButtonObserver, 100);
  
  // Public API
  return {
    openCart,
    closeCart,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItems: () => items.slice(), // Return a copy of the items array
    getItemCount: () => items.reduce((sum, item) => sum + item.quantity, 0)
  };
})();

// Make cart globally available
window.BobbyCart = BobbyCart;

// Make cart compatible with existing code
window.cartManager = window.BobbyCart;

// Export the cart for module compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BobbyCart;
}