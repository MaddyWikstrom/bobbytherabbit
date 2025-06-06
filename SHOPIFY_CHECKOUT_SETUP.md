# Shopify Checkout Integration Setup Guide

This guide explains how the Shopify checkout integration works on your Bobby Streetwear site.

## Overview

Your site now has a fully functional Shopify checkout integration that allows customers to:
1. Add products to their cart
2. View cart with real-time updates
3. Proceed to Shopify's secure checkout
4. Complete their purchase on Shopify's platform

## How It Works

### 1. Product Display
- Products are loaded from Shopify API via Netlify functions
- Local mockup images are combined with Shopify product data
- Each product variant (color/size combination) has a unique Shopify variant ID

### 2. Add to Cart
When a customer adds a product to cart:
- The selected variant's Shopify ID is stored
- Cart data is saved to browser's local storage
- Cart icon updates with item count

### 3. Checkout Process
When a customer clicks "Checkout":
1. Cart items are validated and mapped to Shopify variant IDs
2. A Netlify function (`create-checkout`) creates a Shopify checkout session
3. Customer is redirected to Shopify's secure checkout page
4. Shopify handles payment processing, shipping, and order fulfillment

## Required Environment Variables

Make sure these are set in your Netlify dashboard:

```
SHOPIFY_DOMAIN=your-store.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-storefront-token
SHOPIFY_ACCESS_TOKEN=your-admin-token
```

## Files Involved

### Frontend
- `scripts/cart.js` - Cart management and checkout initiation
- `scripts/product-detail.js` - Product page with variant selection
- `scripts/products.js` - Product listing page

### Backend
- `netlify/functions/create-checkout.js` - Creates Shopify checkout sessions
- `netlify/functions/get-products.js` - Fetches products from Shopify

## Testing the Checkout

1. **Add Products to Cart**
   - Navigate to any product page
   - Select color and size
   - Click "Add to Cart"

2. **View Cart**
   - Click the cart icon in the header
   - Review items and quantities
   - Update quantities or remove items as needed

3. **Proceed to Checkout**
   - Click "Checkout" button
   - Choose "Checkout with Shopify"
   - You'll be redirected to Shopify's checkout

## Checkout Features

### Supported Payment Methods
- Credit/Debit Cards (via Shopify Payments)
- PayPal Express (if enabled in Shopify)
- Apple Pay (if enabled in Shopify)
- Google Pay (if enabled in Shopify)
- Shop Pay
- Any other payment methods configured in your Shopify admin

### Order Management
- Orders appear in your Shopify admin dashboard
- Customers receive order confirmation emails
- Inventory is automatically updated
- Shipping and fulfillment handled through Shopify

## Troubleshooting

### "Failed to create checkout" Error
1. Check that all environment variables are set correctly
2. Verify your Storefront Access Token has proper permissions
3. Check Netlify function logs for detailed error messages

### Products Not Adding to Cart
1. Ensure products have variants with colors/sizes set up in Shopify
2. Check browser console for JavaScript errors
3. Verify product data is loading correctly from API

### Checkout Redirect Not Working
1. Check that the checkout URL is being returned from Netlify function
2. Ensure no browser extensions are blocking redirects
3. Try in an incognito/private browser window

## Customization Options

### Checkout Appearance
- Customize checkout branding in Shopify Admin > Online Store > Themes > Customize checkout
- Add your logo, colors, and fonts to match your brand

### Email Notifications
- Configure order confirmation emails in Shopify Admin > Settings > Notifications
- Customize email templates to match your brand voice

### Shipping Settings
- Set up shipping zones and rates in Shopify Admin > Settings > Shipping and delivery
- Configure free shipping thresholds if desired

## Security Notes

- All payment processing is handled by Shopify's PCI-compliant systems
- Customer payment information never touches your site's code
- Checkout sessions expire after 24 hours for security
- SSL/HTTPS is required for production use

## Next Steps

1. Test the full checkout flow with a test order
2. Configure your payment providers in Shopify admin
3. Set up shipping zones and rates
4. Customize checkout appearance to match your brand
5. Configure email notifications
6. Set up order fulfillment workflow

For more information, refer to:
- [Shopify Checkout Documentation](https://help.shopify.com/en/manual/checkout-settings)
- [Shopify Storefront API Reference](https://shopify.dev/docs/api/storefront)