// netlify/functions/get-active-discounts.js
// Fetch active discounts via Shopify Admin API

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

  // Get environment variables for Admin API
  const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
  const ADMIN_ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  const API_VERSION = process.env.SHOPIFY_API_VERSION || '2024-04';

  console.log("Admin API Environment check:", {
    domain: SHOPIFY_DOMAIN ? '✅ Present' : '❌ Missing',
    adminToken: ADMIN_ACCESS_TOKEN ? '✅ Present' : '❌ Missing',
    apiVersion: API_VERSION
  });

  if (!SHOPIFY_DOMAIN || !ADMIN_ACCESS_TOKEN) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Missing required environment variables',
        required: ['SHOPIFY_STORE_DOMAIN', 'SHOPIFY_ADMIN_ACCESS_TOKEN'],
        timestamp: new Date().toISOString()
      })
    };
  }

  try {
    // Fetch automatic discounts (like your WEEKEND FLASH SALE)
    const automaticDiscountsResponse = await fetch(
      `https://${SHOPIFY_DOMAIN}/admin/api/${API_VERSION}/discount_codes.json?status=enabled`,
      {
        method: 'GET',
        headers: {
          'X-Shopify-Access-Token': ADMIN_ACCESS_TOKEN,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    // Fetch price rules (covers automatic discounts)
    const priceRulesResponse = await fetch(
      `https://${SHOPIFY_DOMAIN}/admin/api/${API_VERSION}/price_rules.json?status=active`,
      {
        method: 'GET',
        headers: {
          'X-Shopify-Access-Token': ADMIN_ACCESS_TOKEN,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    let automaticDiscounts = [];
    let priceRules = [];

    if (automaticDiscountsResponse.ok) {
      const discountData = await automaticDiscountsResponse.json();
      automaticDiscounts = discountData.discount_codes || [];
      console.log(`Found ${automaticDiscounts.length} discount codes`);
    } else {
      console.warn('Failed to fetch discount codes:', automaticDiscountsResponse.status);
    }

    if (priceRulesResponse.ok) {
      const priceRuleData = await priceRulesResponse.json();
      priceRules = priceRuleData.price_rules || [];
      console.log(`Found ${priceRules.length} price rules`);
    } else {
      console.warn('Failed to fetch price rules:', priceRulesResponse.status);
    }

    // Process and combine discount information
    const activeDiscounts = [];

    // Process price rules (these include automatic discounts)
    for (const rule of priceRules) {
      const now = new Date();
      const startDate = rule.starts_at ? new Date(rule.starts_at) : null;
      const endDate = rule.ends_at ? new Date(rule.ends_at) : null;

      // Check if discount is currently active
      const isActive = (!startDate || now >= startDate) && (!endDate || now <= endDate);

      if (isActive) {
        const discount = {
          id: rule.id,
          title: rule.title,
          type: 'automatic',
          value_type: rule.value_type, // 'percentage' or 'fixed_amount'
          value: rule.value,
          target_type: rule.target_type, // 'line_item' or 'shipping_line'
          target_selection: rule.target_selection, // 'all' or 'entitled'
          allocation_method: rule.allocation_method, // 'across' or 'each'
          customer_selection: rule.customer_selection, // 'all' or 'prerequisite'
          starts_at: rule.starts_at,
          ends_at: rule.ends_at,
          usage_limit: rule.usage_limit,
          once_per_customer: rule.once_per_customer,
          prerequisite_subtotal_range: rule.prerequisite_subtotal_range,
          prerequisite_quantity_range: rule.prerequisite_quantity_range,
          entitled_product_ids: rule.entitled_product_ids || [],
          entitled_variant_ids: rule.entitled_variant_ids || [],
          entitled_collection_ids: rule.entitled_collection_ids || [],
          entitled_country_ids: rule.entitled_country_ids || []
        };

        activeDiscounts.push(discount);
      }
    }

    // Sort by value (highest discount first)
    activeDiscounts.sort((a, b) => {
      if (a.value_type === 'percentage' && b.value_type === 'percentage') {
        return parseFloat(b.value) - parseFloat(a.value);
      }
      if (a.value_type === 'fixed_amount' && b.value_type === 'fixed_amount') {
        return parseFloat(b.value) - parseFloat(a.value);
      }
      // Mixed types - percentage discounts first
      return a.value_type === 'percentage' ? -1 : 1;
    });

    console.log(`Processed ${activeDiscounts.length} active discounts`);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        discounts: activeDiscounts,
        meta: {
          count: activeDiscounts.length,
          timestamp: new Date().toISOString(),
          domain: SHOPIFY_DOMAIN
        }
      })
    };

  } catch (error) {
    console.error('Error fetching discounts:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Failed to fetch active discounts',
        details: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};