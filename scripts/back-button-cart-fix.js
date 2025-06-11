/**
 * Back Button Cart Fix
 * 
 * This script specifically addresses the issue of cart items disappearing when:
 * 1. User adds items to cart on bobbytherabbit.com
 * 2. User clicks checkout and goes to Shopify checkout
 * 3. User clicks back button to return to bobbytherabbit.com
 * 
 * The solution uses a combination of localStorage backup and 
 * browser history state detection to ensure cart persistence.
 */

(function() {
    console.log('🔄 Initializing Back Button Cart Fix');
    
    // Constants
    const CART_BACKUP_KEY = 'bobby-cart-backup-data';
    const CHECKOUT_FLAG_KEY = 'bobby-checkout-in-progress';
    
    // Force this script to run early
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBackButtonFix);
    } else {
        initBackButtonFix();
    }
    
    /**
     * Initialize the back button fix
     */
    function initBackButtonFix() {
        // Check if we need to restore the cart (do this immediately)
        checkAndRestoreCart();
        
        // Set up event listeners
        setupEventListeners();
        
        // Set up a backup interval to periodically save cart state
        setInterval(backupCurrentCart, 5000);
        
        console.log('✅ Back Button Cart Fix initialized');
    }
    
    /**
     * Check if we're returning via back button and restore cart if needed
     */
    function checkAndRestoreCart() {
        console.log('🔍 Checking if cart restoration is needed');
        
        // Check if we're coming back from checkout
        const checkoutFlag = localStorage.getItem(CHECKOUT_FLAG_KEY);
        if (checkoutFlag === 'true' && performance.navigation && performance.navigation.type === 2) {
            console.log('🔄 Back button detected - attempting cart restoration');
            restoreCartFromBackup();
            localStorage.removeItem(CHECKOUT_FLAG_KEY);
        } else {
            // Also check if document.referrer includes Shopify domain
            const referrer = document.referrer || '';
            if (referrer.includes('myshopify.com') || referrer.includes('checkout')) {
                console.log('🔄 Return from Shopify detected - attempting cart restoration');
                restoreCartFromBackup();
                localStorage.removeItem(CHECKOUT_FLAG_KEY);
            }
        }
    }
    
    /**
     * Set up all event listeners for cart backup and restoration
     */
    function setupEventListeners() {
        // Watch for all checkout button clicks
        document.addEventListener('click', function(event) {
            // Check if the clicked element is a checkout button
            if (event.target.closest('.checkout-btn, [data-checkout-action]')) {
                console.log('🛒 Checkout button clicked - backing up cart');
                backupCurrentCart();
                localStorage.setItem(CHECKOUT_FLAG_KEY, 'true');
            }
        }, true);
        
        // Watch for history changes (like back button)
        window.addEventListener('popstate', function(event) {
            console.log('🔄 History state changed - checking for cart restoration need');
            checkAndRestoreCart();
        });
        
        // Additional safety: intercept form submissions that might be checkout forms
        document.addEventListener('submit', function(event) {
            const form = event.target;
            if (form.action && (form.action.includes('checkout') || form.action.includes('cart'))) {
                console.log('🛒 Checkout form submission detected - backing up cart');
                backupCurrentCart();
                localStorage.setItem(CHECKOUT_FLAG_KEY, 'true');
            }
        }, true);
    }
    
    /**
     * Backup the current cart to localStorage
     */
    function backupCurrentCart() {
        try {
            // Get cart data from available sources
            let cartItems = null;
            
            // Try cartManager
            if (window.cartManager && window.cartManager.items) {
                cartItems = window.cartManager.items;
            }
            // Try BobbyCart
            else if (window.BobbyCart && typeof window.BobbyCart.getItems === 'function') {
                cartItems = window.BobbyCart.getItems();
            }
            // Try global cart variable
            else if (window.cart && window.cart.items) {
                cartItems = window.cart.items;
            }
            
            // Only backup if we found cart items
            if (cartItems && cartItems.length > 0) {
                localStorage.setItem(CART_BACKUP_KEY, JSON.stringify(cartItems));
                console.log(`📦 Backed up ${cartItems.length} cart items to localStorage`);
                return true;
            }
        } catch (error) {
            console.error('❌ Error backing up cart:', error);
        }
        return false;
    }
    
    /**
     * Restore cart from localStorage backup
     */
    function restoreCartFromBackup() {
        try {
            const backupData = localStorage.getItem(CART_BACKUP_KEY);
            if (!backupData) {
                console.log('⚠️ No cart backup found in localStorage');
                return false;
            }
            
            const cartItems = JSON.parse(backupData);
            if (!cartItems || !cartItems.length) {
                console.log('⚠️ Backup exists but contains no items');
                return false;
            }
            
            console.log(`🔄 Restoring ${cartItems.length} items to cart from backup`);
            
            // First attempt: CartManager
            if (window.cartManager) {
                // Replace the items array with our backup
                window.cartManager.items = cartItems;
                
                // Update the UI
                if (typeof window.cartManager.updateCartDisplay === 'function') {
                    window.cartManager.updateCartDisplay();
                }
                if (typeof window.cartManager.updateCartCount === 'function') {
                    window.cartManager.updateCartCount();
                }
                if (typeof window.cartManager.saveCartToStorage === 'function') {
                    window.cartManager.saveCartToStorage();
                }
                
                console.log('✅ Cart restored via CartManager');
                
                // Force refresh cart count display
                const cartCountElements = document.querySelectorAll('.cart-count');
                if (cartCountElements.length > 0) {
                    const itemCount = cartItems.reduce((total, item) => total + (item.quantity || 1), 0);
                    cartCountElements.forEach(element => {
                        element.textContent = itemCount.toString();
                        element.style.display = itemCount > 0 ? 'flex' : 'none';
                    });
                }
                
                return true;
            }
            
            // Second attempt: BobbyCart
            if (window.BobbyCart) {
                // Use BobbyCart's method to restore if available
                if (typeof window.BobbyCart.restoreItems === 'function') {
                    window.BobbyCart.restoreItems(cartItems);
                    console.log('✅ Cart restored via BobbyCart.restoreItems()');
                    return true;
                }
                
                // Or manually restore the items
                if (typeof window.BobbyCart.addItem === 'function') {
                    // Clear current cart first
                    if (typeof window.BobbyCart.clearCart === 'function') {
                        window.BobbyCart.clearCart();
                    }
                    
                    // Add each item
                    cartItems.forEach(item => {
                        window.BobbyCart.addItem(item, {
                            quantity: item.quantity,
                            color: item.color,
                            size: item.size
                        });
                    });
                    
                    console.log('✅ Cart restored via BobbyCart.addItem()');
                    return true;
                }
            }
            
            // Third attempt: Modify localStorage directly
            localStorage.setItem('bobby-streetwear-cart', JSON.stringify(cartItems));
            console.log('✅ Cart restored via direct localStorage manipulation');
            
            // Show notification about cart restoration
            if (document.querySelector('.cart-count')) {
                const itemCount = cartItems.reduce((total, item) => total + (item.quantity || 1), 0);
                const cartCountElements = document.querySelectorAll('.cart-count');
                cartCountElements.forEach(element => {
                    element.textContent = itemCount.toString();
                    element.style.display = itemCount > 0 ? 'flex' : 'none';
                });
            }
            
            // Force page reload if nothing else worked and it's been 3+ seconds since page load
            if (document.readyState === 'complete' && performance.now() > 3000) {
                console.log('🔄 Forcing page reload to refresh cart state');
                window.location.reload();
            }
            
            return true;
        } catch (error) {
            console.error('❌ Error restoring cart:', error);
            return false;
        }
    }
    
    // Immediately back up the current cart when this script loads
    backupCurrentCart();
    
    // Make functions globally available
    window.BobbyBackButtonFix = {
        backupCart: backupCurrentCart,
        restoreCart: restoreCartFromBackup,
        checkAndRestore: checkAndRestoreCart
    };
})();