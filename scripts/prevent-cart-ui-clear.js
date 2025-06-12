/**
 * Prevent Cart UI Clear
 * 
 * This script specifically targets the visual clearing of the cart UI that happens
 * immediately after clicking checkout but before redirect to Shopify.
 */

(function() {
    console.log('🖥️ Initializing Prevent Cart UI Clear');
    
    // Original cart UI elements and state
    let originalCartItems = [];
    let originalCartHTML = '';
    let cartBeingCleared = false;
    
    // Main initialization
    function initialize() {
        // Immediately preserve cart UI state
        preserveCartUI();
        
        // Set up watchers for checkout button clicks
        watchCheckoutButtons();
        
        // Set up observers for cart DOM changes
        watchCartDOMChanges();
        
        // Set up interval to check for emptied cart
        setInterval(checkAndRestoreCartUI, 100);
        
        console.log('✅ Prevent Cart UI Clear initialized');
    }
    
    /**
     * Preserve the current cart UI state
     */
    function preserveCartUI() {
        try {
            // Save current cart items from various possible sources
            if (window.cartManager && window.cartManager.items) {
                originalCartItems = JSON.parse(JSON.stringify(window.cartManager.items));
            } else if (window.BobbyCart && typeof window.BobbyCart.getItems === 'function') {
                originalCartItems = JSON.parse(JSON.stringify(window.BobbyCart.getItems()));
            }
            
            // Save cart HTML elements
            const cartItemsContainer = document.getElementById('cart-items');
            if (cartItemsContainer) {
                originalCartHTML = cartItemsContainer.innerHTML;
            }
            
            // Save cart count
            const cartCount = document.querySelector('.cart-count');
            if (cartCount) {
                originalCartCount = cartCount.textContent;
            }
            
            console.log(`📸 Preserved cart UI state with ${originalCartItems.length} items`);
        } catch (error) {
            console.error('❌ Error preserving cart UI:', error);
        }
    }
    
    /**
     * Watch for checkout button clicks
     */
    function watchCheckoutButtons() {
        document.addEventListener('click', function(event) {
            // Check if clicked element is a checkout button
            const checkoutButton = event.target.closest('.checkout-btn, [data-checkout-action]');
            if (checkoutButton) {
                console.log('🛒 Checkout button clicked - preserving cart state');
                
                // Mark that checkout is happening (used to prevent cart UI clearing)
                cartBeingCleared = true;
                localStorage.setItem('cart-ui-being-cleared', 'true');
                
                // Preserve cart state immediately
                preserveCartUI();
                
                // Set a flag for a brief period during checkout redirect
                localStorage.setItem('checkout-redirect-in-progress', 'true');
                localStorage.setItem('checkout-redirect-timestamp', Date.now().toString());
                
                // Clear the flag after some time (after redirect should have completed)
                setTimeout(() => {
                    cartBeingCleared = false;
                    localStorage.removeItem('cart-ui-being-cleared');
                }, 10000);
            }
        }, true);
    }
    
    /**
     * Watch for DOM changes that might clear the cart
     */
    function watchCartDOMChanges() {
        // Use MutationObserver to watch for changes to the cart UI
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                // Check if we're in checkout
                if (cartBeingCleared || localStorage.getItem('cart-ui-being-cleared') === 'true') {
                    // Check for cart being emptied
                    if (mutation.target.id === 'cart-items' || 
                        mutation.target.classList?.contains('cart-items') ||
                        mutation.target.closest('#cart-items, .cart-items')) {
                        
                        // If cart is being emptied, prevent it
                        const cartItems = document.getElementById('cart-items');
                        if (cartItems && (cartItems.children.length === 0 || 
                            cartItems.innerHTML.includes('empty-cart') || 
                            cartItems.innerHTML.includes('Your cart is empty'))) {
                            
                            console.log('🛑 Prevented cart UI from being cleared during checkout');
                            
                            // Restore original cart HTML if we have it
                            if (originalCartHTML) {
                                cartItems.innerHTML = originalCartHTML;
                                console.log('🔄 Restored cart UI from preserved state');
                            }
                        }
                    }
                    
                    // Check for cart count being cleared
                    if (mutation.target.classList?.contains('cart-count')) {
                        if (mutation.target.textContent === '0' || mutation.target.style.display === 'none') {
                            console.log('🛑 Prevented cart count from being cleared');
                            
                            // Restore the original count
                            if (originalCartCount) {
                                mutation.target.textContent = originalCartCount;
                                mutation.target.style.display = 'flex';
                            }
                        }
                    }
                }
            });
        });
        
        // Start observing the entire document for changes to cart elements
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true
        });
        
        console.log('👀 Cart DOM observer started');
    }
    
    /**
     * Periodically check for emptied cart UI and restore if needed
     */
    function checkAndRestoreCartUI() {
        // Only run if checkout is in progress
        if (!cartBeingCleared && localStorage.getItem('cart-ui-being-cleared') !== 'true') {
            return;
        }
        
        // Check if checkout redirect is in progress
        const checkoutTimestamp = localStorage.getItem('checkout-redirect-timestamp');
        if (!checkoutTimestamp) {
            return;
        }
        
        // Only run during a reasonable window after checkout button was clicked
        const elapsed = Date.now() - parseInt(checkoutTimestamp);
        if (elapsed > 10000) {
            // Clear the flags if it's been too long
            localStorage.removeItem('checkout-redirect-in-progress');
            localStorage.removeItem('checkout-redirect-timestamp');
            localStorage.removeItem('cart-ui-being-cleared');
            return;
        }
        
        try {
            // Check if cart UI is empty but shouldn't be
            const cartItems = document.getElementById('cart-items');
            if (cartItems && (cartItems.children.length === 0 || 
                cartItems.innerHTML.includes('empty-cart') || 
                cartItems.innerHTML.includes('Your cart is empty'))) {
                
                // Restore original cart HTML if we have it
                if (originalCartHTML) {
                    cartItems.innerHTML = originalCartHTML;
                    console.log('🔄 Restored cart UI via interval check');
                }
            }
            
            // Check cart count elements
            const cartCounts = document.querySelectorAll('.cart-count');
            cartCounts.forEach(countElement => {
                if (countElement.textContent === '0' || countElement.style.display === 'none') {
                    // Restore from original if available
                    if (originalCartCount) {
                        countElement.textContent = originalCartCount;
                        countElement.style.display = 'flex';
                    }
                    // Or calculate from original items
                    else if (originalCartItems.length > 0) {
                        const count = originalCartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
                        countElement.textContent = count.toString();
                        countElement.style.display = 'flex';
                    }
                }
            });
            
            // Check if cart manager has been cleared
            if (window.cartManager && window.cartManager.items && window.cartManager.items.length === 0 &&
                originalCartItems.length > 0) {
                
                // Restore items to cart manager
                window.cartManager.items = JSON.parse(JSON.stringify(originalCartItems));
                if (typeof window.cartManager.updateCartDisplay === 'function') {
                    window.cartManager.updateCartDisplay();
                }
                if (typeof window.cartManager.updateCartCount === 'function') {
                    window.cartManager.updateCartCount();
                }
                console.log('🔄 Restored cart items to cart manager');
            }
            
            // Check if BobbyCart has been cleared
            if (window.BobbyCart && typeof window.BobbyCart.getItems === 'function' &&
                window.BobbyCart.getItems().length === 0 && originalCartItems.length > 0) {
                
                // Restore items to BobbyCart if it has a restore method
                if (typeof window.BobbyCart.restoreItems === 'function') {
                    window.BobbyCart.restoreItems(originalCartItems);
                    console.log('🔄 Restored cart items to BobbyCart');
                }
            }
            
        } catch (error) {
            console.error('❌ Error in cart UI check:', error);
        }
    }
    
    // Initialize on DOMContentLoaded or immediately if already loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();