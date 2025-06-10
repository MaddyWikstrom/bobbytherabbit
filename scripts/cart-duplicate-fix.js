/**
 * Cart Duplicate Fix
 * Prevents duplicate cart additions by patching the core cart system
 * 
 * This script addresses the issue of duplicate items being added to the cart
 * when clicking "Add to Cart" on product pages or in the quick view modal.
 * It implements a robust validation mechanism that prevents both:
 * 1. Rapid duplicate clicks (time-based)
 * 2. Adding items that are already in the cart (content-based)
 */

(function() {
  // Ensure we have the global cart debounce object
  // Ensure BobbyCartDebounce exists with all required properties
  if (!window.BobbyCartDebounce) {
    window.BobbyCartDebounce = {
      lastAddedTimestamp: 0,
      lastAddedItem: null,
      lastAddedItems: {},  // Track by item ID for more granular control
      debounceTime: 3000   // 3 second debounce
    };
  } else {
    // Ensure lastAddedItems exists if BobbyCartDebounce was created elsewhere
    if (!window.BobbyCartDebounce.lastAddedItems) {
      window.BobbyCartDebounce.lastAddedItems = {};
    }
  }
  
  // Wait for the cart system to be available
  function waitForCart(callback, attempts = 0) {
    if (attempts > 20) {
      console.error('Cart duplicate fix: Timed out waiting for cart system');
      return;
    }
    
    if (window.BobbyCart && typeof window.BobbyCart.addItem === 'function') {
      callback();
    } else {
      setTimeout(() => waitForCart(callback, attempts + 1), 200);
    }
  }
  
  // Patch the cart system to prevent duplicates
  waitForCart(() => {
    console.log('Cart duplicate fix: Patching cart system to prevent duplicates');
    
    // Store the original addItem method
    const originalAddItem = window.BobbyCart.addItem;
    
    // Create enhanced version with duplicate prevention
    window.BobbyCart.addItem = function(product) {
      if (!product || !product.id) {
        console.warn('Cart duplicate fix: Invalid product', product);
        return;
      }
      
      // Create a more robust variant identifier
      const color = product.selectedColor || product.color || '';
      const size = product.selectedSize || product.size || '';
      
      // Create a safer variant ID by limiting length and avoiding special characters
      let safeProductId = (product.id || '').toString().substring(0, 30);
      let safeColor = (color || '').toString().substring(0, 15);
      let safeSize = (size || '').toString().substring(0, 10);
      
      // Replace problematic characters with safe ones
      safeProductId = safeProductId.replace(/[^a-zA-Z0-9_-]/g, '_');
      safeColor = safeColor.replace(/[^a-zA-Z0-9_-]/g, '_');
      safeSize = safeSize.replace(/[^a-zA-Z0-9_-]/g, '_');
      
      const variantId = `${safeProductId}_${safeColor}_${safeSize}`;
      
      console.log(`Cart duplicate fix: Processing add to cart for ${product.title} (${variantId})`);
      
      // DUPLICATE PREVENTION - THREE LEVELS:
      
      // 1. Check for rapid duplicate clicks (time-based)
      const now = Date.now();
      const debounce = window.BobbyCartDebounce;
      
      // Use a simple timestamp as the key to avoid any issues with complex keys
      const itemSpecificKey = variantId;
      
      // Ensure lastAddedItems exists
      if (!debounce.lastAddedItems) {
        debounce.lastAddedItems = {};
      }
      
      // Use try/catch to handle any potential property access errors
      let lastAddTime = 0;
      try {
        lastAddTime = debounce.lastAddedItems[itemSpecificKey] || 0;
      } catch (e) {
        console.error('Error accessing lastAddedItems:', e);
        // Continue with lastAddTime = 0
      }
      
      if ((now - lastAddTime) < debounce.debounceTime) {
        console.log(`Cart duplicate fix: Blocked rapid duplicate add for ${variantId} - last added ${now - lastAddTime}ms ago`);
        
        // Notification removed
        return false;
      }
      
      // 2. Check if item is already in cart (content-based)
      const currentCartItems = this.getItems();
      const existingItem = currentCartItems.find(item => {
        // Match both by variant ID and by component parts
        return (item.id === variantId || 
               (item.productId === product.id && 
                item.selectedColor === color && 
                item.selectedSize === size));
      });
      
      if (existingItem) {
        console.log(`Cart duplicate fix: Item already exists in cart - ${variantId}`);
        
        // Check if we just want to update quantity instead of blocking
        if (product.updateQuantityIfExists) {
          console.log(`Cart duplicate fix: Updating quantity instead of blocking`);
          this.updateQuantity(existingItem.id, existingItem.quantity + (product.quantity || 1));
          
          // Update timestamp safely
          try {
            debounce.lastAddedItems[itemSpecificKey] = now;
          } catch (e) {
            console.error('Error updating lastAddedItems:', e);
          }
          return true;
        }
        
        // Notification removed
        return false;
      }
      
      // 3. If we get here, it's safe to add the item - update tracking
      debounce.lastAddedItem = variantId;  // Global last item
      debounce.lastAddedTimestamp = now;   // Global timestamp
      
      // Update item-specific timestamp safely
      try {
        debounce.lastAddedItems[itemSpecificKey] = now;  // Item-specific timestamp
      } catch (e) {
        console.error('Error updating lastAddedItems timestamp:', e);
        // Continue with the cart operation even if we can't update the timestamp
      }
      
      // Call the original method
      return originalAddItem.call(this, product);
    };
    
    // Helper function for notifications - disabled
    function showDuplicateNotification(message) {
      // Notifications disabled - do nothing
      // Just log to console for debugging
      console.log("Cart notification suppressed:", message);
    }
    
    console.log('Cart duplicate fix: Successfully patched cart system');
  });
  
  // Also patch other cart variations to be thorough
  waitForCart(() => {
    // Make sure all cart systems use the same prevention logic
    if (window.cartManager && window.cartManager !== window.BobbyCart) {
      window.cartManager.addItem = window.BobbyCart.addItem;
    }
    
    // Look for any alternative BobbyCart implementation and ensure it uses the same prevention logic
    if (window.BobbyCart && typeof window.BobbyCart.addItem === 'function' &&
        window.BobbyCart.addItem !== originalAddItem) {
      console.log('Cart duplicate fix: Found alternative BobbyCart implementation, applying fix');
      const altOriginalAddItem = window.BobbyCart.addItem;
      
      window.BobbyCart.addItem = function(product) {
        // Convert to compatible format if needed
        const cartProduct = {
          ...product,
          id: product.id || product.productId || `product_${Date.now()}`,
          selectedColor: product.color || product.selectedColor || 'Default',
          selectedSize: product.size || product.selectedSize || 'One Size'
        };
        
        // Use the same prevention logic
        try {
          return originalAddItem.call(this, cartProduct);
        } catch (e) {
          console.error('Error in BobbyCart.addItem:', e);
          return altOriginalAddItem.call(this, product);
        }
      };
    }
  });
})();