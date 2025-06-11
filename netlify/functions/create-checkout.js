// Use dynamic import for node-fetch to fix ESM compatibility issues
const fetch = (...args) => import('node-fetch').then(mod => mod.default(...args));

exports.handler = async (event, context) => {
  // Enable CORS to help with cross-origin issues
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle OPTIONS request for CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('Checkout process started');
    
    // Parse the cart items from the request
    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid request format',
          details: 'Request body could not be parsed as JSON'
        })
      };
    }
    
    const { items } = requestBody;
    
    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error('No valid items provided in request');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'No valid items provided',
          details: 'Request must include an array of items' 
        })
      };
    }

    // Get Shopify credentials from environment variables
    const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || process.env.SHOPIFY_DOMAIN;
    const SHOPIFY_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN; // Use the available token
    const API_VERSION = process.env.SHOPIFY_API_VERSION || '2024-04';

    console.log("Shopify credentials check:", {
      domain: SHOPIFY_DOMAIN ? '✅ Present' : '❌ Missing',
      token: SHOPIFY_TOKEN ? '✅ Present' : '❌ Missing',
      apiVersion: API_VERSION
    });

    if (!SHOPIFY_DOMAIN || !SHOPIFY_TOKEN) {
      console.error('Missing Shopify credentials in environment variables');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Store configuration error',
          details: 'Missing required Shopify credentials'
        })
      };
    }

    console.log(`Using Shopify domain: ${SHOPIFY_DOMAIN}`);

    // Validate and normalize line items
    const lineItems = [];
    let hasErrors = false;
    let errorDetails = [];

    for (const item of items) {
      if (!item.variantId) {
        hasErrors = true;
        errorDetails.push(`Missing variantId for item: ${JSON.stringify(item)}`);
        continue;
      }

      // Convert quantities to integers and ensure they're positive
      const quantity = parseInt(item.quantity, 10);
      if (isNaN(quantity) || quantity <= 0) {
        hasErrors = true;
        errorDetails.push(`Invalid quantity for item: ${JSON.stringify(item)}`);
        continue;
      }

      // Normalize Shopify ID format if needed
      let variantId = item.variantId;
      if (!variantId.includes('/')) {
        // Convert to Storefront API expected format if needed
        variantId = `gid://shopify/ProductVariant/${variantId.replace(/\D/g, '')}`;
      }

      lineItems.push({
        variantId,
        quantity
      });
    }

    if (hasErrors) {
      console.error('Validation errors with line items:', errorDetails);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid line items',
          details: errorDetails
        })
      };
    }

    if (lineItems.length === 0) {
      console.error('No valid line items after validation');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'No valid items',
          details: 'After validation, no valid items remain'
        })
      };
    }

    // Create the GraphQL mutation for cart creation (new API replacing deprecated checkout)
    const mutation = `
      mutation cartCreate($input: CartInput!) {
        cartCreate(input: $input) {
          cart {
            id
            checkoutUrl
            cost {
              totalAmount {
                amount
                currencyCode
              }
            }
            lines(first: 250) {
              edges {
                node {
                  merchandise {
                    ... on ProductVariant {
                      id
                      title
                      price {
                        amount
                        currencyCode
                      }
                      product {
                        title
                      }
                    }
                  }
                  quantity
                }
              }
            }
          }
          userErrors {
            field
            message
            code
          }
        }
      }
    `;

    console.log(`Making request to Shopify with ${lineItems.length} line items`);

    // Make the request to Shopify Storefront API
    let response;
    try {
      response = await fetch(`https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': SHOPIFY_TOKEN,
          'User-Agent': 'Bobby-Streetwear-Checkout/1.0'
        },
        body: JSON.stringify({
          query: mutation,
          variables: {
            input: {
              lines: lineItems.map(item => ({
                merchandiseId: item.variantId,
                quantity: item.quantity
              }))
            }
          }
        })
      });
    } catch (fetchError) {
      console.error('Network error when contacting Shopify:', fetchError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to contact Shopify',
          details: fetchError.message
        })
      };
    }

    if (!response.ok) {
      console.error(`HTTP error from Shopify: ${response.status} ${response.statusText}`);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          error: 'Shopify API error',
          details: `${response.status}: ${response.statusText}`
        })
      };
    }

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('Failed to parse Shopify response:', jsonError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid response from Shopify',
          details: jsonError.message
        })
      };
    }

    // Check for GraphQL errors
    if (data.errors) {
      console.error('GraphQL errors from Shopify:', data.errors);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Shopify GraphQL errors',
          details: data.errors
        })
      };
    }

    // Check for cart user errors
    if (data.data?.cartCreate?.userErrors?.length > 0) {
      console.error('Cart creation errors from Shopify:', data.data.cartCreate.userErrors);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Failed to create cart',
          details: data.data.cartCreate.userErrors
        })
      };
    }

    // Verify cart was created
    if (!data.data?.cartCreate?.cart) {
      console.error('No cart created in Shopify response');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'No cart created',
          details: 'Shopify response did not include cart details'
        })
      };
    }

    // Return the checkout URL and details
    const cart = data.data.cartCreate.cart;
    console.log('Cart created successfully:', cart.id);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        checkoutUrl: cart.checkoutUrl,
        checkoutId: cart.id,
        totalPrice: cart.cost.totalAmount,
        lineItems: cart.lines.edges
      })
    };

  } catch (error) {
    console.error('Unexpected error in checkout function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to create checkout',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};