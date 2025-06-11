# Environment Variables Configuration for Shopify Checkout

This document explains how the Netlify function uses the environment variables currently configured in your Netlify deployment.

## Current Environment Variables

Your Netlify site is currently configured with the following Shopify-related environment variables:

```
SHOPIFY_ACCESS_TOKEN
SHOPIFY_ADMIN_TOKEN
SHOPIFY_API_VERSION
SHOPIFY_STORE_DOMAIN
NODE_ENV
```

## How The Function Uses These Variables

The `create-checkout-simplified.js` function has been updated to work with your existing environment variables:

1. **Domain**: Uses `SHOPIFY_STORE_DOMAIN` (with fallback to `SHOPIFY_DOMAIN`)
2. **API Token**: Uses `SHOPIFY_ACCESS_TOKEN` (with fallback to `SHOPIFY_STOREFRONT_ACCESS_TOKEN`)
3. **API Version**: Uses `SHOPIFY_API_VERSION` (with fallback to '2023-07')

## Variable Mapping

| Function Needs | Your Environment Variable |
|----------------|---------------------------|
| Store Domain | SHOPIFY_STORE_DOMAIN |
| Storefront API Token | SHOPIFY_ACCESS_TOKEN |
| API Version | SHOPIFY_API_VERSION |

## Troubleshooting

If you're still experiencing issues after the update:

1. **Verify Token Type**: Ensure `SHOPIFY_ACCESS_TOKEN` is a Storefront API token, not an Admin API token
   - The Storefront API and Admin API use different tokens
   - Checkout creation requires a Storefront API token with checkout permissions

2. **Check Token Permissions**: Your Storefront API token must have these permissions:
   - ✅ Write to cart

3. **Verify Domain Format**: Ensure your domain is in the correct format:
   - Should be: `your-store.myshopify.com`
   - No `https://` prefix
   - No trailing slashes

4. **API Version**: If GraphQL errors occur, ensure your API version is compatible with the checkout mutation
   - The function now uses your configured `SHOPIFY_API_VERSION`

## Testing After Changes

To verify that these changes have fixed the environment variable issues:

1. Deploy the updated code to Netlify
2. Add items to your cart using the checkout-test.html page
3. Click the "Direct Checkout" button
4. Check the Netlify function logs to see if credentials are now properly detected
   - Look for: `🔑 Shopify credentials check: { domain: "✅ Present", token: "✅ Present" }`

This update should eliminate the "Missing Shopify credentials" error while still maintaining compatibility with your existing Netlify environment configuration.