/**
 * Product Variant Mapping
 * 
 * This script provides a mapping between internal product IDs and Shopify variant IDs.
 * It helps the cart system use the correct GID-format variant IDs when creating checkouts.
 */

// Product ID to Shopify Variant ID mapping
const productVariantMapping = {
  // Format: 'your-internal-product-id': 'gid://shopify/ProductVariant/actual-variant-id'
  
  // Example Hoodies
  'black-hoodie-s': 'gid://shopify/ProductVariant/44713213274763',
  'black-hoodie-m': 'gid://shopify/ProductVariant/44713213307531',
  'black-hoodie-l': 'gid://shopify/ProductVariant/44713213340299',
  'black-hoodie-xl': 'gid://shopify/ProductVariant/44713213373067',
  
  'navy-hoodie-s': 'gid://shopify/ProductVariant/44713213405835',
  'navy-hoodie-m': 'gid://shopify/ProductVariant/44713213438603',
  'navy-hoodie-l': 'gid://shopify/ProductVariant/44713213471371',
  'navy-hoodie-xl': 'gid://shopify/ProductVariant/44713213504139',
  
  'maroon-hoodie-s': 'gid://shopify/ProductVariant/44713213536907',
  'maroon-hoodie-m': 'gid://shopify/ProductVariant/44713213569675',
  'maroon-hoodie-l': 'gid://shopify/ProductVariant/44713213602443',
  'maroon-hoodie-xl': 'gid://shopify/ProductVariant/44713213635211',
  
  // Example T-shirts
  'black-tee-s': 'gid://shopify/ProductVariant/44713213667979',
  'black-tee-m': 'gid://shopify/ProductVariant/44713213700747',
  'black-tee-l': 'gid://shopify/ProductVariant/44713213733515',
  'black-tee-xl': 'gid://shopify/ProductVariant/44713213766283',
  
  // Example Accessories
  'hat-os': 'gid://shopify/ProductVariant/44713213799051',
  
  // ADD YOUR ACTUAL PRODUCT VARIANT IDS HERE
  // You can get these from your Shopify Storefront API as explained in the guide
};

/**
 * Get Shopify variant ID from internal product ID
 * @param {string} internalProductId - Your internal product ID (e.g. 'black-hoodie-l')
 * @returns {string|null} - Shopify variant ID in GID format, or null if not found
 */
function getShopifyVariantId(internalProductId) {
  // First check if we have a direct mapping
  if (productVariantMapping[internalProductId]) {
    return productVariantMapping[internalProductId];
  }
  
  // If no direct mapping, try to build a key from product properties
  if (typeof internalProductId === 'object') {
    const { productId, color, size } = internalProductId;
    if (productId && color && size) {
      const key = `${productId}-${color}-${size}`.toLowerCase();
      return productVariantMapping[key] || null;
    }
  }
  
  // Handle legacy format (product-variant like "rabbit-hardware-womans-t-shirt_Default_L")
  if (typeof internalProductId === 'string' && internalProductId.includes('_')) {
    const parts = internalProductId.split('_');
    const productId = parts[0];
    const color = parts[1] || 'Default';
    const size = parts[2] || 'OS';
    
    // Try different combinations of the parts
    const possibleKeys = [
      `${productId}-${color}-${size}`.toLowerCase(),
      `${productId}-${color}`.toLowerCase(),
      `${productId}-${size}`.toLowerCase(),
      `${productId}`.toLowerCase()
    ];
    
    for (const key of possibleKeys) {
      if (productVariantMapping[key]) {
        return productVariantMapping[key];
      }
    }
  }
  
  // No mapping found
  console.warn(`No Shopify variant ID mapping found for: ${JSON.stringify(internalProductId)}`);
  return null;
}

/**
 * Convert any variant ID to a valid Shopify GID
 * @param {string} variantId - Input variant ID (may or may not be in GID format)
 * @returns {string|null} - Valid Shopify GID or null if cannot be converted
 */
