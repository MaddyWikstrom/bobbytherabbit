// netlify/functions/get-products.js
// Admin API Implementation - Bypasses CORS completely

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
    const STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || 'bobbytherabbit.myshopify.com';
    const API_VERSION = process.env.SHOPIFY_API_VERSION || '2024-01';

    // Check if required environment variables are set
    if (!ADMIN_TOKEN) {
      console.error('Missing SHOPIFY_ADMIN_TOKEN environment variable');
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Missing SHOPIFY_ADMIN_TOKEN environment variable',
          details: 'Please set the SHOPIFY_ADMIN_TOKEN environment variable in Netlify dashboard'
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
      throw new Error(`Admin API error! status: ${response.status}, message: ${errorText}`);
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
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(transformedProducts)
    };

  } catch (error) {
    console.error('Error fetching products via Admin API:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Failed to fetch products via Admin API', 
        details: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};