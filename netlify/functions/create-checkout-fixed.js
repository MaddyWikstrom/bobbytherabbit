// Using native https module instead of node-fetch to avoid ESM compatibility issues
// Added enhanced logging to diagnose 500 errors
const https = require('https');

// Helper function for HTTPS requests
function httpsRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      const chunks = [];
      
      res.on('data', (chunk) => chunks.push(chunk));
      
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString();
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: JSON.parse(body)
            });
          } catch (e) {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body
            });
          }
        } else {
          reject({
            statusCode: res.statusCode,
            headers: res.headers,
            body
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

exports.handler = async (event, context) => {
  console.log("🚀 Checkout function triggered");
  
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
    
    // Parse the cart items from the request with flexible format support
    let requestBody;
    let items = [];
    
    try {
      console.log("📦 Raw request body:", event.body);
      requestBody = JSON.parse(event.body);
      console.log("✅ Parsed request body:", JSON.stringify(requestBody));
      
      // Support multiple formats: {items: []}, {lineItems: []}, or direct array
      if (Array.isArray(requestBody)) {
        console.log("📝 Request body is an array - using directly as items");
        items = requestBody;
      } else if (requestBody.items && Array.isArray(requestBody.items)) {
        console.log("📝 Found items array in request body");
        items = requestBody.items;
      } else if (requestBody.lineItems && Array.isArray(requestBody.lineItems)) {
        console.log("📝 Found lineItems array in request body");
        items = requestBody.lineItems;
      } else {
        // Last resort - try to convert the entire object to an item
        if (requestBody.id || requestBody.variantId) {
          console.log("📝 Request body appears to be a single item - converting to array");
          items = [requestBody];
        }
      }
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid request format',
          details: 'Request body could not be parsed as JSON'
        })
      };
    }
    
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
    const SHOPIFY_DOMAIN = process.env.SHOPIFY_DOMAIN;
    const SHOPIFY_STOREFRONT_ACCESS_TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
    
    console.log("🔑 Shopify credentials check:", {
      domain: SHOPIFY_DOMAIN ? "✅ Present" : "❌ Missing",
      token: SHOPIFY_STOREFRONT_ACCESS_TOKEN ? "✅ Present" : "❌ Missing"
    });

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

    // Validate and normalize line items
    const lineItems = [];
    let hasErrors = false;
    let errorDetails = [];
    
    console.log("📝 Processing items for checkout:", JSON.stringify(items));

    for (const item of items) {
      // Find the variant ID with fallbacks for different formats
      let variantId = item.variantId || item.id || item.variant_id;
      
      // Handle the case where ID is in a nested object
      if (!variantId && item.variant && item.variant.id) {
        variantId = item.variant.id;
      }
      
      if (!variantId) {
        hasErrors = true;
        errorDetails.push(`Missing variantId for item: ${JSON.stringify(item)}`);
        continue;
      }
      
      console.log(`🔍 Processing item with raw ID: ${variantId}`);

      // Convert quantities to integers and ensure they're positive
      const quantity = parseInt(item.quantity, 10) || 1;  // Default to 1 if not specified
      if (isNaN(quantity) || quantity <= 0) {
        hasErrors = true;
        errorDetails.push(`Invalid quantity for item: ${JSON.stringify(item)}`);
        continue;
      }

      // Normalize Shopify ID format if needed
      if (!variantId.includes('gid://shopify')) {
        // Handle numeric IDs
        if (/^\d+$/.test(variantId)) {
          variantId = `gid://shopify/ProductVariant/${variantId}`;
        }
        // Handle IDs with prefixes like "variant-"
        else if (variantId.includes('-')) {
          const parts = variantId.split('-');
          const potentialId = parts.find(part => /^\d+$/.test(part));
          if (potentialId) {
            variantId = `gid://shopify/ProductVariant/${potentialId}`;
          }
        }
        // Strip any non-numeric characters if still not in GID format
        else if (!variantId.includes('/')) {
          variantId = `gid://shopify/ProductVariant/${variantId.replace(/\D/g, '')}`;
        }
      }
      
      console.log(`✅ Processed item ID: ${variantId}, Quantity: ${quantity}`);

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
    console.log("✅ Prepared line items:", JSON.stringify(lineItems));

    // Prepare request payload
    const requestPayload = JSON.stringify({
      query: mutation,
      variables: {
        input: {
          lines: lineItems.map(item => ({
            merchandiseId: item.variantId,
            quantity: item.quantity
          }))
        }
      }
    });
    
    console.log("📤 Full GraphQL request payload:", requestPayload);

    // Make the request to Shopify Storefront API using native https
    try {
      // Set up request options
      const requestOptions = {
        hostname: SHOPIFY_DOMAIN,
        path: '/api/2024-04/graphql.json',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestPayload),
          'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_ACCESS_TOKEN,
          'User-Agent': 'Bobby-Streetwear-Checkout/1.0'
        }
      };
      
      console.log("🔗 Request options:", {
        url: `https://${requestOptions.hostname}${requestOptions.path}`,
        method: requestOptions.method,
        headers: {
          ...requestOptions.headers,
          'X-Shopify-Storefront-Access-Token': '***REDACTED***' // Don't log the actual token
        }
      });

      // Make the request
      console.log("📡 Sending request to Shopify...");
      const response = await httpsRequest(requestOptions, requestPayload);
      console.log("📥 Response status:", response.statusCode);
      const data = response.body;
      console.log("📦 Response data:", JSON.stringify(data).substring(0, 500) + '...');

      // Check for GraphQL errors
      if (data.errors) {
        console.error('❌ GraphQL errors from Shopify:', JSON.stringify(data.errors));
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
        console.error('❌ Cart creation errors from Shopify:', JSON.stringify(data.data.cartCreate.userErrors));
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
        console.error('❌ No cart created in Shopify response. Full response:', JSON.stringify(data));
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
      console.log('✅ Cart created successfully!');
      console.log('📋 Cart details:', {
        id: cart.id,
        checkoutUrl: cart.checkoutUrl,
        totalAmount: cart.cost?.totalAmount
      });
      
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
      console.error('❌ Network error when contacting Shopify:', error);
      console.error('Error details:', {
        message: error.message,
        statusCode: error.statusCode,
        body: error.body
      });
      return {
        statusCode: error.statusCode || 500,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to contact Shopify',
          details: error.body || error.message
        })
      };
    }
  } catch (error) {
    console.error('❌❌❌ Unexpected error in checkout function:', error);
    console.error('Full error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      code: error.code
    });
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