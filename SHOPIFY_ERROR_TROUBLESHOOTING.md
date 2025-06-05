# Shopify Integration Error Troubleshooting Guide

## Current Errors Analysis

Based on your error messages, here are the issues and their solutions:

### 1. 404 Error - Netlify Function Not Found
**Error:** `Failed to load resource: the server responded with a status of 404`

**Cause:** The Netlify function `/.netlify/functions/get-products` is not being found or deployed properly.

**Solutions:**
- Ensure your site is deployed to Netlify
- Check that the `netlify/functions/` directory is properly configured
- Verify your `netlify.toml` configuration
- Use the fixed version: `netlify/functions/get-products-fixed.js`

### 2. JSON Parse Error
**Error:** `SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`

**Cause:** The server is returning an HTML error page instead of JSON, likely due to the 404 error above.

**Solution:** Fix the Netlify function deployment issue.

### 3. Certificate Error
**Error:** `ERR_CERT_COMMON_NAME_INVALID`

**Cause:** SSL certificate issues with your Shopify domain `bobbytherabbit.com.myshopify.com`

**Solutions:**
- Try the alternative domain: `bobbytherabbit.myshopify.com` (without .com)
- The fixed integration includes domain fallback logic

### 4. Shopify Buy SDK Error
**Error:** `Uncaught (in promise) TypeError: Failed to fetch`

**Cause:** Related to the certificate issue above.

**Solution:** Use the fixed integration with domain fallbacks.

## Step-by-Step Troubleshooting

### Step 1: Test Your Setup
1. Open `debug-shopify-integration.html` in your browser
2. Run all four tests to identify which parts are working
3. Check the browser console for detailed error messages

### Step 2: Fix Domain Issues
The most likely issue is your Shopify domain. Try these domains in order:
1. `bobbytherabbit.myshopify.com` (recommended)
2. `bobbytherabbit.com.myshopify.com` (your current)

### Step 3: Deploy Fixed Files
Replace your current files with the fixed versions:

1. **Replace Shopify Integration:**
   ```bash
   # Backup current file
   cp scripts/shopify-integration.js scripts/shopify-integration-backup.js
   
   # Use fixed version
   cp scripts/shopify-integration-fixed.js scripts/shopify-integration.js
   ```

2. **Replace Netlify Function:**
   ```bash
   # Backup current file
   cp netlify/functions/get-products.js netlify/functions/get-products-backup.js
   
   # Use fixed version
   cp netlify/functions/get-products-fixed.js netlify/functions/get-products.js
   ```

3. **Redeploy to Netlify:**
   - Commit and push your changes
   - Or manually redeploy in Netlify dashboard

### Step 4: Test Each Component

#### Test 1: Direct Shopify API
```javascript
// Test in browser console
fetch('https://bobbytherabbit.myshopify.com/api/2024-01/graphql.json', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': '8c6bd66766da4553701a1f1fe7d94dc4'
    },
    body: JSON.stringify({
        query: `{
            shop {
                name
                description
            }
        }`
    })
}).then(r => r.json()).then(console.log);
```

#### Test 2: Netlify Function
```javascript
// Test in browser console
fetch('/.netlify/functions/get-products')
    .then(r => r.json())
    .then(console.log);
```

#### Test 3: Shopify Buy SDK
```javascript
// Test in browser console (after loading SDK)
const client = ShopifyBuy.buildClient({
    domain: 'bobbytherabbit.myshopify.com',
    storefrontAccessToken: '8c6bd66766da4553701a1f1fe7d94dc4',
    apiVersion: '2024-01'
});
client.product.fetchAll().then(console.log);
```

## Fixed Integration Features

The `shopify-integration-fixed.js` includes:

1. **Domain Fallback Logic:** Tries multiple domains automatically
2. **Retry Mechanism:** Retries failed requests with exponential backoff
3. **Enhanced Error Handling:** Better error messages and logging
4. **Health Check Function:** `window.shopifyDebug.performHealthCheck()`
5. **Multiple Fetch Strategies:** Netlify function → Direct API → Hardcoded fallback

## Fixed Netlify Function Features

The `get-products-fixed.js` includes:

1. **Multiple Domain Support:** Tests both domain variations
2. **Retry Logic:** Automatic retries with delays
3. **Better Error Responses:** More detailed error information
4. **Enhanced Logging:** Better debugging information

## Debugging Commands

After implementing the fixes, use these debugging commands in the browser console:

```javascript
// Check health status
window.shopifyDebug.performHealthCheck();

// Get current configuration
window.shopifyDebug.getConfig();

// Manually fetch products
window.shopifyDebug.fetchProducts();

// Get Shopify client
window.shopifyDebug.getClient();

// Get checkout object
window.shopifyDebug.getCheckout();
```

## Common Issues and Solutions

### Issue: "Access token is invalid"
**Solution:** Verify your Storefront Access Token in Shopify Admin:
1. Go to Apps → Manage private apps
2. Check your app's Storefront API permissions
3. Regenerate token if necessary

### Issue: "Domain not found"
**Solution:** Verify your Shopify store URL:
1. Check your store's actual domain in Shopify Admin
2. Try both `yourstore.myshopify.com` and `yourstore.com.myshopify.com`

### Issue: CORS errors
**Solution:** 
1. Ensure your domain is added to Shopify's allowed origins
2. Use the Netlify function instead of direct API calls
3. Check your `_headers` file configuration

### Issue: Netlify function 404
**Solution:**
1. Ensure functions are in `netlify/functions/` directory
2. Check `netlify.toml` configuration
3. Redeploy your site
4. Check Netlify function logs in dashboard

## Next Steps

1. **Test the debug page:** Open `debug-shopify-integration.html`
2. **Replace your files:** Use the fixed versions
3. **Redeploy:** Push changes to Netlify
4. **Monitor:** Check browser console for detailed logs
5. **Verify:** Test the complete integration flow

## Support

If issues persist after following this guide:

1. Check the browser console for detailed error messages
2. Check Netlify function logs in your Netlify dashboard
3. Verify your Shopify store settings and API permissions
4. Test with the debug page to isolate the issue

The fixed integration includes comprehensive logging to help identify exactly where issues occur.