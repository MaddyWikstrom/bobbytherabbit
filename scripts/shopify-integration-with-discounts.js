// Enhanced Shopify Integration with Admin API Discount Support
// Combines existing Shopify integration with advanced discount calculation

// Global variables
let shopifyClient = null;
let shopifyCheckout = null;

// Configuration with single domain - no fallbacks
const SHOPIFY_CONFIG = {
  domain: 'mfdkk3-7g.myshopify.com',
  storefrontAccessToken: '8c6bd66766da4553701a1f1fe7d94dc4',
  apiVersion: '2024-04'
};

// Enhanced fetch with retry logic
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
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
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

// Enhanced product fetching with discount integration
async function fetchProductsWithDiscounts() {
  console.log('🛍️ Starting enhanced product fetch with discounts...');
  
  try {
    // Fetch products from Netlify function
    console.log('📦 Fetching products from Storefront API...');
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

    console.log(`✅ Products loaded successfully: ${data.products?.length || 0} products`);

    // Apply discounts if discount calculator is available
    let productsWithDiscounts = data.products || [];
    
    if (window.discountCalculator) {
      console.log('💰 Applying discount calculations...');
      try {
        productsWithDiscounts = await window.discountCalculator.applyDiscountsToProducts(data.products || []);
        console.log('✅ Discounts applied successfully');
      } catch (discountError) {
        console.warn('⚠️ Discount calculation failed, continuing without discounts:', discountError.message);
        // Continue with original products if discount calculation fails
      }
    } else {
      console.log('ℹ️ Discount calculator not available, loading products without discount info');
    }

    // Process and display products
    processEnhancedProductData({
      ...data,
      products: productsWithDiscounts
    });

  } catch (error) {
    console.error('❌ Product fetch failed:', error.message);
    console.error('🚀 Shopify API only works when deployed to Netlify');
    
    // Show error notification
    if (typeof showNotification === 'function') {
      showNotification('This app requires deployment to Netlify to function. Local testing is not supported.', 'error');
    } else if (window.productManager && typeof window.productManager.showNotification === 'function') {
      window.productManager.showNotification('This app requires deployment to Netlify to function. Local testing is not supported.', 'error');
    }
  }
}

// Enhanced product data processing with discount support
function processEnhancedProductData(data) {
  try {
    let productsArray = [];
    
    if (data.products && Array.isArray(data.products)) {
      productsArray = data.products;
    } else if (Array.isArray(data)) {
      productsArray = data;
    } else {
      console.error('Unexpected data format');
      return;
    }
    
    console.log(`🔄 Processing ${productsArray.length} products with discount information...`);

    // Generate enhanced mapping with discount info
    const mapping = {};
    productsArray.forEach(product => {
      const productNode = product.node || product;
      mapping[productNode.title] = {
        shopifyProductId: productNode.id,
        hasDiscount: product.discountInfo?.hasDiscount || false,
        discountInfo: product.discountInfo || null
      };
    });

    console.log('📊 Enhanced product mapping generated with discount data');

    // Store enhanced mapping
    localStorage.setItem('shopifyProductMapping', JSON.stringify(mapping));
    localStorage.setItem('shopifyProductMappingTimestamp', Date.now().toString());

    // Trigger product display updates
    if (typeof updateProductDisplays === 'function') {
      updateProductDisplays(productsArray);
    }

    // Trigger discount UI updates
    if (window.discountCalculator) {
      setTimeout(() => {
        window.discountCalculator.updateProductCards();
      }, 500);
    }

  } catch (error) {
    console.error('❌ Error processing enhanced product data:', error);
  }
}

// Enhanced product card rendering with discount support
function renderEnhancedProductCard(product) {
  const productNode = product.node || product;
  const discountInfo = product.discountInfo;
  
  // Generate discount elements if available
  let discountBadge = '';
  let priceDisplay = '';
  
  if (window.discountCalculator && discountInfo) {
    discountBadge = window.discountCalculator.generateDiscountBadge(discountInfo);
    priceDisplay = window.discountCalculator.generatePriceDisplay(product, discountInfo);
  } else {
    // Fallback price display
    const price = productNode.priceRange?.minVariantPrice?.amount || 0;
    const currencyCode = productNode.priceRange?.minVariantPrice?.currencyCode || 'USD';
    priceDisplay = `
      <div class="price-display">
        <span class="current-price">${formatPrice(price, currencyCode)}</span>
      </div>
    `;
  }

  return `
    <div class="product-card enhanced-product" data-product='${JSON.stringify(productNode)}'>
      ${discountBadge}
      <div class="product-image">
        <img src="${productNode.featuredImage?.url || '/assets/product-placeholder.png'}" 
             alt="${productNode.featuredImage?.altText || productNode.title}"
             loading="lazy">
      </div>
      <div class="product-info">
        <h3 class="product-title">${productNode.title}</h3>
        <p class="product-description">${truncateText(productNode.description, 100)}</p>
        ${priceDisplay}
        <button class="add-to-cart-btn" onclick="addToCart('${productNode.id}')">
          Add to Cart
        </button>
      </div>
    </div>
  `;
}

// Utility function for price formatting
function formatPrice(amount, currencyCode = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

// Utility function for text truncation
function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

// Load Shopify Buy Button SDK
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
    console.log('✅ Shopify SDK loaded successfully');
    callback();
  };
  
  script.onerror = (error) => {
    console.error('❌ Failed to load Shopify Buy SDK:', error);
    
    if (typeof showNotification === 'function') {
      showNotification('Failed to load Shopify SDK. Please check your connection and try again.', 'error');
    }
  };
  
  document.head.appendChild(script);
}

