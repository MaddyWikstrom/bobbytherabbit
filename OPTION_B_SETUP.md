# 🚀 Option B Setup Guide - Step by Step

## What You'll Get:
- Keep your custom Bobby Streetwear design
- Your cart stays on your site
- Secure checkout through Shopify
- Automatic fulfillment with Printful

---

## Step 1: Create Your Shopify Store (5 minutes)

1. Go to [shopify.com](https://shopify.com)
2. Click "Start free trial"
3. Enter your email and create a password
4. Store name: "Bobby Streetwear" (or your preferred name)
5. Skip all the setup questions (click "Skip" at bottom)
6. You're in! Don't worry about themes - we won't use Shopify's frontend

---

## Step 2: Install Printful (3 minutes)

1. In Shopify Admin, click **Apps** in the left sidebar
2. Click **Visit Shopify App Store**
3. Search for "Printful"
4. Click **Add app**
5. Click **Install app**
6. Log in to your Printful account (or create one)
7. Authorize the connection

---

## Step 3: Add Your Products to Printful (10 minutes)

1. In Printful dashboard, click **Add product**
2. Choose your product type:
   - For hoodie: Select "Hoodies" → "Unisex Heavy Blend Hoodie"
   - For t-shirt: Select "T-shirts" → "Unisex Staple T-Shirt"
3. Upload your design files
4. Position the design on the product
5. Click **Proceed to mockups**
6. Select which mockup images you want
7. Click **Proceed to details**
8. Set your retail price (e.g., $89.99 for hoodie)
9. Click **Submit to store**
10. Repeat for each product

---

## Step 4: Get Your Shopify API Credentials (5 minutes)

1. In Shopify Admin, go to **Settings** (bottom left)
2. Click **Apps and sales channels**
3. Click **Develop apps** (top right)
4. Click **Create an app**
5. App name: "Bobby Website Integration"
6. Click **Create app**
7. Click **Configure Storefront API scopes**
8. Check these boxes:
   - ✅ `unauthenticated_read_product_listings`
   - ✅ `unauthenticated_write_checkouts`
   - ✅ `unauthenticated_read_checkouts`
9. Click **Save**
10. Click **Install app**
11. Click **Reveal token once** and COPY IT (you can't see it again!)

---

## Step 5: Get Your Product IDs (5 minutes)

### Easy Method:
1. In Shopify Admin, go to **Products**
2. Click on your first product
3. Look at the URL: `admin.shopify.com/store/YOUR-STORE/products/1234567890`
4. Copy the number at the end (e.g., `1234567890`)
5. Repeat for each product

### Quick Method (if you have many products):
1. Open browser console (F12)
2. Go to your Products page in Shopify
3. Paste this code:
```javascript
// This will list all your products with IDs
fetch('/admin/api/2024-01/products.json')
  .then(r => r.json())
  .then(data => {
    data.products.forEach(p => {
      console.log(`${p.title}: ${p.id}`);
    });
  });
```

---

## Step 6: Update Your Website (2 minutes)

1. Open `bobby-streetwear/scripts/shopify-integration.js`
2. Find this section at the top:
```javascript
const SHOPIFY_CONFIG = {
    domain: 'your-store.myshopify.com',
    storefrontAccessToken: 'your-storefront-access-token',
    apiVersion: '2024-01'
};
```

3. Replace with your actual values:
```javascript
const SHOPIFY_CONFIG = {
    domain: 'bobby-streetwear.myshopify.com', // Your actual domain
    storefrontAccessToken: 'abcd1234567890', // Your actual token
    apiVersion: '2024-01'
};
```

4. Update the product mapping:
```javascript
const PRODUCT_MAPPING = {
    'hoodie-1': {
        name: 'NEON GLITCH HOODIE',
        shopifyProductId: '1234567890', // Your actual product ID
        shopifyVariants: {
            'S': 'gid://shopify/ProductVariant/11111',
            'M': 'gid://shopify/ProductVariant/22222',
            'L': 'gid://shopify/ProductVariant/33333',
            'XL': 'gid://shopify/ProductVariant/44444'
        },
        price: '$89.99'
    },
    // ... repeat for other products
};
```

---

## Step 7: Get Variant IDs (Optional but recommended)

Variant IDs are for different sizes. To get them:

1. In Shopify Admin, go to your product
2. Open browser console (F12)
3. Run this code:
```javascript
// This will show all variants for the current product
Shopify.product.variants.forEach(v => {
    console.log(`${v.title}: gid://shopify/ProductVariant/${v.id}`);
});
```

---

## Step 8: Test Your Integration

1. Open your website locally
2. Click "Add to Cart" on any product
3. You should see:
   - Product added to your custom cart
   - Cart count updates
   - Your normal cart UI works
4. Click "Checkout"
5. You should be redirected to Shopify checkout
6. Complete a test order (use Shopify's test credit card: 4242 4242 4242 4242)

---

## 🎯 Quick Checklist

- [ ] Shopify store created
- [ ] Printful connected
- [ ] Products synced from Printful
- [ ] API token obtained
- [ ] Product IDs collected
- [ ] shopify-integration.js updated
- [ ] Test order completed

---

## 🔧 Troubleshooting

### "Add to Cart not working"
- Check browser console for errors (F12)
- Verify your API token is correct
- Make sure product IDs match

### "Checkout button does nothing"
- Check if `shopifyCheckout` is created (console: `ShopifyIntegration`)
- Verify token has correct permissions

### "Products show wrong price"
- Update prices in Printful
- Wait 5 minutes for sync
- Or manually update in shopify-integration.js

---

## 🎨 Optional: Customize Checkout Page

1. In Shopify Admin, go to **Settings** → **Checkout**
2. Under "Checkout language", customize text
3. Under "Colors", match your brand:
   - Primary: `#8b5cf6` (your purple)
   - Buttons: `#8b5cf6`
   - Errors: `#facc15` (your yellow)
4. Add your logo
5. Save changes

---

## ✅ You're Done!

Your website now:
- Displays products with your custom design
- Adds items to your styled cart
- Processes payments through Shopify
- Automatically sends orders to Printful
- Handles shipping and fulfillment

## Next Steps:
1. Set up your domain in Shopify (for branded checkout)
2. Configure shipping rates
3. Set up email notifications
4. Add Google Analytics
5. Launch! 🚀

---

## Need the Minimal Version?

If you just want to test quickly, here's the absolute minimum:

1. Add to your index.html:
```html
<script>
// Minimal config - just replace these 2 values
window.SHOPIFY_QUICK_CONFIG = {
    domain: 'YOUR-STORE.myshopify.com',
    token: 'YOUR-TOKEN-HERE'
};
</script>
<script src="scripts/shopify-integration.js"></script>
```

2. That's it! The integration will use default product IDs for testing.