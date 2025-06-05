# 🛍️ Shopify API Setup Guide for Bobby Streetwear

## ❌ Current Issue
Your Shopify Storefront API is blocking requests from `https://bobbytherabbit.com` due to CORS policy. This prevents your website from loading products directly from Shopify.

## ✅ Solution: Configure Shopify Storefront API

### Step 1: Access Your Shopify Admin
1. Go to your Shopify admin: `https://bobbytherabbit.com.myshopify.com/admin`
2. Log in with your admin credentials

### Step 2: Create/Update Storefront Access Token
1. In your Shopify admin, go to **Apps and sales channels**
2. Click **Develop apps** (or **Private apps** in older versions)
3. Look for an existing app or click **Create an app**

### Step 3: Configure App Permissions
1. Click on your app (or create a new one called "Bobby Streetwear Website")
2. Go to **Configuration** tab
3. Under **Storefront API access scopes**, enable:
   - ✅ `unauthenticated_read_product_listings`
   - ✅ `unauthenticated_read_product_inventory`
   - ✅ `unauthenticated_read_product_tags`
   - ✅ `unauthenticated_read_selling_plans`

### Step 4: Add Your Domain
1. In the app configuration, find **Allowed origins** or **CORS settings**
2. Add your domain: `https://bobbytherabbit.com`
3. Also add: `https://*.bobbytherabbit.com` (for subdomains)
4. Save the configuration

### Step 5: Get Your Access Token
1. Go to **API credentials** tab
2. Copy the **Storefront access token**
3. This should be: `8c6bd66766da4553701a1f1fe7d94dc4` (verify this is correct)

### Step 6: Verify Token Permissions
Make sure your token has these permissions:
- ✅ Read products
- ✅ Read product listings
- ✅ Read inventory
- ✅ Read collections

## 🔍 Alternative: Check Existing App Settings

If you already have a Storefront API app:

1. Go to **Apps and sales channels** → **Develop apps**
2. Find your existing app
3. Click **Configuration**
4. Under **Storefront API**, check:
   - Is the access token active?
   - Are the correct scopes enabled?
   - Is `https://bobbytherabbit.com` in allowed origins?

## 🧪 Test After Configuration

1. Visit: `https://bobbytherabbit.com/shopify-test.html`
2. Click "Test Shopify API"
3. You should see your products load successfully

## 📋 Expected Results After Fix

✅ **Console should show:**
- "Successfully fetched X products!"
- Product list with real data from your Shopify store

✅ **Your website should display:**
- All products from your Shopify store
- Real pricing and inventory
- Actual product images from Shopify
- Live updates when you change products in Shopify

## 🚨 If Still Not Working

### Check These Common Issues:

1. **Wrong Domain**: Make sure you added `https://bobbytherabbit.com` (not `http://` or without `https://`)

2. **Token Expired**: Generate a new Storefront access token

3. **Insufficient Permissions**: Ensure all required scopes are enabled

4. **Store Not Published**: Make sure your products are published and visible

### Alternative Solution: Use Shopify Buy Button

If Storefront API continues to have issues, we can implement Shopify Buy Buttons as an alternative:

1. In Shopify admin, go to **Sales channels** → **Buy Button**
2. Create buy buttons for your products
3. Embed them in your website

## 📞 Need Help?

If you're having trouble with these steps:
1. Check your Shopify plan (Storefront API requires certain plans)
2. Contact Shopify support for API configuration help
3. Verify your store settings allow API access

---

**Once you complete these steps, your Bobby Streetwear website will load products directly from your Shopify store in real-time! 🎉**