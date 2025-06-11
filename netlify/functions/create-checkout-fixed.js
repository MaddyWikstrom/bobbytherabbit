exports.handler = async (event) => {
  const fetch = (...args) => import('node-fetch').then(mod => mod.default(...args));

  console.log("🚀 Cart creation function triggered");

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

  try {
    const rawBody = event.body;
    console.log("📦 Raw request body:", rawBody);

    const { items } = JSON.parse(rawBody || '{}');
    console.log("✅ Parsed request body:", { items });

    if (!items || !Array.isArray(items)) {
      throw new Error("Invalid or missing `items` array.");
    }

    console.log("📋 Items received:", items);

    // Check credentials
    const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || process.env.SHOPIFY_DOMAIN;
    const SHOPIFY_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
    const API_VERSION = process.env.SHOPIFY_API_VERSION || '2024-04';

    console.log("🔑 Shopify credentials check:", {
      domain: SHOPIFY_DOMAIN ? '✅ Present' : '❌ Missing',
      token: SHOPIFY_TOKEN ? '✅ Present' : '❌ Missing',
      apiVersion: API_VERSION
    });

    if (!SHOPIFY_DOMAIN || !SHOPIFY_TOKEN) {
      throw new Error("Missing Shopify credentials");
    }

    // EMERGENCY FIX: Map known product variant names to real Shopify GIDs
    const VARIANT_ID_MAP = {
      // Format: 'custom-variant-id': 'real-shopify-gid'
      'bungi-x-bobby-rabbit-hardware-unisex-hoodie_Vintage_Black_S-Vintage Black-S': 'gid://shopify/ProductVariant/44713213274763',
      'bungi-x-bobby-rabbit-hardware-unisex-hoodie_Vintage_Black_M-Vintage Black-M': 'gid://shopify/ProductVariant/44713213307531',
      'bungi-x-bobby-rabbit-hardware-unisex-hoodie_Vintage_Black_L-Vintage Black-L': 'gid://shopify/ProductVariant/44713213340299',
      'bungi-x-bobby-rabbit-hardware-unisex-hoodie_Vintage_Black_XL-Vintage Black-XL': 'gid://shopify/ProductVariant/44713213373067',
      'bungi-x-bobby-rabbit-hardware-unisex-hoodie_Vintage_Black_XXL-Vintage Black-XXL': 'gid://shopify/ProductVariant/44713213405835'
      // Add more mappings as needed
    };

    // Convert non-GID variant IDs to GIDs using our mapping
    const processedItems = items.map(item => {
      // If it's already a valid GID, use it directly
      if (typeof item.variantId === 'string' && item.variantId.startsWith('gid://shopify/ProductVariant/')) {
        return item;
      }
      
      // If we have a mapping for this ID, use the mapped GID
      if (VARIANT_ID_MAP[item.variantId]) {
        console.log(`🔄 Converted custom ID "${item.variantId}" to real Shopify GID: ${VARIANT_ID_MAP[item.variantId]}`);
        return {
          ...item,
          variantId: VARIANT_ID_MAP[item.variantId]
        };
      }
      
      // No mapping found, return original item
      console.log(`⚠️ No mapping found for custom ID: ${item.variantId}`);
      return item;
    });
    
    // Filter valid GIDs - using the term merchandiseId for the Cart API
    const isValidGID = id =>
      typeof id === 'string' && id.startsWith('gid://shopify/ProductVariant/');

    const validItems = processedItems.filter(item => isValidGID(item.variantId));

    if (validItems.length === 0) {
      throw new Error("❌ No valid Shopify variant IDs to checkout. Please add product mappings in the function.");
    }

    // Convert to Cart API format - note the different structure from checkoutCreate
    const lines = validItems.map(item => {
      // If variantId is already in GID format, use it directly
      const merchandiseId = item.variantId;
      return `{ 
        merchandiseId: "${merchandiseId}", 
        quantity: ${item.quantity} 
      }`;
    }).join(',');

    // Use cartCreate mutation instead of checkoutCreate
    const query = `
      mutation {
        cartCreate(input: {
          lines: [${lines}]
        }) {
          cart {
            id
            checkoutUrl
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    console.log("📤 GraphQL query:", query);

    const response = await fetch(`https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_TOKEN
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      throw new Error(`HTTP error from Shopify: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log("🛍️ Shopify API result:", JSON.stringify(result).substring(0, 500) + '...');

    // Check for GraphQL errors
    if (result.errors && result.errors.length > 0) {
      throw new Error(`GraphQL error: ${result.errors[0].message}`);
    }

    const { cart, userErrors } = result.data.cartCreate;

    if (userErrors && userErrors.length > 0) {
      throw new Error(`Shopify error: ${userErrors[0].message}`);
    }

    if (!cart || !cart.checkoutUrl) {
      throw new Error("Checkout URL not returned by Shopify.");
    }

    console.log("✅ Cart created successfully!");
    console.log("🔗 Checkout URL:", cart.checkoutUrl);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        // Return checkoutUrl to maintain compatibility with client code
        checkoutUrl: cart.checkoutUrl,
        cartId: cart.id
      })
    };

  } catch (err) {
    console.error("❌ Cart creation error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: err.message || "Internal error",
        details: err.stack
      })
    };
  }
};