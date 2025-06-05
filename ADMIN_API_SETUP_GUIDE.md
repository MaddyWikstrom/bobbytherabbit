# Shopify Admin API Setup Guide

## Why Admin API is Better

The Admin API approach you found is superior because:

1. **No CORS Issues**: Admin API calls are made server-side
2. **No Certificate Problems**: Uses standard HTTPS endpoints
3. **More Reliable**: Direct access to your store data
4. **Better Performance**: No client-side API limitations
5. **Full Access**: Can access all store data, not just public storefront data

## Step 1: Create Admin API Token

1. **Go to your Shopify Admin**
   - Navigate to: Settings → Apps and sales channels → Develop apps

2. **Create a Private App**
   - Click "Create an app"
   - Name it: "Bobby Streetwear Website Integration"
   - Click "Create app"

3. **Configure Admin API Access**
   - Click "Configure Admin API scopes"
   - Enable these scopes:
     - `read_products` (to fetch product data)
     - `read_product_listings` (for product listings)
     - `read_inventory` (for stock levels)
     - `read_orders` (if you need order data)

4. **Generate Admin API Access Token**
   - Click "Install app"
   - Copy the Admin API access token (starts with `shpat_`)
   - **IMPORTANT**: Save this token securely - you can't see it again!

## Step 2: Update Your Configuration

Replace your current Storefront API setup with Admin API:

```javascript
// OLD (Storefront API)
const SHOPIFY_CONFIG = {
  domain: 'bobbytherabbit.com.myshopify.com',
  storefrontAccessToken: '8c6bd66766da4553701a1f1fe7d94dc4',
  apiVersion: '2024-01'
};

// NEW (Admin API)
const SHOPIFY_CONFIG = {
  domain: 'bobbytherabbit.com.myshopify.com',
  adminAccessToken: 'shpat_YOUR_ADMIN_TOKEN_HERE',
  apiVersion: '2024-01'
};
```

## Step 3: API Endpoints

**Admin API uses different endpoints:**

- **Storefront API**: `https://domain/api/version/graphql.json`
- **Admin API**: `https://domain/admin/api/version/products.json`

## Step 4: Authentication

**Admin API uses different headers:**

```javascript
// Storefront API headers
headers: {
  'X-Shopify-Storefront-Access-Token': 'token'
}

// Admin API headers  
headers: {
  'X-Shopify-Access-Token': 'shpat_token'
}
```

## Benefits of This Approach

1. **No Domain Issues**: Uses standard `.myshopify.com` domain
2. **No Certificate Problems**: Standard HTTPS works perfectly
3. **Server-Side Only**: No CORS issues since it runs in Netlify functions
4. **More Data**: Access to inventory, variants, detailed product info
5. **Better Performance**: Direct REST API calls, no GraphQL complexity

## Security Note

⚠️ **IMPORTANT**: Admin API tokens are powerful and should NEVER be exposed in client-side code. Always use them in:
- Netlify functions (server-side)
- Environment variables
- Secure backend services

The token gives full access to your store data, so treat it like a password!