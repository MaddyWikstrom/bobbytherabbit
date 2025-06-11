/**
 * Cart Persistence System
 * 
 * This script ensures cart items are preserved when navigating back from checkout
 * until an order is actually completed.
 */

const CartPersistenceSystem = {
    // Keys for storage
    BACKUP_KEY: 'bobby-cart-backup',
    CHECKOUT_FLAG_KEY: 'bobby-checkout-in-progress',
    
    /**
     * Backup the current cart before checkout
     */
    backupCart: function() {
        console.log('🛒 Backing up cart before checkout');
        try {
            // Store cart items in sessionStorage
            if (window.cartManager && window.cartManager.items) {
                const cartData = JSON.stringify(window.cartManager.items);
                sessionStorage.setItem(this.BACKUP_KEY, cartData);
                console.log('✅ Cart backup created with', window.cartManager.items.length, 'items');
            } else if (window.BobbyCart && typeof window.BobbyCart.getItems === 'function') {
                const items = window.BobbyCart.getItems();
                const cartData = JSON.stringify(items);
                sessionStorage.setItem(this.BACKUP_KEY, cartData);
                console.log('✅ Cart backup created with', items.length, 'items');
            }
            
            // Set flag indicating checkout is in progress
            sessionStorage.setItem(this.CHECKOUT_FLAG_KEY, 'true');
        } catch (error) {
            console.error('❌ Error backing up cart:', error);
        }
    },
    
    /**
     * Restore cart from backup if available
     */
    restoreCartIfNeeded: function() {
        console.log('🔍 Checking for cart backup');
        try {
            // Check if we're returning from checkout
            const inCheckout = sessionStorage.getItem(this.CHECKOUT_FLAG_KEY);
            if (inCheckout === 'true') {
                console.log('🔄 Returning from checkout, restoring cart');
                
                // Get backup data
                const backupData = sessionStorage.getItem(this.BACKUP_KEY);
                if (backupData) {
                    const cartItems = JSON.parse(backupData);
                    console.log('📦 Found backup with', cartItems.length, 'items');
                    
                    // Restore to cart manager
                    if (window.cartManager) {
                        console.log('🔄 Restoring to cartManager');
                        window.cartManager.items = cartItems;
                        window.cartManager.updateCartDisplay();
                        window.cartManager.updateCartCount();
                        window.cartManager.saveCartToStorage();
                    }
                    
                    // Restore to BobbyCart if available
                    if (window.BobbyCart && typeof window.BobbyCart.restoreItems === 'function') {
                        console.log('🔄 Restoring to BobbyCart');
                        window.BobbyCart.restoreItems(cartItems);
                    }
                    
                    // Clear checkout flag since we've handled it
                    sessionStorage.removeItem(this.CHECKOUT_FLAG_KEY);
                } else {
                    console.log('⚠️ No cart backup found to restore');
                }
            } else {
                console.log('ℹ️ Not returning from checkout, no restoration needed');
            }
        } catch (error) {
            console.error('❌ Error restoring cart:', error);
        }
    },
    
    /**
     * Clear cart backup when order is actually completed
     */
    clearBackup: function() {
        console.log('🗑️ Clearing cart backup - order completed');
        sessionStorage.removeItem(this.BACKUP_KEY);
        sessionStorage.removeItem(this.CHECKOUT_FLAG_KEY);
    },
    
    /**
     * Hook into the checkout process
     */
    setupCheckoutHooks: function() {
        console.log('🔄 Setting up cart persistence hooks');
        
        // Override cart.js checkout
        if (window.cartManager) {
            console.log('🔗 Hooking cartManager checkout methods');
            
            // Store original methods
            const originalInitiateShopify = window.cartManager.initiateShopifyCheckout;
            
            // Override with our version that backs up the cart
            window.cartManager.initiateShopifyCheckout = async function() {
                // Backup cart before proceeding
                CartPersistenceSystem.backupCart();
                
                // Call original method
                return await originalInitiateShopify.apply(this, arguments);
            };
            
            // Add restore method
            window.cartManager.restoreCartFromBackup = function() {
                CartPersistenceSystem.restoreCartIfNeeded();
            };
        }
        
        // Override BobbyCheckoutStorefront
        if (window.BobbyCheckoutStorefront) {
            console.log('🔗 Hooking BobbyCheckoutStorefront methods');
            
            // Store original methods
            const originalProcessCheckout = window.BobbyCheckoutStorefront.processCheckout;
            
            // Override with our version
            window.BobbyCheckoutStorefront.processCheckout = async function() {
                // Backup cart before proceeding
                CartPersistenceSystem.backupCart();
                
                // Call original method
                return await originalProcessCheckout.apply(this, arguments);
            };
        }
        
        // Hook BobbyCart if available
        if (window.BobbyCart) {
            console.log('🔗 Hooking BobbyCart methods');
            
            // Store original method
            const originalProceedToCheckout = window.BobbyCart.proceedToCheckout;
            
            // Add restore method if not exists
            if (typeof window.BobbyCart.restoreItems !== 'function') {
                window.BobbyCart.restoreItems = function(items) {
                    // Implementation depends on BobbyCart structure
                    console.log('Restoring', items.length, 'items to BobbyCart');
                    
                    // Simple implementation - would need to be adapted to actual BobbyCart
                    this.items = items;
                    this.saveCart();
                    this.updateCartUI();
                };
            }
            
            // Override checkout method
            window.BobbyCart.proceedToCheckout = function() {
                // Backup cart before proceeding
                CartPersistenceSystem.backupCart();
                
                // Call original method
                return originalProceedToCheckout.apply(this, arguments);
            };
        }
        
        console.log('✅ Cart persistence hooks configured');
    },
    
    /**
     * Initialize the cart persistence system
     */
    init: function() {
        console.log('🚀 Initializing Cart Persistence System');
        
        // First, check if we need to restore the cart
        this.restoreCartIfNeeded();
        
        // Then, set up hooks for future checkouts
        this.setupCheckoutHooks();
        
        console.log('✅ Cart Persistence System initialized');
    }
};

// Initialize when the DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Delay slightly to ensure other cart systems are loaded first
    setTimeout(function() {
        CartPersistenceSystem.init();
    }, 500);
});

// Also initialize immediately if the page is already loaded
if (document.readyState === 'interactive' || document.readyState === 'complete') {
    setTimeout(function() {
        CartPersistenceSystem.init();
    }, 500);
}