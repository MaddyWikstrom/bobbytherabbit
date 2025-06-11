# Real Shopify Variant IDs Guide

## Overview
This guide explains how to obtain and use real Shopify variant IDs for your store to prevent the 500 errors during checkout operations.

## Understanding Shopify Variant IDs

Shopify uses Global IDs (GIDs) in the format `gid://shopify/ProductVariant/12345678` for checkout operations. Using incorrect IDs or attempting to convert custom IDs incorrectly was causing your checkout failures.

## Getting Your Store's Real Variant IDs

You'll need to query your actual store data to get the real Shopify variant IDs. Below are examples of what the data structure looks like based on sample data:

### Boots

#### Snare Boot
| Variant | Size | Shopify Variant ID |
|---------|------|-------------------|
| Black / 7 | 7 | `gid://shopify/ProductVariant/36607622083` |
| Black / 8 | 8 | `gid://shopify/ProductVariant/36607622147` |
| Black / 9 | 9 | `gid://shopify/ProductVariant/36607622211` |
| Black / 10 | 10 | `gid://shopify/ProductVariant/36607622275` |
| Black / 11 | 11 | `gid://shopify/ProductVariant/36607622339` |

#### Neptune Boot
| Variant | Size | Shopify Variant ID |
|---------|------|-------------------|
| Black / 7 | 7 | `gid://shopify/ProductVariant/36607637635` |
| Black / 8 | 8 | `gid://shopify/ProductVariant/36607637699` |
| Black / 9 | 9 | `gid://shopify/ProductVariant/36607637763` |
| Black / 10 | 10 | `gid://shopify/ProductVariant/36607637827` |
| Black / 11 | 11 | `gid://shopify/ProductVariant/36607637891` |

#### Arena Zip Boot
| Variant | Size | Shopify Variant ID |
|---------|------|-------------------|
| Black / 7 | 7 | `gid://shopify/ProductVariant/36607671875` |
| Black / 8 | 8 | `gid://shopify/ProductVariant/36607672003` |
| Black / 9 | 9 | `gid://shopify/ProductVariant/36607672067` |
| Black / 10 | 10 | `gid://shopify/ProductVariant/36607672259` |
| Black / 11 | 11 | `gid://shopify/ProductVariant/36607672451` |

#### Pin Boot
| Variant | Size | Shopify Variant ID |
|---------|------|-------------------|
| Taupe / 7 | 7 | `gid://shopify/ProductVariant/36607686531` |
| Taupe / 8 | 8 | `gid://shopify/ProductVariant/36607686659` |
| Taupe / 9 | 9 | `gid://shopify/ProductVariant/36607686723` |
| Taupe / 10 | 10 | `gid://shopify/ProductVariant/36607686915` |
| Taupe / 11 | 11 | `gid://shopify/ProductVariant/36607686979` |

### Shirts

#### Hanra Shirt
| Variant | Size | Shopify Variant ID |
|---------|------|-------------------|
| Grey / S | S | `gid://shopify/ProductVariant/36607712259` |
| Grey / M | M | `gid://shopify/ProductVariant/36607712323` |
| Grey / L | L | `gid://shopify/ProductVariant/36607712387` |

#### Meteor Shirt
| Variant | Size | Shopify Variant ID |
|---------|------|-------------------|
| Grey / S | S | `gid://shopify/ProductVariant/36607724099` |
| Grey / M | M | `gid://shopify/ProductVariant/36607724227` |
| Grey / L | L | `gid://shopify/ProductVariant/36607724355` |

#### Hurst Shirt
| Variant | Size | Shopify Variant ID |
|---------|------|-------------------|
| Light Grey / S | S | `gid://shopify/ProductVariant/36607738947` |
| Light Grey / M | M | `gid://shopify/ProductVariant/36607739011` |
| Light Grey / L | L | `gid://shopify/ProductVariant/36607739075` |

#### Monte Shirt
| Variant | Size | Shopify Variant ID |
|---------|------|-------------------|
| Grey / S | S | `gid://shopify/ProductVariant/36607743555` |
| Grey / M | M | `gid://shopify/ProductVariant/36607743683` |
| Grey / L | L | `gid://shopify/ProductVariant/36607743747` |

### Jumpers

#### Ekktar Crew Jumper
| Variant | Size | Shopify Variant ID |
|---------|------|-------------------|
| Taupe Marl / S | S | `gid://shopify/ProductVariant/36607763075` |
| Taupe Marl / M | M | `gid://shopify/ProductVariant/36607763139` |
| Taupe Marl / L | L | `gid://shopify/ProductVariant/36607763203` |
| Ink / S | S | `gid://shopify/ProductVariant/36607763267` |
| Ink / M | M | `gid://shopify/ProductVariant/36607763331` |

#### Rye Crew Jumper
| Variant | Size | Shopify Variant ID |
|---------|------|-------------------|
| Taupe Marl / S | S | `gid://shopify/ProductVariant/36607767235` |
| Taupe Marl / M | M | `gid://shopify/ProductVariant/36607767299` |
| Taupe Marl / L | L | `gid://shopify/ProductVariant/36607767363` |
| Ink / S | S | `gid://shopify/ProductVariant/36607767427` |
| Ink / M | M | `gid://shopify/ProductVariant/36607767491` |

## How to Use These IDs

### 1. Update Your Variant ID Mapping

