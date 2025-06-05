// Shopify Integration using Admin API approach
// This version uses the Admin API via Netlify functions for better reliability

let PRODUCT_MAPPING = {
  "bungi-x-bobby-rabbit-hardware-unisex-hoodie": {
    shopifyProductId: "BUNGI X BOBBY RABBIT HARDWARE Unisex Hoodie",
    variants: [
      {
        option1: "Black",
        sku: "9004018_10779",
        price: "50.00",
        image: "https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-premium-hoodie-black-front-683f9d11a7936.png?v=1748999462",
      },
      {
        option1: "Black",
        sku: "9004018_10780",
        price: "50.00",
        image: "https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-premium-hoodie-black-back-683f9d11a9742.png?v=1748999463",
      },
      {
        option1: "Black",
        sku: "9004018_10781",
        price: "50.00",
        image: "https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-premium-hoodie-navy-blazer-front-683f9d11ab4fe.png?v=1748999463",
      },
    ],
  },
  "bungi-x-bobby-lightmode-rabbit-hardware-unisex-hoodie": {
    shopifyProductId: "BUNGI X BOBBY LIGHTMODE RABBIT HARDWARE Unisex Hoodie",
    variants: [
      {
        option1: "S",
        sku: "4356716_10774",
        price: "50.50",
        image: "https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-premium-hoodie-white-front-683f9ce1094eb.png?v=1748999411",
      },
      {
        option1: "M",
        sku: "4356716_10775",
        price: "50.50",
        image: "https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-premium-hoodie-white-back-683f9ce10ab8f.png?v=1748999410",
      },
      {
        option1: "L",
        sku: "4356716_10776",
        price: "50.50",
        image: "https://cdn.shopify.com/s/files/1/0701/3947/8183/files/unisex-premium-hoodie-white-front-683f9ce1094eb.png?v=1748999411",
      },
    ],
  },
  "bungi-x-bobby-lightmode-rabbit-hardware-mens-t-shirt": {
    shopifyProductId: "BUNGI X BOBBY LIGHTMODE RABBIT HARDWARE Men's t-shirt",
    variants: [
      {
        option1: "XS",
        sku: "7836547_8850",
        price: "27.50",
        image: "https://cdn.shopify.com/s/files/1/0701/3947/8183/files/all-over-print-mens-crew-neck-t-shirt-white-front-683f9c9fdcac3.png?v=1748999335",
      },
      {
        option1: "S",
        sku: "7836547_8851",
        price: "27.50",
        image: "https://cdn.shopify.com/s/files/1/0701/3947/8183/files/all-over-print-mens-crew-neck-t-shirt-white-back-683f9c9fdd370.png?v=1748999335",
      },
      {
        option1: "M",
        sku: "7836547_8852",
        price: "27.50",
        image: "https://cdn.shopify.com/s/files/1/0701/3947/8183/files/all-over-print-mens-crew-neck-t-shirt-white-right-683f9c9fdd489.png?v=1748999335",
      },
    ],
  },
};

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
            return;
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
        
        // Fallback to hardcoded mapping
        console.log('🔄 Falling back to hardcoded product mapping...');
        showWarningMessage('Using Fallback Data', 'Could not fetch live product data. Using hardcoded product information.');
        
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
        showErrorMessage('SDK Load Error', 'Failed to load Shopify checkout functionality');
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
        showErrorMessage('Client Init Error', 'Failed to initialize Shopify checkout client');
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
        showErrorMessage('Checkout Error', 'Failed to create shopping cart');
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
        return { success: false, error: error.message };
    }
}

// Initialize Shopify integration when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Shopify integration with Admin API approach...');
    
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
    }
};

console.log('🔧 Shopify Debug functions available at window.shopifyDebug');