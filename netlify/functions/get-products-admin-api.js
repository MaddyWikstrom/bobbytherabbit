// netlify/functions/get-products-admin-api.js
// Admin API implementation without fallbacks - requires deployment to function

exports.handler = async function(event, context) {
  // Handle preflight OPTIONS requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400',
        'Content-Length': '0'
      },
      body: ''
    };
  }

  try {
    // Use Admin API token from environment variables
    const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
    const STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || 'mfdkk3-7g.myshopify.com';
    const API_VERSION = process.env.SHOPIFY_API_VERSION || '2024-01';

    // Check if required environment variables are set
    if (!ADMIN_TOKEN) {
      console.error('Missing SHOPIFY_ADMIN_TOKEN environment variable');
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Missing SHOPIFY_ADMIN_TOKEN environment variable',
          troubleshooting: 'Please set the SHOPIFY_ADMIN_TOKEN environment variable in Netlify dashboard',
          meta: {
            source: 'Admin API',
            count: 0,
            timestamp: new Date().toISOString()
          }
        })
      };
    }

    console.log('Admin API Config:', {
      domain: STORE_DOMAIN,
      hasToken: !!ADMIN_TOKEN,
      apiVersion: API_VERSION
    });

    // Admin API REST endpoint for products
    const adminApiUrl = `https://${STORE_DOMAIN}/admin/api/${API_VERSION}/products.json?limit=250`;

    console.log('Fetching products from Admin API:', adminApiUrl);
    
    const response = await fetch(adminApiUrl, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': ADMIN_TOKEN,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Admin API Error:', response.status, errorText);
      
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: `Admin API Error: ${response.status}`,
          troubleshooting: [
            'Verify SHOPIFY_ADMIN_TOKEN is correct in Netlify environment variables',
            'Check that the store domain is correct',
            'Ensure the Admin API is enabled for your Shopify store',
            'Confirm the app has the necessary scopes (read_products, etc.)'
          ],
          meta: {
            source: 'Admin API',
            count: 0,
            statusCode: response.status,
            timestamp: new Date().toISOString()
          }
        })
      };
    }

    const data = await response.json();

    // Transform Admin API response to match frontend expectations
    const transformedProducts = data.products.map(product => ({
      node: {
        id: `gid://shopify/Product/${product.id}`,
        title: product.title,
        handle: product.handle,
        description: product.body_html || product.description || '',
        priceRange: {
          minVariantPrice: {
            amount: product.variants && product.variants.length > 0 
              ? Math.min(...product.variants.map(v => parseFloat(v.price))).toString()
              : '0.00',
            currencyCode: 'USD'
          },
          maxVariantPrice: {
            amount: product.variants && product.variants.length > 0 
              ? Math.max(...product.variants.map(v => parseFloat(v.price))).toString()
              : '0.00',
            currencyCode: 'USD'
          }
        },
        images: {
          edges: (product.images || []).map(image => ({
            node: {
              url: image.src,
              altText: image.alt || product.title
            }
          }))
        },
        variants: {
          edges: (product.variants || []).map(variant => ({
            node: {
              id: `gid://shopify/ProductVariant/${variant.id}`,
              title: variant.title,
              price: {
                amount: variant.price,
                currencyCode: 'USD'
              },
              compareAtPrice: variant.compare_at_price ? {
                amount: variant.compare_at_price,
                currencyCode: 'USD'
              } : null,
              availableForSale: variant.available || false,
              selectedOptions: (variant.option1 || variant.option2 || variant.option3) ? [
                ...(variant.option1 ? [{ name: product.options?.[0]?.name || 'Option 1', value: variant.option1 }] : []),
                ...(variant.option2 ? [{ name: product.options?.[1]?.name || 'Option 2', value: variant.option2 }] : []),
                ...(variant.option3 ? [{ name: product.options?.[2]?.name || 'Option 3', value: variant.option3 }] : [])
              ] : []
            }
          }))
        },
        tags: product.tags ? product.tags.split(', ') : [],
        productType: product.product_type || ''
      }
    }));

    console.log(`Successfully fetched ${transformedProducts.length} products via Admin API`);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        products: transformedProducts,
        meta: {
          source: 'Admin API',
          count: transformedProducts.length,
          domain: STORE_DOMAIN,
          timestamp: new Date().toISOString()
        }
      })
    };

  } catch (error) {
    console.error('Error fetching products via Admin API:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Failed to fetch products via Admin API', 
        troubleshooting: [
          'This app requires deployment to Netlify to function properly',
          'Environment variables must be configured in the Netlify dashboard',
          'SHOPIFY_ADMIN_TOKEN must be set with a valid Admin API access token',
          'Local testing is not supported'
        ],
        meta: {
          source: 'Admin API',
          count: 0,
          errorMessage: error.message,
          timestamp: new Date().toISOString()
        }
      })
    };
  }
};