# Bobby Streetwear Codebase Cleanup

## Overview

This document outlines the codebase cleanup that was performed to reduce duplication and improve maintainability of the Bobby Streetwear website.

## Changes Made

### 1. Consolidated Files Created

- **`shopify-integration-consolidated.js`**: A comprehensive Shopify integration that:
  - Provides domain fallbacks for resilience
  - Implements multiple product fetching strategies
  - Includes robust error handling
  - Consolidates product mapping
  
- **`cart-consolidated.js`**: A unified cart system that:
  - Replaces multiple cart implementations (cart.js, cart-checkout-system.js, cart-manager-fix.js)
  - Includes Shopify checkout integration
  - Provides visual feedback and animations
  - Features better image handling with fallbacks
  - Offers Quick View compatibility

### 2. Updated Files

- **`quick-view.js`**: Updated to work with the consolidated cart system
  - Now uses `BobbyCart` as the primary integration point
  - Added event dispatching for component communication
  - Maintains backward compatibility with legacy systems

### 3. Support Files Created

- **`CLEANUP_PLAN.md`**: Detailed plan of files to be removed and necessary HTML updates
- **`update-html-references.js`**: Script to automatically update HTML file references
- **`test-consolidation.html`**: Test page to verify the consolidation

## How to Test

1. Open `test-consolidation.html` in your browser
2. Use the test buttons to verify:
   - Cart system functionality
   - Shopify integration
   - Quick View integration
3. Verify that products can be added to cart via:
   - Regular "Add to Cart" buttons
   - Quick View modal
   - Quick Add functionality

## Implementing the Changes

### 1. Test in Development Environment

```bash
# Start a local server
npx serve -p 3000

# Open the test page
open http://localhost:3000/test-consolidation.html
```

### 2. Update HTML References

Run the update script to modify all HTML files to use the consolidated scripts:

```bash
node scripts/update-html-references.js
```

This script will:
- Find all HTML files in the project
- Replace references to old script files with the new consolidated versions
- Create a mapping file for reference

### 3. Remove Duplicate Files

After verifying that everything works correctly, you can safely remove the following files:

```
scripts/cart.js
scripts/cart-checkout-system.js
scripts/cart-manager-fix.js
scripts/shopify-integration.js
scripts/shopify-integration-fixed.js
scripts/shopify-integration-debug.js
scripts/shopify-integration-admin-api.js
scripts/products-loading.js
scripts/storefront-api-products.js
scripts/fetch-storefront-api.js
```

## Benefits

- **Reduced Code Duplication**: Eliminated multiple implementations of the same functionality
- **Improved Maintainability**: Centralized code into single files with clear responsibilities
- **Better Error Handling**: Consolidated error handling and fallback strategies
- **Enhanced User Experience**: Consistent cart and product preview behavior
- **Simplified Deployment**: Fewer files to maintain and deploy

## Potential Issues to Watch For

1. **HTML References**: Some custom HTML pages might have hardcoded references to the old scripts
2. **Global Variables**: Other scripts might be relying on global variables from the old scripts
3. **Event Handlers**: Custom event handlers might be attached to elements in the old scripts

If you encounter any issues after deployment, you can temporarily revert to include both the old and new scripts until all references are updated.

## Future Improvements

1. Convert to a module-based architecture for better code organization
2. Implement TypeScript for improved type safety
3. Add comprehensive unit tests
4. Optimize bundle size with a build process