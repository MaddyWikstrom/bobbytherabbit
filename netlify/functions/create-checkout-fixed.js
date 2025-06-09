const fetch = require('node-fetch');

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
    console.log('Enhanced checkout process started');
    
    // Log the raw request for debugging
    console.log('Raw request body:', event.body);
    
    // Parse the cart items from the request
    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
      console.log('Parsed request body:', JSON.stringify(requestBody, null, 2));
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid request format',
          details: 'Request body could not be parsed as JSON',
          rawBody: event.body
        })
      };
    }
    
    const { items } = requestBody;
    
    // Validate items with more detailed logging
    if (!items) {
      console.error('No items property in request body');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'No items provided',
          details: 'Request must include an "items" property'
        })
      };
    }
    
    if (!Array.isArray(items)) {
      console.error('Items is not an array:', typeof items);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid items format',
          details: 'Items must be an array'
        })
      };
    }
    
    if (items.length === 0) {
      console.error('Items array is empty');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Empty cart',
          details: 'No items provided for checkout'
        })
      };
    }

    // Log the raw items received for debugging
    console.log('Raw checkout items received:', JSON.stringify(items));

    // Get Shopify credentials from environment variables
    const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
    const SHOPIFY_STOREFRONT_ACCESS_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN;

    if (!SHOPIFY_DOMAIN || !SHOPIFY_STOREFRONT_ACCESS_TOKEN) {
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

    // Validate and normalize line items with enhanced error handling
    const lineItems = [];
    let hasErrors = false;
    let errorDetails = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Log each item for debugging
      console.log(`Processing item ${i}:`, JSON.stringify(item));
      
      if (!item.variantId) {
        hasErrors = true;
        errorDetails.push(`Missing variantId for item at index ${i}: ${JSON.stringify(item)}`);
        continue;
      }

      // Convert quantities to integers and ensure they're positive
      const quantity = parseInt(item.quantity, 10);
      if (isNaN(quantity) || quantity <= 0) {
        hasErrors = true;
        errorDetails.push(`Invalid quantity for item at index ${i}: ${JSON.stringify(item)}`);
        continue;
      }

      // Normalize Shopify ID format if needed
      let variantId = item.variantId;
      
      console.log(`Processing variant ID: ${variantId} (type: ${typeof variantId})`);
      
      // Handle undefined or null
      if (!variantId) {
        hasErrors = true;
        errorDetails.push(`Missing variantId for item at index ${i}: ${JSON.stringify(item)}`);
        continue;
      }
      
      // Fix common variant ID format issues
      if (typeof variantId === 'number') {
        console.log(`Converting numeric variant ID ${variantId} to string`);
        variantId = variantId.toString();
      }
      
      // Handle cases where variantId might be an object
      if (typeof variantId === 'object') {
        console.log(`variantId is an object:`, variantId);
        if (variantId.id) {
          console.log(`Using variantId.id: ${variantId.id}`);
          variantId = variantId.id.toString();
        } else {
          hasErrors = true;
          errorDetails.push(`Invalid variantId object for item at index ${i}: ${JSON.stringify(item)}`);
          continue;
        }
      }
      
      // Ensure proper Shopify GraphQL ID format
      if (!variantId.includes('gid://')) {
        console.log(`Converting to GraphQL ID format: ${variantId}`);
        
        // Check if it's already in a legacy format with slashes
        if (variantId.includes('/')) {
          console.log(`Handling legacy format with slashes: ${variantId}`);
          // Convert from admin API format to storefront format if needed
          if (variantId.includes('Product/') && !variantId.includes('ProductVariant/')) {
            const productId = variantId.split('Product/')[1];
            variantId = `gid://shopify/ProductVariant/${productId}`;
          } else if (!variantId.includes('shopify/')) {
            variantId = `gid://shopify/ProductVariant/${variantId.split('/').pop()}`;
          }
        } else {
          // Plain ID - convert to Storefront API expected format
          console.log(`Converting plain ID to GraphQL format: ${variantId}`);
          // Preserve any letters that might be part of a custom ID
          variantId = `gid://shopify/ProductVariant/${variantId}`;
        }
      }
      
      console.log(`Final variant ID: ${variantId}`);
      
      // Verify the ID has the right format after normalization
      if (!variantId.includes('gid://shopify/ProductVariant/')) {
        console.warn(`Potentially invalid variant ID format after normalization: ${variantId}`);
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

    // Create the GraphQL mutation for cart creation
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
    console.log('Line items formatted for Shopify:', JSON.stringify(lineItems.map(item => ({
      merchandiseId: item.variantId,
      quantity: item.quantity
    }))));

    // Log environment variables (without sensitive values)
    console.log(`SHOPIFY_DOMAIN is ${SHOPIFY_DOMAIN ? 'set' : 'NOT SET'}`);
    console.log(`SHOPIFY_STOREFRONT_ACCESS_TOKEN is ${SHOPIFY_STOREFRONT_ACCESS_TOKEN ? 'set' : 'NOT SET'}`);
    
    // Prepare the request body
    const graphqlRequestBody = {
      query: mutation,
      variables: {
        input: {
          lines: lineItems.map(item => ({
            merchandiseId: item.variantId,
            quantity: item.quantity
          }))
        }
      }
    };
    
    console.log('Shopify GraphQL request prepared:', JSON.stringify(graphqlRequestBody, null, 2));
    
    // Build the full API URL - use the version from the .env file
    const apiVersion = process.env.SHOPIFY_API_VERSION || '2024-01';
    const apiUrl = `https://${SHOPIFY_DOMAIN}/api/${apiVersion}/graphql.json`;
    console.log(`Making request to Shopify API: ${apiUrl}`);
    
    // Make the request to Shopify Storefront API
    let response;
    try {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_ACCESS_TOKEN,
          'User-Agent': 'Bobby-Streetwear-Checkout/2.0'
        },
        body: JSON.stringify(graphqlRequestBody)
      });
      
      console.log(`Shopify API response status: ${response.status} ${response.statusText}`);
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

    // Get full response details for better debugging
    const responseStatus = response.status;
    const responseStatusText = response.statusText;
    
    if (!response.ok) {
      // Try to get more details from the error response
      let errorResponseText;
      try {
        errorResponseText = await response.text();
      } catch (e) {
        errorResponseText = "Could not read error response";
      }
      
      console.error(`HTTP error from Shopify: ${responseStatus} ${responseStatusText}`);
      console.error('Response body:', errorResponseText);
      
      return {
        statusCode: responseStatus,
        headers,
        body: JSON.stringify({ 
          error: 'Shopify API error',
          details: `${responseStatus}: ${responseStatusText}`,
          response: errorResponseText
        })
      };
    }

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('Failed to parse Shopify response:', jsonError);
      
      // Try to get the raw response for debugging
      let rawResponse;
      try {
        rawResponse = await response.text();
      } catch (e) {
        rawResponse = "Could not read response";
      }
      
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid response from Shopify',
          details: jsonError.message,
          rawResponse: rawResponse
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
      console.error('Full response:', JSON.stringify(data));
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'No cart created',
          details: 'Shopify response did not include cart details',
          response: data
        })
      };
    }

    // Return the checkout URL and details
    const cart = data.data.cartCreate.cart;
    console.log('Cart created successfully:', cart.id);
    console.log('Checkout URL:', cart.checkoutUrl);
    
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