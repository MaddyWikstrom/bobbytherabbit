// Simple, reliable implementation for Shopify checkout creation
// Based on feedback and example provided

exports.handler = async (event) => {
  // Enable CORS
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

  // Use dynamic import for node-fetch to avoid ESM issues
  const fetch = (...args) => import('node-fetch').then(mod => mod.default(...args));

  try {
    console.log("🚀 Checkout function triggered");
    console.log("📦 Raw request body:", event.body);

    // Parse the cart items from the request
    const requestBody = JSON.parse(event.body);
    console.log("✅ Parsed request body:", JSON.stringify(requestBody));

    // Extract items array directly
    const { items } = requestBody;
    console.log("📋 Items received:", JSON.stringify(items));

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error("❌ No valid items provided");
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

    // Validate credentials
    if (!SHOPIFY_DOMAIN || !SHOPIFY_STOREFRONT_ACCESS_TOKEN) {
      console.error("❌ Missing Shopify credentials");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Configuration error',
          details: 'Missing Shopify credentials'
        })
      };
    }

    // Validate and format variant IDs
    const lineItems = [];
    for (const item of items) {
      // Ensure we have a variant ID
      if (!item.variantId) {
        console.error(`❌ Missing variantId for item: ${JSON.stringify(item)}`);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Invalid item',
            details: `Missing variantId for item: ${JSON.stringify(item)}`
          })
        };
      }

      // Ensure quantity is valid
      const quantity = parseInt(item.quantity, 10) || 1;
      if (isNaN(quantity) || quantity <= 0) {
        console.error(`❌ Invalid quantity for item: ${JSON.stringify(item)}`);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Invalid item',
            details: `Invalid quantity for item: ${JSON.stringify(item)}`
          })
        };
      }

      // Format variantId to Shopify's GID format if needed
      let variantId = item.variantId;
      if (!variantId.includes('gid://shopify')) {
        // Handle numeric IDs
        if (/^\d+$/.test(variantId)) {
          variantId = `gid://shopify/ProductVariant/${variantId}`;
        }
        // Handle IDs with prefixes
        else if (variantId.includes('-')) {
          const parts = variantId.split('-');
          const potentialId = parts.find(part => /^\d+$/.test(part));
          if (potentialId) {
            variantId = `gid://shopify/ProductVariant/${potentialId}`;
          }
        }
      }

      lineItems.push({ variantId, quantity });
    }

    console.log("✅ Formatted line items:", JSON.stringify(lineItems));

    // Create the GraphQL mutation for checkout creation
    // Using the newer checkoutCreate mutation which has better performance
    const query = `
      mutation {
        checkoutCreate(input: {
          lineItems: [
            ${lineItems.map(item => `{variantId: "${item.variantId}", quantity: ${item.quantity}}`).join(',')}
          ]
        }) {
          checkout {
            id
            webUrl
          }
          checkoutUserErrors {
            message
            field
            code
          }
        }
      }
    `;

    console.log("📤 GraphQL query:", query);

    // Make the request to Shopify
    const response = await fetch(`https://${SHOPIFY_DOMAIN}/api/2023-07/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_ACCESS_TOKEN
      },
      body: JSON.stringify({ query })
    });

    // Check for HTTP errors
    if (!response.ok) {
      console.error(`❌ HTTP error from Shopify: ${response.status} ${response.statusText}`);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          error: 'Shopify API error',
          details: `${response.status}: ${response.statusText}`
        })
      };
    }

    // Parse the response
    const result = await response.json();
    console.log("📥 Shopify response:", JSON.stringify(result).substring(0, 500) + '...');

    // Check for GraphQL errors
    if (result.errors && result.errors.length > 0) {
      console.error("❌ GraphQL errors:", JSON.stringify(result.errors));
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'GraphQL error',
          details: result.errors[0].message
        })
      };
    }

    // Check for checkout user errors
    const { checkout, checkoutUserErrors } = result.data.checkoutCreate;
    if (checkoutUserErrors && checkoutUserErrors.length > 0) {
      console.error("❌ Checkout user errors:", JSON.stringify(checkoutUserErrors));
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Checkout creation error',
          details: checkoutUserErrors[0].message
        })
      };
    }

    // Ensure checkout was created
    if (!checkout || !checkout.webUrl) {
      console.error("❌ No checkout URL in response");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Missing checkout URL',
          details: 'Shopify response did not include a checkout URL'
        })
      };
    }

    // Success!
    console.log("✅ Checkout created successfully!");
    console.log("🔗 Checkout URL:", checkout.webUrl);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        checkoutUrl: checkout.webUrl,
        checkoutId: checkout.id
      })
    };

  } catch (error) {
    console.error("❌❌❌ Unexpected error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Checkout creation failed',
        details: error.message
      })
    };
  }
};