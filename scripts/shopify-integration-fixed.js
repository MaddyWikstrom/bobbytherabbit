// Fixed Shopify Integration - No Fallbacks
// Removed all hardcoded product mapping and fallback logic

// Global variables
let shopifyClient = null;
let shopifyCheckout = null;

// Configuration with single domain - no fallbacks
const SHOPIFY_CONFIG = {
  domain: 'bobbytherabbit.myshopify.com',
  storefrontAccessToken: '8c6bd66766da4553701a1f1fe7d94dc4',
  apiVersion: '2024-01'
};

// Enhanced fetch with retry logic
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Attempt ${i + 1}: Fetching ${url}`);
      const response = await fetch(url, options);
      
      if (response.ok) {
        return response;
      } else {
        console.warn(`Attempt ${i + 1} failed with status: ${response.status}`);
        if (i === maxRetries - 1) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }
    } catch (error) {
      console.warn(`Attempt ${i + 1} failed:`, error.message);
      if (i === maxRetries - 1) {
        throw error;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

// Function to fetch products with no fallback strategies
async function fetchProducts() {
  console.log('🔄 Starting product fetch...');
  
  // Try Netlify function only - no fallbacks
  try {
    console.log('📡 Fetching products from Netlify function...');
    const response = await fetchWithRetry('/.netlify/functions/get-products', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (data.error) {
      console.error('❌ Netlify function returned error:', data.error);
      throw new Error(data.error);
    }

    console.log('✅ Products loaded from Netlify function:', data);
    processProductData(data);
  } catch (error) {
    console.error('❌ Product fetch failed:', error.message);
    console.error('⚠️ IMPORTANT: Shopify API only works when deployed to Netlify.');
    console.error('⚠️ Please deploy to Netlify to test with real products.');
    
    // Show error notification if available
    if (typeof showNotification === 'function') {
      showNotification('This app requires deployment to Netlify to function. Local testing is not supported.', 'error');
    } else if (window.productManager && typeof window.productManager.showNotification === 'function') {
      window.productManager.showNotification('This app requires deployment to Netlify to function. Local testing is not supported.', 'error');
    }
  }
}

// Process product data from API
function processProductData(products) {
  try {
    // Generate mapping
    const mapping = {};
    products.forEach(product => {
      const productNode = product.node || product;
      mapping[productNode.title] = productNode.id;
    });

    console.log('📋 Generated Product Mapping:');
    console.log(mapping);

    // Generate the PRODUCT_MAPPING code
    let mappingCode = 'const PRODUCT_MAPPING = {\n';
    products.forEach(product => {
      const productNode = product.node || product;
      const productId = productNode.id;
      const productName = productNode.title;
      mappingCode += `    '${productName}': {\n`;
      mappingCode += `        shopifyProductId: '${productId}',\n`;
      mappingCode += `        // Add variant information here\n`;
      mappingCode += `    },\n`;
    });
    mappingCode += '};';

    console.log('📝 Generated PRODUCT_MAPPING code:\n');
    console.log(mappingCode);

    // Store the mapping in localStorage
    localStorage.setItem('shopifyProductMapping', mappingCode);
    localStorage.setItem('shopifyProductMappingTimestamp', Date.now().toString());

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

// Initialize Shopify client - no domain fallbacks
function initializeShopifyClient() {
  if (!window.ShopifyBuy) {
    console.error('❌ Shopify Buy SDK not loaded');
    return;
  }
  
  try {
    console.log(`🔧 Initializing Shopify client with domain: ${SHOPIFY_CONFIG.domain}`);
    
    shopifyClient = window.ShopifyBuy.buildClient({
      domain: SHOPIFY_CONFIG.domain,
      storefrontAccessToken: SHOPIFY_CONFIG.storefrontAccessToken,
      apiVersion: SHOPIFY_CONFIG.apiVersion
    });

    console.log('✅ Shopify client initialized successfully');

    // Create or retrieve existing checkout
    const checkoutId = localStorage.getItem('shopifyCheckoutId');
    if (checkoutId) {
      shopifyClient.checkout.fetch(checkoutId).then((checkout) => {
        if (!checkout.completedAt) {
          shopifyCheckout = checkout;
          console.log('✅ Existing checkout retrieved');
        } else {
          // Checkout was completed, create a new one
          createNewCheckout();
        }
      }).catch((error) => {
        console.warn('⚠️ Failed to fetch existing checkout:', error);
        createNewCheckout();
      });
    } else {
      createNewCheckout();
    }

  } catch (error) {
    console.error('❌ Failed to initialize Shopify client:', error);
    console.error('⚠️ This app requires deployment to Netlify to function properly.');
    
    if (typeof showNotification === 'function') {
      showNotification('Failed to initialize Shopify client. Please check your connection and try again.', 'error');
    }
  }
}

// Create new Shopify checkout
function createNewCheckout() {
  if (!shopifyClient) {
    console.error('❌ No Shopify client available for checkout creation');
    return;
  }

  shopifyClient.checkout.create().then((checkout) => {
    shopifyCheckout = checkout;
    localStorage.setItem('shopifyCheckoutId', checkout.id);
    console.log('✅ New checkout created:', checkout.id);
  }).catch((error) => {
    console.error('❌ Failed to create checkout:', error);
  });
}

// Redirect to Shopify checkout
function redirectToShopifyCheckout() {
  if (!shopifyCheckout) {
    console.error('❌ No Shopify checkout available');
    return;
  }

  if (shopifyCheckout && shopifyCheckout.webUrl) {
    console.log('🛒 Redirecting to checkout:', shopifyCheckout.webUrl);
    window.location.href = shopifyCheckout.webUrl;
  } else {
    console.error('❌ No checkout URL available');
  }
}

// Override the checkout button to use Shopify
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

      // Redirect to Shopify checkout
      redirectToShopifyCheckout();
    });
  } else {
    console.warn('⚠️ Checkout button not found');
  }
}

// Health check function
function performHealthCheck() {
  console.log('🏥 Performing Shopify integration health check...');
  
  const checks = {
    sdkLoaded: !!window.ShopifyBuy,
    clientInitialized: !!shopifyClient,
    checkoutAvailable: !!shopifyCheckout,
    domain: SHOPIFY_CONFIG.domain
  };
  
  console.log('📊 Health Check Results:', checks);
  return checks;
}

// Initialize Shopify integration when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Initializing Shopify integration...');
  
  // Load Shopify SDK and initialize
  loadShopifySDK(() => {
    initializeShopifyClient();

    // Override checkout button after a delay
    setTimeout(overrideCheckoutButton, 1000);

    // Fetch products
    fetchProducts();
    
    // Perform health check after initialization
    setTimeout(performHealthCheck, 2000);
  });
});

// Export functions for debugging
window.shopifyDebug = {
  fetchProducts,
  performHealthCheck,
  initializeShopifyClient,
  createNewCheckout,
  redirectToShopifyCheckout,
  getConfig: () => SHOPIFY_CONFIG,
  getClient: () => shopifyClient,
  getCheckout: () => shopifyCheckout,
  showDeploymentMessage: () => {
    console.error('⚠️ This app requires deployment to Netlify to function properly.');
    if (typeof showNotification === 'function') {
      showNotification('This app requires deployment to Netlify to function. Local testing is not supported.', 'error');
    }
  }
};