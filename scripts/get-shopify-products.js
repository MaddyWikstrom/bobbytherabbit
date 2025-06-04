// Script to fetch all Shopify products and generate mapping
// Run this in your browser console while on your website

const SHOPIFY_PRODUCT_CONFIG = {
    domain: 'bobbytherabbit.com.myshopify.com',
    storefrontAccessToken: 'c47b9818634036f23b41ba1a31b14b22',
    apiVersion: '2024-01'
};

async function fetchAllProducts() {
    console.log('🔄 Fetching all products from Shopify...');
    
    const query = `
        {
            products(first: 250) {
                edges {
                    node {
                        id
                        title
                        handle
                        priceRange {
                            minVariantPrice {
                                amount
                                currencyCode
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
                                }
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
                    }
                }
            }
        }
    `;
    
    try {
        const response = await fetch(`https://${SHOPIFY_PRODUCT_CONFIG.domain}/api/${SHOPIFY_PRODUCT_CONFIG.apiVersion}/graphql.json`, {
            method: 'POST',
            headers: {
                'X-Shopify-Storefront-Access-Token': SHOPIFY_PRODUCT_CONFIG.storefrontAccessToken,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query })
        });
        
        const data = await response.json();
        
        if (data.errors) {
            console.error('❌ GraphQL Errors:', data.errors);
            return null;
        }
        
        return data.data.products.edges;
    } catch (error) {
        console.error('❌ Error fetching products:', error);
        return null;
    }
}

async function generateProductMapping() {
    const products = await fetchAllProducts();
    
    if (!products) {
        console.error('Failed to fetch products');
        return;
    }
    
    console.log(`✅ Found ${products.length} products`);
    console.log('\n📋 Product List:\n');
    
    // Display products in a table
    const productList = products.map((edge, index) => {
        const product = edge.node;
        const price = product.priceRange.minVariantPrice.amount;
        return {
            index: index + 1,
            title: product.title,
            handle: product.handle,
            price: `$${price}`,
            id: product.id,
            variants: product.variants.edges.length
        };
    });
    
    console.table(productList);
    
    // Generate mapping code
    console.log('\n📝 Generated Product Mapping:\n');
    console.log('Copy this code and update your shopify-integration.js:\n');
    
    const mappingCode = `const PRODUCT_MAPPING = {`;
    
    const mappings = products.map((edge, index) => {
        const product = edge.node;
        const productKey = `product-${index + 1}`; // You can customize this
        const price = product.priceRange.minVariantPrice.amount;
        
        // Create variant mapping
        const variantMapping = {};
        product.variants.edges.forEach(variantEdge => {
            const variant = variantEdge.node;
            // Extract size from variant title (e.g., "S", "M", "L", "XL")
            const size = variant.title.split(' / ').pop() || variant.title;
            variantMapping[size] = variant.id;
        });
        
        return `
    '${productKey}': {
        name: '${product.title.replace(/'/g, "\\'")}',
        shopifyProductId: '${product.id}',
        shopifyVariants: ${JSON.stringify(variantMapping, null, 12).replace(/\n/g, '\n        ')},
        price: '$${price}'
    }`;
    }).join(',');
    
    console.log(mappingCode + mappings + '\n};\n');
    
    // Also generate a simple product list for reference
    console.log('\n📋 Simple Product Reference:\n');
    products.forEach((edge, index) => {
        const product = edge.node;
        console.log(`${index + 1}. ${product.title}`);
        console.log(`   Handle: ${product.handle}`);
        console.log(`   ID: ${product.id}`);
        console.log(`   Variants: ${product.variants.edges.length}`);
        console.log('');
    });
    
    // Instructions for matching with your existing products
    console.log('\n🎯 How to match with your existing products:\n');
    console.log('1. Look at your current product cards (hoodie-1, tee-1, etc.)');
    console.log('2. Match them with the products above by name');
    console.log('3. Replace the product keys in the mapping');
    console.log('4. For example, if "NEON GLITCH HOODIE" is product #3 above:');
    console.log('   Change "product-3" to "hoodie-1" in the mapping\n');
    
    // Create a helper to match products
    console.log('\n🔍 Product Matcher Helper:\n');
    console.log('Use these commands to find specific products:\n');
    console.log('// Find hoodie products:');
    console.log('products.filter(p => p.node.title.toLowerCase().includes("hoodie"))');
    console.log('\n// Find t-shirt/tee products:');
    console.log('products.filter(p => p.node.title.toLowerCase().includes("tee") || p.node.title.toLowerCase().includes("shirt"))');
    
    // Store products globally for easy access
    window.shopifyProducts = products;
    console.log('\n💡 Products stored in window.shopifyProducts for further inspection');
}

// Auto-run when script loads
generateProductMapping();

// Export functions for manual use
window.ShopifyProductFetcher = {
    fetchAll: fetchAllProducts,
    generateMapping: generateProductMapping,
    config: SHOPIFY_PRODUCT_CONFIG
};