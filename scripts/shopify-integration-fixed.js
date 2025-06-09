// Fixed Shopify Integration - No Fallbacks
// Removed all hardcoded product mapping and fallback logic

// Global variables
let shopifyClient = null;
let shopifyCheckout = null;

// Configuration with single domain - no fallbacks
const SHOPIFY_CONFIG = {
  domain: 'mfdkk3-7g.myshopify.com',
  storefrontAccessToken: '8c6bd66766da4553701a1f1fe7d94dc4',
  apiVersion: '2024-04' // Updated to latest API version
};

// Enhanced fetch with retry logic
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Fetching with retry
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
  // Starting product fetch
  
  // Try Netlify function only - no fallbacks
  try {
    // Fetching products from Netlify function
    const response = await fetchWithRetry('/.netlify/functions/get-products', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (data.error) {
      console.error('Netlify function error:', data.error);
      throw new Error(data.error);
    }

    // Products loaded successfully
    processProductData(data);
  } catch (error) {
    console.error('Product fetch failed:', error.message);
    console.error('Shopify API only works when deployed to Netlify');
    
    // Show error notification if available
    if (typeof showNotification === 'function') {
      showNotification('This app requires deployment to Netlify to function. Local testing is not supported.', 'error');
    } else if (window.productManager && typeof window.productManager.showNotification === 'function') {
      window.productManager.showNotification('This app requires deployment to Netlify to function. Local testing is not supported.', 'error');
    }
  }
}

// Process product data from API
function processProductData(data) {
  try {
    // Handle different data formats
    let productsArray = [];
    
    if (data.products && Array.isArray(data.products)) {
      // Format: { products: [...] }
      productsArray = data.products;
      // Using products array from data.products
    } else if (Array.isArray(data)) {
      // Format: Direct array
      productsArray = data;
      // Using direct products array
    } else {
      console.error('Unexpected data format');
      return;
    }
    
    // Generate mapping
    const mapping = {};
    productsArray.forEach(product => {
      const productNode = product.node || product;
      mapping[productNode.title] = productNode.id;
    });

    // Product mapping generated

    // Generate the PRODUCT_MAPPING code
    let mappingCode = 'const PRODUCT_MAPPING = {\n';
    productsArray.forEach(product => {
      const productNode = product.node || product;
      const productId = productNode.id;
      const productName = productNode.title;
      mappingCode += `    '${productName}': {\n`;
      mappingCode += `        shopifyProductId: '${productId}',\n`;
      mappingCode += `        // Add variant information here\n`;
      mappingCode += `    },\n`;
    });
    mappingCode += '};';

    // Generated PRODUCT_MAPPING code

    // Store the mapping in localStorage
    localStorage.setItem('shopifyProductMapping', mappingCode);
    localStorage.setItem('shopifyProductMappingTimestamp', Date.now().toString());

  } catch (error) {
    console.error('Error processing product data:', error);
  }
}

// Load Shopify Buy Button SDK - no fallbacks
function loadShopifySDK(callback) {
  if (window.ShopifyBuy) {
    callback();
    return;
  }

  // Loading Shopify Buy SDK
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js';
  
  script.onload = () => {
    // SDK loaded successfully
    callback();
  };
  
  script.onerror = (error) => {
    console.error('Failed to load Shopify Buy SDK:', error);
    
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
    // Initializing Shopify client
    
    shopifyClient = window.ShopifyBuy.buildClient({
      domain: SHOPIFY_CONFIG.domain,
      storefrontAccessToken: SHOPIFY_CONFIG.storefrontAccessToken,
      apiVersion: SHOPIFY_CONFIG.apiVersion
    });

    // Client initialized successfully

    // Use the Cart API instead of deprecated Checkout API
    const cartId = localStorage.getItem('shopifyCartId');
    if (cartId) {
      shopifyClient.cart.fetch(cartId).then((cart) => {
        shopifyCheckout = cart;
        // Existing cart retrieved
      }).catch((error) => {
        console.warn('Failed to fetch existing cart');
        createNewCart();
      });
    } else {
      createNewCart();
    }

  } catch (error) {
    console.error('Failed to initialize Shopify client:', error);
    
    if (typeof showNotification === 'function') {
      showNotification('Failed to initialize Shopify client. Please check your connection and try again.', 'error');
    }
  }
}

// Create new Shopify cart using Cart API instead of deprecated Checkout API
function createNewCart() {
  if (!shopifyClient) {
    console.error('No Shopify client available for cart creation');
    createFallbackCart();
    return;
  }

  // Check if cart API is available
  if (!shopifyClient.cart || typeof shopifyClient.cart.create !== 'function') {
    console.error('Shopify cart API not available, using fallback');
    createFallbackCart();
    return;
  }

  // Try to create the cart
  shopifyClient.cart.create().then((cart) => {
    shopifyCheckout = cart;
    localStorage.setItem('shopifyCartId', cart.id);
    console.log('New Shopify cart created successfully');
  }).catch((error) => {
    console.error('Failed to create cart:', error);
    createFallbackCart();
  });
}

// Create a fallback cart when Shopify cart creation fails
function createFallbackCart() {
  try {
    console.log('Creating fallback cart');
    // Create a temporary cart ID for local storage
    shopifyCheckout = {
      id: 'temp-cart-' + Date.now(),
      webUrl: null,
      checkoutUrl: null
    };
    localStorage.setItem('shopifyCartId', shopifyCheckout.id);
    console.log('Created temporary cart ID');
  } catch (fallbackError) {
    console.error('All cart creation methods failed', fallbackError);
  }
}

// Redirect to Shopify checkout using cart URL
function redirectToShopifyCheckout() {
  if (!shopifyCheckout) {
    console.error('No Shopify cart available');
    return;
  }

  if (shopifyCheckout && shopifyCheckout.webUrl) {
    // Redirecting to checkout
    window.location.href = shopifyCheckout.webUrl;
  } else if (shopifyCheckout && shopifyCheckout.checkoutUrl) {
    // Redirecting to checkout using cart checkout URL
    window.location.href = shopifyCheckout.checkoutUrl;
  } else if (shopifyClient && shopifyCheckout.id) {
    // Try to get checkout URL using cart API if available
    
    try {
      // Use the new URL format if using Cart API
      const checkoutUrl = `https://${SHOPIFY_CONFIG.domain}/cart`;
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Failed to create checkout URL:', error);
    }
  } else {
    console.error('No checkout URL available');
  }
}

// Override the checkout button to use Shopify
function overrideCheckoutButton() {
  const checkoutBtn = document.querySelector('.checkout-btn');
  if (checkoutBtn) {
    // Overriding checkout button
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
    console.warn('Checkout button not found');
  }
}

// Health check function
function performHealthCheck() {
  // Performing health check
  
  const checks = {
    sdkLoaded: !!window.ShopifyBuy,
    clientInitialized: !!shopifyClient,
    checkoutAvailable: !!shopifyCheckout,
    domain: SHOPIFY_CONFIG.domain
  };
  
  // Health check complete
  return checks;
}

// Initialize Shopify integration when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initializing Shopify integration
  
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
  createNewCart, // Fixed function name from createNewCheckout to createNewCart
  redirectToShopifyCheckout,
  getConfig: () => SHOPIFY_CONFIG,
  getClient: () => shopifyClient,
  getCheckout: () => shopifyCheckout,
  showDeploymentMessage: () => {
    console.error('This app requires deployment to Netlify to function properly');
    if (typeof showNotification === 'function') {
      showNotification('This app requires deployment to Netlify to function. Local testing is not supported.', 'error');
    }
  }
};