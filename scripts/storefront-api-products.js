// CORS-free product fetching using Netlify functions
// This replaces direct Storefront API calls to prevent CORS errors

// Fetch products using Netlify function (bypasses CORS)
async function fetchProductsFromStorefront() {
    console.log('🔄 Fetching products via Netlify function (CORS-free)...');
    
    try {
        const response = await fetch('/.netlify/functions/get-products');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.error) {
            console.error('❌ Netlify function error:', data.error);
            return null;
        }

        const products = data.products || [];
        console.log(`✅ Successfully fetched ${products.length} products via Netlify function!\n`);
        
        return products;
    } catch (error) {
        console.error('❌ Error fetching products via Netlify function:', error);
        console.log('\n🔧 Troubleshooting tips:');
        console.log('1. Make sure Netlify function is deployed');
        console.log('2. Check environment variables are set in Netlify');
        console.log('3. Verify SHOPIFY_ADMIN_TOKEN is configured');
        console.log('4. Check Netlify function logs for errors');
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
            let size = null;
            
            // Debug output to diagnose the variant structure
            console.log(`Processing variant: ${variant.title}`, JSON.stringify(variant.selectedOptions));
            
            // Method 1: Try to find a direct size option
            const sizeOption = variant.selectedOptions.find(opt =>
                opt.name.toLowerCase() === 'size'
            );
            
            if (sizeOption) {
                size = sizeOption.value;
                console.log(`Found size option directly: ${size}`);
            }
            
            // Method 2: Look for size-like values in any option (regardless of name)
            if (!size && variant.selectedOptions && variant.selectedOptions.length > 0) {
                for (const opt of variant.selectedOptions) {
                    const value = opt.value.toUpperCase().trim();
                    // Check for common size patterns
                    if (['S', 'M', 'L', 'XL', '2XL', 'XXL', '3XL', 'XXXL'].includes(value) ||
                        value.includes('SMALL') || value.includes('MEDIUM') || value.includes('LARGE') ||
                        /^\d+$/.test(value) || // Numeric sizes
                        /^[0-9]+\.[0-9]+$/.test(value)) { // Decimal sizes
                        
                        size = opt.value;
                        console.log(`Found size-like value "${size}" in option "${opt.name}"`);
                        break;
                    }
                }
            }
            
            // Method 3: Try to extract from variant title (format: "Color / Size" or similar)
            if (!size && variant.title && variant.title !== 'Default Title') {
                // Check for slash format
                if (variant.title.includes('/')) {
                    const parts = variant.title.split('/').map(p => p.trim());
                    // Usually size is the second part (after color)
                    if (parts.length > 1) {
                        size = parts[1];
                        console.log(`Extracted size "${size}" from title with slash: ${variant.title}`);
                    }
                }
                // Check for special "One Size" variant
                else if (variant.title.toLowerCase().includes('one size')) {
                    size = 'One Size';
                    console.log(`Found "One Size" variant`);
                }
                // If only one variant exists and it's not "Default Title", use it as is
                else {
                    size = variant.title;
                    console.log(`Using variant title as size: ${size}`);
                }
            }
            
            // Final fallback: if nothing worked, use "One Size"
            if (!size) {
                size = 'One Size';
                console.log(`Defaulting to "One Size" for variant: ${variant.title}`);
            }
            
            // Store the size-to-variant mapping
            variants[size] = variant.id;
            console.log(`Mapped variant "${variant.title}" to size "${size}"`);
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