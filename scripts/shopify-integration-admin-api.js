// Shopify Integration using Admin API approach
// This version uses the Admin API via Netlify functions for better reliability
// No local fallbacks or mockup data

// Global variables
let shopifyClient = null;
let shopifyCheckout = null;

// Configuration for Admin API approach
const SHOPIFY_CONFIG = {
  // Using standard domain (no certificate issues)
  domain: 'bobbytherabbit.myshopify.com',
  // Still need Storefront token for Buy SDK (checkout functionality)
  storefrontAccessToken: '8c6bd66766da4553701a1f1fe7d94dc4',
  apiVersion: '2024-01'
};

// Enhanced fetch with retry logic
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`🔄 Attempt ${i + 1}: Fetching ${url}`);
      const response = await fetch(url, options);
      
      if (response.ok) {
        console.log(`✅ Success on attempt ${i + 1}`);
        return response;
      } else {
        console.warn(`⚠️ Attempt ${i + 1} failed with status: ${response.status}`);
        if (i === maxRetries - 1) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }
    } catch (error) {
      console.warn(`⚠️ Attempt ${i + 1} failed:`, error.message);
      if (i === maxRetries - 1) {
        throw error;
      }
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
}

// Function to fetch products using Admin API via Netlify function
async function fetchProducts() {
  console.log('🚀 Starting product fetch using Admin API approach...');
  
  try {
    console.log('📡 Trying Admin API via Netlify function...');
    
    const response = await fetchWithRetry('/.netlify/functions/get-products-admin-api', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (data.error) {
      console.error('❌ Admin API function returned error:', data.error);
      console.log('🔧 Troubleshooting info:', data.troubleshooting);
      
      // Show user-friendly error message
      showErrorMessage('Admin API Error', data.error, data.troubleshooting);
      throw new Error(data.error);
    }

    console.log('✅ Products loaded from Admin API:', data);
    console.log(`📊 Found ${data.meta?.count || 0} products from ${data.meta?.source || 'Unknown source'}`);
    
    // Process the product data
    processProductData(data.products || []);
    
    // Show success message
    showSuccessMessage(`Successfully loaded ${data.meta?.count || 0} products from Admin API`);
    
    return data.products;

  } catch (error) {
    console.error('❌ Admin API fetch failed:', error.message);
    console.error('⚠️ IMPORTANT: Shopify API only works when deployed to Netlify.');
    console.error('⚠️ Please deploy to Netlify to test with real products.');
    
    showErrorMessage('API Connection Error', 
      'Unable to fetch product data. This app requires deployment to Netlify to function properly.',
      'Local testing of Shopify API functionality is not supported.');
    
    return null;
  }
}

// Process product data from API
function processProductData(products) {
  try {
    if (!products || products.length === 0) {
      console.warn('⚠️ No products received from API');
      return;
    }

    // Generate mapping
    const mapping = {};
    products.forEach(product => {
      const productNode = product.node || product;
      mapping[productNode.title] = productNode.id;
    });

    console.log('📋 Generated Product Mapping:');
    console.log(mapping);

    // Store the mapping with timestamp
    const mappingData = {
      mapping: mapping,
      timestamp: Date.now(),
      source: 'Admin API',
      count: products.length
    };
    
    localStorage.setItem('shopifyProductMapping', JSON.stringify(mappingData));
    console.log('💾 Saved product mapping to localStorage');

  } catch (error) {
    console.error('❌ Error processing product data:', error);
  }
}

// Load Shopify Buy Button SDK (still needed for checkout)
function loadShopifySDK(callback) {
  if (window.ShopifyBuy) {
    console.log('✅ Shopify Buy SDK already loaded');
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
    showErrorMessage('SDK Load Error', 
      'Failed to load Shopify checkout functionality. This app requires deployment to Netlify to function properly.');
  };
  
  document.head.appendChild(script);
}

// Initialize Shopify client (for checkout only)
function initializeShopifyClient() {
  if (!window.ShopifyBuy) {
    console.error('❌ Shopify Buy SDK not loaded');
    return;
  }

  try {
    console.log('🔧 Initializing Shopify client for checkout...');
    console.log('🏪 Using domain:', SHOPIFY_CONFIG.domain);
    
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
          console.log('🔄 Previous checkout completed, creating new one');
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
    showErrorMessage('Client Init Error', 
      'Failed to initialize Shopify checkout client. This app requires deployment to Netlify to function properly.');
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
    showErrorMessage('Checkout Error', 
      'Failed to create shopping cart. This app requires deployment to Netlify to function properly.');
  });
}

