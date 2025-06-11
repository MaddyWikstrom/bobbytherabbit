// Dynamic variant resolution checkout function
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

    // Check credentials - ALWAYS use Storefront API token for checkout operations
    const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || process.env.SHOPIFY_DOMAIN || 'mfdkk3-7g.myshopify.com';
    const SHOPIFY_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN; // Using the available token for Storefront API
    const API_VERSION = process.env.SHOPIFY_API_VERSION || '2024-04';

    console.log("🔑 Shopify credentials check:", {
      domain: SHOPIFY_DOMAIN ? '✅ Present' : '❌ Missing',
      token: SHOPIFY_TOKEN ? '✅ Present' : '❌ Missing',
      apiVersion: API_VERSION
    });

    if (!SHOPIFY_DOMAIN) {
      throw new Error("Missing Shopify domain configuration");
    }
    
    if (!SHOPIFY_TOKEN) {
      throw new Error("Missing Shopify access token. Make sure SHOPIFY_ACCESS_TOKEN is set in your environment variables.");
    }

    // Function to fetch product variants by handle
    async function getVariants(handle) {
      console.log(`🔍 Fetching variants for product handle: ${handle}`);
      const query = `
        query {
          product(handle: "${handle}") {
            variants(first: 100) {
              edges {
                node {
                  id
                  title
                  selectedOptions {
                    name
                    value
                  }
                }
              }
            }
          }
        }
      `;

      const response = await fetch(`https://${SHOPIFY_DOMAIN}/api/${API_VERSION}/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': SHOPIFY_TOKEN
        },
        body: JSON.stringify({ query })
      });

      if (!response.ok) {
        console.error(`❌ Failed to fetch variants for ${handle}: ${response.status} ${response.statusText}`);
        return null;
      }

      const result = await response.json();
      
      if (!result.data || !result.data.product) {
        console.error(`❌ Product not found or invalid response for handle: ${handle}`);
        return null;
      }
      
      console.log(`✅ Retrieved ${result.data.product.variants.edges.length} variants for ${handle}`);
      return result.data.product.variants.edges.map(({ node }) => node);
    }
    
    // Parse custom IDs to extract product handle, color and size
    function parseCustomId(customId) {
      // Handle different custom ID formats
      // Format 1: 'product-handle_Color_Size-Color-Size'
      // Format 2: 'product-handle_Color_Size'
      
      let handle, color, size;
      
      if (customId.includes('-')) {
        // Try to extract handle as everything before the first underscore
        const firstUnderscorePos = customId.indexOf('_');
        if (firstUnderscorePos > 0) {
          handle = customId.substring(0, firstUnderscorePos);
          
          // Try to extract color and size
          const dashPos = customId.indexOf('-', firstUnderscorePos);
          if (dashPos > 0) {
            // Format 1: Look for color and size after the dash
            const parts = customId.substring(dashPos + 1).split('-');
            if (parts.length >= 2) {
              color = parts[0];
              size = parts[1];
            }
          } else {
            // Format 2: Try to extract from underscores
            const parts = customId.substring(firstUnderscorePos + 1).split('_');
            if (parts.length >= 2) {
              color = parts[0];
              size = parts[1];
            }
          }
        }
      }
      
      return { handle, color, size };
    }

    // Create a variant ID resolver that builds mappings dynamically
    const variantCache = {}; // Cache variant data by product handle
    
    async function resolveVariantId(customId) {
      console.log(`🔄 Resolving custom ID: ${customId}`);
      
      // If it's already a valid GID, return it directly
      if (typeof customId === 'string' && customId.startsWith('gid://shopify/ProductVariant/')) {
        console.log(`✅ ID already in GID format: ${customId}`);
        return customId;
      }
      
      // Parse the custom ID to extract product handle, color and size
      const { handle, color, size } = parseCustomId(customId);
      console.log(`📝 Parsed custom ID - Handle: ${handle || 'unknown'}, Color: ${color || 'unknown'}, Size: ${size || 'unknown'}`);
      
      if (!handle) {
        console.error(`❌ Could not parse product handle from custom ID: ${customId}`);
        return null;
      }
      
      // Fetch variants if not already in cache
      if (!variantCache[handle]) {
        variantCache[handle] = await getVariants(handle);
      }
      
      const variants = variantCache[handle];
      if (!variants || variants.length === 0) {
        console.error(`❌ No variants found for handle: ${handle}`);
        return null;
      }
      
      // Find matching variant based on color and size
      let matchedVariant = null;
      
      for (const variant of variants) {
        // Extract color and size from variant's selectedOptions
        const variantColor = variant.selectedOptions.find(opt => opt.name === "Color")?.value;
        const variantSize = variant.selectedOptions.find(opt => opt.name === "Size")?.value;
        
        console.log(`👀 Checking variant - Title: ${variant.title}, Color: ${variantColor || 'none'}, Size: ${variantSize || 'none'}`);
        
        // Check for direct match on color and size
        if ((color && variantColor && variantColor.toLowerCase().includes(color.toLowerCase())) &&
            (size && variantSize && variantSize.toLowerCase().includes(size.toLowerCase()))) {
          matchedVariant = variant;
          console.log(`✅ Found exact match for color and size: ${variant.id}`);
          break;
        }
        
        // Check for match in the variant title if we couldn't match by options
        if (!matchedVariant && variant.title) {
          if ((color && variant.title.toLowerCase().includes(color.toLowerCase())) &&
              (size && variant.title.toLowerCase().includes(size.toLowerCase()))) {
            matchedVariant = variant;
            console.log(`✅ Found match in variant title: ${variant.id}`);
            break;
          }
        }
      }
      
      // If no exact match was found but we have size, try matching just by size
      if (!matchedVariant && size) {
        matchedVariant = variants.find(v => {
          const variantSize = v.selectedOptions.find(opt => opt.name === "Size")?.value;
          return variantSize && variantSize.toLowerCase().includes(size.toLowerCase());
        });
        
        if (matchedVariant) {
          console.log(`⚠️ Found partial match by size: ${matchedVariant.id}`);
        }
      }
      
      // If no match found at all, use the first variant as fallback
      if (!matchedVariant && variants.length > 0) {
        matchedVariant = variants[0];
        console.log(`⚠️ No match found, using first variant as fallback: ${matchedVariant.id}`);
      }
      
      return matchedVariant ? matchedVariant.id : null;
    }
    
    // Process each item to resolve variant IDs
    const processedItems = [];
    for (const item of items) {
      // If it's already a valid GID, use it directly
      if (typeof item.variantId === 'string' && item.variantId.startsWith('gid://shopify/ProductVariant/')) {
        processedItems.push(item);
        continue;
      }
      
      // Try to resolve the variant ID
      const resolvedId = await resolveVariantId(item.variantId);
      
      if (resolvedId) {
        console.log(`🔄 Resolved custom ID "${item.variantId}" to real Shopify GID: ${resolvedId}`);
        processedItems.push({
          ...item,
          variantId: resolvedId
        });
      } else {
        console.error(`❌ Failed to resolve variant ID for: ${item.variantId}`);
        // Skip this item
      }
    }
    
    // Check if we have any valid items to checkout
    if (processedItems.length === 0) {
      throw new Error("❌ No valid Shopify variant IDs to checkout. All variant resolution attempts failed.");
    }
    
    console.log(`✅ Successfully resolved ${processedItems.length} items for checkout`);
    
    // Convert to Cart API format - using merchandiseId for the Cart API
    const lines = processedItems.map(item => {
      return `{ 
        merchandiseId: "${item.variantId}", 
        quantity: ${item.quantity} 
      }`;
    }).join(',');

    // Use cartCreate mutation with enhanced response data
    const query = `
      mutation {
        cartCreate(input: {
          lines: [${lines}]
        }) {
          cart {
            id
            checkoutUrl
            lines(first: 50) {
              edges {
                node {
                  merchandise {
                    ... on ProductVariant {
                      id
                      title
                      product {
                        title
                        handle
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
      console.error("❌ GraphQL error:", JSON.stringify(result.errors));
      throw new Error(`GraphQL error: ${result.errors[0].message}`);
    }

    const { cart, userErrors } = result.data.cartCreate;

    if (userErrors && userErrors.length > 0) {
      console.error("❌ User errors:", JSON.stringify(userErrors));
      throw new Error(`Shopify error: ${userErrors[0].message} (${userErrors[0].code || 'No code'})`);
    }

    if (!cart || !cart.checkoutUrl) {
      throw new Error("Checkout URL not returned by Shopify.");
    }

    // Log the actual items that were added to the cart
    if (cart.lines && cart.lines.edges) {
      console.log("📋 Items in checkout cart:");
      cart.lines.edges.forEach(edge => {
        const { merchandise, quantity } = edge.node;
        console.log(`- ${quantity}x ${merchandise.product.title} (${merchandise.title})`);
      });
    }

    console.log("✅ Cart created successfully!");
    console.log("🔗 Original checkout URL:", cart.checkoutUrl);

    // Use SHOPIFY_STORE_DOMAIN if available for checkout URL
    let finalCheckoutUrl = cart.checkoutUrl;
    
    // Check if we need to replace the default myshopify domain with SHOPIFY_STORE_DOMAIN
    if (cart.checkoutUrl.includes('myshopify.com') && SHOPIFY_DOMAIN) {
      // Extract the default Shopify domain from the URL (e.g., mfdkk3-7g.myshopify.com)
      const shopifyUrlMatch = cart.checkoutUrl.match(/https:\/\/([^\/]+)/);
      if (shopifyUrlMatch && shopifyUrlMatch[1]) {
        const shopifyDomain = shopifyUrlMatch[1];
        console.log(`🔄 Replacing ${shopifyDomain} with ${SHOPIFY_DOMAIN} in checkout URL`);
        finalCheckoutUrl = cart.checkoutUrl.replace(shopifyDomain, SHOPIFY_DOMAIN);
      }
    }

    console.log("🔗 Final checkout URL:", finalCheckoutUrl);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        // Return checkoutUrl to maintain compatibility with client code
        checkoutUrl: finalCheckoutUrl,
        cartId: cart.id,
        itemCount: cart.lines?.edges?.length || 0
      })
    };

  } catch (err) {
    console.error("❌ Cart creation error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: err.message || "Internal error",
        details: err.stack,
        itemsReceived: items?.length || 0,
        processedItems: processedItems?.length || 0
      })
    };
  }
};