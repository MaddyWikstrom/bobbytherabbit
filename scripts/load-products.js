/**
 * Simplified Product Loader for Bobby Streetwear
 * Fetches products directly from Shopify and renders them with valid variant IDs
 */

// ============ UPDATE THESE VALUES ============
const SHOPIFY_DOMAIN = 'your-store.myshopify.com'; // <-- update this
const SHOPIFY_TOKEN = 'your-storefront-access-token'; // <-- update this
// ============================================

const API_VERSION = '2024-04';

async function loadProductsAndRender() {
  // Show loading state
  const grid = document.querySelector('.product-grid');
  if (grid) {
    grid.innerHTML = `
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading products from Shopify...</p>
      </div>
    `;
  }

  try {
    // GraphQL query to get products and their first variant
    const query = `
      {
        products(first: 6) {
          edges {
            node {
              title
              variants(first: 1) {
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
                  }
                }
              }
            }
          }
        }
      }
    `;

    // Fetch products from Shopify
    const res = await fetch(`https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_TOKEN,
      },
      body: JSON.stringify({ query }),
    });

    // Check if the request was successful
    if (!res.ok) {
      throw new Error(`Shopify API error: ${res.status} ${res.statusText}`);
    }

    // Parse the response
    const result = await res.json();
    
    // Check for GraphQL errors
    if (result.errors) {
      throw new Error(`GraphQL error: ${result.errors[0].message}`);
    }

    // Get the products from the response
    const products = result.data.products.edges;
    console.log(`✅ Loaded ${products.length} products from Shopify`);

    // Clear the grid
    if (grid) {
      grid.innerHTML = '';

      // Render each product
      products.forEach(({ node }) => {
        const variant = node.variants.edges[0]?.node;
        if (!variant) return;

        // Create product card HTML
        const html = `
          <div class="product-card">
            <div class="product-image-container">
              <img src="${variant.image?.url || 'assets/product-placeholder.png'}" class="product-image" alt="${node.title}">
            </div>
            <div class="product-details">
              <h3 class="product-title">${node.title}</h3>
              <div class="product-price">$${parseFloat(variant.price.amount).toFixed(2)}</div>
              <button class="add-to-cart-btn"
                data-product-id="${variant.id}"
                data-product-title="${node.title}"
                data-product-price="${variant.price.amount}"
                data-product-image="${variant.image?.url || 'assets/product-placeholder.png'}">
                Add to Cart
              </button>
            </div>
          </div>
        `;
        
        // Add the product to the grid
        grid.insertAdjacentHTML('beforeend', html);
      });

      // Add event listeners to the cart buttons
      attachCartListeners();
    }
  } catch (error) {
    console.error('❌ Error loading products:', error);
    
    // Show error message
    if (grid) {
      grid.innerHTML = `
        <div class="error-container">
          <p>Error loading products: ${error.message}</p>
          <button class="retry-btn">Retry</button>
        </div>
      `;
      
      // Add retry button listener
      const retryBtn = grid.querySelector('.retry-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', loadProductsAndRender);
      }
    }
  }
}

// Add to cart functionality
function attachCartListeners() {
  document.querySelectorAll('.add-to-cart-btn').forEach(button => {
    button.addEventListener('click', function() {
      // Get product data from button attributes
      const product = {
        id: this.getAttribute('data-product-id'),
        title: this.getAttribute('data-product-title'),
        price: parseFloat(this.getAttribute('data-product-price')),
        image: this.getAttribute('data-product-image'),
        quantity: 1
      };
      
      console.log(`Adding product to cart: ${product.title} (ID: ${product.id})`);
      
      // Add to cart using Bobby's cart system
      if (window.BobbyCart && typeof window.BobbyCart.addItem === 'function') {
        window.BobbyCart.addItem(product);
      } else if (window.cartManager && typeof window.cartManager.addItem === 'function') {
        window.cartManager.addItem(product);
      } else {
        console.error('No cart system available to add item');
        alert('Cart system not available');
      }
      
      // Visual feedback
      this.textContent = 'Added!';
      setTimeout(() => this.textContent = 'Add to Cart', 1500);
    });
  });
}

// Load products when the script is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Check if we should auto-load
  const autoLoadElement = document.querySelector('[data-auto-load="true"]');
  if (autoLoadElement || !document.querySelector('.no-auto-load')) {
    loadProductsAndRender();
  }
  
  // Add global function to window for manual loading
  window.loadBobbyProducts = loadProductsAndRender;
});