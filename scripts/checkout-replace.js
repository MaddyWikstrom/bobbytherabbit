/**
 * Checkout Replace
 * 
 * This script completely replaces the checkout function to prevent cart clearing.
 * Instead of trying to intercept clearing operations, we're replacing the checkout
 * process entirely with our own implementation.
 */

(function() {
    console.log('🔄 Initializing Checkout Replace');
    
    // Track if we've replaced checkout functionality
    let checkoutReplaced = false;
    
    // Initialize
    function initialize() {
        // Replace checkout functionality immediately
        replaceCheckoutFunctionality();
        
        // Also try again after a short delay to ensure it runs after other scripts
        setTimeout(replaceCheckoutFunctionality, 500);
        setTimeout(replaceCheckoutFunctionality, 1000);
        setTimeout(replaceCheckoutFunctionality, 2000);
        
        // Set up listeners for checkout buttons
        setupCheckoutButtonListeners();
        
        console.log('✅ Checkout Replace initialized');
    }
    
    // Replace all checkout functionality
    function replaceCheckoutFunctionality() {
        if (checkoutReplaced) {
            return;
        }
        
        // Replace CartManager checkout methods
        if (window.cartManager) {
            console.log('🔄 Replacing CartManager checkout methods');
            
            // Replace proceedToCheckout
            if (typeof window.cartManager.proceedToCheckout === 'function') {
                window.cartManager.proceedToCheckout = ourCheckoutImplementation;
                console.log('✅ Replaced CartManager.proceedToCheckout');
            }
            
            // Replace initiateShopifyCheckout
            if (typeof window.cartManager.initiateShopifyCheckout === 'function') {
                window.cartManager.initiateShopifyCheckout = ourCheckoutImplementation;
                console.log('✅ Replaced CartManager.initiateShopifyCheckout');
            }
            
            checkoutReplaced = true;
        }
        
        // Replace BobbyCheckoutStorefront methods
        if (window.BobbyCheckoutStorefront) {
            console.log('🔄 Replacing BobbyCheckoutStorefront methods');
            
            // Replace processCheckout
            if (typeof window.BobbyCheckoutStorefront.processCheckout === 'function') {
                window.BobbyCheckoutStorefront.processCheckout = ourCheckoutImplementation;
                console.log('✅ Replaced BobbyCheckoutStorefront.processCheckout');
            }
            
            // Replace createCheckout
            if (typeof window.BobbyCheckoutStorefront.createCheckout === 'function') {
                const originalCreateCheckout = window.BobbyCheckoutStorefront.createCheckout;
                window.BobbyCheckoutStorefront.createCheckout = async function(cartItems) {
                    // Save cart items
                    saveCartItems(cartItems);
                    
                    // Call original but don't let it clear the cart
                    return await originalCreateCheckout.apply(this, arguments);
                };
                console.log('✅ Replaced BobbyCheckoutStorefront.createCheckout');
            }
            
            checkoutReplaced = true;
        }
        
        // Replace BobbyCart methods
        if (window.BobbyCart) {
            console.log('🔄 Replacing BobbyCart methods');
            
            // Replace proceedToCheckout
            if (typeof window.BobbyCart.proceedToCheckout === 'function') {
                window.BobbyCart.proceedToCheckout = ourCheckoutImplementation;
                console.log('✅ Replaced BobbyCart.proceedToCheckout');
            }
            
            checkoutReplaced = true;
        }
    }
    
    // Set up listeners for checkout buttons
    function setupCheckoutButtonListeners() {
        // Find all checkout buttons and override their click handlers
        document.addEventListener('click', function(event) {
            // Identify checkout buttons
            const checkoutButton = event.target.closest('.checkout-btn, [data-checkout-action]');
            if (checkoutButton ||
                (event.target.tagName === 'BUTTON' && event.target.textContent.toLowerCase().includes('checkout'))) {
                console.log('🛒 Checkout button clicked - using our implementation');
                event.preventDefault();
                event.stopPropagation();
                
                // Use our implementation
                ourCheckoutImplementation();
            }
        }, true); // Use capture phase to intercept before other handlers
        
        console.log('👂 Checkout button listeners set up');
    }
    
    // Save cart items for later use
    function saveCartItems(items) {
        try {
            // Get the items from various possible sources
            let cartItems = items;
            
            if (!cartItems) {
                if (window.cartManager && window.cartManager.items) {
                    cartItems = window.cartManager.items;
                } else if (window.BobbyCart && typeof window.BobbyCart.getItems === 'function') {
                    cartItems = window.BobbyCart.getItems();
                }
            }
            
            if (cartItems && cartItems.length > 0) {
                // Save to localStorage
                localStorage.setItem('bobby-checkout-cart-items', JSON.stringify(cartItems));
                console.log(`📦 Saved ${cartItems.length} items for checkout`);
            }
        } catch (error) {
            console.error('❌ Error saving cart items:', error);
        }
    }
    
    // Our custom checkout implementation
    async function ourCheckoutImplementation() {
        console.log('🚀 Running our checkout implementation');
        
        try {
            // Show loading indication
            const checkoutBtn = document.querySelector('.checkout-btn');
            if (checkoutBtn) {
                const originalText = checkoutBtn.querySelector('span')?.textContent || 'Checkout';
                if (checkoutBtn.querySelector('span')) {
                    checkoutBtn.querySelector('span').textContent = 'Processing...';
                }
                checkoutBtn.disabled = true;
            }
            
            // Get cart items
            let cartItems;
            if (window.cartManager && window.cartManager.items) {
                cartItems = window.cartManager.items;
            } else if (window.BobbyCart && typeof window.BobbyCart.getItems === 'function') {
                cartItems = window.BobbyCart.getItems();
            } else {
                throw new Error('Could not find cart items');
            }
            
            if (!cartItems || cartItems.length === 0) {
                throw new Error('Cart is empty');
            }
            
            // Save cart items for restoration
            saveCartItems(cartItems);
            
            // Determine which checkout method to use
            let checkoutUrl;
            
            // Try Shopify Storefront API
            if (window.BobbyCheckoutStorefront) {
                console.log('Using BobbyCheckoutStorefront for checkout');
                try {
                    // Prepare items in the format expected by BobbyCheckoutStorefront
                    checkoutUrl = await window.BobbyCheckoutStorefront.createCheckout(cartItems);
                } catch (err) {
                    console.error('Error with BobbyCheckoutStorefront:', err);
                }
            }
            
            // Try Netlify functions if Storefront failed
            if (!checkoutUrl) {
                console.log('Using Netlify function for checkout');
                try {
                    // Prepare items for checkout
                    const checkoutItems = await prepareCheckoutItems(cartItems);
                    
                    // Call the Netlify function
                    const response = await fetch('/.netlify/functions/create-checkout-fixed', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            items: checkoutItems
                        })
                    });
                    
                    if (!response.ok) {
                        throw new Error(`Checkout creation failed: ${response.status}`);
                    }
                    
                    const data = await response.json();
                    if (data.error) {
                        throw new Error(data.error);
                    }
                    
                    checkoutUrl = data.checkoutUrl;
                } catch (err) {
                    console.error('Error with Netlify function:', err);
                }
            }
            
            // If we got a checkout URL, redirect to it
            if (checkoutUrl) {
                console.log('✅ Checkout URL obtained:', checkoutUrl);
                console.log('🔄 Redirecting to checkout...');
                
                // IMPORTANT: DO NOT CLEAR THE CART HERE
                // Just redirect
                window.location.href = checkoutUrl;
                return true;
            } else {
                throw new Error('Could not obtain checkout URL');
            }
        } catch (error) {
            console.error('❌ Checkout error:', error);
            
            // Show error to user
            const errorMessage = error.message || 'There was a problem with checkout. Please try again.';
            showNotification(errorMessage, 'error');
            
            // Reset checkout button
            const checkoutBtn = document.querySelector('.checkout-btn');
            if (checkoutBtn) {
                if (checkoutBtn.querySelector('span')) {
                    checkoutBtn.querySelector('span').textContent = 'Checkout';
                }
                checkoutBtn.disabled = false;
            }
            
            return false;
        }
    }
    
    // Prepare checkout items - similar to cartManager.prepareCheckoutItems
    async function prepareCheckoutItems(cartItems) {
        try {
            const checkoutItems = [];
            
            for (const item of cartItems) {
                // If it has a Shopify variant ID in the right format, use it
                if (item.shopifyVariantId && 
                    item.shopifyVariantId.includes('gid://shopify/ProductVariant/')) {
                    checkoutItems.push({
                        variantId: item.shopifyVariantId,
                        quantity: item.quantity
                    });
                    continue;
                }
                
                // Try to format an ID if we have a numeric product ID
                if (item.productId && /^\d+$/.test(item.productId)) {
                    const variantId = `gid://shopify/ProductVariant/${item.productId}`;
                    checkoutItems.push({
                        variantId: variantId,
                        quantity: item.quantity
                    });
                    continue;
                }
                
                // Last resort - try to construct something from the item ID
                if (item.id) {
                    const parts = item.id.split('-');
                    const productId = parts[0];
                    
                    if (/^\d+$/.test(productId)) {
                        const variantId = `gid://shopify/ProductVariant/${productId}`;
                        checkoutItems.push({
                            variantId: variantId,
                            quantity: item.quantity
                        });
                    }
                }
            }
            
            return checkoutItems;
        } catch (error) {
            console.error('Error preparing checkout items:', error);
            return [];
        }
    }
    
    // Show notification to user
    function showNotification(message, type = 'info') {
        // Try to use existing notification system
        if (window.cartManager && typeof window.cartManager.showNotification === 'function') {
            window.cartManager.showNotification(message, type);
        } else if (window.productManager && typeof window.productManager.showNotification === 'function') {
            window.productManager.showNotification(message, type);
        } else {
            // Create our own notification
            const notification = document.createElement('div');
            notification.className = `checkout-notification ${type}`;
            notification.textContent = message;
            
            // Style the notification
            Object.assign(notification.style, {
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                padding: '10px 20px',
                backgroundColor: type === 'error' ? '#f44336' : '#2196F3',
                color: 'white',
                borderRadius: '4px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                zIndex: '10000',
                opacity: '0',
                transition: 'opacity 0.3s ease'
            });
            
            // Add to document
            document.body.appendChild(notification);
            
            // Fade in
            setTimeout(() => {
                notification.style.opacity = '1';
            }, 10);
            
            // Remove after a delay
            setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }, 3000);
        }
    }
    
    // Initialize on DOMContentLoaded or immediately if already loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();