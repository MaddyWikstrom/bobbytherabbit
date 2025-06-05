// netlify/functions/options-handler.js
// Handle CORS preflight OPTIONS requests

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

  // For non-OPTIONS requests, return method not allowed
  return {
    statusCode: 405,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};