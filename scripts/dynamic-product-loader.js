/**
 * Dynamic Product Loader
 * 
 * This script fetches real products and variants directly from Shopify
 * using the Storefront API, then renders them with valid variant IDs.
 */

class DynamicProductLoader {
  constructor(options = {}) {
    // Configuration with defaults
    this.config = {
      shopifyDomain: options.shopifyDomain || 'your-store.myshopify.com', // Replace with your store
      storefrontToken: options.storefrontToken || '', // Add your token from Shopify admin
      apiVersion: options.apiVersion || '2024-04',
      productLimit: options.productLimit || 10,
      variantLimit: options.variantLimit || 5,
      container: options.container || '.product-grid',
      productTemplate: options.productTemplate || this.defaultProductTemplate,
      onProductsLoaded: options.onProductsLoaded || function() {},
      loadOnInit: options.loadOnInit !== false
    };
    
    // Initialize if requested
    if (this.config.loadOnInit) {
      this.init();
    }
  }
  
  // Initialize the loader
  init() {
    console.log('🔄 Initializing Dynamic Product Loader...');
    
    // Create container if it doesn't exist
    if (!document.querySelector(this.config.container)) {
      console.warn(`Container ${this.config.container} not found, creating it`);
      const container = document.createElement('div');
      container.className = this.config.container.replace('.', '');
      document.body.appendChild(container);
    }
    
    // Load products if we have credentials
    if (this.config.storefrontToken && this.config.shopifyDomain) {
      this.loadProducts();
    } else {
      console.warn('⚠️ Missing Shopify credentials. Set shopifyDomain and storefrontToken.');
      this.renderDummyProducts();
    }
  }
  
