// netlify/functions/get-products.js
// Using built-in fetch (Node.js 18+)

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

  try {
    const SHOPIFY_CONFIG = {
      domain: 'bobbytherabbit.myshopify.com',
      storefrontAccessToken: process.env.SHOPIFY_ACCESS_TOKEN || '8c6bd66766da4553701a1f1fe7d94dc4',
      apiVersion: '2024-01'
    };

    console.log('Shopify Config:', {
      domain: SHOPIFY_CONFIG.domain,
      hasToken: !!SHOPIFY_CONFIG.storefrontAccessToken,
      apiVersion: SHOPIFY_CONFIG.apiVersion
    });

    // Enhanced GraphQL query to match what the frontend expects
    const productsQuery = `
      query Products {
        products(first: 250) {
          edges {
            node {
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
              images(first: 5) {
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
        }
      }
    `;

    const response = await fetch(`https://${SHOPIFY_CONFIG.domain}/api/${SHOPIFY_CONFIG.apiVersion}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_CONFIG.storefrontAccessToken,
        'Accept': 'application/json'
      },
      body: JSON.stringify({ query: productsQuery })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.errors) {
      console.error('GraphQL Errors:', data.errors);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Shopify-Storefront-Access-Token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Failed to fetch products', details: data.errors })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Shopify-Storefront-Access-Token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data.data.products.edges)
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Shopify-Storefront-Access-Token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Failed to fetch products', details: error.message })
    };
  }
};