/**
 * Consolidated Shopify Integration for Bobby Streetwear
 * Combines functionality from all previous integration files
 */

// Product mapping from Shopify products to site products
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

// Configuration with fallback domains
const SHOPIFY_CONFIG = {
  domains: [
    'mfdkk3-7g.myshopify.com',  // Primary domain
  ],
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

// Function to fetch products with multiple fallback strategies
async function fetchProducts() {
  console.log('🔄 Starting product fetch...');
  
  // Strategy 1: Try Netlify function first
  try {
    console.log('📡 Trying Netlify function...');
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
    return;

  } catch (error) {
    console.warn('⚠️ Netlify function failed:', error.message);
    console.log('🔄 Trying direct Shopify API...');
  }

  // Strategy 2: Try direct Shopify API with domain fallbacks
  for (const domain of SHOPIFY_CONFIG.domains) {
    try {
      console.log(`📡 Trying direct API with domain: ${domain}`);
      
      const productsQuery = `
        query Products {
          products(first: 50) {
            edges {
              node {
                id
                title
                handle
                description
                priceRange {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                }
                images(first: 3) {
                  edges {
                    node {
                      url
                      altText
                    }
                  }
                }
                variants(first: 20) {
                  edges {
                    node {
                      id
                      title
                      price {
                        amount
                        currencyCode
                      }
                      availableForSale
                      selectedOptions {
                        name
                        value
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const response = await fetchWithRetry(`https://${domain}/api/${SHOPIFY_CONFIG.apiVersion}/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': SHOPIFY_CONFIG.storefrontAccessToken,
          'Accept': 'application/json'
        },
        body: JSON.stringify({ query: productsQuery })
      });

      const data = await response.json();

      if (data.errors) {
        console.error('❌ GraphQL Errors:', data.errors);
        throw new Error('GraphQL errors: ' + JSON.stringify(data.errors));
      }

      console.log(`✅ Products loaded from direct API (${domain}):`, data);
      processProductData(data.data.products.edges);
      
      // Update config to use working domain
      SHOPIFY_CONFIG.workingDomain = domain;
      return;

    } catch (error) {
      console.warn(`⚠️ Direct API failed for ${domain}:`, error.message);
    }
  }

  // Strategy 3: Use hardcoded fallback data
  console.log('⚠️ All API methods failed, using hardcoded product mapping');
  console.log('📋 Using existing PRODUCT_MAPPING:', PRODUCT_MAPPING);
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

    // Store the mapping in localStorage
    localStorage.setItem('shopifyProductMapping', mappingCode);
    localStorage.setItem('shopifyProductMappingTimestamp', Date.now().toString());

  } catch (error) {
    console.error('❌ Error processing product data:', error);
  }
}

// Load Shopify Buy Button SDK with retry
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
    // Try alternative CDN or fallback
    const fallbackScript = document.createElement('script');
    fallbackScript.async = true;
    fallbackScript.src = 'https://cdn.jsdelivr.net/npm/shopify-buy@2/index.umd.min.js';
    fallbackScript.onload = callback;
    fallbackScript.onerror = () => {
      console.error('❌ All SDK loading attempts failed');
    };
    document.head.appendChild(fallbackScript);
  };
  
  document.head.appendChild(script);
}

// Initialize Shopify client with domain fallback
function initializeShopifyClient() {
  if (!window.ShopifyBuy) {
    console.error('❌ Shopify Buy SDK not loaded');
    return;
  }

  // Use working domain if available, otherwise try domains in order
  const domainToTry = SHOPIFY_CONFIG.workingDomain || SHOPIFY_CONFIG.domains[0];
  
  try {
    console.log(`🔧 Initializing Shopify client with domain: ${domainToTry}`);
    
    shopifyClient = window.ShopifyBuy.buildClient({
      domain: domainToTry,
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
    
    // Try fallback domain if available
    if (!SHOPIFY_CONFIG.workingDomain && SHOPIFY_CONFIG.domains.length > 1) {
      console.log('🔄 Trying fallback domain...');
      try {
        shopifyClient = window.ShopifyBuy.buildClient({
          domain: SHOPIFY_CONFIG.domains[1],
          storefrontAccessToken: SHOPIFY_CONFIG.storefrontAccessToken,
          apiVersion: SHOPIFY_CONFIG.apiVersion
        });
        SHOPIFY_CONFIG.workingDomain = SHOPIFY_CONFIG.domains[1];
        console.log('✅ Shopify client initialized with fallback domain');
        createNewCheckout();
      } catch (fallbackError) {
        console.error('❌ Fallback domain also failed:', fallbackError);
      }
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
    workingDomain: SHOPIFY_CONFIG.workingDomain || 'Not determined'
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
  PRODUCT_MAPPING
};