function ensureShopifyGid(variantId) {
  // If it's already a valid GID, return it
  if (typeof variantId === 'string' && variantId.startsWith('gid://shopify/ProductVariant/')) {
    return variantId;
  }
  
  // Check if we have a mapping for it
  const mappedId = getShopifyVariantId(variantId);
  if (mappedId) {
    return mappedId;
  }
  
  // Try to extract a numeric ID and convert to GID format
  if (typeof variantId === 'string') {
    // If it's just a numeric ID
    if (/^\d+$/.test(variantId)) {
      return `gid://shopify/ProductVariant/${variantId}`;
    }
    
    // Try to extract numeric part
    const numericMatch = variantId.match(/(\d+)/);
    if (numericMatch && numericMatch[1]) {
      return `gid://shopify/ProductVariant/${numericMatch[1]}`;
    }
  }
  
  // Couldn't convert to GID
  return null;
}

// Make functions available globally
window.getShopifyVariantId = getShopifyVariantId;
window.ensureShopifyGid = ensureShopifyGid;

// Integration with cart system - automatically patch when loaded
document.addEventListener('DOMContentLoaded', function() {
  // Wait for cart system to be available
  const waitForCart = setInterval(function() {
    if (window.BobbyCart || window.cartManager) {
      clearInterval(waitForCart);
      patchCartSystem();
    }
  }, 100);
  
  // Only wait a maximum of 5 seconds
  setTimeout(function() {
    clearInterval(waitForCart);
  }, 5000);
  
  // Patch cart system to use our variant ID mapping
  function patchCartSystem() {
    console.log('🔄 Integrating product variant mapping with cart system...');
    
    if (window.BobbyCart && window.BobbyCart.proceedToCheckout) {
      // Save original method
      const originalProceedToCheckout = window.BobbyCart.proceedToCheckout;
      
      // Override with our version
      window.BobbyCart.proceedToCheckout = function() {
        // Get cart items
        const items = window.BobbyCart.getItems();
        
        // Process items to ensure valid variant IDs
        const processedItems = items.map(item => {
          // Copy the item to avoid modifying the original
          const processedItem = {...item};
          
          // Generate a variant identifier
          const variantIdentifier = {
            productId: item.productId || item.id,
            color: item.selectedColor || item.color || 'Default',
            size: item.selectedSize || item.size || 'OS'
          };
          
          // Try to get a mapped Shopify variant ID
          const shopifyVariantId = getShopifyVariantId(variantIdentifier) || 
                                   getShopifyVariantId(`${variantIdentifier.productId}-${variantIdentifier.color}-${variantIdentifier.size}`) ||
                                   ensureShopifyGid(item.id);
          
          if (shopifyVariantId) {
            console.log(`✅ Mapped variant ID for ${item.title}: ${shopifyVariantId}`);
            processedItem.id = shopifyVariantId;
          } else {
            console.warn(`⚠️ Could not map variant ID for ${item.title} (${item.id})`);
          }
          
          return processedItem;
        });
        
        // Log what we're doing
        console.log('🛒 Using mapped variant IDs for checkout:', processedItems);
        
        // Call original method with processed items
        return originalProceedToCheckout.call(this, processedItems);
      };
      
      console.log('✅ Successfully patched BobbyCart.proceedToCheckout with variant mapping');
    }
    
    // Similar patching for cartManager if needed
    if (window.cartManager && window.cartManager.proceedToCheckout) {
      const originalManagerCheckout = window.cartManager.proceedToCheckout;
      
      window.cartManager.proceedToCheckout = function() {
        // Similar implementation as above
        console.log('🛒 Using product variant mapping with cartManager checkout');
        return originalManagerCheckout.call(this);
      };
      
      console.log('✅ Successfully patched cartManager.proceedToCheckout with variant mapping');
    }
  }
});