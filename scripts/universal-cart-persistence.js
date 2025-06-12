/**
 * Universal Cart Persistence
 * 
 * Ensures cart data persists across all page navigations, redirects, and browser events.
 * This script handles the core issue where cart gets cleared during page transitions.
 */

(function() {
    console.log('🌐 Universal Cart Persistence Loading');
    
    // Configuration
    const CONFIG = {
        CART_KEY: 'bobby-cart-items',
        BACKUP_KEY: 'bobby-cart-backup-universal',
        LAST_SAVE_KEY: 'bobby-cart-last-save',
        CHECKOUT_FLAG_KEY: 'bobby-checkout-in-progress',
        SAVE_INTERVAL: 1000, // Save every second
        BACKUP_EXPIRY: 24 * 60 * 60 * 1000 // 24 hours
    };
    
    // Global cart persistence manager
    window.CartPersistenceManager = {
        // Save cart data to multiple storage locations
        saveCart: function(cartData) {
            try {
                const timestamp = Date.now();
                const dataToSave = JSON.stringify(cartData);
                
                // Save to primary location
                localStorage.setItem(CONFIG.CART_KEY, dataToSave);
                
                // Save backup copy
                localStorage.setItem(CONFIG.BACKUP_KEY, dataToSave);
                
                // Save timestamp
                localStorage.setItem(CONFIG.LAST_SAVE_KEY, timestamp.toString());
                
                console.log('💾 Cart saved universally:', cartData.length, 'items');
                return true;
            } catch (error) {
                console.error('Error saving cart:', error);
                return false;
            }
        },
        
        // Load cart data with fallback options
        loadCart: function() {
            try {
                // Try primary location first
                let cartData = localStorage.getItem(CONFIG.CART_KEY);
                
                // If primary is empty, try backup
                if (!cartData || cartData === '[]') {
                    cartData = localStorage.getItem(CONFIG.BACKUP_KEY);
                    
                    // If backup exists, restore it to primary
                    if (cartData && cartData !== '[]') {
                        localStorage.setItem(CONFIG.CART_KEY, cartData);
                        console.log('🔄 Restored cart from backup');
                    }
                }
                
                return cartData ? JSON.parse(cartData) : [];
            } catch (error) {
                console.error('Error loading cart:', error);
                return [];
            }
        },
        
        // Get current cart from any available cart system
        getCurrentCart: function() {
            let items = [];
            
            // Try BobbyCart first
            if (window.BobbyCart && window.BobbyCart.items) {
                items = window.BobbyCart.items;
            }
            // Try cartManager
            else if (window.cartManager && window.cartManager.items) {
                items = window.cartManager.items;
            }
            // Try localStorage
            else {
                items = this.loadCart();
            }
            
            return Array.isArray(items) ? items : [];
        },
        
        // Update all cart systems with data
        updateAllCartSystems: function(items) {
            try {
                // Update BobbyCart
                if (window.BobbyCart) {
                    window.BobbyCart.items = items;
                    if (typeof window.BobbyCart.updateCartDisplay === 'function') {
                        window.BobbyCart.updateCartDisplay();
                    }
                    if (typeof window.BobbyCart.updateCartCount === 'function') {
                        window.BobbyCart.updateCartCount();
                    }
                }
                
                // Update cartManager
                if (window.cartManager) {
                    window.cartManager.items = items;
                    if (typeof window.cartManager.updateCartDisplay === 'function') {
                        window.cartManager.updateCartDisplay();
                    }
                    if (typeof window.cartManager.updateCartCount === 'function') {
                        window.cartManager.updateCartCount();
                    }
                }
                
                // Update UI cart counts
                const cartCounts = document.querySelectorAll('.cart-count');
                if (cartCounts.length > 0) {
                    const count = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
                    cartCounts.forEach(element => {
                        element.textContent = count.toString();
                        element.style.display = count > 0 ? 'flex' : 'none';
                    });
                }
                
                console.log('✅ Updated all cart systems with', items.length, 'items');
            } catch (error) {
                console.error('Error updating cart systems:', error);
            }
        },
        
        // Force synchronization of all cart data
        syncCart: function() {
            const currentCart = this.getCurrentCart();
            this.saveCart(currentCart);
            this.updateAllCartSystems(currentCart);
        }
    };
    
    // Auto-save cart data periodically
    function startAutoSave() {
        setInterval(() => {
            const currentCart = window.CartPersistenceManager.getCurrentCart();
            if (currentCart.length > 0) {
                window.CartPersistenceManager.saveCart(currentCart);
            }
        }, CONFIG.SAVE_INTERVAL);
    }
    
    // Restore cart on page load
    function restoreCartOnLoad() {
        setTimeout(() => {
            const savedCart = window.CartPersistenceManager.loadCart();
            if (savedCart.length > 0) {
                console.log('🔄 Restoring cart on page load:', savedCart.length, 'items');
                window.CartPersistenceManager.updateAllCartSystems(savedCart);
            }
        }, 500); // Small delay to ensure cart systems are loaded
    }
    
    // Listen for page unload to save cart
    window.addEventListener('beforeunload', function() {
        const currentCart = window.CartPersistenceManager.getCurrentCart();
        window.CartPersistenceManager.saveCart(currentCart);
        console.log('💾 Cart saved before page unload');
    });
    
    // Listen for page visibility changes
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            // Page is being hidden, save cart
            const currentCart = window.CartPersistenceManager.getCurrentCart();
            window.CartPersistenceManager.saveCart(currentCart);
        } else {
            // Page is visible again, restore cart
            setTimeout(() => {
                const savedCart = window.CartPersistenceManager.loadCart();
                if (savedCart.length > 0) {
                    window.CartPersistenceManager.updateAllCartSystems(savedCart);
                }
            }, 100);
        }
    });
    
    // Listen for storage changes (for cross-tab synchronization)
    window.addEventListener('storage', function(e) {
        if (e.key === CONFIG.CART_KEY && e.newValue) {
            try {
                const newCart = JSON.parse(e.newValue);
                window.CartPersistenceManager.updateAllCartSystems(newCart);
                console.log('🔄 Cart synchronized from another tab');
            } catch (error) {
                console.error('Error synchronizing cart from storage:', error);
            }
        }
    });
    
    // Listen for checkout events
    document.addEventListener('click', function(event) {
        const target = event.target;
        
        // Check if it's a checkout button
        if (target.classList.contains('checkout-btn') || 
            target.closest('.checkout-btn') ||
            target.hasAttribute('data-checkout-action') ||
            (target.tagName === 'BUTTON' && target.textContent.toLowerCase().includes('checkout'))) {
            
            console.log('🛒 Checkout detected - saving cart state');
            
            // Save current cart state
            const currentCart = window.CartPersistenceManager.getCurrentCart();
            window.CartPersistenceManager.saveCart(currentCart);
            
            // Set checkout flag
            localStorage.setItem(CONFIG.CHECKOUT_FLAG_KEY, Date.now().toString());
        }
    }, true);
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            restoreCartOnLoad();
            startAutoSave();
        });
    } else {
        restoreCartOnLoad();
        startAutoSave();
    }
    
    // Also initialize after a short delay to catch late-loading cart systems
    setTimeout(() => {
        restoreCartOnLoad();
        startAutoSave();
    }, 2000);
    
    console.log('✅ Universal Cart Persistence Ready');
})();