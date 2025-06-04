# Printful + Shopify Integration Guide for Bobby Streetwear

## Overview
This guide will help you integrate your Printful products with Shopify and display them on your custom Bobby Streetwear website.

## Integration Options

### Option 1: Shopify Buy Button (Recommended for Simple Integration)
This is the easiest way to integrate Shopify products into your existing website while maintaining your custom design.

### Option 2: Shopify Storefront API (Advanced Integration)
For a more seamless integration with full control over the shopping experience.

### Option 3: Full Shopify Store with Custom Theme
Migrate your entire site to Shopify with a custom theme matching your current design.

## Step-by-Step Integration Guide

### Prerequisites
1. Shopify account with Printful app installed
2. Products created in Printful and synced to Shopify
3. Shopify Buy Button sales channel enabled

### Step 1: Set Up Printful + Shopify

1. **Create a Shopify Store**
   - Sign up at shopify.com
   - Choose a plan that supports the Buy Button channel

2. **Install Printful App in Shopify**
   - Go to Shopify App Store
   - Search for "Printful"
   - Click "Add app" and authorize

3. **Connect Your Products**
   - In Printful dashboard, go to "Stores"
   - Select your Shopify store
   - Click "Add product"
   - Design your products or sync existing ones

### Step 2: Enable Buy Button Channel

1. In Shopify admin, go to **Sales channels**
2. Click **+** button
3. Search for "Buy Button"
4. Click "Add channel"

### Step 3: Create Buy Buttons for Your Products

1. Go to **Buy Button** channel in Shopify
2. Click "Create Buy Button"
3. Select "Product Buy Button"
4. Choose your product
5. Customize the button appearance
6. Copy the embed code

### Step 4: Integration Methods

#### Method A: Replace Current Cart with Shopify Checkout
This method uses Shopify's checkout while keeping your site's design.

#### Method B: Hybrid Approach (Recommended)
Keep your current cart for browsing, but redirect to Shopify for checkout.

#### Method C: Full API Integration
Use Shopify Storefront API for complete control.

## Implementation Code

### Method A: Shopify Buy Button Integration

```javascript
// Add this to your HTML where you want the buy button
<div id="product-component-[PRODUCT_ID]"></div>

// Add Shopify Buy SDK
<script type="text/javascript">
/*<![CDATA[*/
(function () {
  var scriptURL = 'https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js';
  if (window.ShopifyBuy) {
    if (window.ShopifyBuy.UI) {
      ShopifyBuyInit();
    } else {
      loadScript();
    }
  } else {
    loadScript();
  }
  function loadScript() {
    var script = document.createElement('script');
    script.async = true;
    script.src = scriptURL;
    (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(script);
    script.onload = ShopifyBuyInit;
  }
  function ShopifyBuyInit() {
    var client = ShopifyBuy.buildClient({
      domain: 'your-store.myshopify.com',
      storefrontAccessToken: 'your-access-token',
    });
    ShopifyBuy.UI.onReady(client).then(function (ui) {
      ui.createComponent('product', {
        id: 'YOUR_PRODUCT_ID',
        node: document.getElementById('product-component-YOUR_PRODUCT_ID'),
        moneyFormat: '%24%7B%7Bamount%7D%7D',
        options: {
          "product": {
            "styles": {
              "product": {
                "@media (min-width: 601px)": {
                  "max-width": "calc(25% - 20px)",
                  "margin-left": "20px",
                  "margin-bottom": "50px"
                }
              },
              "button": {
                "font-family": "Orbitron, sans-serif",
                "font-weight": "bold",
                "font-size": "16px",
                "padding-top": "16px",
                "padding-bottom": "16px",
                ":hover": {
                  "background-color": "#7d4fd3"
                },
                "background-color": "#8b5cf6",
                ":focus": {
                  "background-color": "#7d4fd3"
                },
                "border-radius": "4px"
              }
            },
            "text": {
              "button": "Add to cart"
            }
          },
          "cart": {
            "styles": {
              "button": {
                "font-family": "Orbitron, sans-serif",
                "font-weight": "bold",
                "font-size": "16px",
                "padding-top": "16px",
                "padding-bottom": "16px",
                ":hover": {
                  "background-color": "#7d4fd3"
                },
                "background-color": "#8b5cf6",
                ":focus": {
                  "background-color": "#7d4fd3"
                },
                "border-radius": "4px"
              }
            }
          }
        }
      });
    });
  }
})();
/*]]>*/
</script>
```

### Method B: Hybrid Integration

