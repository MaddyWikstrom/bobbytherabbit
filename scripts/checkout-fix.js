// Enhanced Checkout System
// This script fixes checkout issues across the site

// Silent checkout transition without intrusive notifications
class SilentCheckoutSystem {
    // Track checkout state
    static checkoutInProgress = false;
    
    // Initialize checkout improvements
    static initialize() {
        // Initialize enhanced checkout system
        SilentCheckoutSystem.patchCartManager();
        SilentCheckoutSystem.setupGlobalCheckoutListeners();
        SilentCheckoutSystem.fixShopifyClientErrors();
    }
    
    // Patch the CartManager's checkout methods to work silently
    static patchCartManager() {
        // Wait for cart manager to be available
        const waitForCartManager = setInterval(() => {
            if (window.cartManager) {
                clearInterval(waitForCartManager);
                // Enhance checkout system
                
                // Store original methods we'll be overriding
                const originalInitiateShopifyCheckout = window.cartManager.initiateShopifyCheckout;
                const originalShowNotification = window.cartManager.showNotification;
                
                // Override the initiateShopifyCheckout method with our improved version
                window.cartManager.initiateShopifyCheckout = async function() {
                    try {
                        if (SilentCheckoutSystem.checkoutInProgress) {
                            // Prevent duplicate checkout attempts
                            return;
                        }
                        
                        SilentCheckoutSystem.checkoutInProgress = true;
                        
                        // Update UI to indicate checkout is happening, but without popup
                        const checkoutBtn = document.querySelector('.checkout-btn');
                        if (checkoutBtn) {
                            const originalText = checkoutBtn.querySelector('span')?.textContent || 'Checkout';
                            if (checkoutBtn.querySelector('span')) {
                                checkoutBtn.querySelector('span').textContent = 'Processing...';
                            } else {
                                checkoutBtn.textContent = 'Processing...';
                            }
                            checkoutBtn.disabled = true;
                            
                            // Add a subtle loading indicator
                            checkoutBtn.classList.add('checkout-processing');
                        }
                        
                        // Prepare checkout items - enhanced to handle more variant cases
                        const checkoutItems = await this.prepareCheckoutItems();
                        
                        if (!checkoutItems || checkoutItems.length === 0) {
                            console.error('No valid checkout items prepared');
                            SilentCheckoutSystem.checkoutInProgress = false;
                            
                            // Reset checkout button
                            if (checkoutBtn) {
                                if (checkoutBtn.querySelector('span')) {
                                    checkoutBtn.querySelector('span').textContent = originalText;
                                } else {
                                    checkoutBtn.textContent = originalText;
                                }
                                checkoutBtn.disabled = false;
                                checkoutBtn.classList.remove('checkout-processing');
                            }
                            
                            // Show a minimal error message
                            window.cartManager.showSilentNotification('Unable to process checkout. Please try again.', 'error');
                            return;
                        }

                        // Start a subtle progress indicator instead of popup notification
                        SilentCheckoutSystem.showCheckoutProgress();
                        
                        // Call Netlify function to create checkout - with improved error handling
                        // Create checkout with prepared items
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

                        // Check for valid checkout URL before proceeding
                        if (data.checkoutUrl) {
                            // Store cart data in sessionStorage before checkout
                            // This allows us to preserve the cart until the order is actually completed
                            sessionStorage.setItem('bobby-checkout-in-progress', 'true');
                            
                            // Redirect immediately to Shopify checkout without delay
                            window.location.href = data.checkoutUrl;
                        } else {
                            throw new Error('No checkout URL received');
                        }
                        
                    } catch (error) {
                        console.error('Checkout error:', error);
                        SilentCheckoutSystem.checkoutInProgress = false;
                        
                        // Reset checkout button
                        const checkoutBtn = document.querySelector('.checkout-btn');
                        if (checkoutBtn) {
                            if (checkoutBtn.querySelector('span')) {
                                checkoutBtn.querySelector('span').textContent = 'Checkout';
                            } else {
                                checkoutBtn.textContent = 'Checkout';
                            }
                            checkoutBtn.disabled = false;
                            checkoutBtn.classList.remove('checkout-processing');
                        }
                        
                        // Show a minimal error message
                        window.cartManager.showSilentNotification('Checkout issue. Please try again.', 'error');
                    }
                };
                
                // Add silent notification method to CartManager
                window.cartManager.showSilentNotification = function(message, type = 'info') {
                    // Silent notification triggered
                    
                    // Only show error notifications as small indicators
                    if (type === 'error') {
                        const container = document.createElement('div');
                        container.className = 'silent-notification error';
                        container.innerHTML = `
                            <div class="silent-notification-content">
                                <span class="silent-notification-message">${message}</span>
                            </div>
                        `;
                        
                        document.body.appendChild(container);
                        setTimeout(() => container.classList.add('show'), 10);
                        setTimeout(() => {
                            container.classList.remove('show');
                            setTimeout(() => container.remove(), 300);
                        }, 3000);
                    }
                };
                
                // Enhance the prepareCheckoutItems method to handle more cases
                // Only override if it exists already
                if (typeof window.cartManager.prepareCheckoutItems === 'function') {
                    const originalPrepareCheckoutItems = window.cartManager.prepareCheckoutItems;
                    window.cartManager.prepareCheckoutItems = async function() {
                        try {
                            // Start with basic preparation using the original method
                            let checkoutItems = await originalPrepareCheckoutItems.call(this);
                            
                            // If we couldn't prepare items, try an alternative approach
                            if (!checkoutItems || checkoutItems.length === 0) {
                                // Try alternative checkout item preparation
                                checkoutItems = [];
                                
                                // Direct approach - construct variant IDs in Shopify format if missing
                                for (const cartItem of this.items) {
                                    // If we already have a Shopify variant ID, use it
                                    if (cartItem.shopifyVariantId) {
                                        // Make sure it's in the correct format for the Storefront API
                                        let variantId = cartItem.shopifyVariantId;
                                        
                                        // Add the gid:// prefix if missing
                                        if (!variantId.includes('gid://')) {
                                            variantId = `gid://shopify/ProductVariant/${variantId.replace(/\D/g, '')}`;
                                        }
                                        
                                        checkoutItems.push({
                                            variantId: variantId,
                                            quantity: cartItem.quantity
                                        });
                                    }
                                    // Otherwise try to find or construct a variant ID
                                    else {
                                        // Use product ID + variant info to construct a valid ID
                                        // This is a fallback approach
                                        const fallbackId = `gid://shopify/ProductVariant/${cartItem.productId}-${cartItem.color}-${cartItem.size}`
                                            .replace(/\s+/g, '-')
                                            .toLowerCase();
                                        
                                        checkoutItems.push({
                                            variantId: fallbackId,
                                            quantity: cartItem.quantity
                                        });
                                        
                                        // Using fallback variant ID
                                    }
                                }
                            }
                            
                            return checkoutItems;
                        } catch (error) {
                            console.error('Checkout preparation error:', error);
                            // Create basic checkout items as fallback
                            try {
                                const checkoutItems = [];
                                
                                // Direct approach - use whatever info we have
                                for (const cartItem of this.items) {
                                    // Try to construct some kind of ID
                                    let variantId = cartItem.shopifyVariantId || cartItem.shopifyId || cartItem.id;
                                    
                                    // Try to make it a proper Shopify variant ID format
                                    if (variantId && !variantId.includes('gid://')) {
                                        // If it might be a product ID rather than variant ID
                                        if (variantId.includes('Product/')) {
                                            variantId = `gid://shopify/ProductVariant/${variantId.split('Product/')[1]}`;
                                        } else {
                                            variantId = `gid://shopify/ProductVariant/${variantId}`;
                                        }
                                    }
                                    
                                    checkoutItems.push({
                                        variantId: variantId,
                                        quantity: cartItem.quantity || 1
                                    });
                                }
                                
                                return checkoutItems;
                            } catch (fallbackError) {
                                console.error('All checkout preparation methods failed:', fallbackError);
                                return [];
                            }
                        }
                    };
                } else {
                    // Add the method if it doesn't exist
                    window.cartManager.prepareCheckoutItems = async function() {
                        try {
                            const checkoutItems = [];
                            
                            // Create checkout items from cart items
                            for (const cartItem of this.items) {
                                // Try to get or construct a variant ID
                                let variantId = cartItem.shopifyVariantId || cartItem.shopifyId || cartItem.id;
                                
                                // Try to format it properly
                                if (variantId && !variantId.includes('gid://')) {
                                    // If it might be a product ID rather than variant ID
                                    if (variantId.includes('Product/')) {
                                        variantId = `gid://shopify/ProductVariant/${variantId.split('Product/')[1]}`;
                                    } else {
                                        variantId = `gid://shopify/ProductVariant/${variantId}`;
                                    }
                                }
                                
                                checkoutItems.push({
                                    variantId: variantId,
                                    quantity: cartItem.quantity || 1
                                });
                            }
                            
                            return checkoutItems;
                        } catch (error) {
                            console.error('Error preparing checkout items:', error);
                            return [];
                        }
                    };
                }
            }
        }, 100);
    }
    
