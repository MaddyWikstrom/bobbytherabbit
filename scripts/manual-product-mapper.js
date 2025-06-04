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

const template = `const PRODUCT_MAPPING = {
    'hoodie-1': {
        name: 'NEON GLITCH HOODIE',
        shopifyProductId: 'gid://shopify/Product/YOUR_HOODIE_ID',
        shopifyVariants: {
            'S': 'gid://shopify/ProductVariant/YOUR_S_VARIANT_ID',
            'M': 'gid://shopify/ProductVariant/YOUR_M_VARIANT_ID',
            'L': 'gid://shopify/ProductVariant/YOUR_L_VARIANT_ID',
            'XL': 'gid://shopify/ProductVariant/YOUR_XL_VARIANT_ID'
        },
        price: '$89.99'
    },
    'tee-1': {
        name: 'CYBER RABBIT TEE',
        shopifyProductId: 'gid://shopify/Product/YOUR_TEE_ID',
        shopifyVariants: {
            'S': 'gid://shopify/ProductVariant/YOUR_S_VARIANT_ID',
            'M': 'gid://shopify/ProductVariant/YOUR_M_VARIANT_ID',
            'L': 'gid://shopify/ProductVariant/YOUR_L_VARIANT_ID',
            'XL': 'gid://shopify/ProductVariant/YOUR_XL_VARIANT_ID'
        },
        price: '$49.99'
    },
    'jacket-1': {
        name: 'TECH ELITE JACKET',
        shopifyProductId: 'gid://shopify/Product/YOUR_JACKET_ID',
        shopifyVariants: {
            'S': 'gid://shopify/ProductVariant/YOUR_S_VARIANT_ID',
            'M': 'gid://shopify/ProductVariant/YOUR_M_VARIANT_ID',
            'L': 'gid://shopify/ProductVariant/YOUR_L_VARIANT_ID',
            'XL': 'gid://shopify/ProductVariant/YOUR_XL_VARIANT_ID'
        },
        price: '$149.99'
    },
    'pants-1': {
        name: 'DIGITAL CARGO PANTS',
        shopifyProductId: 'gid://shopify/Product/YOUR_PANTS_ID',
        shopifyVariants: {
            'S': 'gid://shopify/ProductVariant/YOUR_S_VARIANT_ID',
            'M': 'gid://shopify/ProductVariant/YOUR_M_VARIANT_ID',
            'L': 'gid://shopify/ProductVariant/YOUR_L_VARIANT_ID',
            'XL': 'gid://shopify/ProductVariant/YOUR_XL_VARIANT_ID'
        },
        price: '$79.99'
    }
};`;

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