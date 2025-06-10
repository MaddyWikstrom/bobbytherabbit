/**
 * Direct Storefront Checkout
 * 
 * A simple, direct implementation of Shopify Storefront API checkout
 * that works entirely client-side without requiring Netlify functions.
 * 
 * NOTE: This exposes your Storefront API token in client-side code.
 * Only use for testing or if you're comfortable with that exposure.
 */

const DirectStorefrontCheckout = (function() {
  // Configuration - REPLACE THESE WITH YOUR VALUES
  const SHOPIFY_CONFIG = {
    domain: 'mfdkk3-7g.myshopify.com',
    storefrontAccessToken: '8c6bd66766da4553701a1f1fe7d94dc4',
    apiVersion: '2023-07',
    // Retry configuration
    maxRetries: 3,
    retryDelay: 1000
  };

  // Check if already initialized to prevent duplicate declaration
  if (window.DirectStorefrontCheckout) {
    console.log('DirectStorefrontCheckout already initialized');
    return window.DirectStorefrontCheckout;
  }

  /**
   * Create a checkout directly from cart items
   * 
   * @param {Array} cartItems - Cart items with variantId and quantity
   * @returns {Promise<string>} - Checkout URL
   */
  async function createCheckout(cartItems) {
    console.log('Creating direct Storefront API checkout with items:', cartItems);
    
    if (!cartItems || !cartItems.length) {
      console.error('No items provided for checkout');
      return Promise.reject(new Error('No items in cart'));
    }

    // Prepare line items for Storefront API
    const lineItems = prepareLineItems(cartItems);
    
    // Create GraphQL mutation
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
      // Make API request
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
      
      // Check for errors
      if (data.errors) {
        console.error('GraphQL errors:', data.errors);
        return Promise.reject(new Error(data.errors[0].message));
      }

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
   * Prepare line items for Shopify Storefront API
   * 
   * @param {Array} cartItems - Cart items
   * @returns {Array} - Formatted line items
   */
  function prepareLineItems(cartItems) {
    return cartItems.map(item => {
      // Get variant ID with fallbacks
      let variantId = item.variantId || item.id || '';
      
      // Convert to Shopify's expected format if needed
      if (variantId && !variantId.includes('gid://shopify')) {
        // Handle composite IDs (e.g., "123-red-M")
        if (variantId.includes('-')) {
          const parts = variantId.split('-');
          const numericId = parts.find(part => /^\d+$/.test(part));
          if (numericId) {
            variantId = `gid://shopify/ProductVariant/${numericId}`;
          } else {
            variantId = `gid://shopify/ProductVariant/${variantId.replace(/\D/g, '')}`;
          }
        } 
        // Handle numeric IDs
        else if (/^\d+$/.test(variantId)) {
          variantId = `gid://shopify/ProductVariant/${variantId}`;
        }
        // Last resort cleanup
        else {
          variantId = `gid://shopify/ProductVariant/${variantId.replace(/\D/g, '')}`;
        }
      }

      return {
        variantId: variantId,
        quantity: parseInt(item.quantity, 10) || 1
      };
    });
  }

  /**
   * Process checkout for cart items and redirect to Shopify checkout
   * 
   * @param {Array} cartItems - Cart items
   * @returns {Promise<boolean>} - Success status
   */
  async function processCheckoutAndRedirect(cartItems) {
    try {
      // Show loading UI if possible
      if (typeof window.showLoadingOverlay === 'function') {
        window.showLoadingOverlay('Creating checkout...');
      }

      // Create checkout
      const checkoutUrl = await createCheckout(cartItems);
      
      if (!checkoutUrl) {
        throw new Error('No checkout URL received');
      }
      
      // Redirect to Shopify checkout
      window.location.href = checkoutUrl;
      
      return true;
    } catch (error) {
      console.error('Checkout process failed:', error);
      
      // Hide loading UI if possible
      if (typeof window.hideLoadingOverlay === 'function') {
        window.hideLoadingOverlay();
      }
      
      // Show error message
      alert(`Checkout error: ${error.message || 'Unknown error'}`);
      
      return false;
    }
  }

  // Replace the cart's checkout button with our direct checkout
  function replaceCheckoutButton() {
    const checkoutButtons = document.querySelectorAll('.cart-checkout-btn, .checkout-btn');
    
    checkoutButtons.forEach(button => {
      if (button && !button.dataset.directCheckoutAttached) {
        console.log('Replacing checkout button with direct checkout');
        
        // Clone to remove all event listeners
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // Add our event listener
        newButton.addEventListener('click', function(e) {
          e.preventDefault();
          
          // Get cart items
          const cartItems = window.BobbyCart ? window.BobbyCart.getItems() : [];
          
          if (!cartItems || cartItems.length === 0) {
            alert('Your cart is empty');
            return;
          }
          
          // Process checkout
          processCheckoutAndRedirect(cartItems);
        });
        
        // Mark as attached
        newButton.dataset.directCheckoutAttached = 'true';
      }
    });
  }

  // Initialize 
  function init() {
    console.log('Initializing Direct Storefront Checkout');
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', replaceCheckoutButton);
    } else {
      replaceCheckoutButton();
    }
    
    // Also listen for cart changes that might add new checkout buttons
    document.addEventListener('cart:updated', replaceCheckoutButton);
  }
  
  // Run initialization
  init();

  // Public API
  return {
    createCheckout: createCheckout,
    processCheckoutAndRedirect: processCheckoutAndRedirect,
    replaceCheckoutButton: replaceCheckoutButton
  };
})();

// Make available globally
window.DirectStorefrontCheckout = DirectStorefrontCheckout;