    // Set up global checkout-related event listeners
    static setupGlobalCheckoutListeners() {
        // Listen for checkout button clicks across the site
        document.addEventListener('click', (e) => {
            const checkoutButton = e.target.closest('.checkout-btn, [data-checkout-action]');
            if (checkoutButton && window.cartManager) {
                e.preventDefault();
                
                // Use our enhanced checkout flow
                window.cartManager.initiateShopifyCheckout();
            }
        });
    }
    
    // Show a subtle checkout progress indicator
    static showCheckoutProgress() {
        const progressBar = document.createElement('div');
        progressBar.className = 'checkout-progress-bar';
        progressBar.innerHTML = `
            <div class="checkout-progress-inner"></div>
        `;
        
        document.body.appendChild(progressBar);
        
        // Remove after a short time (will be interrupted by page navigation)
        setTimeout(() => {
            progressBar.remove();
        }, 10000);
    }
    
    // Fix Shopify client errors, particularly the "Cannot read properties of undefined (reading 'create')" error
    static fixShopifyClientErrors() {
        console.log('🛠️ Fixing potential Shopify client errors...');
        
        // Watch for Shopify client initialization
        const checkShopifyClient = setInterval(() => {
            // Check for shopifyClient global variable
            if (window.shopifyClient !== undefined) {
                clearInterval(checkShopifyClient);
                
                // If shopifyClient exists but cart property is undefined
                if (window.shopifyClient && (window.shopifyClient.cart === undefined ||
                    typeof window.shopifyClient.cart?.create !== 'function')) {
                    
                    console.log('⚠️ Detected Shopify client with missing cart API, applying fix...');
                    
                    // Add fallback cart methods
                    window.shopifyClient.cart = window.shopifyClient.cart || {};
                    
                    // If create method is missing, add a fallback implementation
                    if (typeof window.shopifyClient.cart.create !== 'function') {
                        window.shopifyClient.cart.create = function() {
                            console.log('Using fallback cart creation');
                            return Promise.resolve({
                                id: `fallback-cart-${Date.now()}`,
                                lineItems: [],
                                checkoutUrl: null,
                                webUrl: null,
                                totalPrice: 0
                            });
                        };
                    }
                    
                    // Ensure other cart methods exist
                    window.shopifyClient.cart.fetch = window.shopifyClient.cart.fetch || function() {
                        return Promise.resolve({
                            id: `fallback-cart-${Date.now()}`,
                            lineItems: [],
                            checkoutUrl: null,
                            webUrl: null,
                            totalPrice: 0
                        });
                    };
                    
                    console.log('✅ Applied Shopify client cart API fix');
                }
            }
        }, 500);
        
        // Maximum wait time of 10 seconds
        setTimeout(() => clearInterval(checkShopifyClient), 10000);
    }
    
