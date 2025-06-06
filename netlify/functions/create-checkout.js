const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse the cart items from the request
    const { items } = JSON.parse(event.body);
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No items provided' })
      };
    }

    // Get Shopify credentials from environment variables
    const SHOPIFY_DOMAIN = process.env.SHOPIFY_DOMAIN;
    const SHOPIFY_STOREFRONT_ACCESS_TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

    if (!SHOPIFY_DOMAIN || !SHOPIFY_STOREFRONT_ACCESS_TOKEN) {
      console.error('Missing Shopify credentials');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Store configuration error' })
      };
    }

    // Create the GraphQL mutation for checkout creation
    const mutation = `
      mutation checkoutCreate($input: CheckoutCreateInput!) {
        checkoutCreate(input: $input) {
          checkout {
            id
            webUrl
            totalPrice {
              amount
              currencyCode
            }
            lineItems(first: 250) {
              edges {
                node {
                  title
                  quantity
                  variant {
                    id
                    title
                    price {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
          }
          checkoutUserErrors {
            field
            message
          }
        }
      }
    `;

    // Format line items for Shopify
    const lineItems = items.map(item => ({
      variantId: item.variantId,
      quantity: item.quantity
    }));

    // Make the request to Shopify Storefront API
    const response = await fetch(`https://${SHOPIFY_DOMAIN}/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_ACCESS_TOKEN
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          input: {
            lineItems: lineItems,
            allowPartialAddresses: true
          }
        }
      })
    });

    const data = await response.json();

    // Check for errors
    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Failed to create checkout',
          details: data.errors 
        })
      };
    }

    if (data.data.checkoutCreate.checkoutUserErrors.length > 0) {
      console.error('Checkout errors:', data.data.checkoutCreate.checkoutUserErrors);
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Failed to create checkout',
          details: data.data.checkoutCreate.checkoutUserErrors 
        })
      };
    }

    // Return the checkout URL
    const checkout = data.data.checkoutCreate.checkout;
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        checkoutUrl: checkout.webUrl,
        checkoutId: checkout.id,
        totalPrice: checkout.totalPrice,
        lineItems: checkout.lineItems.edges
      })
    };

  } catch (error) {
    console.error('Error creating checkout:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to create checkout',
        message: error.message 
      })
    };
  }
};