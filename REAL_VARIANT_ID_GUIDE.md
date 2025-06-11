# Getting Real Shopify Variant IDs

## The Problem: Placeholder IDs Don't Work

You're seeing this error because the variant IDs being used (like `gid://shopify/ProductVariant/1`) don't actually exist in your Shopify store:

```
❌ "The merchandise with id gid://shopify/ProductVariant/1 does not exist."
```

Real Shopify variant IDs typically look like: `gid://shopify/ProductVariant/44713213274763`

## Solution: Using Real Variant IDs

### Step 1: Get Real Variant IDs from Your Shopify Store

#### Option A: Using Shopify Storefront API Explorer

1. Go to your Shopify admin
2. Navigate to **Apps** > **App and sales channel settings**
3. Scroll to the bottom and click **Develop apps and channels**
4. Click on your Storefront API app (or create one if needed)
5. Click on **API credentials** to get your Storefront API token
6. Visit the [Shopify Storefront API Explorer](https://shopify.dev/tools/graphiql-storefront-api)
7. Enter your shop domain and API token
8. Run this query to get your product and variant IDs:

```graphql
{
  products(first: 10) {
    edges {
      node {
        title
        handle
        variants(first: 5) {
          edges {
            node {
              id
              title
              price {
                amount
              }
            }
          }
        }
      }
    }
  }
}
```

9. Copy the variant IDs from the response (they'll be in the format `gid://shopify/ProductVariant/12345678901234`)

#### Option B: Using Developer Tools in Shopify Admin

1. Go to your Shopify admin
2. Navigate to **Products** > **All products**
3. Click on a product
4. Click on a variant
5. Open your browser's Developer Tools (F12 or right-click > Inspect)
6. Go to the Network tab
7. Refresh the page and look for GraphQL requests
8. Find the variant ID in the response data

### Step 2: Update Your Product Buttons

Update your product buttons in HTML to use real variant IDs:

```html
<button class="add-to-cart-btn"
  data-product-id="gid://shopify/ProductVariant/44713213274763"
  data-product-title="Classic Black Hoodie"
  data-product-price="59.99"
  data-product-image="assets/hoodie-black.png">
  Add to Cart
</button>
```

Replace `44713213274763` with your actual variant IDs from step 1.

## Option C: Creating a Product Mapping Script

If you have many products, you might want to create a mapping script:

1. Create a file named `scripts/product-variant-mapping.js`
2. Add a mapping of your product IDs to Shopify variant IDs:

```javascript
// Product ID to Shopify Variant ID mapping
const productVariantMapping = {
  // Format: 'your-internal-product-id': 'gid://shopify/ProductVariant/actual-variant-id'
  'black-hoodie-l': 'gid://shopify/ProductVariant/44713213274763',
  'navy-hoodie-m': 'gid://shopify/ProductVariant/44713213307531',
  // Add more mappings here
};

// Function to get Shopify variant ID from internal product ID
function getShopifyVariantId(internalProductId) {
  return productVariantMapping[internalProductId] || null;
}

// Make available globally
window.getShopifyVariantId = getShopifyVariantId;
```

3. Include this script in your pages
4. Modify your cart system to use this mapping when sending items to checkout

## Testing Your Implementation

1. Deploy these changes to your site
2. Add a product to cart
3. Check the browser console to confirm the correct variant ID is being used
4. Proceed to checkout and verify that you're redirected to Shopify's checkout page
5. Confirm your cart items appear correctly in the checkout

## Troubleshooting

- If you still see "does not exist" errors, double-check that you're using the correct variant IDs from your Shopify store
- Ensure the variant IDs are being properly passed to the cart system
- Verify that your Storefront API token has the necessary permissions
- Check Netlify function logs for any additional errors or warnings