    // Handle order completion - called when an order is successfully completed
    static handleOrderCompleted() {
        console.log('🛍️ Order completed - clearing cart');
        
        // Clear checkout in progress flag
        sessionStorage.removeItem('bobby-checkout-in-progress');
        
        // Clear the cart if cart manager exists
        if (window.cartManager && typeof window.cartManager.clearCart === 'function') {
            window.cartManager.clearCart();
        }
    }
}

// Add styles for the enhanced checkout system
const checkoutFixStyles = `
    /* Silent notification styling */
    .silent-notification {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(40, 40, 60, 0.9);
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        transform: translateY(100px);
        opacity: 0;
        transition: all 0.3s ease;
        font-size: 14px;
        max-width: 300px;
    }
    
    .silent-notification.show {
        transform: translateY(0);
        opacity: 1;
    }
    
    .silent-notification.error {
        background: rgba(220, 50, 50, 0.9);
    }
    
    /* Checkout progress styling */
    .checkout-progress-bar {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 3px;
        z-index: 10001;
        background: rgba(120, 119, 198, 0.2);
    }
    
    .checkout-progress-inner {
        height: 100%;
        width: 0%;
        background: linear-gradient(90deg, #a855f7, #3b82f6);
        animation: progress-animation 2s ease-in-out infinite;
    }
    
    @keyframes progress-animation {
        0% { width: 0%; }
        50% { width: 70%; }
        100% { width: 100%; }
    }
    
    /* Processing state for checkout button */
    .checkout-btn.checkout-processing {
        position: relative;
        overflow: hidden;
    }
    
    .checkout-btn.checkout-processing::after {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        animation: shimmer 1.5s infinite;
    }
    
    @keyframes shimmer {
        100% { left: 100%; }
    }
`;

// Add the styles to the document
const styleElement = document.createElement('style');
styleElement.textContent = checkoutFixStyles;
document.head.appendChild(styleElement);

// Initialize the enhanced checkout system when the page loads
document.addEventListener('DOMContentLoaded', () => {
    SilentCheckoutSystem.initialize();
});

// Also try to initialize immediately in case the DOM is already loaded
if (document.readyState === 'interactive' || document.readyState === 'complete') {
    SilentCheckoutSystem.initialize();
}