// Simple product fetcher using Shopify Buy SDK
console.log('🔄 Fetching your Shopify products...');

// Wait for Shopify Buy SDK to load
function waitForShopifySDK(callback) {
    if (window.ShopifyBuy && window.shopifyClient) {
        callback();
    } else {
        setTimeout(() => waitForShopifySDK(callback), 500);
    }
}

waitForShopifySDK(async () => {
    try {
        // Use the existing Shopify client
        const client = window.shopifyClient;
        
        if (!client) {
            console.error('❌ Shopify client not initialized');
            return;
        }
        
        console.log('✅ Using existing Shopify client');
        
        // Fetch all products
        const products = await client.product.fetchAll();
        
        console.log(`\n✅ Found ${products.length} products in your store!\n`);
        
        // Create a simple product list
        console.log('📋 YOUR PRODUCTS:\n');
        products.forEach((product, index) => {
            console.log(`${index + 1}. ${product.title}`);
            console.log(`   Price: $${product.variants[0].price}`);
            console.log(`   Product ID: ${product.id}`);
            console.log(`   Variants: ${product.variants.length}`);
            console.log('');
        });
        
        // Generate the mapping code
        console.log('\n📝 COPY THIS PRODUCT MAPPING:\n');
        console.log('Replace the PRODUCT_MAPPING in shopify-integration.js with:\n');
        
        console.log('const PRODUCT_MAPPING = {');
        
        // Try to match products with your existing ones
        const mappings = [];
        
        // Look for hoodie
        const hoodie = products.find(p => 
            p.title.toLowerCase().includes('hoodie') || 
            p.title.toLowerCase().includes('neon glitch')
        );
        if (hoodie) {
            mappings.push(generateProductMapping('hoodie-1', hoodie));
        }
        
        // Look for tee/t-shirt
        const tee = products.find(p => 
            p.title.toLowerCase().includes('tee') || 
            p.title.toLowerCase().includes('t-shirt') ||
            p.title.toLowerCase().includes('cyber rabbit')
        );
        if (tee) {
            mappings.push(generateProductMapping('tee-1', tee));
        }
        
        // Look for jacket
        const jacket = products.find(p => 
            p.title.toLowerCase().includes('jacket') ||
            p.title.toLowerCase().includes('tech elite')
        );
        if (jacket) {
            mappings.push(generateProductMapping('jacket-1', jacket));
        }
        
        // Look for pants
        const pants = products.find(p => 
            p.title.toLowerCase().includes('pants') ||
            p.title.toLowerCase().includes('cargo') ||
            p.title.toLowerCase().includes('digital')
        );
        if (pants) {
            mappings.push(generateProductMapping('pants-1', pants));
        }
        
        // Add any unmatched products
        products.forEach((product, index) => {
            if (!mappings.some(m => m.includes(product.id))) {
                mappings.push(generateProductMapping(`product-${index + 1}`, product));
            }
        });
        
        console.log(mappings.join(',\n'));
        console.log('};');
        
        console.log('\n✅ Copy the mapping above and paste it into shopify-integration.js');
        console.log('\n💡 TIP: Check if the automatic matching is correct:');
        console.log('   - hoodie-1 should be your hoodie product');
        console.log('   - tee-1 should be your t-shirt product');
        console.log('   - jacket-1 should be your jacket product');
        console.log('   - pants-1 should be your pants product');
        
        // Store products for manual inspection
        window.myShopifyProducts = products;
        console.log('\n📦 Products stored in window.myShopifyProducts for inspection');
        
    } catch (error) {
        console.error('❌ Error fetching products:', error);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Make sure your Shopify store has products');
        console.log('2. Check that your API token has the right permissions');
        console.log('3. Try refreshing the page and waiting a few seconds');
    }
});

function generateProductMapping(key, product) {
    // Create variant mapping
    const variants = {};
    product.variants.forEach(variant => {
        // Try to extract size from variant title
        const title = variant.title;
        let size = 'Default';
        
        // Common size patterns
        if (title.includes(' / ')) {
            size = title.split(' / ').pop();
        } else if (['S', 'M', 'L', 'XL', 'XXL', 'XS'].includes(title)) {
            size = title;
        } else if (title.match(/\b(Small|Medium|Large|X-Large|XX-Large|X-Small)\b/i)) {
            const sizeMap = {
                'Small': 'S',
                'Medium': 'M', 
                'Large': 'L',
                'X-Large': 'XL',
                'XX-Large': 'XXL',
                'X-Small': 'XS'
            };
            const match = title.match(/\b(Small|Medium|Large|X-Large|XX-Large|X-Small)\b/i)[0];
            size = sizeMap[match] || match;
        }
        
        variants[size] = variant.id;
    });
    
    return `    '${key}': {
        name: '${product.title.replace(/'/g, "\\'")}',
        shopifyProductId: '${product.id}',
        shopifyVariants: ${JSON.stringify(variants, null, 8).split('\n').map((line, i) => i === 0 ? line : '        ' + line).join('\n')},
        price: '$${product.variants[0].price}'
    }`;
}