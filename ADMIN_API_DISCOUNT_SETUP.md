# 🎯 Admin API Discount Setup Guide

## Overview

This guide implements **Option 2: Advanced Discount Fetching via Admin API** to solve the issue where Shopify's automatic discounts (like your WEEKEND FLASH SALE) don't appear in the Storefront API's `compareAtPrice` fields.

## 🔍 The Problem

- ✅ Shopify automatic discounts work at checkout
- ❌ They don't modify product data in Storefront API
- ❌ Frontend can't display discount information
- ❌ Customers don't see savings until checkout

## 🚀 The Solution

Fetch active discounts via Admin API and apply them client-side to show:
- Discount badges on products
- Original vs. discounted prices
- Savings amounts and percentages
- Real-time discount information

## 📁 Files Created

### 1. Server-Side (Netlify Functions)
- `netlify/functions/get-active-discounts.js` - Fetches discounts via Admin API

### 2. Client-Side Scripts
- `scripts/discount-calculator.js` - Calculates and applies discounts
- `styles/discount-display.css` - Styling for discount elements

### 3. Testing
- `test-admin-api-discounts.html` - Comprehensive testing interface

## 🔧 Environment Setup

### Required Environment Variables

Add these to your Netlify environment variables:

```bash
# Existing (you should already have these)
SHOPIFY_STORE_DOMAIN=mfdkk3-7g.myshopify.com
SHOPIFY_ACCESS_TOKEN=8c6bd66766da4553701a1f1fe7d94dc4
SHOPIFY_API_VERSION=2024-04

# NEW - Required for Admin API
SHOPIFY_ADMIN_ACCESS_TOKEN=your_admin_api_token_here
```

### Getting Admin API Token

1. **Go to Shopify Admin** → Apps → App and sales channel settings
2. **Click "Develop apps"** → Create an app
3. **Configure Admin API access** with these permissions:
   - `read_price_rules` - To fetch discount rules
   - `read_discounts` - To fetch discount codes
   - `read_products` - To match products to discounts
4. **Install the app** and copy the Admin API access token
5. **Add to Netlify** environment variables as `SHOPIFY_ADMIN_ACCESS_TOKEN`

## 🎨 Integration Steps

### Step 1: Add CSS to Your Pages

Add the discount display CSS to your main pages:

```html
<link rel="stylesheet" href="styles/discount-display.css">
```

### Step 2: Include Discount Calculator

Add the discount calculator script:

```html
<script src="scripts/discount-calculator.js"></script>
```

### Step 3: Initialize on Product Pages

The discount calculator auto-initializes, but you can manually trigger updates:

```javascript
// Manual initialization
window.discountCalculator.initialize();

// Update specific products
window.discountCalculator.updateProductCards();

// Apply to product data
const productsWithDiscounts = await window.discountCalculator.applyDiscountsToProducts(products);
```

## 🛠️ API Endpoints

### Get Active Discounts
```
GET /.netlify/functions/get-active-discounts
```

**Response:**
```json
{
  "discounts": [
    {
      "id": "123456789",
      "title": "WEEKEND FLASH SALE",
      "type": "automatic",
      "value_type": "percentage",
      "value": "12.0",
      "target_type": "line_item",
      "target_selection": "all",
      "starts_at": "2024-06-14T00:00:00Z",
      "ends_at": "2024-06-16T23:59:59Z",
      "entitled_product_ids": [],
      "entitled_variant_ids": [],
      "entitled_collection_ids": []
    }
  ],
  "meta": {
    "count": 1,
    "timestamp": "2024-06-14T19:05:00Z",
    "domain": "mfdkk3-7g.myshopify.com"
  }
}
```

## 🎯 Discount Logic

### Eligibility Check
1. **All Products** - If `target_selection: "all"` and no specific targeting
2. **Specific Products** - If product ID in `entitled_product_ids`
3. **Specific Variants** - If variant ID in `entitled_variant_ids`
4. **Collections** - If product belongs to entitled collections

### Calculation
1. **Percentage Discounts** - `discountedPrice = originalPrice * (1 - value/100)`
2. **Fixed Amount** - `discountedPrice = originalPrice - value`
3. **Best Discount** - Automatically selects highest savings

### Display Elements
- **Discount Badge** - Shows percentage/amount off
- **Original Price** - Crossed out with red line
- **Discounted Price** - Highlighted in green
- **Savings Amount** - Shows dollar amount and percentage saved

## 🧪 Testing

### Local Testing Limitations
⚠️ **Important:** Admin API requires server-side access and won't work locally.

### Testing Steps
1. **Deploy to Netlify** with environment variables
2. **Open test page:** `https://your-site.netlify.app/test-admin-api-discounts.html`
3. **Click "Fetch Active Discounts"** to test API
4. **Click "Test Product Discounts"** to see application

### Expected Results
- ✅ Fetches your WEEKEND FLASH SALE (12% off)
- ✅ Shows discount badges on products
- ✅ Displays original vs. discounted prices
- ✅ Calculates savings amounts

## 🔄 Integration with Existing Code

### Update Product Display Functions

Modify your existing product rendering to include discounts:

```javascript
// In your product loading function
async function loadProductsWithDiscounts() {
  // Fetch products normally
  const products = await fetchProducts();
  
  // Apply discounts
  const productsWithDiscounts = await window.discountCalculator.applyDiscountsToProducts(products);
  
  // Render with discount information
  renderProducts(productsWithDiscounts);
}

// In your product card rendering
function renderProductCard(product) {
  const discountInfo = product.discountInfo;
  const priceDisplay = window.discountCalculator.generatePriceDisplay(product, discountInfo);
  const discountBadge = window.discountCalculator.generateDiscountBadge(discountInfo);
  
  return `
    <div class="product-card">
      ${discountBadge}
      <div class="product-info">
        <h3>${product.node.title}</h3>
        ${priceDisplay}
      </div>
    </div>
  `;
}
```

## 📱 Mobile Optimization

The CSS includes responsive design for mobile devices:
- Smaller discount badges
- Adjusted font sizes
- Touch-friendly interactions
- Reduced motion support

## ♿ Accessibility Features

- High contrast mode support
- Reduced motion preferences
- ARIA labels for screen readers
- Keyboard navigation support

## 🚀 Performance Optimization

- **Caching** - Discounts cached for 5 minutes
- **Lazy Loading** - Only fetches when needed
- **Error Handling** - Graceful fallbacks
- **Rate Limiting** - Respects Shopify API limits

## 🔍 Troubleshooting

### Common Issues

1. **"Missing environment variables"**
   - Ensure `SHOPIFY_ADMIN_ACCESS_TOKEN` is set in Netlify
   - Verify token has correct permissions

2. **"Failed to fetch discounts"**
   - Check Admin API token permissions
   - Verify Shopify store domain
   - Check API rate limits

3. **"No discounts found"**
   - Verify discounts are active in Shopify admin
   - Check discount start/end dates
   - Ensure discount type is supported

### Debug Tools

Use the test page for debugging:
- Real-time API testing
- Detailed error messages
- Debug logs
- Status indicators

## 🎉 Expected Results

After implementation, your customers will see:

1. **Product Pages** - Discount badges and pricing
2. **Collection Pages** - Sale indicators
3. **Homepage** - Featured product discounts
4. **Real-time Updates** - Current discount information

This solves the core issue where automatic discounts weren't visible until checkout!

## 📞 Support

If you encounter issues:
1. Check the test page for specific error messages
2. Verify environment variables in Netlify
3. Ensure Admin API permissions are correct
4. Test with a simple discount first

The system is designed to fail gracefully - if discounts can't be fetched, products will display normally without discount information.