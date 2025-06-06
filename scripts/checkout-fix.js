// Enhanced Checkout Flow Fix
document.addEventListener('DOMContentLoaded', function() {
    // Apply checkout fixes
    enhanceCheckoutProcess();
});

function enhanceCheckoutProcess() {
    // Override the original checkout function in CartManager if it exists
    if (window.cartManager) {
        // Save reference to original method
        const originalInitiateShopifyCheckout = window.cartManager.initiateShopifyCheckout;
        
        // Override with enhanced method
        window.cartManager.initiateShopifyCheckout = async function() {
            try {
                // Show loading state
                this.showNotification('Creating checkout...', 'info');
                
                // First, prepare the checkout items using the original method
                const checkoutItems = await this.prepareCheckoutItems();
                
                if (!checkoutItems || checkoutItems.length === 0) {
                    this.showNotification('Unable to process checkout. Please try again.', 'error');
                    return;
                }

                // Use the fixed checkout function
                const response = await fetch('/.netlify/functions/create-checkout-fixed', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        items: checkoutItems
                    })
                });

                // Check for HTTP errors
                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Checkout error response:', errorData);
                    throw new Error(`Checkout failed: ${errorData.error || response.statusText}`);
                }

                const data = await response.json();
                
                if (data.error) {
                    throw new Error(data.error);
                }

                // Redirect to Shopify checkout
                if (data.checkoutUrl) {
                    this.showNotification('Redirecting to checkout...', 'success');
                    
                    // Clear cart after successful checkout creation
                    this.clearCart();
                    
                    // Redirect to Shopify checkout
                    setTimeout(() => {
                        window.location.href = data.checkoutUrl;
                    }, 1000);
                } else {
                    throw new Error('No checkout URL received');
                }
                
            } catch (error) {
                console.error('Enhanced checkout error:', error);
                this.showNotification(`Checkout error: ${error.message}. Please try again.`, 'error');
                
                // Fall back to original method if our enhanced version fails
                try {
                    console.log('Trying original checkout method as fallback...');
                    return originalInitiateShopifyCheckout.call(this);
                } catch (fallbackError) {
                    console.error('Fallback checkout also failed:', fallbackError);
                    // Show the modal as final fallback
                    this.showCheckoutModal();
                }
            }
        };

        // Also override the checkout button handler
        const checkoutBtn = document.querySelector('.checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.removeEventListener('click', window.cartManager.proceedToCheckout);
            checkoutBtn.addEventListener('click', function() {
                console.log('Enhanced checkout process initiated');
                
                // Check for empty cart
                if (window.cartManager.items.length === 0) {
                    window.cartManager.showNotification('Your cart is empty!', 'error');
                    return;
                }

                // Show loading state
                const originalText = this.querySelector('span') ? 
                    this.querySelector('span').textContent : 
                    this.textContent;
                
                if (this.querySelector('span')) {
                    this.querySelector('span').textContent = 'Processing...';
                } else {
                    this.textContent = 'Processing...';
                }
                
                this.disabled = true;

                // Initiate checkout
                window.cartManager.initiateShopifyCheckout()
                    .finally(() => {
                        // Reset button state
                        if (this.querySelector('span')) {
                            this.querySelector('span').textContent = originalText;
                        } else {
                            this.textContent = originalText;
                        }
                        this.disabled = false;
                    });
            });
        }
    }
}

// Add helpful error styles
const errorStyles = `
    .checkout-error {
        background: rgba(255, 0, 0, 0.1);
        border: 1px solid rgba(255, 0, 0, 0.3);
        color: #ff6b6b;
        padding: 10px;
        margin: 10px 0;
        border-radius: 5px;
        font-size: 14px;
    }
    
    .checkout-retry-btn {
        background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
        border: none;
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 10px;
        font-weight: bold;
        transition: all 0.3s ease;
    }
    
    .checkout-retry-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(255, 107, 107, 0.4);
    }
    
    .checkout-spinner {
        display: inline-block;
        width: 20px;
        height: 20px;
        border: 2px solid rgba(255,255,255,0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: checkout-spin 1s ease-in-out infinite;
        margin-left: 10px;
        vertical-align: middle;
    }
    
    @keyframes checkout-spin {
        to { transform: rotate(360deg); }
    }
`;

// Inject error styles
const styleEl = document.createElement('style');
styleEl.textContent = errorStyles;
document.head.appendChild(styleEl);