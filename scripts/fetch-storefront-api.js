// Fetch products using Storefront API and update PRODUCT_MAPPING

const SHOPIFY_CONFIG = {
    domain: 'bobbytherabbit.com.myshopify.com',
    storefrontAccessToken: '8c6bd66766da4553701a1f1fe7d94dc4',
    apiVersion: '2024-01'
};

async function fetchProductsAndGenerateMapping() {
    try {
        const response = await fetch(`https://${SHOPIFY_CONFIG.domain}/api/${SHOPIFY_CONFIG.apiVersion}/graphql.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Storefront-Access-Token': SHOPIFY_CONFIG.storefrontAccessToken
            },
            body: JSON.stringify({
                query: `{
                    products(first: 250) {
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
                }`
            })
        });

        const data = await response.json();

        if (data.errors) {
            console.error('GraphQL Errors:', data.errors);
            return;
        }

        const products = data.data.products.edges;
        console.log('✅ Products loaded:', products);

        // Generate mapping
        const mapping = {};
        products.forEach(product => {
            console.log(`- ${product.node.title}: ${product.node.id}`);
            mapping[product.node.title] = product.node.id;
        });

        console.log('📋 Product Mapping:');
        console.log(mapping);

        // Generate the PRODUCT_MAPPING code
        let mappingCode = 'const PRODUCT_MAPPING = {\n';
        products.forEach(product => {
            const productId = product.node.id;
            const productName = product.node.title;
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
        console.error('Error fetching products:', error);
    }
}

fetchProductsAndGenerateMapping();