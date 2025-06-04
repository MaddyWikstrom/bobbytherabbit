# Quick Setup Guide: Printful + Shopify + Your Website

## 🚀 Quick Start (15 minutes)

### Step 1: Set Up Shopify Store (5 min)
1. Go to [shopify.com](https://shopify.com) and start a free trial
2. Choose a basic plan that supports the Buy Button channel
3. Complete basic store setup (you won't use the Shopify storefront)

### Step 2: Install Printful (3 min)
1. In Shopify Admin, go to **Apps**
2. Search for "Printful" in the App Store
3. Click **Add app** and authorize
4. Connect your Printful account (or create one)

### Step 3: Add Your Products (5 min)
1. In Printful dashboard:
   - Click **Add product**
   - Choose product type (Hoodie, T-shirt, etc.)
   - Upload your designs
   - Set retail prices
   - Click **Submit to store**
2. Products will sync to Shopify automatically

### Step 4: Enable Buy Button (2 min)
1. In Shopify Admin, go to **Sales channels** → **+**
2. Add "Buy Button" channel
3. Click **Create Buy Button** → **Product Buy Button**
4. Select a product and copy the code

## 🔧 Integration Options

### Option A: Simple Buy Button (Easiest - 10 min setup)

**Pros:**
- Quick to implement
- No coding required
- Handles all payment processing
- Automatic order fulfillment with Printful

**Cons:**
- Less control over checkout experience
- Customers leave your site for checkout

**Implementation:**
1. Add this script to your `index.html` before `</body>`:
```html
<script src="scripts/shopify-integration.js"></script>
```

2. Update the configuration in `shopify-integration.js`:
```javascript
const SHOPIFY_CONFIG = {
    domain: 'your-store.myshopify.com',
    storefrontAccessToken: 'your-token-here'
};
```

3. Your existing "Add to Cart" buttons will automatically sync with Shopify

### Option B: Embedded Checkout (Recommended - 20 min setup)

**Pros:**
- Keeps customers on your site longer
- Custom cart experience
- Shopify handles secure checkout
- Best of both worlds

**Cons:**
- Requires some configuration
- Final checkout still on Shopify

**Implementation:**
1. Use the provided `shopify-integration.js`
2. Keep your current cart display
3. Checkout redirects to Shopify's secure checkout

### Option C: Full API Integration (Advanced - 2+ hours)

**Pros:**
- Complete control
- Fully custom experience
- Never leave your site

**Cons:**
- Complex implementation
- Must handle PCI compliance
- Requires backend development

## 📝 Getting Your Credentials

### 1. Get Storefront Access Token:
1. Shopify Admin → **Settings** → **Apps and sales channels**
2. Click **Develop apps**
3. Click **Create an app**
4. Name it "Bobby Streetwear Integration"
5. Go to **Configuration** → **Storefront API**
6. Check all product-related scopes
7. Click **Install app**
8. Copy the **Storefront API access token**

### 2. Find Your Product IDs:
1. Go to **Products** in Shopify Admin
2. Click on a product
3. Look at the URL: `admin/products/1234567890`
4. The number is your product ID

Or use this quick script in browser console:
```javascript
// Run this in Shopify admin console
copy(window.location.href.match(/products\/(\d+)/)[1])
```

### 3. Get Variant IDs:
1. On the product page, inspect the variant dropdown
2. Or use Shopify GraphQL explorer
3. Or check the Printful sync details

## 🎨 Matching Your Design

Add these CSS overrides to maintain your cyberpunk aesthetic:

```css
/* Shopify Buy Button Overrides */
.shopify-buy-frame {
    --shopify-buy-button-color: #8b5cf6 !important;
    --shopify-buy-button-hover-color: #7d4fd3 !important;
    --shopify-buy-button-text-color: #ffffff !important;
}

.shopify-buy__btn {
    font-family: 'Orbitron', sans-serif !important;
    text-transform: uppercase !important;
    letter-spacing: 1px !important;
    border: 2px solid #8b5cf6 !important;
    background: transparent !important;
    transition: all 0.3s ease !important;
}

.shopify-buy__btn:hover {
    background: #8b5cf6 !important;
    box-shadow: 0 0 20px rgba(139, 92, 246, 0.5) !important;
    transform: translateY(-2px) !important;
}
```

## 🧪 Testing Checklist

- [ ] Products display correctly
- [ ] Add to cart works
- [ ] Cart count updates
- [ ] Checkout redirects properly
- [ ] Test order goes through
- [ ] Printful receives order
- [ ] Customer gets confirmation email

## 🚨 Common Issues & Solutions

### "Products not showing"
- Check product IDs are correct
- Ensure products are active in Shopify
- Verify Storefront API token has correct permissions

### "Checkout not working"
- Check if checkout URL is correct
- Ensure all products have variants
- Test with a single product first

### "Styles not matching"
- Use `!important` in CSS overrides
- Check for conflicting styles
- Inspect element to see applied styles

### "Orders not reaching Printful"
- Verify Printful app is connected
- Check product sync status
- Ensure shipping settings are configured

## 💡 Pro Tips

1. **Start Small**: Test with one product first
2. **Use Test Mode**: Shopify has a test payment gateway
3. **Monitor Analytics**: Track conversion rates
4. **Mobile First**: Test thoroughly on mobile devices
5. **Cache Busting**: Clear cache when testing changes

## 📊 Next Steps

1. **Set up analytics**: Track conversion funnel
2. **Optimize loading**: Lazy load Shopify scripts
3. **A/B testing**: Try different button placements
4. **Email marketing**: Set up abandoned cart emails
5. **Inventory sync**: Configure stock management

## 🆘 Need Help?

- Shopify Support: help.shopify.com
- Printful Support: printful.com/support
- API Documentation: shopify.dev/api/storefront
- Community Forums: community.shopify.com

## 🎯 Quick Implementation (Copy & Paste)

Add this to your `index.html` right before `</body>`:

```html
<!-- Shopify Integration -->
<script type="text/javascript">
// Quick config - replace these values
const QUICK_CONFIG = {
    domain: 'YOUR-STORE.myshopify.com',
    token: 'YOUR-STOREFRONT-TOKEN',
    products: {
        'hoodie-1': 'SHOPIFY-PRODUCT-ID-1',
        'tee-1': 'SHOPIFY-PRODUCT-ID-2',
        'jacket-1': 'SHOPIFY-PRODUCT-ID-3',
        'pants-1': 'SHOPIFY-PRODUCT-ID-4'
    }
};

// Load integration
const script = document.createElement('script');
script.src = 'scripts/shopify-integration.js';
document.body.appendChild(script);
</script>
```

That's it! Your site will now process orders through Shopify and automatically fulfill with Printful. 🎉