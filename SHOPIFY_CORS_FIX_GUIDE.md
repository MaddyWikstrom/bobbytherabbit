# 🔧 Shopify CORS Fix Guide for Bobby Streetwear

## ❌ Current Issue
Your Shopify Storefront API is blocking requests due to CORS policy, even with the new token `8c6bd66766da4553701a1f1fe7d94dc4`.

## 📚 Official Shopify Documentation
**Reference:** https://shopify.dev/docs/api/pos-ui-extensions/2025-04/server-communication#cors

Shopify enforces strict CORS policies for security. The Storefront API has limited CORS support and requires proper server-side implementation.

## ✅ Solution Steps

### Step 1: Configure Shopify App CORS Settings

1. **Go to your Shopify Admin:**
   - Visit: `https://bobbytherabbit.com.myshopify.com/admin`
   - Log in with your admin credentials

2. **Navigate to Apps:**
   - Go to **Apps and sales channels**
   - Click **Develop apps** (or **Private apps** in older versions)

3. **Find Your Storefront API App:**
   - Look for the app that has your token `8c6bd66766da4553701a1f1fe7d94dc4`
   - Click on the app name

4. **Verify Token Permissions:**
   - Go to **Configuration** tab
   - Look for **Storefront API access scopes** section
   - **Note:** There are NO "Allowed origins" or "CORS settings" in Shopify admin
   - This is why we need the Netlify function proxy!

5. **Ensure These Permissions Are Enabled:**
   Make sure these scopes are enabled:
   - ✅ `unauthenticated_read_product_listings`
   - ✅ `unauthenticated_read_product_inventory`
   - ✅ `unauthenticated_read_product_tags`
   - ✅ `unauthenticated_read_selling_plans`

6. **Save Configuration**

### Step 2: Test the Fix

1. **Wait 5-10 minutes** for Shopify to propagate the changes
2. **Clear your browser cache**
3. **Visit your website:** `https://bobbytherabbit.com/products.html`
4. **Check browser console** - CORS errors should be gone

### Step 3: Alternative - Use Admin API (If Storefront API Still Fails)

If the Storefront API continues to have CORS issues, we can switch to using the Admin API via the Netlify function:

1. **Get Admin API Token:**
   - In Shopify Admin, go to **Apps and sales channels** → **Develop apps**
   - Create a new app or use existing one
   - Go to **Configuration** → **Admin API access scopes**
   - Enable: `read_products`, `read_product_listings`
   - Generate **Admin API access token**

2. **Update Netlify Function:**
   - Replace Storefront API with Admin API endpoint
   - Use Admin API token instead of Storefront token

## 🔍 Current Implementation Status

✅ **Already Implemented:**
- ✅ Netlify function proxy at `/.netlify/functions/get-products`
- ✅ CORS headers in Netlify function
- ✅ Fallback to direct API if function fails
- ✅ New token `8c6bd66766da4553701a1f1fe7d94dc4` deployed everywhere

⏳ **Needs Configuration:**
- ⏳ Shopify app CORS origins (Step 1 above)

## 🚨 If Still Not Working

### Check These:

1. **Token Validity:**
   ```bash
   curl -X POST \
     https://bobbytherabbit.com.myshopify.com/api/2024-01/graphql.json \
     -H "Content-Type: application/json" \
     -H "X-Shopify-Storefront-Access-Token: 8c6bd66766da4553701a1f1fe7d94dc4" \
     -d '{"query": "{ shop { name } }"}'
   ```

2. **Netlify Function Logs:**
   - Check Netlify dashboard for function execution logs
   - Look for errors in the function

3. **Browser Network Tab:**
   - Check if the request to `/.netlify/functions/get-products` is successful
   - Look at response headers and status codes

## 🏗️ Shopify-Recommended Solutions

Based on official Shopify documentation, here are the recommended approaches:

### 1. **Server-Side Proxy (Current Implementation) ✅**
- **Status:** Already implemented via Netlify functions
- **Benefit:** Bypasses all CORS restrictions
- **File:** [`netlify/functions/get-products.js`](netlify/functions/get-products.js)

### 2. **Shopify App Proxy**
- Create a Shopify app with proxy configuration
- Route requests through Shopify's proxy system
- Requires app development and installation

### 3. **Shopify Hydrogen/Remix Framework**
- Use Shopify's official React framework
- Built-in CORS handling and optimization
- Requires framework migration

### 4. **Shopify Buy SDK**
- Official JavaScript SDK with CORS support
- Limited to specific operations
- Alternative to direct GraphQL calls

## 📞 Next Steps

1. **Current Solution:** CSV-first loading is working ✅
2. **Monitor:** Netlify function deployment for API integration
3. **Future:** Consider Shopify Buy SDK for enhanced features

## 🔗 Additional Resources

- [Shopify CORS Documentation](https://shopify.dev/docs/api/pos-ui-extensions/2025-04/server-communication#cors)
- [Shopify Storefront API Guide](https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api)
- [Shopify Buy SDK](https://shopify.dev/docs/api/storefront/2024-01/objects/product)

---

**Current Status: ✅ Working solution deployed with CSV data + server-side proxy backup**