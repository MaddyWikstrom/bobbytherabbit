# Fix "View Your Order" Button Domain Issue

## Problem
The "View your order" button in order confirmation emails is linking to:
```
https://bobbytherabbit.com/70139478183/orders/...
```

Instead of:
```
https://mfdkk3-7g.myshopify.com/70139478183/orders/...
```

## Root Cause
Shopify is using your custom domain (`bobbytherabbit.com`) for order status URLs instead of your native Shopify domain (`mfdkk3-7g.myshopify.com`).

## Solution: Update Shopify Domain Settings

### Step 1: Access Shopify Admin
1. Go to: `https://mfdkk3-7g.myshopify.com/admin`
2. Log in with your admin credentials

### Step 2: Check Domain Configuration
1. Navigate to **Settings** → **Domains**
2. Look for your domain configuration

### Step 3: Fix Primary Domain Setting
You'll see something like this:
- **Primary domain**: `bobbytherabbit.com` ← This is the problem
- **Shopify domain**: `mfdkk3-7g.myshopify.com`

**Option A: Remove Custom Domain (Recommended)**
1. If `bobbytherabbit.com` is listed as a custom domain, **remove it**
2. This will force Shopify to use `mfdkk3-7g.myshopify.com` for all order URLs
3. Click **Save**

**Option B: Configure Domain Properly**
1. If you want to keep `bobbytherabbit.com`, you need to:
   - Set up proper DNS pointing to Shopify
   - Configure SSL certificate through Shopify
   - Ensure the domain is fully connected

### Step 4: Update Email Template (If Needed)
1. Go to **Settings** → **Notifications**
2. Find **Order confirmation** email
3. Click **Edit code**
4. Verify the "View your order" button uses: `{{ order.order_status_url }}`

### Step 5: Test the Fix
1. Place a test order
2. Check the confirmation email
3. The "View your order" button should now link to `mfdkk3-7g.myshopify.com`

## Why This Happened
Your Shopify store has `bobbytherabbit.com` configured as a custom domain, but it's not properly connected. Shopify is trying to use this domain for order status URLs, but since the domain isn't fully configured, the links don't work properly.

## Quick Fix
The fastest solution is to **remove the custom domain** from Shopify settings and use only the native `mfdkk3-7g.myshopify.com` domain for now. You can always add the custom domain back later once it's properly configured.

## Expected Result
After the fix, order confirmation emails will contain:
```
https://mfdkk3-7g.myshopify.com/70139478183/orders/72c686da318f92e7be6454ff82f99826/authenticate?key=...
```

This URL will work correctly and allow customers to view their order status.