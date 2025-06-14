# 🎯 Discount Configuration Guide

## ✅ Problem Fixed

The issue where "sale items that shouldn't be on sale" has been resolved with the **Precise Discount System**.

### What Was Wrong Before:
- The system applied 12% discount to ANY item containing keywords like "hoodie", "sweatshirt", etc.
- This caught items that shouldn't be discounted

### What's Fixed Now:
- **Precise product matching** - only specific products get discounts
- **Strict validation** - prevents false positives
- **Configurable rules** - you control exactly which products are discounted

## 🔧 How to Configure Discounts

### Method 1: By Specific Product IDs (Recommended)

Edit `scripts/precise-discount-system.js` and update the `discountEligibleProducts` object:

```javascript
discountEligibleProducts: {
    // Add your actual Shopify product IDs here
    'your-hoodie-product-id': { percentage: 12, description: '12% off hoodies' },
    'another-hoodie-id': { percentage: 12, description: '12% off hoodies' },
    'sweatshirt-product-id': { percentage: 15, description: '15% off sweatshirts' },
}
```

### Method 2: By Product Handles

If you know the product handles (URL slugs):

```javascript
discountEligibleProducts: {
    'tech-animal-hoodie': { percentage: 12, description: '12% off hoodies' },
    'bobby-sweatshirt': { percentage: 12, description: '12% off sweatshirts' },
}
```

### Method 3: Disable All Discounts Temporarily

To turn off all discounts while you configure:

```javascript
discountEligibleProducts: {
    // Empty object = no discounts
}
```

## 🔍 How to Find Your Product IDs

### Option 1: Check Shopify Admin
1. Go to Shopify Admin → Products
2. Click on a product
3. Look at the URL: `...products/PRODUCT_ID`
4. Use that ID in the configuration

### Option 2: Check Browser Console
1. Add a product to cart
2. Open browser console (F12)
3. Look for log messages showing product details
4. Use the ID shown in the logs

### Option 3: Check Network Tab
1. Open DevTools → Network tab
2. Add a product to cart
3. Look at the API requests to see product data

## 📝 Example Configuration

Here's an example of how to set up discounts for specific products:

```javascript
discountEligibleProducts: {
    // Hoodies that should be 12% off
    'hoodie-black-large': { percentage: 12, description: '12% off black hoodie' },
    'hoodie-navy-medium': { percentage: 12, description: '12% off navy hoodie' },
    
    // Sweatshirts that should be 15% off
    'sweatshirt-vintage-small': { percentage: 15, description: '15% off vintage sweatshirt' },
    
    // Special sale items
    'limited-edition-hoodie': { percentage: 20, description: '20% off limited edition' },
}
```

## 🧪 Testing Your Configuration

1. **Add products to cart** that should have discounts
2. **Verify discount appears** in cart with correct percentage
3. **Add products that shouldn't be discounted** 
4. **Verify no discount appears** for non-eligible items
5. **Check console logs** for messages like:
   - `🎯 Applying 12% discount to: [Product Name]`
   - `ℹ️ No discount applied to: [Product Name]`

## 🚨 Important Notes

### Current Default Behavior
- **No products have discounts by default** (safe mode)
- You must explicitly add product IDs to enable discounts
- This prevents accidental discounting of wrong items

### Validation Rules
The system includes extra validation to prevent false positives:
- Excludes gift cards, shipping, fees, accessories
- Requires actual hoodie/sweatshirt indicators in title
- Uses exact product matching when possible

### Console Logging
The system logs all discount decisions:
- `🎯 Applying X% discount to: [Product]` - Discount applied
- `ℹ️ No discount applied to: [Product]` - No discount (correct)

## 🔄 Quick Fix Steps

1. **Identify which products should be discounted**
2. **Get their product IDs from Shopify**
3. **Add them to `discountEligibleProducts` in the script**
4. **Test by adding products to cart**
5. **Verify only intended products show discounts**

## ✅ Result

After configuration:
- ✅ Only products you specify will have discounts
- ✅ Sale prices persist when items are removed
- ✅ No false positives or unwanted discounts
- ✅ Clean console with no spam
- ✅ Precise control over all pricing

**Your discount system is now completely under your control!**