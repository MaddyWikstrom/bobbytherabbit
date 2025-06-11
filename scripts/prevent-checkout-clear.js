/**
 * Prevent Checkout Clear
 * 
 * This script prevents the cart from being cleared when the checkout button is clicked.
 * It intercepts the checkout process to make sure the cart remains intact.
 */

(function() {
    // Execute immediately to ensure we catch all checkout events
    console.log('🛡️ Initializing Prevent Checkout Clear');
    
    // Store original localStorage methods
    const originalSetItem = localStorage.setItem;
    const originalRemoveItem = localStorage.removeItem;
    const originalClear = localStorage.clear;
    
    // Cart data keys
    const CART_KEY = 'bobby-streetwear-cart';
    
    // Watch all localStorage operations to prevent cart clearing
    localStorage.setItem = function(key, value) {
        // Check if this is an attempt to clear the cart during checkout
        if (key === CART_KEY && value === '[]' && isCheckoutInProgress()) {
            console.log('🛑 Prevented cart clearing during checkout');
            
            // Get current cart data to preserve it
            const currentCart = localStorage.getItem(CART_KEY);
            
            // Store a backup just in case
            if (currentCart && currentCart !== '[]') {
                localStorage.setItem('bobby-cart-backup', currentCart);
                console.log('📦 Created cart backup');
            }
            
            // Don't actually clear the cart - just pretend we did
            return;
        }
        
        // Otherwise proceed with normal operation
        return originalSetItem.call(localStorage, key, value);
    };
    
    // Also intercept remove item to prevent cart clearing
    localStorage.removeItem = function(key) {
        // Prevent removing the cart data during checkout
        if (key === CART_KEY && isCheckoutInProgress()) {
            console.log('🛑 Prevented cart removal during checkout');
            return;
        }
        
        // Otherwise proceed with normal operation
        return originalRemoveItem.call(localStorage, key);
    };
    
    // Also intercept clear to prevent cart clearing
    localStorage.clear = function() {
        // Backup cart data before clear
        const cartData = localStorage.getItem(CART_KEY);
        
        // Proceed with clear
        const result = originalClear.call(localStorage);
        
        // If we were in checkout and had cart data, restore it
        if (isCheckoutInProgress() && cartData && cartData !== '[]') {
            console.log('🔄 Restored cart data after localStorage clear');
            localStorage.setItem(CART_KEY, cartData);
        }
        
        return result;
    };
    
    // Intercept cart manager methods - this has to be done after the cart manager is loaded
    function interceptCartManager() {
        if (!window.cartManager) {
            // Try again in a moment if cartManager isn't available yet
            setTimeout(interceptCartManager, 100);
            return;
        }
        
        console.log('🔄 Intercepting CartManager methods');
        
        // Store original clearCart method
        const originalClearCart = window.cartManager.clearCart;
        
        // Override clearCart to prevent clearing during checkout
        window.cartManager.clearCart = function() {
            // Check if we're in a checkout process
            if (isCheckoutInProgress()) {
                console.log('🛑 Prevented CartManager.clearCart() during checkout');
                
                // Create a backup of the current cart
                const cartBackup = JSON.stringify(window.cartManager.items);
                if (cartBackup && cartBackup !== '[]') {
                    localStorage.setItem('bobby-cart-backup', cartBackup);
                }
                
                return;
            }
            
            // Not in checkout, proceed with normal clear
            return originalClearCart.apply(this, arguments);
        };
        
        // Intercept initiateShopifyCheckout
        if (typeof window.cartManager.initiateShopifyCheckout === 'function') {
            const originalInitiateShopify = window.cartManager.initiateShopifyCheckout;
            
            window.cartManager.initiateShopifyCheckout = async function() {
                // Mark that we're starting checkout
                startCheckout();
                
                // Backup cart data
                backupCart();
                
                // Call original method but don't allow it to clear the cart
                return await originalInitiateShopify.apply(this, arguments);
            };
        }
        
        // Intercept proceedToCheckout
        if (typeof window.cartManager.proceedToCheckout === 'function') {
            const originalProceedToCheckout = window.cartManager.proceedToCheckout;
            
            window.cartManager.proceedToCheckout = function() {
                // Mark that we're starting checkout
                startCheckout();
                
                // Backup cart data
                backupCart();
                
                // Call original method but don't allow it to clear the cart
                return originalProceedToCheckout.apply(this, arguments);
            };
        }
    }
    
    // Intercept BobbyCheckoutStorefront methods
    function interceptBobbyCheckoutStorefront() {
        if (!window.BobbyCheckoutStorefront) {
            // Try again in a moment if BobbyCheckoutStorefront isn't available yet
            setTimeout(interceptBobbyCheckoutStorefront, 100);
            return;
        }
        
        console.log('🔄 Intercepting BobbyCheckoutStorefront methods');
        
        // Store original processCheckout method
        const originalProcessCheckout = window.BobbyCheckoutStorefront.processCheckout;
        
        // Override processCheckout to prevent clearing during checkout
        window.BobbyCheckoutStorefront.processCheckout = async function() {
            // Mark that we're starting checkout
            startCheckout();
            
            // Backup cart data
            backupCart();
            
            // Call original method
            return await originalProcessCheckout.apply(this, arguments);
        };
    }
    
    // Intercept BobbyCart methods
    function interceptBobbyCart() {
        if (!window.BobbyCart) {
            // Try again in a moment if BobbyCart isn't available yet
            setTimeout(interceptBobbyCart, 100);
            return;
        }
        
        console.log('🔄 Intercepting BobbyCart methods');
        
        // Store original clearCart method
        if (typeof window.BobbyCart.clearCart === 'function') {
            const originalClearCart = window.BobbyCart.clearCart;
            
            // Override clearCart to prevent clearing during checkout
            window.BobbyCart.clearCart = function() {
                // Check if we're in a checkout process
                if (isCheckoutInProgress()) {
                    console.log('🛑 Prevented BobbyCart.clearCart() during checkout');
                    return;
                }
                
                // Not in checkout, proceed with normal clear
                return originalClearCart.apply(this, arguments);
            };
        }
        
        // Intercept proceedToCheckout
        if (typeof window.BobbyCart.proceedToCheckout === 'function') {
            const originalProceedToCheckout = window.BobbyCart.proceedToCheckout;
            
            window.BobbyCart.proceedToCheckout = function() {
                // Mark that we're starting checkout
                startCheckout();
                
                // Backup cart data
                backupCart();
                
                // Call original method but don't allow it to clear the cart
                return originalProceedToCheckout.apply(this, arguments);
            };
        }
    }
    
    // Backup cart data
    function backupCart() {
        // Get cart data from localStorage
        const cartData = localStorage.getItem(CART_KEY);
        
        if (cartData && cartData !== '[]') {
            localStorage.setItem('bobby-cart-backup', cartData);
            console.log('📦 Created cart backup', cartData.length);
        } else {
            console.log('⚠️ No cart data to backup');
        }
    }
    
    // Mark that checkout is starting
    function startCheckout() {
        localStorage.setItem('bobby-checkout-in-progress', 'true');
        localStorage.setItem('bobby-checkout-timestamp', Date.now().toString());
        console.log('🛒 Marked checkout as in progress');
    }
    
    // Check if checkout is in progress
    function isCheckoutInProgress() {
        // Check for direct indicator
        if (localStorage.getItem('bobby-checkout-in-progress') === 'true') {
            return true;
        }
        
        // Check if we're on a checkout page
        if (window.location.href.includes('checkout')) {
            return true;
        }
        
        // Check if a checkout button was recently clicked
        const checkoutTimestamp = localStorage.getItem('bobby-checkout-timestamp');
        if (checkoutTimestamp) {
            const elapsed = Date.now() - parseInt(checkoutTimestamp);
            // Consider checkout in progress if clicked in the last 10 seconds
            if (elapsed < 10000) {
                return true;
            }
        }
        
        // Check if there's a focused checkout button (about to be clicked)
        if (document.activeElement && 
            (document.activeElement.classList.contains('checkout-btn') || 
             document.activeElement.hasAttribute('data-checkout-action'))) {
            return true;
        }
        
        return false;
    }
    
    // Watch for checkout buttons
    function watchCheckoutButtons() {
        document.addEventListener('click', function(event) {
            const checkoutButton = event.target.closest('.checkout-btn, [data-checkout-action]');
            if (checkoutButton) {
                console.log('🛒 Checkout button clicked');
                startCheckout();
                backupCart();
            }
        }, true);
    }
    
    // Restore cart if needed
    function restoreCartIfNeeded() {
        const cartData = localStorage.getItem(CART_KEY);
        const backupData = localStorage.getItem('bobby-cart-backup');
        
        // If cart is empty but we have a backup, restore it
        if ((!cartData || cartData === '[]') && backupData && backupData !== '[]') {
            localStorage.setItem(CART_KEY, backupData);
            console.log('🔄 Restored cart from backup');
            
            // Also restore to cartManager if available
            if (window.cartManager && window.cartManager.items) {
                window.cartManager.items = JSON.parse(backupData);
                if (typeof window.cartManager.updateCartDisplay === 'function') {
                    window.cartManager.updateCartDisplay();
                }
                if (typeof window.cartManager.updateCartCount === 'function') {
                    window.cartManager.updateCartCount();
                }
                console.log('🔄 Restored cart to CartManager');
            }
        }
    }
    
    // Initialize everything
    function initialize() {
        watchCheckoutButtons();
        interceptCartManager();
        interceptBobbyCheckoutStorefront();
        interceptBobbyCart();
        restoreCartIfNeeded();
        
        // Watch for page visibility changes (might indicate back button)
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden) {
                restoreCartIfNeeded();
            }
        });
        
        console.log('✅ Prevent Checkout Clear initialized');
    }
    
    // Initialize on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();