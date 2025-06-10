# Shopify Checkout Implementation Guide

This guide summarizes the Shopify checkout integration options and fixes implemented for Bobby Streetwear.

> **CRITICAL UPDATE:** After testing, we discovered ESM compatibility issues with the original Netlify function approach. A completely rewritten version (`create-checkout-fixed.js`) has been created that uses Node's native https module instead of node-fetch to avoid these issues.

## Implementation Options

### Option 1: Integrated Cart Solution
- **Files**: `scripts/bobby-checkout-storefront.js` + `scripts/simple-cart-system.js`
- **Purpose**: Preserves your existing cart UI/UX while adding Shopify checkout
- **How it works**: When users click checkout, it creates a Shopify checkout session via Storefront API

### Option 2: Direct Client-Side Implementation
- **File**: `direct-storefront-checkout.html`
- **Purpose**: Demonstrates standalone implementation without Netlify functions
- **How it works**: Makes Storefront API requests directly from the client

### Option 3: Netlify Function
- **File**: `netlify/functions/create-checkout.js`
- **Purpose**: Server-side checkout creation for added security
- **How it works**: Handles Shopify API calls on the server, avoids exposing tokens

## Fixed Issues

### 1. Netlify Function 502 Error
The 502 Bad Gateway error was caused by ESM compatibility issues with node-fetch. We fixed this by creating a completely rewritten version that uses Node's native https module instead.

### 2. Netlify Function 500 Internal Server Error
To diagnose 500 Internal Server errors, we've added enhanced logging throughout the function. These logs will appear in the Netlify Functions dashboard and help identify exactly where issues are occurring:

- Request payload logging
- Shopify credentials verification
- Line item preparation
- GraphQL request details
- Response parsing
- Error details

### 3. Duplicate Script Declaration Errors
Added safeguards to prevent script conflicts:
```js
// Prevent duplicate declarations
if (window.BobbyCartSystem) {
  console.log('BobbyCartSystem already initialized, using existing instance');
} else {
  // Create cart system...
}
```

## Testing the Implementation

### For Local Testing
1. Use the `direct-storefront-checkout.html` example
2. This works without deployment and shows the direct API integration

### For Deployed Testing
1. All options should work when deployed
2. The Netlify function approach now uses dynamic imports to fix ESM compatibility

## Troubleshooting

If you encounter issues with the checkout process, follow these steps to diagnose and resolve them:

### Checking Netlify Function Logs

1. Go to your Netlify dashboard
2. Navigate to Functions > create-checkout-fixed > Logs
3. Look for log entries with emoji indicators:
   - 🚀 Function start
   - 📦 Request body information
   - 🔑 Credential verification
   - 📝 Line item processing
   - 📤 GraphQL request details
   - 📥 Response information
   - ❌ Error indicators

### Common Issues and Solutions

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| Missing line items | Cart items not formatted correctly | Check the format of items being sent from the cart |
| Invalid variant ID | Variant IDs not in Shopify's GID format | Ensure IDs are formatted as `gid://shopify/ProductVariant/12345678` |
| Missing Shopify credentials | Environment variables not set | Configure SHOPIFY_DOMAIN and SHOPIFY_STOREFRONT_ACCESS_TOKEN in Netlify |
| GraphQL syntax errors | Malformed query | Check the mutation string for any syntax errors |
| CORS errors | Cross-origin issues | Ensure the CORS headers are properly set |

### Testing Without Deployment

For local testing without dealing with Netlify Functions:

1. Use the `direct-storefront-checkout.html` example
2. This bypasses server-side processing completely
3. Note that your Storefront API token will be exposed in client-side code

## Recommended Approach

For maximum reliability, we recommend:

1. **During development**: Use the direct client-side approach for testing
2. **For production**: Use the integrated cart solution for the best user experience

The code is structured to gracefully fall back if one method fails, ensuring users can always complete their purchase.

## Storefront API vs. Admin API

- **Storefront API** (what we're using): Client-facing, limited permissions, safer to use in browser code
- **Admin API**: More powerful, requires full admin permissions, should only be used server-side

Our implementation uses the Storefront API with appropriate access scopes for checkout creation.