// Initialize enhanced Shopify client
function initializeEnhancedShopifyClient() {
  if (!window.ShopifyBuy) {
    console.error('❌ Shopify Buy SDK not loaded');
    return;
  }
  
  try {
    console.log('🔧 Initializing enhanced Shopify client...');
    
    shopifyClient = window.ShopifyBuy.buildClient({
      domain: SHOPIFY_CONFIG.domain,
      storefrontAccessToken: SHOPIFY_CONFIG.storefrontAccessToken,
      apiVersion: SHOPIFY_CONFIG.apiVersion
    });

    console.log('✅ Shopify client initialized successfully');

    // Initialize cart
    const cartId = localStorage.getItem('shopifyCartId');
    
    if (!shopifyClient.cart || typeof shopifyClient.cart.fetch !== 'function') {
      console.warn('⚠️ Shopify cart API not available');
      createFallbackCart();
      return;
    }
    
    if (cartId) {
      try {
        shopifyClient.cart.fetch(cartId)
          .then((cart) => {
            shopifyCheckout = cart;
            console.log('✅ Existing cart retrieved successfully');
          })
          .catch((error) => {
            console.warn('⚠️ Failed to fetch existing cart:', error);
            createNewCart();
          });
      } catch (error) {
        console.error('❌ Error accessing cart.fetch:', error);
        createFallbackCart();
      }
    } else {
      createNewCart();
    }

  } catch (error) {
    console.error('❌ Failed to initialize Shopify client:', error);
    
    if (typeof showNotification === 'function') {
      showNotification('Failed to initialize Shopify client. Please check your connection and try again.', 'error');
    }
  }
}

// Create new Shopify cart
function createNewCart() {
  if (!shopifyClient || !shopifyClient.cart || typeof shopifyClient.cart.create !== 'function') {
    console.error('❌ Shopify cart API not available, using fallback');
    createFallbackCart();
    return;
  }

  shopifyClient.cart.create().then((cart) => {
    shopifyCheckout = cart;
    localStorage.setItem('shopifyCartId', cart.id);
    console.log('✅ New Shopify cart created successfully');
  }).catch((error) => {
    console.error('❌ Failed to create cart:', error);
    createFallbackCart();
  });
}

// Create fallback cart
function createFallbackCart() {
  try {
    console.log('🔄 Creating fallback cart');
    shopifyCheckout = {
      id: 'temp-cart-' + Date.now(),
      webUrl: null,
      checkoutUrl: null
    };
    localStorage.setItem('shopifyCartId', shopifyCheckout.id);
    console.log('✅ Created temporary cart ID');
  } catch (fallbackError) {
    console.error('❌ All cart creation methods failed', fallbackError);
  }
}

// Enhanced checkout redirect
function redirectToShopifyCheckout() {
  if (!shopifyCheckout) {
    console.error('❌ No Shopify cart available');
    return;
  }

  console.log('🛒 Redirecting to Shopify checkout...');

  if (shopifyCheckout && shopifyCheckout.webUrl) {
    window.location.href = shopifyCheckout.webUrl;
  } else if (shopifyCheckout && shopifyCheckout.checkoutUrl) {
    window.location.href = shopifyCheckout.checkoutUrl;
  } else if (shopifyClient && shopifyCheckout.id) {
    try {
      const checkoutUrl = `https://${SHOPIFY_CONFIG.domain}/cart`;
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('❌ Failed to create checkout URL:', error);
    }
  } else {
    console.error('❌ No checkout URL available');
  }
}

// Override checkout button with enhanced functionality
function overrideCheckoutButton() {
  const checkoutBtn = document.querySelector('.checkout-btn');
  if (checkoutBtn) {
    console.log('🔧 Overriding checkout button with enhanced functionality');
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

// Enhanced health check
function performEnhancedHealthCheck() {
  console.log('🔍 Performing enhanced health check...');
  
  const checks = {
    sdkLoaded: !!window.ShopifyBuy,
    clientInitialized: !!shopifyClient,
    checkoutAvailable: !!shopifyCheckout,
    discountCalculatorAvailable: !!window.discountCalculator,
    domain: SHOPIFY_CONFIG.domain,
    timestamp: new Date().toISOString()
  };
  
  console.log('📊 Health check results:', checks);
  return checks;
}

// Initialize enhanced Shopify integration
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Initializing enhanced Shopify integration with discount support...');
  
  // Load Shopify SDK and initialize
  loadShopifySDK(() => {
    initializeEnhancedShopifyClient();

    // Override checkout button after a delay
    setTimeout(overrideCheckoutButton, 1000);

    // Wait for discount calculator to be ready, then fetch products
    const initProducts = () => {
      if (window.discountCalculator) {
        console.log('💰 Discount calculator ready, fetching products with discount support...');
        fetchProductsWithDiscounts();
      } else {
        console.log('⏳ Waiting for discount calculator...');
        setTimeout(initProducts, 500);
      }
    };

    // Start product initialization
    setTimeout(initProducts, 1000);
    
    // Perform health check after initialization
    setTimeout(performEnhancedHealthCheck, 3000);
  });
});

// Export enhanced functions for debugging
window.shopifyEnhancedDebug = {
  fetchProductsWithDiscounts,
  performEnhancedHealthCheck,
  initializeEnhancedShopifyClient,
  createNewCart,
  redirectToShopifyCheckout,
  renderEnhancedProductCard,
  getConfig: () => SHOPIFY_CONFIG,
  getClient: () => shopifyClient,
  getCheckout: () => shopifyCheckout,
  showDeploymentMessage: () => {
    console.error('🚀 This app requires deployment to Netlify to function properly');
    if (typeof showNotification === 'function') {
      showNotification('This app requires deployment to Netlify to function. Local testing is not supported.', 'error');
    }
  }
};

// Backward compatibility
window.shopifyDebug = window.shopifyEnhancedDebug;