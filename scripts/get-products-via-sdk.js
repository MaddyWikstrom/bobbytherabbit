// Get products using the already-loaded Shopify Buy SDK
console.log('🔄 Fetching products via Shopify Buy SDK...\n');

// Wait for the SDK and client to be ready
function waitForClient(callback) {
    if (window.shopifyClient) {
        callback();
    } else {
        console.log('⏳ Waiting for Shopify client to initialize...');
        setTimeout(() => waitForClient(callback), 1000);
    }
}

waitForClient(async () => {
    try {
        const client = window.shopifyClient;
        console.log('✅ Using initialized Shopify client\n');
        
        // Fetch all products
        const products = await client.product.fetchAll();
        
        if (!products || products.length === 0) {
            console.log('❌ No products found. Make sure you have products in Shopify.');
            return;
        }
        
        console.log(`✅ Found ${products.length} products!\n`);
        
        // Display products
        console.log('📋 YOUR PRODUCTS:\n');
        products.forEach((product, index) => {
            console.log(`${index + 1}. ${product.title}`);
            console.log(`   Price: $${product.variants[0].price.amount}`);
            console.log(`   Variants: ${product.variants.length}`);
            console.log(`   ID: ${product.id}`);
            
            // Show variants
            if (product.variants.length > 1) {
                console.log('   Sizes:');
                product.variants.forEach(v => {
                    console.log(`     - ${v.title}: ${v.id}`);
                });
            }
            console.log('');
        });
        
        // Generate mapping
        console.log('\n📝 COPY THIS PRODUCT MAPPING:\n');
        console.log('Replace the entire PRODUCT_MAPPING in shopify-integration.js with:\n');
        
        console.log('const PRODUCT_MAPPING = {');
        
        const mappings = [];
        
        // Try to match products
        products.forEach((product, index) => {
            let key = `product-${index + 1}`;
            const title = product.title.toLowerCase();
            
            // Match to existing product keys
            if (title.includes('hoodie') || title.includes('hoody') || title.includes('neon glitch')) {
                key = 'hoodie-1';
            } else if (title.includes('tee') || title.includes('t-shirt') || title.includes('shirt') || title.includes('cyber rabbit')) {
                key = 'tee-1';
            } else if (title.includes('jacket') || title.includes('tech elite')) {
                key = 'jacket-1';
            } else if (title.includes('pants') || title.includes('cargo') || title.includes('digital')) {
                key = 'pants-1';
            }
            
            // Build variants object
            const variants = {};
            product.variants.forEach(variant => {
                // Extract size - handle different formats
                let size = 'Default';
                
                if (variant.title === 'Default Title') {
                    size = 'Default';
                } else if (variant.title.includes(' / ')) {
                    // Format: "Color / Size" or "Size / Color"
                    const parts = variant.title.split(' / ');
                    // Try to find size part
                    const sizePart = parts.find(p => 
                        ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL'].includes(p.toUpperCase())
                    );
                    size = sizePart || parts[parts.length - 1];
                } else {
                    size = variant.title;
                }
                
                variants[size] = variant.id;
            });
            
            const mapping = `    '${key}': {
        name: '${product.title.replace(/'/g, "\\'")}',
        shopifyProductId: '${product.id}',
        shopifyVariants: ${JSON.stringify(variants, null, 8).split('\n').map((line, i) => i === 0 ? line : '        ' + line).join('\n')},
        price: '$${product.variants[0].price.amount}'
    }`;
            
            mappings.push(mapping);
        });
        
        console.log(mappings.join(',\n'));
        console.log('};\n');
        
        console.log('✅ Copy the mapping above and paste it into shopify-integration.js\n');
        
        console.log('💡 IMPORTANT: Check that the product keys match your site:');
        console.log('   - hoodie-1 → Your hoodie product');
        console.log('   - tee-1 → Your t-shirt product');
        console.log('   - jacket-1 → Your jacket product');
        console.log('   - pants-1 → Your pants product\n');
        
        console.log('If the automatic matching is wrong, manually adjust the keys.');
        
        // Store for inspection
        window.myProducts = products;
        console.log('\n📦 Products stored in window.myProducts for manual inspection');
        
    } catch (error) {
        console.error('❌ Error fetching products:', error);
        console.log('\n🔧 Try these solutions:');
        console.log('1. Make sure your token has product reading permissions');
        console.log('2. Check that you have products in Shopify');
        console.log('3. Verify products are active/published');
        console.log('4. Try refreshing the page');
    }
});

// Also provide manual trigger
window.fetchMyProducts = () => {
    location.reload();
};

console.log('💡 TIP: If products don\'t load, type fetchMyProducts() in console');