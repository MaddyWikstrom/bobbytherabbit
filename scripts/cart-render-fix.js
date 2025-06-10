/**
 * Cart Render Fix
 * 
 * This script fixes issues with cart UI rendering where items exist
 * but don't appear in the cart interface.
 */

(function() {
  // Wait for DOM and cart system to be ready
  function initialize() {
    console.log('🔄 Initializing cart render fix...');
    
    // Check if we have access to the cart system
    if (!window.BobbyCart || !window.localStorage) {
      console.log('Cart system or localStorage not available yet, retrying in 500ms');
      setTimeout(initialize, 500);
      return;
    }
    
    // Get cart items from localStorage directly
    try {
      const savedCartItems = localStorage.getItem('bobby-cart-items');
      if (savedCartItems) {
        const items = JSON.parse(savedCartItems);
        console.log(`🛒 Found ${items.length} items in localStorage`);
        
        // Force update the cart UI with these items
        forceCartUpdate(items);
      } else {
        console.log('No items found in localStorage');
      }
    } catch (error) {
      console.error('Error accessing cart items:', error);
    }
    
    // Hook into the cart's addItem method to ensure UI updates
    if (window.BobbyCart && window.BobbyCart.addItem) {
      const originalAddItem = window.BobbyCart.addItem;
      window.BobbyCart.addItem = function(product) {
        // Call original method
        const result = originalAddItem.call(this, product);
        
        // Force a UI update
        setTimeout(() => {
          console.log('🔄 Forcing cart UI update after item added');
          updateCartUI();
        }, 100);
        
        return result;
      };
      console.log('✅ Enhanced cart addItem method to ensure UI updates');
    }
    
    // Override updateCartUI function if it's not working properly
    if (window.BobbyCart) {
      // Store original for reference
      window.originalUpdateCartUI = window.BobbyCart.updateCartUI || function() {};
      
      // Add our enhanced version
      window.BobbyCart.updateCartUI = function() {
        updateCartUI();
      };
    }
    
    // Initial UI update
    updateCartUI();
    
    console.log('✅ Cart render fix initialized');
  }
  
  // Function to force update the cart UI
  function forceCartUpdate(items) {
    if (!items || !items.length) return;
    
    console.log(`🛒 Forcing update of cart UI with ${items.length} items`);
    
    // Find cart container
    const cartItemsContainer = document.getElementById('cart-items');
    if (!cartItemsContainer) {
      console.error('❌ Cart items container not found');
      return;
    }
    
    // Update cart items
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
      addCartItemEventListeners(cartItemsContainer);
    }
    
    // Update total
    const cartTotalElement = document.getElementById('cart-total-amount');
    if (cartTotalElement) {
      const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      cartTotalElement.textContent = total.toFixed(2);
    }
    
    // Update cart count badge
    const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(element => {
      element.textContent = cartCount;
      element.style.display = cartCount > 0 ? 'flex' : 'none';
    });
  }
  
  // Enhanced version of updateCartUI
  function updateCartUI() {
    console.log('🔄 Enhanced updateCartUI called');
    
    // Try the original first
    try {
      if (typeof window.originalUpdateCartUI === 'function') {
        window.originalUpdateCartUI();
      }
    } catch (error) {
      console.error('Error in original updateCartUI:', error);
    }
    
    // Get cart items from various possible sources
    let items = [];
    
    // Try BobbyCart.getItems()
    if (window.BobbyCart && typeof window.BobbyCart.getItems === 'function') {
      try {
        items = window.BobbyCart.getItems();
        console.log(`🛒 Got ${items.length} items from BobbyCart.getItems()`);
      } catch (error) {
        console.error('Error getting items from BobbyCart:', error);
      }
    }
    
    // If no items found, try localStorage
    if (!items || items.length === 0) {
      try {
        const savedCartItems = localStorage.getItem('bobby-cart-items');
        if (savedCartItems) {
          items = JSON.parse(savedCartItems);
          console.log(`🛒 Got ${items.length} items from localStorage`);
        }
      } catch (error) {
        console.error('Error getting items from localStorage:', error);
      }
    }
    
    // If we have items, force an update
    if (items && items.length > 0) {
      forceCartUpdate(items);
    }
  }
  
  // Add event listeners to cart item buttons
  function addCartItemEventListeners(container) {
    if (!container) return;
    
    // Add event listeners to quantity decrease buttons
    container.querySelectorAll('.quantity-decrease').forEach(button => {
      button.addEventListener('click', function() {
        const itemId = this.getAttribute('data-item-id');
        if (window.BobbyCart && typeof window.BobbyCart.updateQuantity === 'function') {
          // Find current quantity
          const currentItem = window.BobbyCart.getItems().find(item => item.id === itemId);
          if (currentItem) {
            window.BobbyCart.updateQuantity(itemId, currentItem.quantity - 1);
          }
        }
      });
    });
    
    // Add event listeners to quantity increase buttons
    container.querySelectorAll('.quantity-increase').forEach(button => {
      button.addEventListener('click', function() {
        const itemId = this.getAttribute('data-item-id');
        if (window.BobbyCart && typeof window.BobbyCart.updateQuantity === 'function') {
          // Find current quantity
          const currentItem = window.BobbyCart.getItems().find(item => item.id === itemId);
          if (currentItem) {
            window.BobbyCart.updateQuantity(itemId, currentItem.quantity + 1);
          }
        }
      });
    });
    
    // Add event listeners to remove buttons
    container.querySelectorAll('.cart-item-remove').forEach(button => {
      button.addEventListener('click', function() {
        const itemId = this.getAttribute('data-item-id');
        if (window.BobbyCart && typeof window.BobbyCart.removeItem === 'function') {
          window.BobbyCart.removeItem(itemId);
        }
      });
    });
  }
  
  // Run after a short delay to ensure other scripts have loaded
  setTimeout(initialize, 1000);
})();