Based on your error logs, you need to update the `VARIANT_ID_MAP` in your `netlify/functions/create-checkout-fixed.js` file with the missing variant IDs. Here's how you should structure it:

```javascript
const VARIANT_ID_MAP = {
  // Format: 'custom-variant-id': 'real-shopify-gid'
  
  // EXISTING ITEMS - KEEP THESE
  // ... [your existing mappings]
  
  // MISSING ITEMS FROM ERROR LOGS - ADD THESE
  // Replace the placeholder GIDs with real ones from your Shopify API query
  'bungi-x-bobby-rabbit-hardware-unisex-hoodie_Navy_Blazer_S': 'gid://shopify/ProductVariant/XXXXXXXXXX',
  'bungi-x-bobby-rabbit-hardware-unisex-hoodie_Navy_Blazer_XL': 'gid://shopify/ProductVariant/XXXXXXXXXX',
  'rabbit-hardware-womans-t-shirt_Default_XS': 'gid://shopify/ProductVariant/XXXXXXXXXX',
  'bungi-x-bobby-cuffed-beanie-1_Black_One_Size': 'gid://shopify/ProductVariant/XXXXXXXXXX',
  
  // Generic fallback for unknown items - Use a real product variant as default
  'unknown-variant': 'gid://shopify/ProductVariant/XXXXXXXXXX' // Update this with a real ID
};
```

When you query each product in the Storefront API Explorer, you'll get responses like this:

```json
{
  "data": {
    "product": {
      "title": "Bobby Cuffed Beanie",
      "variants": {
        "edges": [
          {
            "node": {
              "id": "gid://shopify/ProductVariant/46823105626279",
              "title": "Black / One Size",
              "selectedOptions": [
                {
                  "name": "Color",
                  "value": "Black"
                },
                {
                  "name": "Size",
                  "value": "One Size"
                }
              ]
            }
          }
        ]
      }
    }
  }
}
```

Then you would update your mapping like:
```javascript
'bungi-x-bobby-cuffed-beanie-1_Black_One_Size': 'gid://shopify/ProductVariant/46823105626279',
```

### 2. Ensure ShopifyIdHandler is Properly Implemented

The `ShopifyIdHandler` should be used throughout your site to preserve these real Shopify variant IDs. Make sure it's properly loaded on all pages that interact with the cart.

### 3. Modify the Product Detail Page

Update your product detail page to pass the real Shopify variant IDs to the cart. For example:

```javascript
// When adding to cart
const selectedVariant = getSelectedVariant();
const product = {
  id: selectedVariant.id, // This should be the real Shopify GID
  title: productTitle,
  price: selectedVariant.price,
  image: selectedVariant.image,
  selectedColor: selectedColor,
  selectedSize: selectedSize,
  quantity: quantity
};
BobbyCart.addItem(product);
```

## Troubleshooting Checkout Issues

If you still encounter checkout issues:

1. **Check the Console Logs**: Look for any messages about variant IDs or checkout errors
2. **Verify ID Format**: Ensure all IDs being sent to checkout are in the correct GID format
3. **Check API Tokens**: Make sure you're using the correct Storefront API token
4. **Validate Environment Variables**: Confirm that your Netlify environment variables are correctly set

## Finding Variant IDs for Specific Products

Your logs show several missing variant mappings:
- `bungi-x-bobby-rabbit-hardware-unisex-hoodie_Navy_Blazer_S`
- `bungi-x-bobby-rabbit-hardware-unisex-hoodie_Navy_Blazer_XL`
- `rabbit-hardware-womans-t-shirt_Default_XS`
- `bungi-x-bobby-cuffed-beanie-1_Black_One_Size`

To find the exact Shopify GIDs for these variants:

1. Visit the [Shopify Storefront API Explorer](https://shopify.dev/tools/graphiql-storefront-api)
2. Enter your shop domain and API token
3. Run a targeted query for each product handle:

```graphql
{
  product(handle: "bungi-x-bobby-cuffed-beanie-1") {
    title
    variants(first: 50) {
      edges {
        node {
          id
          title
          selectedOptions {
            name
            value
          }
        }
      }
    }
  }
}
```

4. Replace `"bungi-x-bobby-cuffed-beanie-1"` with each product handle you need
5. Look for variants that match the color and size options you need:
   - For the beanie example, look for options like "Black" + "One Size"
   - For hoodies, look for "Navy Blazer" + "S" or "XL"

## Querying Multiple Products

If you need IDs for all products at once:

## Important Note: This is Sample Data

The variant IDs shown in this guide are from a sample response and are provided only to demonstrate the format and structure. **These are not your actual store's variant IDs.** You must run the GraphQL query against your own store to get your real variant IDs.

## Steps to Implement in Your Store

1. **Run the GraphQL Query**: Use the Storefront API Explorer with your store credentials to get your actual variant IDs
2. **Update Your Variant ID Mapping**: Add your real GIDs to the mapping in your checkout function
3. **Test the Checkout Process**: Make a test purchase to verify the checkout process works correctly
4. **Monitor for Errors**: Keep an eye on the console logs for any remaining issues

## Conclusion

Using the correct Shopify variant IDs in the proper GID format is essential for successful checkout operations. By querying your store for the real variant IDs and implementing them in your checkout system, you should be able to resolve the 500 errors and provide a smooth shopping experience for your customers.

Remember that each time you add new products or variants to your store, you'll need to update your variant ID mapping with the new GIDs to ensure they work properly with checkout.