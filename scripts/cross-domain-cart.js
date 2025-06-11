/**
 * Cross-Domain Cart Persistence System
 * 
 * This script ensures cart items are preserved when navigating between domains during checkout.
 * It specifically handles the bobbytherabbit.com to mfdkk3-7g.myshopify.com transition.
 */

const CrossDomainCart = {
    // Constants
    CART_BACKUP_KEY: 'bobby-cart-cross-domain-backup',
    CHECKOUT_TIME_KEY: 'bobby-checkout-timestamp',
    CHECKOUT_REFERRER_KEY: 'bobby-checkout-referrer',
    DOMAIN_SHOPIFY: 'mfdkk3-7g.myshopify.com',
    
    /**
     * Initialize the cross-domain cart system
     */
    init: function() {
        console.log('🔄 Initializing Cross-Domain Cart System');
        
        // Check if we need to restore the cart
        this.checkAndRestoreCart();
        
        // Set up hooks for future checkouts
        this.setupCheckoutHooks();
        
        console.log('✅ Cross-Domain Cart System initialized');
    },
    
    /**
     * Create a robust backup of cart before checkout
     */
    backupCart: function() {
        console.log('📦 Creating cross-domain cart backup');
        
        try {
            // Get cart items from various possible sources
            let cartItems = null;
            
            // Try cartManager first
            if (window.cartManager && window.cartManager.items) {
                cartItems = window.cartManager.items;
                console.log(`Found ${cartItems.length} items in cartManager`);
            }
            // Then try BobbyCart
            else if (window.BobbyCart && typeof window.BobbyCart.getItems === 'function') {
                cartItems = window.BobbyCart.getItems();
                console.log(`Found ${cartItems.length} items in BobbyCart`);
            }
            
            if (cartItems && cartItems.length > 0) {
                // Store cart data in localStorage for cross-domain persistence
                localStorage.setItem(this.CART_BACKUP_KEY, JSON.stringify(cartItems));
                
                // Store checkout timestamp for expiration checking
                localStorage.setItem(this.CHECKOUT_TIME_KEY, Date.now().toString());
                
                // Store current URL as referrer
                localStorage.setItem(this.CHECKOUT_REFERRER_KEY, window.location.href);
                
                console.log(`✅ Successfully backed up ${cartItems.length} items to localStorage`);
                return true;
            } else {
                console.log('⚠️ No cart items found to back up');
                return false;
            }
        } catch (error) {
            console.error('❌ Error backing up cart:', error);
            return false;
        }
    },
    
    /**
     * Check if we're returning from checkout and restore cart if needed
     */
    checkAndRestoreCart: function() {
        console.log('🔍 Checking if returning from checkout');
        
        try {
            // Get document referrer - this will tell us if we're coming from Shopify
            const referrer = document.referrer;
            console.log('📎 Current referrer:', referrer);
            
            // Check if referrer contains Shopify domain
            const isFromShopify = referrer && referrer.includes(this.DOMAIN_SHOPIFY);
            
            // Get the stored checkout timestamp
            const checkoutTime = localStorage.getItem(this.CHECKOUT_TIME_KEY);
            
            // If we're coming from Shopify OR we have a recent checkout time
            if (isFromShopify || (checkoutTime && (Date.now() - parseInt(checkoutTime)) < 3600000)) {
                console.log('🔄 Detected return from checkout!');
                
                // Get the backed up cart
                const cartBackup = localStorage.getItem(this.CART_BACKUP_KEY);
                
                if (cartBackup) {
                    const cartItems = JSON.parse(cartBackup);
                    console.log(`📦 Found backup with ${cartItems.length} items`);
                    
                    // Restore the cart to the current cart system
                    this.restoreCartItems(cartItems);
                    
                    // Clear the checkout timestamp to prevent multiple restorations
                    localStorage.removeItem(this.CHECKOUT_TIME_KEY);
                    
                    return true;
                } else {
                    console.log('⚠️ No cart backup found');
                }
            } else {
                console.log('ℹ️ Not returning from checkout, no restoration needed');
            }
            
            return false;
        } catch (error) {
            console.error('❌ Error checking/restoring cart:', error);
            return false;
        }
    },
    
    /**
     * Restore cart items to the active cart system
     */
    restoreCartItems: function(items) {
        if (!items || items.length === 0) {
            console.log('⚠️ No items to restore');
            return false;
        }
        
        console.log(`🔄 Restoring ${items.length} items to cart`);
        
        try {
            // Try to restore to CartManager
            if (window.cartManager) {
                console.log('🛒 Restoring to CartManager');
                
                // If the cart already has items, we don't want to add duplicates
                // So we'll clear it first and then restore everything
                window.cartManager.items = [];
                
                // Add all items from backup
                items.forEach(item => {
                    window.cartManager.items.push(item);
                });
                
                // Update cart UI
                window.cartManager.saveCartToStorage();
                window.cartManager.updateCartDisplay();
                window.cartManager.updateCartCount();
                
                console.log('✅ Successfully restored to CartManager');
                return true;
            }
            // Try to restore to BobbyCart
            else if (window.BobbyCart) {
                console.log('🛒 Restoring to BobbyCart');
                
                // Clear current cart first to avoid duplicates
                if (typeof window.BobbyCart.clearCart === 'function') {
                    window.BobbyCart.clearCart();
                }
                
                // If BobbyCart has a restoreItems method, use it
                if (typeof window.BobbyCart.restoreItems === 'function') {
                    window.BobbyCart.restoreItems(items);
                    console.log('✅ Successfully restored to BobbyCart via restoreItems');
                    return true;
                }
                // Otherwise try to add items individually
                else if (typeof window.BobbyCart.addItem === 'function') {
                    items.forEach(item => {
                        window.BobbyCart.addItem(item, {
                            quantity: item.quantity,
                            color: item.color,
                            size: item.size
                        });
                    });
                    console.log('✅ Successfully restored to BobbyCart via addItem');
                    return true;
                }
            }
            
            console.log('⚠️ No compatible cart system found for restoration');
            return false;
        } catch (error) {
            console.error('❌ Error restoring cart items:', error);
            return false;
        }
    },
    
    /**
     * Set up hooks to intercept checkout processes
     */
    setupCheckoutHooks: function() {
        console.log('🔄 Setting up checkout hooks');
        
        // Hook into the checkout process
        this.interceptCheckoutMethods();
        
        // Also add a window beforeunload listener to detect navigations
        window.addEventListener('beforeunload', (event) => {
            // If we're about to go to checkout, backup the cart
            if (window.location.href.includes('checkout') || 
                document.activeElement?.classList?.contains('checkout-btn')) {
                this.backupCart();
            }
        });
    },
    
    /**
     * Intercept all known checkout methods to backup cart
     */
    interceptCheckoutMethods: function() {
        // Intercept CartManager checkout
        if (window.cartManager) {
            // Store original methods
            const originalInitiateShopify = window.cartManager.initiateShopifyCheckout;
            const originalProceedToCheckout = window.cartManager.proceedToCheckout;
            
            // Override with our version
            window.cartManager.initiateShopifyCheckout = async function() {
                // Backup cart before proceeding
                CrossDomainCart.backupCart();
                
                // Call original method
                return await originalInitiateShopify.apply(this, arguments);
            };
            
            window.cartManager.proceedToCheckout = function() {
                // Backup cart before proceeding
                CrossDomainCart.backupCart();
                
                // Call original method
                return originalProceedToCheckout.apply(this, arguments);
            };
        }
        
        // Intercept BobbyCheckoutStorefront
        if (window.BobbyCheckoutStorefront) {
            // Store original methods
            const originalProcessCheckout = window.BobbyCheckoutStorefront.processCheckout;
            
            // Override with our version
            window.BobbyCheckoutStorefront.processCheckout = async function() {
                // Backup cart before proceeding
                CrossDomainCart.backupCart();
                
                // Call original method
                return await originalProcessCheckout.apply(this, arguments);
            };
        }
        
        // Hook BobbyCart if available
        if (window.BobbyCart) {
            // Store original method
            const originalProceedToCheckout = window.BobbyCart.proceedToCheckout;
            
            // Override checkout method
            window.BobbyCart.proceedToCheckout = function() {
                // Backup cart before proceeding
                CrossDomainCart.backupCart();
                
                // Call original method
                return originalProceedToCheckout.apply(this, arguments);
            };
        }
        
        // Get all checkout buttons on the page
        const checkoutButtons = document.querySelectorAll('.checkout-btn, [data-checkout-action]');
        if (checkoutButtons.length > 0) {
            checkoutButtons.forEach(button => {
                button.addEventListener('click', () => {
                    CrossDomainCart.backupCart();
                });
            });
        }
    }
};

// Initialize when the DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Delay slightly to ensure other cart systems are loaded first
    setTimeout(function() {
        CrossDomainCart.init();
    }, 500);
});

// Also initialize immediately if the page is already loaded
if (document.readyState === 'interactive' || document.readyState === 'complete') {
    setTimeout(function() {
        CrossDomainCart.init();
    }, 500);
}