/**
 * Cart Debug Script
 * 
 * This script will help us identify exactly what is clearing the cart
 * by logging all cart-related operations and stack traces.
 */

(function() {
    console.log('🔍 Cart Debug Script Loaded');
    
    // Store original methods
    const originalSetItem = localStorage.setItem;
    const originalRemoveItem = localStorage.removeItem;
    const originalClear = localStorage.clear;
    
    // Override localStorage.setItem to track cart changes
    localStorage.setItem = function(key, value) {
        if (key === 'bobby-streetwear-cart') {
            console.log('📝 localStorage.setItem called for cart:', value);
            console.trace('Stack trace for cart setItem:');
            
            // Check if this is clearing the cart
            if (value === '[]' || value === '') {
                console.error('🚨 CART BEING CLEARED via localStorage.setItem!');
                console.trace('CART CLEAR STACK TRACE:');
            }
        }
        return originalSetItem.call(this, key, value);
    };
    
    // Override localStorage.removeItem to track cart removal
    localStorage.removeItem = function(key) {
        if (key === 'bobby-streetwear-cart') {
            console.error('🚨 CART BEING REMOVED via localStorage.removeItem!');
            console.trace('CART REMOVE STACK TRACE:');
        }
        return originalRemoveItem.call(this, key);
    };
    
    // Override localStorage.clear to track full clear
    localStorage.clear = function() {
        console.error('🚨 localStorage.clear() called!');
        console.trace('LOCALSTORAGE CLEAR STACK TRACE:');
        return originalClear.call(this);
    };
    
    // Watch for cart manager operations
    function watchCartManager() {
        if (window.cartManager) {
            console.log('👀 Watching CartManager');
            
            // Store original methods
            const originalClearCart = window.cartManager.clearCart;
            const originalSaveCartToStorage = window.cartManager.saveCartToStorage;
            
            // Override clearCart
            window.cartManager.clearCart = function() {
                console.error('🚨 CartManager.clearCart() called!');
                console.trace('CART MANAGER CLEAR STACK TRACE:');
                return originalClearCart.apply(this, arguments);
            };
            
            // Override saveCartToStorage
            window.cartManager.saveCartToStorage = function() {
                console.log('💾 CartManager.saveCartToStorage() called with items:', this.items.length);
                if (this.items.length === 0) {
                    console.error('🚨 CartManager saving empty cart!');
                    console.trace('EMPTY CART SAVE STACK TRACE:');
                }
                return originalSaveCartToStorage.apply(this, arguments);
            };
            
            // Watch items array changes
            let originalItems = window.cartManager.items;
            Object.defineProperty(window.cartManager, 'items', {
                get: function() {
                    return originalItems;
                },
                set: function(value) {
                    console.log('📦 CartManager.items being set to:', value.length, 'items');
                    if (value.length === 0 && originalItems.length > 0) {
                        console.error('🚨 CartManager.items being cleared!');
                        console.trace('CART ITEMS CLEAR STACK TRACE:');
                    }
                    originalItems = value;
                }
            });
        } else {
            setTimeout(watchCartManager, 100);
        }
    }
    
    // Watch for BobbyCart operations
    function watchBobbyCart() {
        if (window.BobbyCart) {
            console.log('👀 Watching BobbyCart');
            
            // Store original methods
            if (typeof window.BobbyCart.clearCart === 'function') {
                const originalClearCart = window.BobbyCart.clearCart;
                window.BobbyCart.clearCart = function() {
                    console.error('🚨 BobbyCart.clearCart() called!');
                    console.trace('BOBBY CART CLEAR STACK TRACE:');
                    return originalClearCart.apply(this, arguments);
                };
            }
            
            if (typeof window.BobbyCart.saveCart === 'function') {
                const originalSaveCart = window.BobbyCart.saveCart;
                window.BobbyCart.saveCart = function() {
                    const items = this.getItems ? this.getItems() : [];
                    console.log('💾 BobbyCart.saveCart() called with items:', items.length);
                    if (items.length === 0) {
                        console.error('🚨 BobbyCart saving empty cart!');
                        console.trace('BOBBY CART EMPTY SAVE STACK TRACE:');
                    }
                    return originalSaveCart.apply(this, arguments);
                };
            }
        } else {
            setTimeout(watchBobbyCart, 100);
        }
    }
    
    // Watch for checkout button clicks
    document.addEventListener('click', function(event) {
        if (event.target.closest('.checkout-btn, [data-checkout-action]')) {
            console.log('🛒 CHECKOUT BUTTON CLICKED');
            console.log('Current cart state before checkout:');
            
            // Log current cart state
            const cartData = localStorage.getItem('bobby-streetwear-cart');
            console.log('localStorage cart:', cartData);
            
            if (window.cartManager) {
                console.log('CartManager items:', window.cartManager.items);
            }
            
            if (window.BobbyCart && typeof window.BobbyCart.getItems === 'function') {
                console.log('BobbyCart items:', window.BobbyCart.getItems());
            }
        }
    }, true);
    
    // Start watching
    watchCartManager();
    watchBobbyCart();
    
    // Log current cart state
    setTimeout(() => {
        console.log('🔍 Initial cart state check:');
        const cartData = localStorage.getItem('bobby-streetwear-cart');
        console.log('localStorage cart:', cartData);
        
        if (window.cartManager) {
            console.log('CartManager items:', window.cartManager.items);
        }
        
        if (window.BobbyCart && typeof window.BobbyCart.getItems === 'function') {
            console.log('BobbyCart items:', window.BobbyCart.getItems());
        }
    }, 1000);
    
    console.log('✅ Cart Debug Script Ready');
})();