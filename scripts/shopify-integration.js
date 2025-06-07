// Shopify Integration - No Local Fallbacks
// This file has been updated to remove all local mockup data and fallback logic

// Global variables
let shopifyClient = null;
let shopifyCheckout = null;

// Configuration with single domain
const SHOPIFY_CONFIG = {
  domain: 'mfdkk3-7g.myshopify.com',
  storefrontAccessToken: '8c6bd66766da4553701a1f1fe7d94dc4',
  apiVersion: '2024-01'
};

// Function to fetch products from Netlify function only
async function fetchProducts() {
  console.log('🔄 Fetching products from Netlify function...');
  
  try {
    const response = await fetch('/.netlify/functions/get-products');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();

    if (data.error) {
      console.error('❌ Error fetching products:', data.error);
      throw new Error(data.error);
    }

    console.log('✅ Products loaded from Netlify function:', data);
    
    // Process product data
    processProductData(data);
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    console.error('⚠️ IMPORTANT: Shopify API only works when deployed to Netlify.');
    console.error('⚠️ Please deploy to Netlify to test with real products.');
    
    if (typeof showNotification === 'function') {
      showNotification('This app requires deployment to Netlify to function. Local testing is not supported.', 'error');
    }
  }
}

// Process product data from API
function processProductData(products) {
  try {
    // Log products for debugging
    console.log('📋 Products received:', products);
    
    if (!Array.isArray(products)) {
      console.warn('⚠️ Expected array of products but received:', typeof products);
      return;
    }
    
    // Generate simple mapping for reference
    const mapping = {};
    products.forEach(product => {
      const productNode = product.node || product;
      mapping[productNode.title] = productNode.id;
    });

    console.log('📋 Product ID Mapping:');
    console.log(mapping);
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

  console.log('📦 Loading Shopify Buy SDK...');
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js';
  
  script.onload = () => {
    console.log('✅ Shopify Buy SDK loaded successfully');
    callback();
  };
  
  script.onerror = (error) => {
    console.error('❌ Failed to load Shopify Buy SDK:', error);
    console.error('⚠️ SDK loading failed. The app requires deployment to Netlify to function properly.');
    
    if (typeof showNotification === 'function') {
      showNotification('Failed to load Shopify SDK. Please check your connection and try again.', 'error');
    }
  };
  
  document.head.appendChild(script);
}

// Create checkout using Netlify function
async function createCheckoutWithNetlify(cart) {
  console.log('🔄 Creating checkout via Netlify function...');
  
  try {
    const response = await fetch('/.netlify/functions/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ cart })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ Error creating checkout:', data.error);
      throw new Error(data.error);
    }
    
    console.log('✅ Checkout created:', data);
    return data;
  } catch (error) {
    console.error('❌ Error creating checkout:', error);
    console.error('⚠️ Checkout creation failed. The app requires deployment to Netlify to function properly.');
    
    if (typeof showNotification === 'function') {
      showNotification('Failed to create checkout. Please try again later.', 'error');
    }
    
    return null;
  }
}

// Redirect to checkout
async function redirectToCheckout() {
  console.log('🔄 Redirecting to checkout...');
  
  const cart = window.cartManager ? window.cartManager.getCart() : [];
  
  if (!cart || cart.length === 0) {
    console.warn('⚠️ Cart is empty - nothing to checkout');
    
    if (typeof showNotification === 'function') {
      showNotification('Your cart is empty. Please add items before checkout.', 'warning');
    }
    
    return;
  }
  
  const checkout = await createCheckoutWithNetlify(cart);
  
  if (checkout && checkout.webUrl) {
    console.log('🛒 Redirecting to checkout URL:', checkout.webUrl);
    window.location.href = checkout.webUrl;
  } else {
    console.error('❌ No checkout URL available');
    
    if (typeof showNotification === 'function') {
      showNotification('Unable to create checkout. Please try again later.', 'error');
    }
  }
}

// Override the checkout button
function overrideCheckoutButton() {
  const checkoutBtn = document.querySelector('.checkout-btn');
  if (checkoutBtn) {
    console.log('🔧 Overriding checkout button');
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
  console.log('🚀 Initializing Shopify integration...');
  
  // Load Shopify SDK
  loadShopifySDK(() => {
    console.log('✅ SDK loaded, setting up checkout button');
    
    // Override checkout button after a delay
    setTimeout(overrideCheckoutButton, 1000);

    // Fetch products
    fetchProducts();
  });
  
  // Display deployment notice
  console.log('⚠️ NOTICE: This app requires deployment to Netlify to function properly.');
  console.log('⚠️ Local testing of Shopify API functionality is not supported.');
});

// Export functions for debugging
window.shopifyDebug = {
  fetchProducts,
  createCheckout: createCheckoutWithNetlify,
  redirectToCheckout,
  getConfig: () => SHOPIFY_CONFIG,
  showDeploymentMessage: () => {
    console.error('⚠️ This app requires deployment to Netlify to function properly.');
    if (typeof showNotification === 'function') {
      showNotification('This app requires deployment to Netlify to function. Local testing is not supported.', 'error');
    }
  }
};