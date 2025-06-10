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
The 502 Bad Gateway error was caused by ESM compatibility issues with node-fetch. We fixed this by:
```js
// Use dynamic import for node-fetch to fix ESM compatibility issues
const fetch = (...args) => import('node-fetch').then(mod => mod.default(...args));
```

### 2. Duplicate Script Declaration Errors
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

## Recommended Approach

For maximum reliability, we recommend:

1. **During development**: Use the direct client-side approach for testing
2. **For production**: Use the integrated cart solution for the best user experience

The code is structured to gracefully fall back if one method fails, ensuring users can always complete their purchase.

## Storefront API vs. Admin API

- **Storefront API** (what we're using): Client-facing, limited permissions, safer to use in browser code
- **Admin API**: More powerful, requires full admin permissions, should only be used server-side

Our implementation uses the Storefront API with appropriate access scopes for checkout creation.