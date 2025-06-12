/**
 * Simple Cart Fix
 * 
 * A direct, simple approach to prevent cart clearing during checkout.
 * This script focuses on the core issue without complex interception.
 */

(function() {
    console.log('🔧 Simple Cart Fix Loading');
    
    // Store cart data before any potential clearing
    let cartBackup = null;
    
    // Function to backup cart
    function backupCart() {
        try {
            const cartData = localStorage.getItem('bobby-cart-items');
            if (cartData && cartData !== '[]') {
                cartBackup = cartData;
                console.log('📦 Cart backed up:', cartData.length, 'chars');
            }
        } catch (error) {
            console.error('Error backing up cart:', error);
        }
    }
    
    // Function to restore cart if it was cleared
    function restoreCartIfNeeded() {
        try {
            const currentCart = localStorage.getItem('bobby-cart-items');
            
            // If cart is empty but we have a backup, restore it
            if ((!currentCart || currentCart === '[]') && cartBackup && cartBackup !== '[]') {
                console.log('🔄 Restoring cart from backup');
                localStorage.setItem('bobby-cart-items', cartBackup);
                
                // Also update cart manager if available
                if (window.cartManager) {
                    try {
                        window.cartManager.items = JSON.parse(cartBackup);
                        if (typeof window.cartManager.updateCartDisplay === 'function') {
                            window.cartManager.updateCartDisplay();
                        }
                        if (typeof window.cartManager.updateCartCount === 'function') {
                            window.cartManager.updateCartCount();
                        }
                    } catch (e) {
                        console.error('Error updating cart manager:', e);
                    }
                }
                
                // Update cart count in UI
                const cartCounts = document.querySelectorAll('.cart-count');
                if (cartCounts.length > 0 && cartBackup) {
                    try {
                        const items = JSON.parse(cartBackup);
                        const count = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
                        cartCounts.forEach(element => {
                            element.textContent = count.toString();
                            element.style.display = count > 0 ? 'flex' : 'none';
                        });
                    } catch (e) {
                        console.error('Error updating cart count:', e);
                    }
                }
                
                return true;
            }
        } catch (error) {
            console.error('Error restoring cart:', error);
        }
        return false;
    }
    
    // Backup cart periodically
    setInterval(backupCart, 1000);
    
    // Watch for checkout button clicks
    document.addEventListener('click', function(event) {
        // Check if it's a checkout button
        if (event.target.classList.contains('checkout-btn') || 
            event.target.closest('.checkout-btn') ||
            event.target.hasAttribute('data-checkout-action') ||
            (event.target.tagName === 'BUTTON' && event.target.textContent.toLowerCase().includes('checkout'))) {
            
            console.log('🛒 Checkout button detected - backing up cart');
            backupCart();
            
            // Set a flag to indicate checkout is happening
            localStorage.setItem('checkout-in-progress', 'true');
            
            // Check for cart restoration after a short delay
            setTimeout(() => {
                if (restoreCartIfNeeded()) {
                    console.log('✅ Cart was restored after checkout click');
                }
            }, 100);
            
            // Also check after a longer delay
            setTimeout(() => {
                if (restoreCartIfNeeded()) {
                    console.log('✅ Cart was restored after longer delay');
                }
            }, 500);
        }
    }, true);
    
    // Watch for page visibility changes (back button)
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            setTimeout(() => {
                if (restoreCartIfNeeded()) {
                    console.log('✅ Cart restored on page visibility change');
                }
            }, 100);
        }
    });
    
    // Watch for popstate events (back button)
    window.addEventListener('popstate', function() {
        setTimeout(() => {
            if (restoreCartIfNeeded()) {
                console.log('✅ Cart restored on popstate');
            }
        }, 100);
    });
    
    // Initial backup
    setTimeout(backupCart, 500);
    
    console.log('✅ Simple Cart Fix Ready');
})();