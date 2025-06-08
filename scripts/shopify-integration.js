// Shopify Integration - No Local Fallbacks
// This file has been updated to remove all local mockup data and fallback logic

// Global variables
let shopifyClient = null;
let shopifyCheckout = null;

// Configuration with single domain
const SHOPIFY_CONFIG = {
  domain: 'mfdkk3-7g.myshopify.com',
  storefrontAccessToken: '8c6bd66766da4553701a1f1fe7d94dc4',
  apiVersion: '2024-04'
};

// Function to fetch products from Netlify function only
async function fetchProducts() {
  
  try {
    const response = await fetch('/.netlify/functions/get-products');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    
    // Process product data
    processProductData(data);
  } catch (error) {
    
    if (typeof showNotification === 'function') {
      showNotification('This app requires deployment to Netlify to function. Local testing is not supported.', 'error');
    }
  }
}

// Process product data from API
function processProductData(products) {
  try {
    // Log products for debugging
    
    if (!Array.isArray(products)) {
      return;
    }
    
    // Generate simple mapping for reference
    const mapping = {};
    products.forEach(product => {
      const productNode = product.node || product;
      mapping[productNode.title] = productNode.id;
    });

  } catch (error) {
    console.error('❌ Error processing product data:', error);
  }
}

// Load Shopify Buy Button SDK - no fallbacks
function loadShopifySDK(callback) {
  if (window.ShopifyBuy) {
    callback();
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js';
  
  script.onload = () => {
    callback();
  };
  
  script.onerror = (error) => {
    
    if (typeof showNotification === 'function') {
      showNotification('Failed to load Shopify SDK. Please check your connection and try again.', 'error');
    }
  };
  
  document.head.appendChild(script);
}

// Create cart using Netlify function
async function createCartWithNetlify(cart) {
  
  try {
    const response = await fetch('/.netlify/functions/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ items: cart.map(item => ({
        variantId: item.shopifyVariantId,
        quantity: item.quantity || 1
      })) })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data;
  } catch (error) {
    
    if (typeof showNotification === 'function') {
      showNotification('Failed to create cart. Please try again later.', 'error');
    }
    
    return null;
  }
}

// Redirect to checkout
async function redirectToCheckout() {
  
  const cart = window.cartManager ? window.cartManager.getCart() : [];
  
  if (!cart || cart.length === 0) {
    
    if (typeof showNotification === 'function') {
      showNotification('Your cart is empty. Please add items before checkout.', 'warning');
    }
    
    return;
  }
  
  const cartData = await createCartWithNetlify(cart);
  
  if (cartData && cartData.checkoutUrl) {
    window.location.href = cartData.checkoutUrl;
  } else {
    
    if (typeof showNotification === 'function') {
      showNotification('Unable to create checkout. Please try again later.', 'error');
    }
  }
}

// Override the checkout button
function overrideCheckoutButton() {
  const checkoutBtn = document.querySelector('.checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();

      // Show loading state
      this.innerHTML = '<span>REDIRECTING TO CHECKOUT...</span><div class="btn-glow"></div>';
      this.disabled = true;

      // Redirect to checkout
      redirectToCheckout().catch(error => {
        console.error('❌ Checkout error:', error);
        // Reset button if checkout fails
        this.innerHTML = '<span>CHECKOUT</span><div class="btn-glow"></div>';
        this.disabled = false;
        
        if (typeof showNotification === 'function') {
          showNotification('Checkout failed. Please try again later.', 'error');
        }
      });
    });
  } else {
    console.warn('⚠️ Checkout button not found');
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  
  // Load Shopify SDK
  loadShopifySDK(() => {
    
    // Override checkout button after a delay
    setTimeout(overrideCheckoutButton, 1000);

    // Fetch products
    fetchProducts();
  });
  
  // Display deployment notice
});

// Export functions for debugging
window.shopifyDebug = {
  fetchProducts,
  createCart: createCartWithNetlify,
  redirectToCheckout,
  getConfig: () => SHOPIFY_CONFIG,
  showDeploymentMessage: () => {
    console.error('⚠️ This app requires deployment to Netlify to function properly.');
    if (typeof showNotification === 'function') {
      showNotification('This app requires deployment to Netlify to function. Local testing is not supported.', 'error');
    }
  }
};