// Redirect to Shopify checkout
function redirectToShopifyCheckout() {
  if (!shopifyCheckout) {
    console.error('❌ No Shopify checkout available');
    showErrorMessage('Checkout Error', 'Shopping cart not available');
    return;
  }

  if (shopifyCheckout && shopifyCheckout.webUrl) {
    console.log('🛒 Redirecting to checkout:', shopifyCheckout.webUrl);
    window.location.href = shopifyCheckout.webUrl;
  } else {
    console.error('❌ No checkout URL available');
    showErrorMessage('Checkout Error', 'Checkout URL not available');
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

// UI Helper Functions
function showErrorMessage(title, message, details = null) {
  console.error(`❌ ${title}: ${message}`);
  // You can implement UI notifications here
  if (details) {
    console.log('🔧 Troubleshooting details:', details);
  }
}

function showSuccessMessage(message) {
  console.log(`✅ ${message}`);
  // You can implement UI notifications here
}

function showWarningMessage(title, message) {
  console.warn(`⚠️ ${title}: ${message}`);
  // You can implement UI notifications here
}

// Health check function
function performHealthCheck() {
  console.log('🏥 Performing Shopify integration health check...');
  
  const checks = {
    sdkLoaded: !!window.ShopifyBuy,
    clientInitialized: !!shopifyClient,
    checkoutAvailable: !!shopifyCheckout,
    domain: SHOPIFY_CONFIG.domain,
    apiVersion: SHOPIFY_CONFIG.apiVersion,
    lastProductFetch: localStorage.getItem('shopifyProductMapping') ? 
      JSON.parse(localStorage.getItem('shopifyProductMapping')).timestamp : 'Never'
  };
  
  console.log('📊 Health Check Results:', checks);
  return checks;
}

// Test Admin API function
async function testAdminAPI() {
  console.log('🧪 Testing Admin API function...');
  
  try {
    const response = await fetch('/.netlify/functions/get-products-admin-api');
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ Admin API test failed:', data.error);
      return { success: false, error: data.error, details: data.troubleshooting };
    } else {
      console.log('✅ Admin API test successful:', data.meta);
      return { success: true, data: data.meta };
    }
  } catch (error) {
    console.error('❌ Admin API test error:', error);
    console.error('⚠️ IMPORTANT: This app requires deployment to Netlify to function properly.');
    return { success: false, error: error.message };
  }
}

// Initialize Shopify integration when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Initializing Shopify integration with Admin API approach...');
  console.log('⚠️ IMPORTANT: This app requires deployment to Netlify to function properly.');
  
  // Load Shopify SDK and initialize (for checkout functionality)
  loadShopifySDK(() => {
    initializeShopifyClient();

    // Override checkout button after a delay
    setTimeout(overrideCheckoutButton, 1000);

    // Fetch products using Admin API
    fetchProducts();
    
    // Perform health check after initialization
    setTimeout(performHealthCheck, 3000);
  });
});

// Export functions for debugging
window.shopifyDebug = {
  fetchProducts,
  performHealthCheck,
  testAdminAPI,
  initializeShopifyClient,
  createNewCheckout,
  redirectToShopifyCheckout,
  getConfig: () => SHOPIFY_CONFIG,
  getClient: () => shopifyClient,
  getCheckout: () => shopifyCheckout,
  getStoredMapping: () => {
    const stored = localStorage.getItem('shopifyProductMapping');
    return stored ? JSON.parse(stored) : null;
  },
  showDeploymentMessage: () => {
    console.error('⚠️ This app requires deployment to Netlify to function properly.');
    showErrorMessage('Deployment Required', 
      'This app must be deployed to Netlify to connect with Shopify API.',
      'Local testing is not supported.');
  }
};

console.log('🔧 Shopify Debug functions available at window.shopifyDebug');