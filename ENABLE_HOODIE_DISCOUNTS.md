# 🎯 Enable Hoodie/Sweatshirt/Sweatpants Discounts

## ✅ Current Status: NO DISCOUNTS ACTIVE

The system is now in **safe mode** - NO products will show discounts until you explicitly configure them.

## 🔧 How to Enable 12% Discount for Specific Products

### Step 1: Find Your Product IDs

You need to identify the exact product IDs for your hoodies, sweatshirts, and sweatpants.

**Method 1: Check Shopify Admin**
1. Go to Shopify Admin → Products
2. Click on a hoodie/sweatshirt product
3. Look at the URL: `...products/PRODUCT_ID`
4. Copy that ID

**Method 2: Check Browser Console**
1. Add a hoodie to cart
2. Open browser console (F12)
3. Look for messages like: `ℹ️ No discount applied to: [Product Name]`
4. Note the product name/ID

### Step 2: Configure Discounts

Edit `scripts/precise-discount-system.js` and find this section:

```javascript
discountEligibleProducts: {
    // Add specific product IDs or handles that should have discounts
    // Format: 'product-id': { percentage: 12, description: '12% off' }
    
    // Example hoodie products that should be on sale
    // You'll need to replace these with actual product IDs from your Shopify store
    'hoodie-black': { percentage: 12, description: '12% off hoodies' },
    'hoodie-navy': { percentage: 12, description: '12% off hoodies' },
    'hoodie-charcoal': { percentage: 12, description: '12% off hoodies' },
    'sweatshirt-vintage': { percentage: 12, description: '12% off sweatshirts' },
    'sweatpants-black': { percentage: 12, description: '12% off sweatpants' }
},
```

**Replace the example IDs with your actual product IDs:**

```javascript
discountEligibleProducts: {
    // Replace these with your actual Shopify product IDs
    'your-actual-hoodie-id-1': { percentage: 12, description: '12% off hoodies' },
    'your-actual-hoodie-id-2': { percentage: 12, description: '12% off hoodies' },
    'your-actual-sweatshirt-id-1': { percentage: 12, description: '12% off sweatshirts' },
    'your-actual-sweatpants-id-1': { percentage: 12, description: '12% off sweatpants' },
},
```

### Step 3: Test the Configuration

1. **Refresh your website**
2. **Add a hoodie to cart** (should show 12% discount)
3. **Add a t-shirt to cart** (should NOT show discount)
4. **Check console logs** for confirmation:
   - `🎯 Applying 12% discount to: [Hoodie Name]`
   - `ℹ️ No discount applied to: [T-shirt Name]`

## 📝 Example Configuration

Here's how to set up discounts for specific products:

```javascript
discountEligibleProducts: {
    // Hoodies that should be 12% off
    '7234567890123': { percentage: 12, description: '12% off hoodies' },
    '7234567890124': { percentage: 12, description: '12% off hoodies' },
    
    // Sweatshirts that should be 12% off  
    '7234567890125': { percentage: 12, description: '12% off sweatshirts' },
    
    // Sweatpants that should be 12% off
    '7234567890126': { percentage: 12, description: '12% off sweatpants' },
},
```

## 🧪 Testing Checklist

- [ ] Add hoodie to cart → Should show 12% discount
- [ ] Add sweatshirt to cart → Should show 12% discount  
- [ ] Add sweatpants to cart → Should show 12% discount
- [ ] Add t-shirt to cart → Should NOT show discount
- [ ] Add accessories to cart → Should NOT show discount
- [ ] Remove items from cart → Discounts should persist on remaining items

## 🚨 Important Notes

### Current Behavior
- **NO products have discounts by default** (safe)
- **Only products you explicitly add will be discounted**
- **No false positives or unwanted discounts**

### Console Messages
- `🎯 Applying 12% discount to: [Product]` = Discount applied correctly
- `ℹ️ No discount applied to: [Product]` = No discount (correct for non-hoodie items)

### If You Need Help Finding Product IDs
1. Add products to cart and check console logs
2. Look at Shopify Admin URLs
3. Check your Shopify product export files
4. Ask me to help you identify them from your product data

## ✅ Result After Configuration

Once you add your product IDs:
- ✅ **Only hoodies/sweatshirts/sweatpants** will show 12% discount
- ✅ **All other products** will show regular price
- ✅ **Discounts persist** when items are removed
- ✅ **No unwanted sale prices** on other items

**Your discount system will be perfectly controlled!**