  // Load products from Shopify
  async loadProducts() {
    try {
      console.log('🔄 Loading products from Shopify...');
      
      // Build GraphQL query
      const query = `
        {
          products(first: ${this.config.productLimit}) {
            edges {
              node {
                id
                title
                description
                handle
                featuredImage {
                  url
                }
                variants(first: ${this.config.variantLimit}) {
                  edges {
                    node {
                      id
                      title
                      price {
                        amount
                      }
                      image {
                        url
                      }
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
      
      // Execute the query
      const response = await fetch(`https://${this.config.shopifyDomain}/api/${this.config.apiVersion}/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': this.config.storefrontToken
        },
        body: JSON.stringify({ query })
      });
      
      // Check for errors
      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
      }
      
      // Parse the response
      const data = await response.json();
      
      // Check for GraphQL errors
      if (data.errors) {
        throw new Error(`GraphQL error: ${data.errors[0].message}`);
      }
      
      // Extract the products
      const products = data.data.products.edges.map(edge => edge.node);
      console.log(`✅ Loaded ${products.length} products from Shopify`);
      
      // Render the products
      this.renderProducts(products);
      
      // Call the callback
      this.config.onProductsLoaded(products);
      
      return products;
    } catch (error) {
      console.error('❌ Error loading products:', error);
      this.renderDummyProducts();
      return [];
    }
  }
  
  // Render products to the page
  renderProducts(products) {
    const container = document.querySelector(this.config.container);
    if (!container) {
      console.error(`❌ Container ${this.config.container} not found`);
      return;
    }
    
    // Clear existing content
    container.innerHTML = '';
    
    // Render each product
    products.forEach(product => {
      // Get the first variant (or skip if no variants)
      const firstVariant = product.variants?.edges[0]?.node;
      if (!firstVariant) {
        console.warn(`⚠️ Product ${product.title} has no variants, skipping`);
        return;
      }
      
      // Get variant details
      const variantId = firstVariant.id;
      const price = parseFloat(firstVariant.price.amount);
      const imageUrl = firstVariant.image?.url || product.featuredImage?.url || 'assets/product-placeholder.png';
      
      // Create product element
      const productElement = document.createElement('div');
      productElement.className = 'product-card';
      productElement.innerHTML = this.config.productTemplate({
        id: variantId,
        title: product.title,
        price: price,
        image: imageUrl,
        description: product.description || '',
        handle: product.handle,
        variant: firstVariant
      });
      
      // Add to container
      container.appendChild(productElement);
    });
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  // Render dummy products for testing/fallback
  renderDummyProducts() {
    console.warn('⚠️ Rendering dummy products (for testing only)');
    
    const dummyProducts = [
      {
        title: 'Black Hoodie',
        price: 59.99,
        image: 'assets/hoodie-black.png',
        id: 'gid://shopify/ProductVariant/44713213274763'
      },
      {
        title: 'Navy Hoodie',
        price: 59.99,
        image: 'assets/hoodie-navy.png',
        id: 'gid://shopify/ProductVariant/44713213307531'
      },
      {
        title: 'Maroon Hoodie',
        price: 59.99,
        image: 'assets/hoodie-maroon.png',
        id: 'gid://shopify/ProductVariant/44713213340299'
      }
    ];
    
    this.renderProducts(dummyProducts.map(p => ({
      title: p.title,
      variants: {
        edges: [{
          node: {
            id: p.id,
            price: { amount: p.price },
            image: { url: p.image }
          }
        }]
      }
    })));
  }
  
  // Set up event listeners for products
  setupEventListeners() {
    // Add to cart buttons
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
      button.addEventListener('click', event => {
        const productId = button.getAttribute('data-product-id');
        const productTitle = button.getAttribute('data-product-title');
        const productPrice = parseFloat(button.getAttribute('data-product-price'));
        const productImage = button.getAttribute('data-product-image');
        
        // Create product object
        const product = {
          id: productId, // This is the Shopify variant ID in GID format
          title: productTitle,
          price: productPrice,
          image: productImage,
          quantity: 1,
          selectedColor: button.getAttribute('data-product-color') || 'Default',
          selectedSize: button.getAttribute('data-product-size') || 'OS'
        };
        
        console.log(`Adding product to cart: ${product.title} (ID: ${product.id})`);
        
        // Add to cart using available cart system
        if (window.BobbyCart && typeof window.BobbyCart.addItem === 'function') {
          window.BobbyCart.addItem(product);
        } else if (window.cartManager && typeof window.cartManager.addItem === 'function') {
          window.cartManager.addItem(product);
        } else {
          console.error('No cart system available to add item');
        }
        
        // Visual feedback
        button.textContent = 'Added!';
        setTimeout(() => button.textContent = 'Add to Cart', 1500);
      });
    });
  }
  
  // Default product template
  defaultProductTemplate(product) {
    return `
      <div class="product-image-container">
        <img src="${product.image}" alt="${product.title}" class="product-image">
      </div>
      <div class="product-details">
        <h3 class="product-title">${product.title}</h3>
        <div class="product-price">$${product.price.toFixed(2)}</div>
        <button class="add-to-cart-btn"
          data-product-id="${product.id}"
          data-product-title="${product.title}"
          data-product-price="${product.price}"
          data-product-image="${product.image}">
          Add to Cart
        </button>
      </div>
    `;
  }
}

// Make available globally
window.DynamicProductLoader = DynamicProductLoader;

// Auto initialize when included on page with data attributes
document.addEventListener('DOMContentLoaded', () => {
  // Check for auto-init
  const autoInit = document.querySelector('[data-dynamic-product-loader="auto"]');
  if (autoInit) {
    // Get configuration from data attributes
    const config = {
      shopifyDomain: autoInit.getAttribute('data-shopify-domain'),
      storefrontToken: autoInit.getAttribute('data-storefront-token'),
      apiVersion: autoInit.getAttribute('data-api-version'),
      productLimit: parseInt(autoInit.getAttribute('data-product-limit'), 10) || 10,
      container: autoInit.getAttribute('data-container') || '.product-grid'
    };
    
    // Initialize with configuration
    new DynamicProductLoader(config);
  }
});