# 🏷️ Tag-Based Discount Setup Guide

## Overview

This is the **simple and effective solution** for displaying discount information when using Shopify's automatic discounts. Instead of complex API calls, it uses product tags to simulate "was $X, now $Y" pricing.

## 🎯 The Problem Solved

- ✅ Your 12% automatic discount works at checkout
- ❌ Customers don't see the savings until checkout
- ❌ No "was $65, now $57.20" display on product pages

## 💡 The Simple Solution

1. **Tag your sale products** in Shopify admin
2. **JavaScript detects the tags** and calculates original prices
3. **Displays discount badges** and crossed-out pricing
4. **Works immediately** - no API setup required!

## 📁 Files Created

- [`scripts/tag-based-discount-display.js`](scripts/tag-based-discount-display.js:1) - Main discount logic
- [`styles/tag-based-sale-display.css`](styles/tag-based-sale-display.css:1) - Sale styling
- [`test-tag-based-discounts.html`](test-tag-based-discounts.html:1) - Testing interface

## 🔧 Setup Steps

### Step 1: Tag Your Sale Products in Shopify

In your Shopify admin, add tags to products that are part of your 12% sale:

**Recommended tags:**
- `weekend-flash` - For your weekend flash sale
- `sale` - For general sale items
- `flash-sale` - For flash sales
- `clearance` - For clearance items (20% off)

**How to add tags:**
1. Go to **Products** in Shopify admin
2. Select a product on sale
3. In the **Tags** field, add: `weekend-flash`
4. Save the product
5. Repeat for all sale products

### Step 2: Add Files to Your Site

Add the CSS and JavaScript files to your pages:

```html
<!-- Add to your <head> section -->
<link rel="stylesheet" href="styles/tag-based-sale-display.css">

<!-- Add before closing </body> tag -->
<script src="scripts/tag-based-discount-display.js"></script>
```

### Step 3: Test the System

1. **Open the test page:** `test-tag-based-discounts.html`
2. **See the examples** of how different tags display
3. **Verify the math:** $65 ÷ 0.88 = $73.86 (original price for 12% off)

## 🧮 How the Math Works

For a **12% discount**, the current price is 88% of the original:
- **Current Price** = Original Price × 0.88
- **Original Price** = Current Price ÷ 0.88

**Example:**
- Current price: $57.20
- Original price: $57.20 ÷ 0.88 = $65.00
- Display: ~~$65.00~~ **$57.20** (Save $7.80)

## 🎨 What Customers See

### Products with Sale Tags:
- **Discount badge** in top-right corner showing "-12%"
- **Original price** crossed out in gray
- **Sale price** highlighted in green
- **Savings amount** showing dollar amount and percentage

### Products without Sale Tags:
- **Regular price display** with no changes
- **No discount badges** or special styling

## ⚙️ Configuration

The system supports different sale types:

```javascript
// In tag-based-discount-display.js
this.saleConfigs = {
  'weekend-flash': {
    discountPercent: 12,
    badgeText: 'WEEKEND FLASH',
    badgeColor: '#ff4757'
  },
  'sale': {
    discountPercent: 12,
    badgeText: 'SALE',
    badgeColor: '#e74c3c'
  },
  'clearance': {
    discountPercent: 20,
    badgeText: 'CLEARANCE',
    badgeColor: '#f39c12'
  }
};
```

## 🔄 Integration with Existing Code

### Automatic Integration
The system automatically:
- Detects product cards on page load
- Applies sale styling to tagged products
- Watches for new products added dynamically

### Manual Integration
You can also manually process products:

```javascript
// Process a product array
const productsWithSales = window.tagBasedDiscountDisplay.processProducts(products);

// Apply to existing cards
window.tagBasedDiscountDisplay.applyToProductCards();

// Check if product has sale tag
const isOnSale = window.tagBasedDiscountDisplay.hasSaleTag(product);
```

## 📱 Mobile Optimization

The system includes:
- **Responsive design** for all screen sizes
- **Touch-friendly** discount badges
- **Optimized typography** for mobile reading
- **Reduced motion** support for accessibility

## 🎯 Expected Results

After tagging your products and adding the files:

1. **Products with `weekend-flash` tag** show:
   - Red discount badge with "-12%" and "WEEKEND FLASH"
   - Original price crossed out
   - Current price highlighted in green
   - Savings amount displayed

2. **Products without sale tags** show:
   - Normal price display
   - No discount badges

3. **Automatic updates** when new products are loaded

## 🧪 Testing Checklist

- [ ] Add `weekend-flash` tag to a test product in Shopify
- [ ] Include CSS and JS files in your pages
- [ ] Open `test-tag-based-discounts.html` to see examples
- [ ] Verify discount badges appear on tagged products
- [ ] Check that math is correct (current price ÷ 0.88 = original)
- [ ] Test on mobile devices

## 🔧 Troubleshooting

### "No discount badges showing"
- Verify products have the correct tags in Shopify
- Check that CSS and JS files are loaded
- Open browser console for error messages

### "Wrong original price calculation"
- Verify the discount percentage in the configuration
- For 12% off: `discountPercent: 12`
- For 20% off: `discountPercent: 20`

### "Styling looks wrong"
- Ensure CSS file is loaded after your main styles
- Check for CSS conflicts with existing styles
- Verify product cards have the expected HTML structure

## 🚀 Deployment

This system works immediately:
- ✅ **No API tokens** required
- ✅ **No server-side setup** needed
- ✅ **Works locally** and on any hosting
- ✅ **No Shopify app** installation required

Simply:
1. Tag your products in Shopify admin
2. Add the files to your site
3. Deploy and test!

## 📊 Performance

- **Lightweight** - Only ~8KB of JavaScript
- **Fast** - No API calls or external dependencies
- **Cached** - Runs once per page load
- **Efficient** - Only processes products with sale tags

## 🎉 Benefits

- **Immediate implementation** - Works right away
- **No maintenance** - Set it and forget it
- **Flexible** - Easy to add new sale types
- **Reliable** - No API dependencies or rate limits
- **SEO friendly** - All content is rendered client-side

This solution perfectly addresses your need to show discount information for your 12% automatic sale without any complex setup!