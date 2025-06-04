// Manual Product Mapping Helper
// Since CORS is blocking API access, use this to manually create your mapping

console.log('📝 MANUAL PRODUCT MAPPING HELPER\n');
console.log('Since the API is blocked by CORS, you\'ll need to manually get your product IDs from Shopify.\n');

console.log('📋 STEP 1: Get Your Product IDs from Shopify Admin\n');
console.log('1. Go to your Shopify Admin');
console.log('2. Click on "Products"');
console.log('3. For each product:');
console.log('   - Click on the product');
console.log('   - Look at the URL: admin.shopify.com/store/bobbytherabbit/products/[PRODUCT_ID]');
console.log('   - Copy the number at the end\n');

console.log('📋 STEP 2: Get Variant IDs\n');
console.log('While on the product page in Shopify Admin:');
console.log('1. Open browser console (F12)');
console.log('2. Run this command:');
console.log('   Shopify.product.variants.forEach(v => console.log(`${v.title}: ${v.id}`))');
console.log('3. Copy the variant IDs for each size\n');

console.log('📋 STEP 3: Use This Template\n');
console.log('Copy this template and fill in your actual IDs:\n');

const PRODUCT_MAPPING = {
    'bungi-x-bobby-rabbit-hardware-unisex-hoodie': {
        shopifyProductId: 'gid://shopify/Product/YOUR_HOODIE_ID',
        shopifyVariants: {
            'S': 'gid://shopify/ProductVariant/YOUR_S_VARIANT_ID',
            'M': 'gid://shopify/ProductVariant/YOUR_M_VARIANT_ID',
            'L': 'gid://shopify/ProductVariant/YOUR_L_VARIANT_ID',
            'XL': 'gid://shopify/ProductVariant/YOUR_XL_VARIANT_ID'
        },
        price: '$50.00'
    },
    'bungi-x-bobby-lightmode-rabbit-hardware-unisex-hoodie': {
        shopifyProductId: 'gid://shopify/Product/YOUR_LIGHTMODE_HOODIE_ID',
        shopifyVariants: {
            'S': 'gid://shopify/ProductVariant/YOUR_LIGHTMODE_S_VARIANT_ID',
            'M': 'gid://shopify/ProductVariant/YOUR_LIGHTMODE_M_VARIANT_ID',
            'L': 'gid://shopify/ProductVariant/YOUR_LIGHTMODE_L_VARIANT_ID',
            'XL': 'gid://shopify/ProductVariant/YOUR_LIGHTMODE_XL_VARIANT_ID'
        },
        price: '$50.50'
    },
    'bungi-x-bobby-lightmode-rabbit-hardware-mens-t-shirt': {
        shopifyProductId: 'gid://shopify/Product/YOUR_LIGHTMODE_TEE_ID',
        shopifyVariants: {
            'XS': 'gid://shopify/ProductVariant/YOUR_LIGHTMODE_XS_VARIANT_ID',
            'S': 'gid://shopify/ProductVariant/YOUR_LIGHTMODE_S_VARIANT_ID',
            'M': 'gid://shopify/ProductVariant/YOUR_LIGHTMODE_M_VARIANT_ID',
            'L': 'gid://shopify/ProductVariant/YOUR_LIGHTMODE_L_VARIANT_ID'
        },
        price: '$27.50'
    },
    'bungi-x-bobby-darkmode-embroidered-unisex-organic-oversized-sweatshirt': {
        shopifyProductId: 'gid://shopify/Product/YOUR_DARKMODE_SWEATSHIRT_ID',
        shopifyVariants: {
            'S': 'gid://shopify/ProductVariant/YOUR_DARKMODE_S_VARIANT_ID',
            'M': 'gid://shopify/ProductVariant/YOUR_DARKMODE_M_VARIANT_ID',
            'L': 'gid://shopify/ProductVariant/YOUR_DARKMODE_L_VARIANT_ID',
            'XL': 'gid://shopify/ProductVariant/YOUR_DARKMODE_XL_VARIANT_ID'
        },
        price: '$50.00'
    },
    'bungi-x-bobby-cowboy-unisex-windbreaker': {
        shopifyProductId: 'gid://shopify/Product/YOUR_COWBOY_WIND_BREAKER_ID',
        shopifyVariants: {
            'S': 'gid://shopify/ProductVariant/YOUR_COWBOY_S_VARIANT_ID',
            'M': 'gid://shopify/ProductVariant/YOUR_COWBOY_M_VARIANT_ID',
            'L': 'gid://shopify/ProductVariant/YOUR_COWBOY_L_VARIANT_ID',
            'XL': 'gid://shopify/ProductVariant/YOUR_COWBOY_XL_VARIANT_ID'
        },
        price: '$41.00'
    },
    'bungi-x-bobby-dark-mode-wide-leg-joggers': {
        shopifyProductId: 'gid://shopify/Product/YOUR_WIDE_LEG_JOGGERS_ID',
        shopifyVariants: {
            'S': 'gid://shopify/ProductVariant/YOUR_WIDE_LEG_S_VARIANT_ID',
            'M': 'gid://shopify/ProductVariant/YOUR_WIDE_LEG_M_VARIANT_ID',
            'L': 'gid://shopify/ProductVariant/YOUR_WIDE_LEG_L_VARIANT_ID',
            'XL': 'gid://shopify/ProductVariant/YOUR_WIDE_LEG_XL_VARIANT_ID'
        },
        price: '$44.00'
    }
};

console.log(template);

console.log('\n📋 STEP 4: Format Your IDs\n');
console.log('Your product IDs should look like:');
console.log('- Product ID: gid://shopify/Product/1234567890');
console.log('- Variant ID: gid://shopify/ProductVariant/1234567890\n');

console.log('💡 ALTERNATIVE: Use Shopify GraphQL Explorer\n');
console.log('1. Install "Shopify GraphiQL App" from Shopify App Store');
console.log('2. Run this query:');

const graphqlQuery = `{
  products(first: 10) {
    edges {
      node {
        id
        title
        variants(first: 10) {
          edges {
            node {
              id
              title
            }
          }
        }
      }
    }
  }
}`;

console.log(graphqlQuery);

console.log('\n🔧 CORS WORKAROUND OPTIONS:\n');
console.log('1. Deploy your site to a real domain (CORS only affects localhost)');
console.log('2. Use Shopify Buy Button instead of custom integration');
console.log('3. Create a backend proxy server');
console.log('4. Use Shopify\'s embedded app approach\n');

console.log('📌 For now, manually copy your product IDs from Shopify Admin and update shopify-integration.js');

// Helper function to format IDs
window.formatShopifyId = (type, id) => {
    return `gid://shopify/${type}/${id}`;
};

console.log('\n💡 Helper function available: formatShopifyId("Product", "1234567890")');