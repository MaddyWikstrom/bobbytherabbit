/**
 * Shopify Product Loader
 * This script loads products with correct Shopify variant IDs directly from the Storefront API
 */

// Configuration (replace with your actual values)
const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || 'your-store.myshopify.com';
const SHOPIFY_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN || 'your-storefront-access-token';
const API_VERSION = '2024-04';

/**
 * Load products from Shopify with proper variant IDs and render them to the page
 * @param {string} containerSelector - CSS selector for the container to render products into
 * @param {number} limit - Number of products to load (default: 8)
 * @param {string} collectionHandle - Optional collection handle to filter products
 */
async function loadProductsAndRender(containerSelector = '.product-grid', limit = 8, collectionHandle = null) {
  console.log(`🔄 Loading products from Shopify (limit: ${limit}${collectionHandle ? `, collection: ${collectionHandle}` : ''})`);
  
  const container = document.querySelector(containerSelector);
  if (!container) {
    console.error(`❌ Product container not found: ${containerSelector}`);
    return;
  }
  
  // Show loading state
  container.innerHTML = '<div class="loading-products">Loading products...</div>';
  
  try {
    // Build the GraphQL query based on whether we're fetching from a collection or not
    let query;
    
    if (collectionHandle) {
      query = `
        {
          collection(handle: "${collectionHandle}") {
            products(first: ${limit}) {
              edges {
                node {
                  id
                  title
                  handle
                  description
                  variants(first: 10) {
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
                        availableForSale
                      }
                    }
                  }
                  images(first: 5) {
                    edges {
                      node {
                        url
                        altText
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;
    } else {
      query = `
        {
          products(first: ${limit}) {
            edges {
              node {
                id
                title
                handle
                description
                variants(first: 10) {
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
                      availableForSale
                    }
                  }
                }
                images(first: 5) {
                  edges {
                    node {
                      url
                      altText
                    }
                  }
                }
              }
            }
          }
        }
      `;
    }

    // Fetch products from Shopify Storefront API
    const response = await fetch(`https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_TOKEN
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    // Handle GraphQL errors
    if (result.errors && result.errors.length > 0) {
      throw new Error(`GraphQL error: ${result.errors[0].message}`);
    }
    
    // Extract products from response
    const productsData = collectionHandle 
      ? (result.data.collection?.products?.edges || [])
      : (result.data.products?.edges || []);
    
    if (productsData.length === 0) {
      container.innerHTML = '<div class="no-products">No products found</div>';
      return;
    }
    
    // Clear the container
    container.innerHTML = '';
    
    // Render each product
    productsData.forEach(({ node: product }) => {
      const productVariants = product.variants.edges.map(edge => edge.node);
      const firstVariant = productVariants[0]; // Default to first variant
      
      if (!firstVariant) return; // Skip products with no variants
      
      // Get the main product image or the first variant image
      const productImage = product.images.edges[0]?.node.url || 
                           firstVariant.image?.url || 
                           'assets/product-placeholder.png';
      
      // Get available colors and sizes from variants
      const colorOptions = [...new Set(productVariants
        .map(variant => {
          const colorOption = variant.selectedOptions.find(opt => 
            opt.name.toLowerCase() === 'color' || 
            opt.name.toLowerCase() === 'colour'
          );
          return colorOption ? colorOption.value : null;
        })
        .filter(color => color !== null)
      )];
      
      const sizeOptions = [...new Set(productVariants
        .map(variant => {
          const sizeOption = variant.selectedOptions.find(opt => 
            opt.name.toLowerCase() === 'size'
          );
          return sizeOption ? sizeOption.value : null;
        })
        .filter(size => size !== null)
      )];
      
      // Create product card HTML
      const productCard = document.createElement('div');
      productCard.className = 'product-card';
      productCard.innerHTML = `
        <div class="product-image-container">
          <img src="${productImage}" alt="${product.title}" class="product-image">
        </div>
        <div class="product-details">
          <h3 class="product-title">${product.title}</h3>
          <div class="product-price">$${parseFloat(firstVariant.price.amount).toFixed(2)}</div>
          
          ${colorOptions.length > 0 ? `
            <div class="product-colors">
              ${colorOptions.map(color => `
                <button class="color-option" data-color="${color}" 
                  title="${color}">${color.charAt(0)}</button>
              `).join('')}
            </div>
          ` : ''}
          
          ${sizeOptions.length > 0 ? `
            <div class="product-sizes">
              ${sizeOptions.map(size => `
                <button class="size-option" data-size="${size}">${size}</button>
              `).join('')}
            </div>
          ` : ''}
          
          <button class="add-to-cart-btn" 
            data-product-id="${firstVariant.id}"
            data-product-title="${product.title}"
            data-product-price="${firstVariant.price.amount}"
            data-product-image="${productImage}">
            Add to Cart
          </button>
        </div>
      `;
      
      // Store all variant data for this product
      productCard.dataset.variants = JSON.stringify(productVariants.map(variant => ({
        id: variant.id, // This is the real Shopify variant ID in GID format
        title: variant.title,
        price: variant.price.amount,
        options: variant.selectedOptions.reduce((acc, opt) => {
          acc[opt.name.toLowerCase()] = opt.value;
          return acc;
        }, {})
      })));
      
      // Add product card to container
      container.appendChild(productCard);
      
      // Set up color and size selection
      const colorButtons = productCard.querySelectorAll('.color-option');
      const sizeButtons = productCard.querySelectorAll('.size-option');
      const addToCartBtn = productCard.querySelector('.add-to-cart-btn');
      
      // Color selection
      colorButtons.forEach(button => {
        button.addEventListener('click', () => {
          // Remove active class from all color buttons
          colorButtons.forEach(btn => btn.classList.remove('active'));
          // Add active class to clicked button
          button.classList.add('active');
          
          updateSelectedVariant(productCard);
        });
      });
      
      // Size selection
      sizeButtons.forEach(button => {
        button.addEventListener('click', () => {
          // Remove active class from all size buttons
          sizeButtons.forEach(btn => btn.classList.remove('active'));
          // Add active class to clicked button
          button.classList.add('active');
          
          updateSelectedVariant(productCard);
        });
      });
      
      // Add to cart button
      addToCartBtn.addEventListener('click', () => {
        const selectedVariantId = addToCartBtn.dataset.productId;
        const productTitle = addToCartBtn.dataset.productTitle;
        const productPrice = parseFloat(addToCartBtn.dataset.productPrice);
        const productImage = addToCartBtn.dataset.productImage;
        
        const selectedColor = productCard.querySelector('.color-option.active')?.dataset.color || null;
        const selectedSize = productCard.querySelector('.size-option.active')?.dataset.size || null;
        
        // Log the real Shopify variant ID being used
        console.log(`Adding to cart with real Shopify variant ID: ${selectedVariantId}`);
        
        // Add to cart using real Shopify variant ID
        if (window.BobbyCart) {
          window.BobbyCart.addItem({
            id: selectedVariantId, // This is the real Shopify variant ID in GID format
            title: productTitle,
            price: productPrice,
            image: productImage,
            selectedColor: selectedColor,
            selectedSize: selectedSize,
            quantity: 1
          });
          
          // Show added to cart feedback
          addToCartBtn.innerHTML = 'Added!';
          setTimeout(() => {
            addToCartBtn.innerHTML = 'Add to Cart';
          }, 2000);
        } else {
          console.error('Cart system not available');
        }
      });
    });
    
    console.log(`✅ Loaded ${productsData.length} products with real Shopify variant IDs`);
  } catch (error) {
    console.error('❌ Error loading products:', error);
    container.innerHTML = `<div class="error-loading">Error loading products: ${error.message}</div>`;
  }
}

