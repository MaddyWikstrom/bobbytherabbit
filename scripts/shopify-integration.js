// Simplified Shopify Integration for Checkout Redirection

const SHOPIFY_CONFIG = {
    domain: 'bobbytherabbit.com.myshopify.com',
    storefrontAccessToken: 'fb92c5b6df6a740fc5d5fc94c30dbd0d',
    apiVersion: '2024-01'
};

// Initialize Shopify Buy SDK
let shopifyClient = null;
let shopifyCheckout = null;

// Load Shopify Buy Button SDK
function loadShopifySDK(callback) {
    if (window.ShopifyBuy) {
        callback();
        return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js';
    script.onload = callback;
    document.head.appendChild(script);
}

// Initialize Shopify client
function initializeShopifyClient() {
    if (!window.ShopifyBuy) {
        console.error('Shopify Buy SDK not loaded');
        return;
    }

    shopifyClient = window.ShopifyBuy.buildClient({
        domain: SHOPIFY_CONFIG.domain,
        storefrontAccessToken: SHOPIFY_CONFIG.storefrontAccessToken,
        apiVersion: SHOPIFY_CONFIG.apiVersion
    });

    // Create or retrieve existing checkout
    const checkoutId = localStorage.getItem('shopifyCheckoutId');
    if (checkoutId) {
        shopifyClient.checkout.fetch(checkoutId).then((checkout) => {
            if (!checkout.completedAt) {
                shopifyCheckout = checkout;
            } else {
                // Checkout was completed, create a new one
                createNewCheckout();
            }
        }).catch(() => {
            createNewCheckout();
        });
    } else {
        createNewCheckout();
    }
}

// Create new Shopify checkout
function createNewCheckout() {
    shopifyClient.checkout.create().then((checkout) => {
        shopifyCheckout = checkout;
        localStorage.setItem('shopifyCheckoutId', checkout.id);
    });
}

// Redirect to Shopify checkout
function redirectToShopifyCheckout() {
    if (!shopifyCheckout) {
        console.error('No Shopify checkout available');
        return;
    }

    if (shopifyCheckout && shopifyCheckout.webUrl) {
        window.location.href = shopifyCheckout.webUrl;
    }
}

// Override the checkout button to use Shopify
function overrideCheckoutButton() {
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            // Show loading state
            this.innerHTML = '<span>REDIRECTING TO CHECKOUT...</span><div class="btn-glow"></div>';
            this.disabled = true;

            // Redirect to Shopify checkout
            redirectToShopifyCheckout();
        });
    }
}

// Initialize Shopify integration when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load Shopify SDK and initialize
    loadShopifySDK(() => {
        initializeShopifyClient();

        // Override checkout button
        setTimeout(overrideCheckoutButton, 1000);
    });
});