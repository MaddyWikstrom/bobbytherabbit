/**
 * Shopify ID Handler - Ensures proper Shopify variant IDs for checkout
 * 
 * This utility can be integrated with any existing product loading logic
 * and ensures that real Shopify variant IDs are used for checkout.
 */

// Create the handler as a self-executing function to avoid global namespace pollution
(function() {
  // Store real variant IDs indexed by custom product identifiers
  const variantIdMap = new Map();
  
  // Store a reference to the original BobbyCart.addItem method
  let originalAddItemMethod = null;
  
  // Initialize the handler
  function init() {
    // Only initialize once
    if (originalAddItemMethod) return;
    
    console.log('🔄 Initializing Shopify ID Handler');
    
    // Patch the cart's addItem method to handle variant IDs properly
    if (window.BobbyCart && typeof window.BobbyCart.addItem === 'function') {
      originalAddItemMethod = window.BobbyCart.addItem;
      
      // Replace with our enhanced version
      window.BobbyCart.addItem = function(product) {
        // Check if this is a real Shopify variant ID (GID format)
        const isShopifyGID = product.id && typeof product.id === 'string' && 
                            product.id.startsWith('gid://shopify/ProductVariant/');
        
        if (isShopifyGID) {
          console.log('✅ Using real Shopify variant ID:', product.id);
          
          // Store this ID in our map for future reference using a key that includes color/size
          const key = generateProductKey(product);
          if (key) {
            variantIdMap.set(key, product.id);
            console.log(`📝 Mapped '${key}' to '${product.id}'`);
          }
          
          // Pass through to original method
          return originalAddItemMethod.call(window.BobbyCart, product);
        } else {
          // Try to look up a real Shopify variant ID for this product
          const key = generateProductKey(product);
          const realVariantId = key ? variantIdMap.get(key) : null;
          
          if (realVariantId) {
            console.log(`🔄 Found real Shopify variant ID for '${key}': ${realVariantId}`);
            
            // Create a copy of the product with the real variant ID
            const enhancedProduct = {
              ...product,
              shopifyVariantId: realVariantId // Add shopifyVariantId property
            };
            
            // Pass the enhanced product to the original method
            return originalAddItemMethod.call(window.BobbyCart, enhancedProduct);
          } else {
            console.warn(`⚠️ No real Shopify variant ID found for '${key}'`);
            
            // Still pass through to original method
            return originalAddItemMethod.call(window.BobbyCart, product);
          }
        }
      };
      
      console.log('✅ Shopify ID Handler initialized');
    } else {
      console.warn('⚠️ BobbyCart not found, will retry initialization later');
      setTimeout(init, 500);
    }
  }
  
  // Generate a consistent key for a product based on its attributes
  function generateProductKey(product) {
    if (!product) return null;
    
    const title = product.title || '';
    const color = product.selectedColor || product.color || '';
    const size = product.selectedSize || product.size || '';
    
    return `${title}_${color}_${size}`.replace(/\s+/g, '-').toLowerCase();
  }
  
  // Store real Shopify variant IDs for products
  function storeVariantId(customId, shopifyVariantId) {
    if (customId && shopifyVariantId) {
      variantIdMap.set(customId, shopifyVariantId);
      console.log(`📝 Manually mapped '${customId}' to '${shopifyVariantId}'`);
    }
  }
  
  // Store mappings for products from any data source
  function processProductBatch(products) {
    if (!Array.isArray(products)) return;
    
    products.forEach(product => {
      // Handle different product data structures
      
      // Standard Shopify API format
      if (product.node) {
        const node = product.node;
        if (node.variants && node.variants.edges) {
          node.variants.edges.forEach(edge => {
            const variant = edge.node;
            if (variant.id && variant.selectedOptions) {
              // Extract color and size
              const color = variant.selectedOptions.find(opt => 
                opt.name.toLowerCase() === 'color' || opt.name.toLowerCase() === 'colour'
              )?.value || '';
              
              const size = variant.selectedOptions.find(opt => 
                opt.name.toLowerCase() === 'size'
              )?.value || '';
              
              // Generate a key and store the mapping
              const key = `${node.title}_${color}_${size}`.replace(/\s+/g, '-').toLowerCase();
              variantIdMap.set(key, variant.id);
              console.log(`📝 API Mapped '${key}' to '${variant.id}'`);
            }
          });
        }
      } 
      // Direct variant format
      else if (product.id && product.id.startsWith('gid://shopify/ProductVariant/')) {
        const key = generateProductKey(product);
        if (key) {
          variantIdMap.set(key, product.id);
          console.log(`📝 Direct Mapped '${key}' to '${product.id}'`);
        }
      }
      // Custom product format with variants
      else if (product.variants) {
        product.variants.forEach(variant => {
          if (variant.id && variant.id.startsWith('gid://shopify/ProductVariant/')) {
            const color = variant.color || variant.selectedColor || '';
            const size = variant.size || variant.selectedSize || '';
            const key = `${product.title}_${color}_${size}`.replace(/\s+/g, '-').toLowerCase();
            variantIdMap.set(key, variant.id);
            console.log(`📝 Variant Mapped '${key}' to '${variant.id}'`);
          }
        });
      }
    });
    
    console.log(`✅ Processed ${products.length} products, current map size: ${variantIdMap.size}`);
  }
  
  // Add hard-coded mappings for essential products
  function addHardCodedMappings() {
    // These mappings will ensure checkout works even if products aren't loaded from API
    const MAPPINGS = {
      'bungi-x-bobby-rabbit-hardware-unisex-hoodie_vintage-black_s': 'gid://shopify/ProductVariant/44713213274763',
      'bungi-x-bobby-rabbit-hardware-unisex-hoodie_vintage-black_m': 'gid://shopify/ProductVariant/44713213307531',
      'bungi-x-bobby-rabbit-hardware-unisex-hoodie_vintage-black_l': 'gid://shopify/ProductVariant/44713213340299',
      'bungi-x-bobby-rabbit-hardware-unisex-hoodie_vintage-black_xl': 'gid://shopify/ProductVariant/44713213373067',
      'bungi-x-bobby-rabbit-hardware-unisex-hoodie_vintage-black_xxl': 'gid://shopify/ProductVariant/44713213405835',
      'rabbit-hardware-womans-t-shirt_default_s': 'gid://shopify/ProductVariant/44713244246251',
      'rabbit-hardware-womans-t-shirt_default_m': 'gid://shopify/ProductVariant/44713244279019',
      'rabbit-hardware-womans-t-shirt_default_l': 'gid://shopify/ProductVariant/44713244311787',
      'rabbit-hardware-womans-t-shirt_default_xl': 'gid://shopify/ProductVariant/44713244344555'
    };
    
    Object.entries(MAPPINGS).forEach(([key, value]) => {
      variantIdMap.set(key, value);
    });
    
    console.log(`📝 Added ${Object.keys(MAPPINGS).length} hard-coded variant ID mappings`);
  }
  
  // Get the current variant ID map (for debugging)
  function getVariantIdMap() {
    return Object.fromEntries(variantIdMap.entries());
  }
  
  // Initialize the handler when the DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      addHardCodedMappings();
      setTimeout(init, 500); // Delay to ensure cart is initialized
    });
  } else {
    addHardCodedMappings();
    setTimeout(init, 500);
  }
  
  // Export public API
  window.ShopifyIdHandler = {
    storeVariantId,
    processProductBatch,
    getVariantIdMap
  };
})();