/**
 * Update the selected variant based on color and size selection
 */
function updateSelectedVariant(productCard) {
  const selectedColor = productCard.querySelector('.color-option.active')?.dataset.color;
  const selectedSize = productCard.querySelector('.size-option.active')?.dataset.size;
  const addToCartBtn = productCard.querySelector('.add-to-cart-btn');
  
  // Get all variants for this product
  const variants = JSON.parse(productCard.dataset.variants || '[]');
  
  // Find matching variant
  let matchingVariant = variants.find(variant => {
    const variantColor = variant.options.color || variant.options.colour;
    const variantSize = variant.options.size;
    
    // Match both color and size if both are selected
    if (selectedColor && selectedSize) {
      return variantColor === selectedColor && variantSize === selectedSize;
    }
    // Match just color if only color is selected
    else if (selectedColor && !selectedSize) {
      return variantColor === selectedColor;
    }
    // Match just size if only size is selected
    else if (!selectedColor && selectedSize) {
      return variantSize === selectedSize;
    }
    
    // Default to first variant if no selection
    return true;
  });
  
  // Default to first variant if no match found
  if (!matchingVariant && variants.length > 0) {
    matchingVariant = variants[0];
  }
  
  // Update add to cart button with selected variant info
  if (matchingVariant) {
    addToCartBtn.dataset.productId = matchingVariant.id;
    addToCartBtn.dataset.productPrice = matchingVariant.price;
    
    // Update price display
    const priceElement = productCard.querySelector('.product-price');
    if (priceElement) {
      priceElement.textContent = `$${parseFloat(matchingVariant.price).toFixed(2)}`;
    }
  }
}

// Expose functions to global scope
window.ShopifyProductLoader = {
  loadProductsAndRender
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loadProductsAndRender
  };
}