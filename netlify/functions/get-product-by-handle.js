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
  ];

  // GraphQL query for a single product by handle
  const productQuery = `
    query ProductByHandle($handle: String!) {
      product(handle: $handle) {
        id
        title
        handle
        description
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
        console.log(`Attempt ${i + 1}: Trying domain ${config.domain} for product ${handle}`);
        
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
            variables: { handle: handle }
          })
        });

        console.log(`Response status: ${response.status} for domain ${config.domain}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`HTTP error ${response.status} for ${config.domain}:`, errorText);
          
          if (i === retries - 1) {
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
          }
          continue;
        }

        const data = await response.json();

        if (data.errors) {
          console.error('GraphQL Errors for', config.domain, ':', data.errors);
          
          if (i === retries - 1) {
            throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
          }
          continue;
        }

        if (!data.data.product) {
          console.error(`Product with handle "${handle}" not found on ${config.domain}`);
          
          if (i === retries - 1) {
            throw new Error(`Product with handle "${handle}" not found`);
          }
          continue;
        }

        console.log(`Success with domain ${config.domain}, found product: ${data.data.product.title}`);
        return {
          success: true,
          data: data.data.product,
          domain: config.domain
        };

      } catch (error) {
        console.error(`Attempt ${i + 1} failed for ${config.domain}:`, error.message);
        
        if (i === retries - 1) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  // Try each configuration
  let lastError = null;
  
  for (const config of SHOPIFY_CONFIGS) {
    try {
      const result = await makeShopifyRequest(config);
      
      if (result.success) {
        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Shopify-Storefront-Access-Token',
            'Content-Type': 'application/json',
            'X-Working-Domain': result.domain
          },
          body: JSON.stringify({
            product: result.data,
            meta: {
              domain: result.domain,
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
    statusCode: 500,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Shopify-Storefront-Access-Token',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
      error: 'Failed to fetch product from all configured domains',
      details: lastError?.message || 'Unknown error',
      attemptedDomains: SHOPIFY_CONFIGS.map(c => c.domain),
      timestamp: new Date().toISOString()
    })
  };
};