```javascript
// Modify your existing addToCart function to use Shopify
function addToCartShopify(productId, variantId) {
    // Store product info locally for display
    const product = {
        id: productId,
        variantId: variantId,
        name: getProductName(productId),
        price: getProductPrice(productId),
        quantity: 1
    };
    
    // Add to local cart for display
    let cart = JSON.parse(localStorage.getItem('bobbyCart')) || [];
    cart.push(product);
    localStorage.setItem('bobbyCart', JSON.stringify(cart));
    
    // Update UI
    updateCartCount();
    showNotification('Added to cart!');
}

// Modify checkout to redirect to Shopify
function initiateShopifyCheckout() {
    const cart = getCart();
    
    // Build Shopify checkout URL
    let checkoutUrl = 'https://your-store.myshopify.com/cart/';
    
    cart.forEach((item, index) => {
        if (index > 0) checkoutUrl += ',';
        checkoutUrl += `${item.variantId}:${item.quantity}`;
    });
    
    // Redirect to Shopify checkout
    window.location.href = checkoutUrl;
}
```

### Method C: Storefront API Integration

```javascript
// Initialize Storefront API client
const client = ShopifyBuy.buildClient({
    domain: 'your-store.myshopify.com',
    storefrontAccessToken: 'your-storefront-access-token'
});

// Fetch products from Shopify
async function fetchShopifyProducts() {
    try {
        const products = await client.product.fetchAll();
        return products;
    } catch (error) {
        console.error('Error fetching products:', error);
    }
}

// Create checkout
async function createShopifyCheckout(items) {
    const lineItems = items.map(item => ({
        variantId: item.variantId,
        quantity: item.quantity
    }));
    
    try {
        const checkout = await client.checkout.create(lineItems);
        window.location.href = checkout.webUrl;
    } catch (error) {
        console.error('Error creating checkout:', error);
    }
}
```

## Product Data Mapping

Map your Printful products to your website:

```javascript
const productMapping = {
    'hoodie-1': {
        shopifyProductId: 'gid://shopify/Product/1234567890',
        shopifyVariants: {
            'S': 'gid://shopify/ProductVariant/1234567891',
            'M': 'gid://shopify/ProductVariant/1234567892',
            'L': 'gid://shopify/ProductVariant/1234567893',
            'XL': 'gid://shopify/ProductVariant/1234567894'
        },
        printfulId: 'printful_product_id'
    },
    'tee-1': {
        shopifyProductId: 'gid://shopify/Product/2234567890',
        shopifyVariants: {
            'S': 'gid://shopify/ProductVariant/2234567891',
            'M': 'gid://shopify/ProductVariant/2234567892',
            'L': 'gid://shopify/ProductVariant/2234567893',
            'XL': 'gid://shopify/ProductVariant/2234567894'
        },
        printfulId: 'printful_product_id_2'
    }
    // Add more products...
};
```

## Webhook Integration for Order Fulfillment

1. **Set up Shopify webhooks** to notify Printful of new orders
2. **Configure Printful** to automatically fulfill orders
3. **Track fulfillment** status and update customers

## Testing Your Integration

1. **Test Product Sync**: Ensure products appear correctly
2. **Test Checkout Flow**: Complete a test purchase
3. **Test Fulfillment**: Verify Printful receives the order
4. **Test Shipping**: Confirm tracking information updates

## Best Practices

1. **Keep Product Data Synced**: Regular updates between Printful and Shopify
2. **Handle Inventory**: Let Printful manage inventory (print-on-demand)
3. **Customer Communication**: Set up order confirmation emails
4. **Mobile Optimization**: Test on various devices
5. **Performance**: Lazy load Shopify scripts

## Troubleshooting

### Common Issues:

1. **Products not syncing**: Check Printful connection in Shopify
2. **Checkout errors**: Verify API credentials
3. **Styling conflicts**: Use CSS specificity to override Shopify styles
4. **Cart persistence**: Store cart data in both localStorage and Shopify

## Security Considerations

1. **Never expose private API keys** in client-side code
2. **Use Storefront Access Token** for public API calls
3. **Validate prices** server-side before processing
4. **Enable CORS** properly for API requests

## Next Steps

1. Choose your integration method
2. Get your Shopify API credentials
3. Update your product mappings
4. Test thoroughly before going live
5. Monitor performance and user experience

## Support Resources

- [Shopify Buy Button Documentation](https://help.shopify.com/en/manual/online-sales-channels/buy-button)
- [Shopify Storefront API](https://shopify.dev/api/storefront)
- [Printful API Documentation](https://developers.printful.com/)
- [Printful + Shopify Integration Guide](https://www.printful.com/integration/shopify)