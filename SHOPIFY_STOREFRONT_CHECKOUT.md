# Shopify Storefront API Checkout Integration

This document explains how the Shopify Storefront API checkout has been integrated with your existing cart system.

> **IMPORTANT UPDATE:** For a more reliable implementation that works without Netlify functions, see the `direct-storefront-checkout.html` example. This demonstrates client-side integration that works consistently in all environments.

## Overview

The integration preserves your existing cart functionality while adding Shopify's Storefront API checkout capabilities. This allows you to:

1. Continue using your custom cart UI and experience across the site
2. Create a standard Shopify checkout when users are ready to complete their purchase
3. Maintain all your existing cart features (add to cart, remove items, update quantities)

## How It Works

### End-to-End Flow

1. **Cart Management**: Users interact with your existing cart system (add products, update quantities, etc.)
2. **Checkout Initialization**: When the user clicks "Checkout", the system creates a Shopify checkout session via the Storefront API
3. **Checkout Redirect**: The user is redirected to the secure Shopify-hosted checkout page
4. **Payment Processing**: Shopify handles payment processing, shipping calculation, etc.

### Technical Implementation

The integration consists of:

1. **`bobby-checkout-storefront.js`**: A new module that handles Storefront API interaction
2. **Updated cart checkout flow**: Modified to use the Storefront API checkout when available
3. **Fallback mechanism**: If the Storefront API checkout fails, it falls back to your existing checkout method

## Usage

To use this integration in any page:

1. Include both script files:

```html
<script src="scripts/simple-cart-system.js"></script>
<script src="scripts/bobby-checkout-storefront.js"></script>
```

2. The cart system will automatically use the Storefront API checkout when available.

## Testing

A test page has been provided at `test-storefront-checkout.html` that demonstrates the integration. You can:

- Add sample products to the cart
- Open the cart
- Test the checkout process

## Limitations & Considerations

- **Variant Resolution**: The integration attempts to map your internal product/variant IDs to Shopify's. This may require customization for your specific product structure.
- **Deployment Required**: Shopify API functionality requires deployment to properly test, as mentioned in your instructions.
- **Storefront Access Token**: Ensure your Storefront API access token is properly configured in the `SHOPIFY_CONFIG` object.

## Customization

You can customize the integration by:

1. **Modifying variant resolution**: Adjust the `resolveVariantId` function in `bobby-checkout-storefront.js` to match your product structure
2. **Updating API version**: Change the `apiVersion` in the `SHOPIFY_CONFIG` if needed
3. **Customizing checkout options**: Add additional checkout input parameters (e.g., customer information) as needed

## Troubleshooting

If you encounter issues:

1. **Check browser console**: Most errors will be logged with details
2. **Verify configuration**: Ensure the Shopify domain and access token are correct
3. **Check product IDs**: Make sure your product IDs can be properly mapped to Shopify variant IDs

## Further Improvements

Potential enhancements for the future:

1. **Custom checkout fields**: Pre-populate customer information in the checkout
2. **Discount code support**: Allow users to apply discount codes before checkout
3. **Cart synchronization**: Keep the Shopify cart in sync with your local cart for a seamless experience
4. **Enhanced error handling**: Provide more specific error messages and recovery options

## Need Help?

For additional assistance:
- Check Shopify's [Storefront API documentation](https://shopify.dev/docs/api/storefront)
- Review the code comments in `bobby-checkout-storefront.js` for detailed implementation notes