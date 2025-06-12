/**
 * Back Button Cart Restore
 * 
 * Specifically handles cart restoration when users return from Shopify checkout
 * using the browser back button. This ensures a seamless user experience.
 */

(function() {
    console.log('🔙 Back Button Cart Restore Loading');
    
    // Key for storing cart backup before checkout
    const CART_BACKUP_KEY = 'bobby-cart-backup';
    const CHECKOUT_FLAG_KEY = 'bobby-checkout-initiated';
    const CART_KEY = 'bobby-cart-items'; // Updated to match simple-cart-system.js
    
    // Function to backup cart before checkout
    function backupCartForCheckout() {
        try {
            const cartData = localStorage.getItem(CART_KEY);
            if (cartData && cartData !== '[]') {
                localStorage.setItem(CART_BACKUP_KEY, cartData);
                localStorage.setItem(CHECKOUT_FLAG_KEY, Date.now().toString());
                console.log('💾 Cart backed up before checkout:', cartData.length, 'chars');
                return true;
            }
        } catch (error) {
            console.error('Error backing up cart:', error);
        }
        return false;
    }
    
    // Function to restore cart when returning from checkout
    function restoreCartFromBackup() {
        try {
            const backupData = localStorage.getItem(CART_BACKUP_KEY);
            const checkoutFlag = localStorage.getItem(CHECKOUT_FLAG_KEY);
            
            if (backupData && checkoutFlag) {
                // Check if we're returning from checkout (within reasonable time)
                const checkoutTime = parseInt(checkoutFlag);
                const now = Date.now();
                const timeDiff = now - checkoutTime;
                
                // If checkout was initiated within last 30 minutes, restore cart
                if (timeDiff < 30 * 60 * 1000) {
                    console.log('🔄 Restoring cart from backup (returned from checkout)');
                    
                    // Restore to localStorage
                    localStorage.setItem(CART_KEY, backupData);
                    
                    // Update cart systems
                    updateCartSystems(backupData);
                    
                    // Clean up backup (but keep for a bit longer in case of multiple back/forward)
                    setTimeout(() => {
                        localStorage.removeItem(CART_BACKUP_KEY);
                        localStorage.removeItem(CHECKOUT_FLAG_KEY);
                    }, 5000);
                    
                    return true;
                }
            }
        } catch (error) {
            console.error('Error restoring cart from backup:', error);
        }
        return false;
    }
    
    // Function to update all cart systems with restored data
    function updateCartSystems(cartData) {
        try {
            const items = JSON.parse(cartData);
            
            // Update BobbyCart if available
            if (window.BobbyCart) {
                window.BobbyCart.items = items;
                if (typeof window.BobbyCart.updateCartDisplay === 'function') {
                    window.BobbyCart.updateCartDisplay();
                }
                if (typeof window.BobbyCart.updateCartCount === 'function') {
                    window.BobbyCart.updateCartCount();
                }
            }
            
            // Update cartManager if available
            if (window.cartManager) {
                window.cartManager.items = items;
                if (typeof window.cartManager.updateCartDisplay === 'function') {
                    window.cartManager.updateCartDisplay();
                }
                if (typeof window.cartManager.updateCartCount === 'function') {
                    window.cartManager.updateCartCount();
                }
            }
            
            // Update cart count in UI
            const cartCounts = document.querySelectorAll('.cart-count');
            if (cartCounts.length > 0) {
                const count = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
                cartCounts.forEach(element => {
                    element.textContent = count.toString();
                    element.style.display = count > 0 ? 'flex' : 'none';
                });
            }
            
            console.log('✅ Cart systems updated with', items.length, 'items');
        } catch (error) {
            console.error('Error updating cart systems:', error);
        }
    }
    
    // Check if we're returning from checkout on page load
    function checkForCheckoutReturn() {
        // Check referrer
        const referrer = document.referrer;
        const isFromShopify = referrer && referrer.includes('myshopify.com');
        
        // Check if we have a checkout flag
        const checkoutFlag = localStorage.getItem(CHECKOUT_FLAG_KEY);
        
        if (isFromShopify || checkoutFlag) {
            console.log('🔍 Detected return from checkout, attempting restoration');
            
            // Small delay to ensure cart systems are loaded
            setTimeout(() => {
                if (restoreCartFromBackup()) {
                    console.log('✅ Successfully restored cart from checkout return');
                } else {
                    console.log('ℹ️ No cart backup found or expired');
                }
            }, 500);
        }
    }
    
    // Listen for checkout button clicks to backup cart
    document.addEventListener('click', function(event) {
        const target = event.target;
        
        // Check if it's a checkout button
        if (target.classList.contains('checkout-btn') || 
            target.closest('.checkout-btn') ||
            target.hasAttribute('data-checkout-action') ||
            (target.tagName === 'BUTTON' && target.textContent.toLowerCase().includes('checkout'))) {
            
            console.log('🛒 Checkout button clicked - backing up cart');
            backupCartForCheckout();
        }
    }, true);
    
    // Listen for popstate events (back/forward button)
    window.addEventListener('popstate', function() {
        console.log('🔙 Popstate detected - checking for cart restoration');
        setTimeout(() => {
            const currentCart = localStorage.getItem(CART_KEY);
            if (!currentCart || currentCart === '[]') {
                restoreCartFromBackup();
            }
        }, 100);
    });
    
    // Listen for page visibility changes (when returning to tab)
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            setTimeout(() => {
                const currentCart = localStorage.getItem(CART_KEY);
                if (!currentCart || currentCart === '[]') {
                    restoreCartFromBackup();
                }
            }, 100);
        }
    });
    
    // Check on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkForCheckoutReturn);
    } else {
        checkForCheckoutReturn();
    }
    
    console.log('✅ Back Button Cart Restore Ready');
})();