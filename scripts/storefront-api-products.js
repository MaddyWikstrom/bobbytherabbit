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
            
            // Extract size from variant options - enhanced with better fallbacks
            let size = 'Default';
            
            // First try to find a direct size option
            const sizeOption = variant.selectedOptions.find(opt =>
                opt.name.toLowerCase() === 'size'
            );
            
            if (sizeOption) {
                size = sizeOption.value;
            }
            // If no size option found, try to extract from title (common format: "Color / Size")
            else if (variant.title && variant.title !== 'Default Title') {
                const titleParts = variant.title.split('/');
                if (titleParts.length > 1) {
                    // Usually the size is the second part after color
                    size = titleParts[1].trim();
                } else {
                    size = variant.title.trim();
                }
            }
            
            // Additional extraction fallback - try common size formats
            if (size === 'Default' && variant.selectedOptions && variant.selectedOptions.length > 0) {
                // Try to find any option that looks like a size (S, M, L, XL, XXL, etc.)
                const possibleSizeOption = variant.selectedOptions.find(opt => {
                    const val = opt.value.toUpperCase().trim();
                    return val === 'S' || val === 'M' || val === 'L' || val === 'XL' ||
                           val === '2XL' || val === 'XXL' || val === '3XL' || val === 'XXXL' ||
                           val.match(/^\d+$/) || // Numeric sizes like 30, 32, etc.
                           val.includes('SMALL') || val.includes('MEDIUM') ||
                           val.includes('LARGE') || val.includes('EXTRA');
                });
                
                if (possibleSizeOption) {
                    size = possibleSizeOption.value;
                    console.log(`Extracted size "${size}" from option "${possibleSizeOption.name}"`);
                }
            }
            
            // Store all sizes in a complete object to ensure none are missed
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