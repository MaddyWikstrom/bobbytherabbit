// Direct Storefront API implementation following Shopify's guide
// https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/products-collections/getting-started

const STOREFRONT_ACCESS_TOKEN = '8c6bd66766da4553701a1f1fe7d94dc4';
const SHOP_DOMAIN = 'bobbytherabbit.com.myshopify.com';
const API_VERSION = '2024-01';

// GraphQL endpoint
const endpoint = `https://${SHOP_DOMAIN}/api/${API_VERSION}/graphql.json`;

// Query to fetch products
const productsQuery = `
  query Products {
    products(first: 250) {
      edges {
        node {
          id
          title
          handle
          description
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 1) {
            edges {
              node {
                url
                altText
              }
            }
          }
          variants(first: 100) {
            edges {
              node {
                id
                title
                price {
                  amount
                  currencyCode
                }
                availableForSale
                selectedOptions {
                  name
                  value
                }
              }
            }
          }
        }
      }
    }
  }
`;

// Fetch products using Storefront API
async function fetchProductsFromStorefront() {
    console.log('🔄 Fetching products from Shopify Storefront API...');
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Storefront-Access-Token': STOREFRONT_ACCESS_TOKEN
            },
            body: JSON.stringify({ query: productsQuery })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.errors) {
            console.error('❌ GraphQL Errors:', data.errors);
            data.errors.forEach(error => {
                console.error(`   - ${error.message}`);
            });
            return null;
        }

        const products = data.data.products.edges;
        console.log(`✅ Successfully fetched ${products.length} products!\n`);
        
        return products;
    } catch (error) {
        console.error('❌ Error fetching products:', error);
        console.log('\n🔧 Troubleshooting tips:');
        console.log('1. Check if your Storefront Access Token is correct');
        console.log('2. Verify the token has product reading permissions');
        console.log('3. Make sure your domain is correct (should end with .myshopify.com)');
        console.log('4. Check browser console for CORS errors');
        return null;
    }
}

// Generate product mapping for your site
function generateProductMapping(products) {
    console.log('📝 GENERATED PRODUCT MAPPING:\n');
    console.log('Copy this entire block and replace PRODUCT_MAPPING in shopify-integration.js:\n');
    
    console.log('const PRODUCT_MAPPING = {');
    
    const mappings = [];
    
    // Try to match products with your existing structure
    products.forEach((edge, index) => {
        const product = edge.node;
        let key = `product-${index + 1}`;
        
        // Try to identify product type
        const title = product.title.toLowerCase();
        if (title.includes('hoodie') || title.includes('hoody')) {
            key = 'hoodie-1';
        } else if (title.includes('tee') || title.includes('t-shirt') || title.includes('shirt')) {
            key = 'tee-1';
        } else if (title.includes('jacket')) {
            key = 'jacket-1';
        } else if (title.includes('pants') || title.includes('cargo')) {
            key = 'pants-1';
        }
        
        // Build variant mapping
        const variants = {};
        product.variants.edges.forEach(variantEdge => {
            const variant = variantEdge.node;
            
            // Extract size from variant options
            let size = 'Default';
            const sizeOption = variant.selectedOptions.find(opt => 
                opt.name.toLowerCase() === 'size'
            );
            if (sizeOption) {
                size = sizeOption.value;
            } else if (variant.title && variant.title !== 'Default Title') {
                size = variant.title;
            }
            
            variants[size] = variant.id;
        });
        
        const mapping = `    '${key}': {
        name: '${product.title.replace(/'/g, "\\'")}',
        shopifyProductId: '${product.id}',
        shopifyVariants: ${JSON.stringify(variants, null, 8).split('\n').map((line, i) => i === 0 ? line : '        ' + line).join('\n')},
        price: '$${product.priceRange.minVariantPrice.amount}'
    }`;
        
        mappings.push(mapping);
    });
    
    console.log(mappings.join(',\n'));
    console.log('};\n');
    
    // Display product list for reference
    console.log('\n📋 PRODUCT REFERENCE LIST:\n');
    products.forEach((edge, index) => {
        const product = edge.node;
        console.log(`${index + 1}. ${product.title}`);
        console.log(`   Handle: ${product.handle}`);
        console.log(`   Price: $${product.priceRange.minVariantPrice.amount}`);
        console.log(`   Variants: ${product.variants.edges.length}`);
        console.log(`   ID: ${product.id}`);
        console.log('');
    });
    
    console.log('✅ Done! Copy the PRODUCT_MAPPING above and update your shopify-integration.js file.');
}

// Run the fetch when page loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Shopify Storefront API Product Fetcher\n');
    
    const products = await fetchProductsFromStorefront();
    
    if (products && products.length > 0) {
        generateProductMapping(products);
        
        // Store for manual inspection
        window.shopifyProducts = products;
        console.log('\n💡 Products stored in window.shopifyProducts for manual inspection');
    } else if (products && products.length === 0) {
        console.log('⚠️ No products found in your store');
        console.log('Make sure you have published products in Shopify');
    }
});

// Also run immediately if DOM is already loaded
if (document.readyState !== 'loading') {
    fetchProductsFromStorefront().then(products => {
        if (products) generateProductMapping(products);
    });
}