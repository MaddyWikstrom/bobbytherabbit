# Shopify Token Guide for Bobby Streetwear

## Important Token Information

This document explains the critical differences between Shopify API tokens and how to use them correctly in this project.

## Types of Shopify API Tokens

There are two primary types of tokens used for interacting with Shopify:

1. **Storefront API Token** - Used for customer-facing operations like browsing products and checkout
2. **Admin API Token** - Used for administrative operations like creating/editing products

## ⚠️ CRITICAL: Checkout Operations Must Use Storefront API Token

The checkout system in this application **MUST** use the Storefront API token, not the Admin API token. Using the wrong token will result in 500 errors during checkout.

## Where to Find the Correct Storefront API Token

The Storefront API token must be generated from:
- Shopify Admin → Settings → Apps and sales channels → Develop apps → Your App → Storefront API access token

Do NOT use tokens from:
- API credentials page
- Admin API section
- Private app credentials

## Environment Variables Setup

For Netlify deployment, set the following environment variables:

```
SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_storefront_token_here
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
```

## Token Usage in Different Functions

- **create-checkout-fixed.js**: Must use ONLY the Storefront API token
- **get-products.js**: Uses the Storefront API for browsing products
- **get-products-admin-api.js**: Uses Admin API token (for admin functions only)

## Common Issues and Solutions

1. **500 Errors During Checkout**
   - Verify you're using the Storefront API token, not Admin API token
   - Ensure the token has the necessary scopes (unauthenticated_write_checkouts)

2. **"No Such Product Exists" Errors**
   - The system is using fake/incorrect Shopify variant IDs
   - Ensure ShopifyIdHandler is properly integrated to maintain real Shopify GIDs

3. **Token Not Working**
   - Storefront API tokens are app-specific; regenerate in the correct app
   - Check token expiration; Shopify tokens can expire or be revoked

## Testing Token Validity

You can test if your Storefront API token is valid by using:
```
curl -X POST \
  -H "X-Shopify-Storefront-Access-Token: your_token_here" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ shop { name } }"}' \
  https://your-store.myshopify.com/api/2024-04/graphql.json
```

A valid token will return the shop name.