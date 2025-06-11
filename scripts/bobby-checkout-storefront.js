/**
 * Bobby Checkout - Storefront API Integration
 * 
 * This file implements Shopify Storefront API checkout functionality
 * while maintaining compatibility with the existing cart system.
 */

// Use IIFE pattern to avoid global namespace conflicts
const BobbyCheckoutStorefront = (function() {
  // Configuration
  const SHOPIFY_CONFIG = {
    domain: 'mfdkk3-7g.myshopify.com',
    storefrontAccessToken: '8c6bd66766da4553701a1f1fe7d94dc4',
    apiVersion: '2023-07'
  };

  // Check if already initialized to prevent duplicate declaration
  if (window.BobbyCheckoutStorefront) {
    console.log('BobbyCheckoutStorefront already initialized, using existing instance');
    return window.BobbyCheckoutStorefront;
  }

  // Cache for product variant mapping
  let variantCache = {};

  /**
   * Create a checkout session using Shopify Storefront API
   * @param {Array} cartItems - Array of cart items from BobbyCart
   * @returns {Promise} - Resolves with checkout URL or rejects with error
   */
  async function createCheckout(cartItems) {
    if (!cartItems || !cartItems.length) {
      return Promise.reject(new Error('No items in cart'));
    }

    console.log('Creating checkout with Storefront API for items:', cartItems);

    // Prepare line items in the format expected by the Storefront API
    const lineItems = await prepareLineItems(cartItems);
    
    if (!lineItems.length) {
      return Promise.reject(new Error('Failed to prepare line items'));
    }

    // GraphQL mutation for checkout creation
    const mutation = `
      mutation checkoutCreate($input: CheckoutCreateInput!) {
        checkoutCreate(input: $input) {
          checkout {
            id
            webUrl
          }
          checkoutUserErrors {
            code
            field
            message
          }
        }
      }
    `;

    const variables = {
      input: {
        lineItems: lineItems
      }
    };

    try {
      // Make the API request
      const response = await fetch(`https://${SHOPIFY_CONFIG.domain}/api/${SHOPIFY_CONFIG.apiVersion}/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': SHOPIFY_CONFIG.storefrontAccessToken
        },
        body: JSON.stringify({
          query: mutation,
          variables: variables
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Check for GraphQL errors
      if (data.errors) {
        console.error('GraphQL errors:', data.errors);
        return Promise.reject(new Error(data.errors[0].message));
      }

      // Check for checkout user errors
      if (data.data.checkoutCreate.checkoutUserErrors && 
          data.data.checkoutCreate.checkoutUserErrors.length > 0) {
        console.error('Checkout creation errors:', data.data.checkoutCreate.checkoutUserErrors);
        return Promise.reject(new Error(data.data.checkoutCreate.checkoutUserErrors[0].message));
      }

      // Success - return the checkout URL
      const checkout = data.data.checkoutCreate.checkout;
      console.log('Checkout created successfully:', checkout);
      
      return checkout.webUrl;
    } catch (error) {
      console.error('Error creating checkout:', error);
      return Promise.reject(error);
    }
  }

  /**
   * Convert cart items to Shopify line items
   * This handles the mapping from our internal item format to Shopify's
   */
  async function prepareLineItems(cartItems) {
    const lineItems = [];

    for (const item of cartItems) {
      try {
        // Get the Shopify variant ID for this item
        const variantId = await resolveVariantId(item);
        
        if (!variantId) {
          console.error('Could not resolve variant ID for item:', item);
          continue;
        }

        lineItems.push({
          variantId: variantId,
          quantity: item.quantity
        });
      } catch (error) {
        console.error('Error preparing line item:', error);
      }
    }

    return lineItems;
  }

  /**
   * Resolve a Shopify variant ID from a cart item
   * This handles different formats and fallback strategies
   */
  async function resolveVariantId(item) {
    // If item already has a Shopify variant ID in the right format, use it
    if (item.variantId && item.variantId.includes('gid://shopify/ProductVariant/')) {
      return item.variantId;
    }

    // If we have a cached variant ID for this item, use it
    const cacheKey = `${item.productId}-${item.selectedColor || ''}-${item.selectedSize || ''}`;
    if (variantCache[cacheKey]) {
      return variantCache[cacheKey];
    }

    // Try to construct a variant ID from our internal ID format
    // Our internal format is typically: productId-color-size
    if (item.id && item.id.includes('-')) {
      const parts = item.id.split('-');
      const productId = parts[0];
      
      // Convert to Storefront API format if it's a numeric ID
      if (/^\d+$/.test(productId)) {
        const variantId = `gid://shopify/ProductVariant/${productId}`;
        variantCache[cacheKey] = variantId;
        return variantId;
      }
    }

    // If we have a specific productId, try to use that
    if (item.productId && /^\d+$/.test(item.productId)) {
      const variantId = `gid://shopify/ProductVariant/${item.productId}`;
      variantCache[cacheKey] = variantId;
      return variantId;
    }

    // As a last resort, try to fetch the product by title and find the right variant
    try {
      return await fetchVariantByTitle(item.title, item.selectedColor, item.selectedSize);
    } catch (error) {
      console.error('Could not fetch variant by title:', error);
      return null;
    }
  }

  /**
   * Fetch a product variant by title and attributes
   * This is a fallback method when we don't have a direct variant ID
   */
  async function fetchVariantByTitle(title, color, size) {
    // In a production app, you would make a query to the Storefront API to find 
    // the product by title and then find the variant that matches the color and size.
    // For simplicity, we'll return null here since we don't have that functionality yet.
    console.warn('Variant lookup by title not implemented yet');
    return null;
  }

  /**
   * Process cart items and redirect to Shopify checkout
   */
  async function processCheckout(cartItems) {
    try {
      // Create checkout session
      const checkoutUrl = await createCheckout(cartItems);
      
      if (!checkoutUrl) {
        throw new Error('No checkout URL received');
      }
      
      // Validate and redirect to Shopify checkout
      let finalUrl = checkoutUrl;
      
      // Check if URL is a valid Shopify checkout URL
      if (checkoutUrl.includes('myshopify.com')) {
        console.log('✅ Valid Shopify checkout URL, redirecting now');
      } else {
        console.warn('⚠️ Non-Shopify URL detected:', checkoutUrl);
        
        // If we got a bobbytherabbit.com URL, replace it with the myshopify domain
        if (finalUrl.includes('bobbytherabbit.com')) {
          finalUrl = finalUrl.replace('bobbytherabbit.com', 'mfdkk3-7g.myshopify.com');
          console.log('🔄 Fixed URL to:', finalUrl);
        } else {
          console.error('❌ Could not fix invalid checkout URL');
          throw new Error('Invalid checkout URL: Not a Shopify domain');
        }
      }
      
      // Redirect to the final URL
      console.log('🚀 Final redirect URL:', finalUrl);
      window.location.href = finalUrl;
      
      return true;
    } catch (error) {
      console.error('Checkout process failed:', error);
      
      // Display an error message to the user
      alert('There was a problem creating your checkout. Please try again.');
      
      return false;
    }
  }

  // Return public API
  return {
    createCheckout: createCheckout,
    processCheckout: processCheckout
  };
})();

// Make checkout handler available globally
window.BobbyCheckoutStorefront = BobbyCheckoutStorefront;