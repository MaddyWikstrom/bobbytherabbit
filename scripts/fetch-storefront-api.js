// Fetch products using Netlify function (CORS-free) and update PRODUCT_MAPPING

async function fetchProductsAndGenerateMapping() {
    try {
        console.log('🔄 Fetching products via Netlify function...');
        const response = await fetch('/.netlify/functions/get-products');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            console.error('❌ Netlify function error:', data.error);
            return;
        }

        const products = data.products || [];
        console.log('✅ Products loaded via Netlify function:', products);

        // Generate mapping
        const mapping = {};
        products.forEach(product => {
            console.log(`- ${product.title}: ${product.id}`);
            mapping[product.title] = product.id;
        });

        console.log('📋 Product Mapping:');
        console.log(mapping);

        // Generate the PRODUCT_MAPPING code
        let mappingCode = 'const PRODUCT_MAPPING = {\n';
        products.forEach(product => {
            const productId = product.id;
            const productName = product.title;
            mappingCode += `    '${productName}': {\n`;
            mappingCode += `        shopifyProductId: '${productId}',\n`;
            mappingCode += `        // Add variant information here\n`;
            mappingCode += `    },\n`;
        });
        mappingCode += '};';

        console.log('📝 Generated PRODUCT_MAPPING code:\n');
        console.log(mappingCode);

        // Store the mapping in localStorage (for now)
        localStorage.setItem('shopifyProductMapping', mappingCode);

    } catch (error) {
        console.error('❌ Error fetching products via Netlify function:', error);
        console.log('💡 Make sure environment variables are set in Netlify Dashboard');
    }
}

fetchProductsAndGenerateMapping();