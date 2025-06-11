# Migration to Shopify Cart API

## Critical Update: Checkout API Deprecation

Shopify has deprecated the Checkout API (`checkoutCreate` mutation) that we were previously using. According to Shopify's deprecation notice:

> ❌ The Checkout API has been deprecated and is not accessible for new usage.

This affects our integration because:
- The `checkoutCreate` mutation is no longer available for new usage
- This API is only accessible for Shopify Plus merchants or approved sales channels

## Solution: Migration to Cart API

We've updated our integration to use Shopify's recommended alternative approach:

1. **Create a cart** using the Cart API's `cartCreate` mutation
2. **Redirect to Shopify-hosted checkout** using the returned `cart.checkoutUrl`

This approach:
- Works for all Shopify merchants (Plus not required)
- Provides the same end-user experience
- Is fully supported by Shopify

## Technical Changes

### 1. Updated Netlify Function

We've completely rewritten `create-checkout-fixed.js` to:
- Use the `cartCreate` mutation instead of `checkoutCreate`
- Format cart items as `lines` with `merchandiseId` instead of `lineItems` with `variantId`
- Return `cart.checkoutUrl` instead of `checkout.webUrl`

### 2. API Differences

| Checkout API (Old) | Cart API (New) |
|-------------------|---------------|
| `checkoutCreate` mutation | `cartCreate` mutation |
| Uses `lineItems` array | Uses `lines` array |
| Items have `variantId` | Items have `merchandiseId` |
| Returns `checkout.webUrl` | Returns `cart.checkoutUrl` |

### 3. Client Compatibility

The function returns the checkout URL with the same property name (`checkoutUrl`) as before, so no changes are needed in the frontend code. This maintains backward compatibility with our existing cart system.

## Benefits of the Cart API

1. **Future Proof**: The Cart API is Shopify's recommended approach and will be supported long-term
2. **Better Performance**: The Cart API is more efficient than the Checkout API
3. **Wider Availability**: Works for all Shopify merchants, not just Plus merchants
4. **Same User Experience**: End users still get a seamless checkout experience

## Example of the New Cart API GraphQL Mutation

```graphql
mutation {
  cartCreate(input: {
    lines: [
      { 
        merchandiseId: "gid://shopify/ProductVariant/1234567890", 
        quantity: 1 
      }
    ]
  }) {
    cart {
      id
      checkoutUrl
    }
    userErrors {
      field
      message
    }
  }
}
```

## Testing Instructions

1. **Deploy the updated function** to your Netlify site
2. **Test the checkout process** by adding items to cart and proceeding to checkout
3. **Verify** that you're redirected to Shopify's hosted checkout page
4. **Check** that your cart items appear correctly in the checkout

## Error Handling

The updated function includes comprehensive error handling to:
- Filter out invalid variant IDs
- Report detailed error messages in Netlify logs
- Return appropriate HTTP status codes and error details

## Next Steps

1. **Consider Updating Product Data**: Ensure all your product variant IDs are in the correct Shopify GID format
2. **Monitor Function Logs**: Watch for any "No valid Shopify variant IDs" errors which indicate products with incorrect IDs
3. **Update Documentation**: Make sure your team is aware of this change to the Cart API

This migration addresses the fatal error with the deprecated Checkout API while maintaining the same functionality and user experience.