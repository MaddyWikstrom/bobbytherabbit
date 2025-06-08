// netlify/functions/get-product-by-handle.js
// Function to fetch a single product by handle from Shopify

exports.handler = async function(event, context) {
  // Handle preflight OPTIONS requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Shopify-Storefront-Access-Token',
        'Access-Control-Max-Age': '86400',
        'Content-Length': '0'
      },
      body: ''
    };
  }

  // Get product handle from query params
  const params = event.queryStringParameters;
  const handle = params && params.handle;
  
  if (!handle) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Product handle is required' })
    };
  }

  console.log(`Fetching product with handle: ${handle}`);

  // Configuration with fallback domains
  const SHOPIFY_CONFIGS = [
    {
      domain: 'mfdkk3-7g.myshopify.com',  // Primary domain
      storefrontAccessToken: '8c6bd66766da4553701a1f1fe7d94dc4',
      apiVersion: '2024-04'
    },
    // Use alternative domain format as fallback
    {
      domain: 'bobbytherabbit.com.myshopify.com',  // Alternative domain format
      storefrontAccessToken: '8c6bd66766da4553701a1f1fe7d94dc4',
      apiVersion: '2024-04'
    }
  ];
  
  // Add debugging for the request
  console.log(`Attempting to fetch product with handle: ${handle} from ${SHOPIFY_CONFIGS.length} configured domains`);

  // GraphQL query for a single product by handle
  const productQuery = `
    query ProductByHandle($handle: String!) {
      product(handle: $handle) {
        id
        title
        handle
        description
        descriptionHtml
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
          maxVariantPrice {
            amount
            currencyCode
          }
        }
        images(first: 20) {
          edges {
            node {
              url
              altText
            }
          }
        }
        variants(first: 100) {
          edges {
            node {
              id
              title
              price {
                amount
                currencyCode
              }
              compareAtPrice {
                amount
                currencyCode
              }
              availableForSale
              quantityAvailable
              image {
                url
                altText
              }
              selectedOptions {
                name
                value
              }
            }
          }
        }
        tags
        productType
      }
    }
  `;

  // Function to make API request with retry logic
  async function makeShopifyRequest(config, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        // Try multiple handle formats if original fails
        let handleFormats = [handle];
        
        // Add common variations of the handle to try
        if (i > 0) {
          handleFormats = [
            handle,
            handle.toLowerCase(),
            handle.replace(/-/g, '_'),
            handle.replace(/_/g, '-'),
            handle.replace(/\s+/g, '-').toLowerCase()
          ];
        }
        
        let lastError = null;
        let lastStatus = null;
        
        // Try each handle format
        for (const currentHandle of handleFormats) {
          try {
            console.log(`Attempt ${i + 1}: Trying domain ${config.domain} for product handle "${currentHandle}"`);
            
            const response = await fetch(`https://${config.domain}/api/${config.apiVersion}/graphql.json`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Storefront-Access-Token': config.storefrontAccessToken,
                'Accept': 'application/json',
                'User-Agent': 'Netlify-Function/1.0'
              },
              body: JSON.stringify({ 
                query: productQuery,
                variables: { handle: currentHandle }
              })
            });

            console.log(`Response status: ${response.status} for domain ${config.domain} with handle "${currentHandle}"`);
            lastStatus = response.status;
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error(`HTTP error ${response.status} for ${config.domain} with handle "${currentHandle}":`, errorText);
              lastError = new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
              continue; // Try next handle format
            }

            const data = await response.json();

            if (data.errors) {
              console.error('GraphQL Errors for', config.domain, 'with handle', currentHandle, ':', data.errors);
              lastError = new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
              continue; // Try next handle format
            }

            if (!data.data.product) {
              console.error(`Product with handle "${currentHandle}" not found on ${config.domain}`);
              lastError = new Error(`Product with handle "${currentHandle}" not found`);
              continue; // Try next handle format
            }

            console.log(`Success with domain ${config.domain}, found product: ${data.data.product.title}`);
            return {
              success: true,
              data: data.data.product,
              domain: config.domain,
              handle: currentHandle
            };
          } catch (handleError) {
            console.error(`Error with handle "${currentHandle}":`, handleError.message);
            lastError = handleError;
            // Continue to next handle format
          }
        }
        
        // If we've tried all handle formats and none worked, throw the last error
        if (lastError) {
          // If it's the last retry, throw the error to be caught by the outer catch
          if (i === retries - 1) {
            throw lastError;
          }
          
          // Otherwise, continue to the next retry
          console.log(`All handle formats failed for attempt ${i + 1}, trying again...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          continue;
        }
      } catch (error) {
        console.error(`Attempt ${i + 1} failed for ${config.domain}:`, error.message);
        
        if (i === retries - 1) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    // If we reach here, all retries failed
    throw new Error(`All retry attempts failed for domain ${config.domain}`);
  }

  // Try variations of the handle if the original doesn't work
  const handleVariations = [
    handle,
    handle.toLowerCase(),
    handle.replace(/-/g, '_'),
    handle.replace(/_/g, '-'),
    handle.replace(/\s+/g, '-').toLowerCase()
  ];
  
  console.log(`Will try these handle variations if needed:`, handleVariations);
  
  // Try each configuration
  let lastError = null;
  
  for (const config of SHOPIFY_CONFIGS) {
    try {
      const result = await makeShopifyRequest(config);
      
      if (result && result.success) {
        console.log(`Successfully found product with handle "${result.handle}" on domain ${result.domain}`);
        
        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Shopify-Storefront-Access-Token',
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, max-age=0',
            'X-Working-Domain': result.domain,
            'X-Working-Handle': result.handle
          },
          body: JSON.stringify({
            product: result.data,
            meta: {
              domain: result.domain,
              handle: result.handle,
              originalHandle: handle,
              timestamp: new Date().toISOString()
            }
          })
        };
      }
    } catch (error) {
      console.error(`Configuration failed for ${config.domain}:`, error.message);
      lastError = error;
      continue;
    }
  }

  // If all configurations failed, return error
  console.error('All Shopify configurations failed. Last error:', lastError?.message);
  
  return {
    statusCode: 404,  // Changed from 500 to 404 as this is more appropriate for product not found
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Shopify-Storefront-Access-Token',
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0'
    },
    body: JSON.stringify({ 
      error: 'Failed to fetch product from all configured domains',
      requestedHandle: handle,
      details: lastError?.message || 'Unknown error',
      attemptedDomains: SHOPIFY_CONFIGS.map(c => c.domain),
      attemptedHandles: handleVariations,
      timestamp: new Date().toISOString()
    })
  };
};