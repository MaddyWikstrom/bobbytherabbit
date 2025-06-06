# Bobby Streetwear Codebase Cleanup Plan

## Overview
This document outlines the plan to clean up the Bobby Streetwear codebase by removing duplicate files and consolidating functionality.

## Duplicate Files Identified

### Cart System
Multiple cart implementations were found:
- `cart.js` - Original cart implementation
- `cart-checkout-system.js` - Comprehensive rebuild of cart functionality
- `cart-manager-fix.js` - Fixed version of cart manager with minor improvements

These have been consolidated into:
- `cart-consolidated.js` - Comprehensive cart implementation with Shopify integration and Quick View compatibility

### Shopify Integration
Multiple Shopify integration files were identified:
- `shopify-integration.js` - Original integration
- `shopify-integration-fixed.js` - Fixed version with better error handling
- `shopify-integration-debug.js` - Debug version with more logging
- `shopify-integration-admin-api.js` - Version using Admin API instead of Storefront API

These have been consolidated into:
- `shopify-integration-consolidated.js` - Complete integration with domain fallbacks, error handling, and multiple fetch strategies

### Product Fetching
Multiple product fetching implementations were found:
- `products-loading.js` - Basic product loading
- `storefront-api-products.js` - Storefront API specific implementation
- `fetch-storefront-api.js` - Standalone storefront API fetcher

These are now handled by the consolidated Shopify integration.

## Files to Remove
The following files can be safely removed after integration of the consolidated versions:

1. `cart.js`
2. `cart-checkout-system.js` 
3. `cart-manager-fix.js`
4. `shopify-integration.js`
5. `shopify-integration-fixed.js`
6. `shopify-integration-debug.js`
7. `shopify-integration-admin-api.js`
8. `products-loading.js`
9. `storefront-api-products.js`
10. `fetch-storefront-api.js`

## HTML Updates Required
All HTML files that reference any of the files listed above need to be updated to use the new consolidated files:

1. Replace all cart JS references with `cart-consolidated.js`
2. Replace all Shopify integration references with `shopify-integration-consolidated.js`
3. Remove any standalone product fetching script references

## Integration Testing
After making these changes, test the following functionality:
1. Product browsing and display
2. Adding items to cart
3. Cart functionality (add, remove, update quantity)
4. Checkout process
5. Quick View feature integration
6. Cart animations and notifications

## Benefits
- Reduced codebase size
- Eliminated duplicate functionality
- Improved maintainability
- Consistent error handling
- Better integration between components
- Simplified deployment process