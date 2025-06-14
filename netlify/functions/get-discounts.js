const fetch = require('node-fetch');

exports.handler = async function (event, context) {
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

  const ADMIN_API_KEY = process.env.SHOPIFY_ADMIN_API_KEY;
  const STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
  const API_VERSION = process.env.SHOPIFY_API_VERSION || '2024-04';

  console.log("Environment check:", {
    adminKey: ADMIN_API_KEY ? '✅ Present' : '❌ Missing',
    domain: STORE_DOMAIN ? '✅ Present' : '❌ Missing',
    apiVersion: API_VERSION
  });

  if (!ADMIN_API_KEY || !STORE_DOMAIN) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Missing required environment variables',
        required: ['SHOPIFY_ADMIN_API_KEY', 'SHOPIFY_STORE_DOMAIN'],
        timestamp: new Date().toISOString()
      })
    };
  }

  const now = new Date();

  try {
    console.log('Fetching price rules from Shopify Admin API...');
    
    // Step 1: Fetch all price rules
    const rulesRes = await fetch(`https://${STORE_DOMAIN}/admin/api/${API_VERSION}/price_rules.json`, {
      headers: {
        'X-Shopify-Access-Token': ADMIN_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!rulesRes.ok) {
      const text = await rulesRes.text();
      console.error(`Failed to fetch price rules: ${rulesRes.status}`, text);
      return {
        statusCode: rulesRes.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Failed to fetch price rules', 
          details: text,
          status: rulesRes.status
        })
      };
    }

    const rulesData = await rulesRes.json();
    console.log(`Found ${rulesData.price_rules?.length || 0} total price rules`);

    // Step 2: Filter only *active* rules
    const activeRules = rulesData.price_rules.filter(rule => {
      const start = rule.starts_at ? new Date(rule.starts_at) : null;
      const end = rule.ends_at ? new Date(rule.ends_at) : null;
      
      // Rule is active if:
      // - No start date OR start date is in the past
      // - No end date OR end date is in the future
      const isActive = (!start || start <= now) && (!end || end >= now);
      
      if (isActive) {
        console.log(`Active rule: ${rule.title} (${rule.value_type}: ${rule.value})`);
      }
      
      return isActive;
    });

    console.log(`Found ${activeRules.length} active price rules`);

    // Step 3: If `handle` query param is passed, fetch product and check rule applicability
    const params = event.queryStringParameters || {};
    const handle = params.handle;

    if (handle) {
      console.log(`Fetching product by handle: ${handle}`);
      
      // Step 3a: Fetch product by handle
      const productRes = await fetch(`https://${STORE_DOMAIN}/admin/api/${API_VERSION}/products.json?handle=${handle}`, {
        headers: {
          'X-Shopify-Access-Token': ADMIN_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!productRes.ok) {
        const text = await productRes.text();
        console.error(`Failed to fetch product by handle: ${productRes.status}`, text);
        return {
          statusCode: productRes.status,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            error: 'Failed to fetch product by handle', 
            details: text,
            handle: handle
          })
        };
      }

      const productData = await productRes.json();
      const product = productData.products?.[0];
      
      if (!product) {
        console.warn(`Product not found for handle: ${handle}`);
        return {
          statusCode: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            error: `Product not found for handle "${handle}"`,
            handle: handle
          })
        };
      }

      console.log(`Found product: ${product.title} (ID: ${product.id})`);

      // Step 3b: Filter active rules by checking if product ID is included (if applicable)
      const matchingRules = activeRules.filter(rule => {
        // If rule has no entitled_product_ids, it applies to all products
        if (!rule.entitled_product_ids || rule.entitled_product_ids.length === 0) {
          console.log(`Rule "${rule.title}" applies to all products`);
          return true;
        }
        
        // Check if this product is specifically entitled
        const isEntitled = rule.entitled_product_ids.includes(product.id);
        if (isEntitled) {
          console.log(`Rule "${rule.title}" applies to product ${product.id}`);
        }
        return isEntitled;
      });

      console.log(`Found ${matchingRules.length} matching rules for product ${handle}`);

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          discounts: matchingRules, 
          product: {
            id: product.id,
            title: product.title,
            handle: product.handle,
            tags: product.tags
          },
          meta: {
            handle: handle,
            totalRules: rulesData.price_rules?.length || 0,
            activeRules: activeRules.length,
            matchingRules: matchingRules.length,
            timestamp: new Date().toISOString()
          }
        })
      };
    }

    // If no handle provided, just return all active rules
    console.log('Returning all active discount rules');
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        discounts: activeRules,
        meta: {
          totalRules: rulesData.price_rules?.length || 0,
          activeRules: activeRules.length,
          timestamp: new Date().toISOString(),
          domain: STORE_DOMAIN
        }
      })
    };

  } catch (err) {
    console.error('Error in get-discounts function:', err);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: err.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};