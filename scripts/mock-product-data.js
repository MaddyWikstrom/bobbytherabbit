/**
 * Mock Product Data for Local Testing
 * This script provides mock product data when the Netlify function fails
 * to facilitate local testing of cart functionality
 */

// Create mock product data
const MOCK_PRODUCTS = [
    {
        id: 'bungi-hoodie-black',
        handle: 'bungi-hoodie-black',
        shopifyId: 'gid://shopify/Product/123456789',
        title: 'BUNGI X BOBBY Tech Animal Hoodie - Black',
        description: 'Premium tech animal streetwear hoodie featuring the iconic Bobby Rabbit hardware design. Made with high-quality materials for maximum comfort and style.',
        category: 'Hoodies',
        price: 79.99,
        comparePrice: 99.99,
        images: [
            'mockups/unisex-premium-hoodie-black-front-683f9021c6f6d.png',
            'mockups/unisex-premium-hoodie-black-back-683f9021c7dbc.png',
            'mockups/unisex-premium-hoodie-black-side-683f9021c454e.png'
        ],
        variants: [
            {
                id: 'gid://shopify/ProductVariant/1001',
                color: 'Black',
                size: 'S',
                price: 79.99,
                comparePrice: 99.99,
                availableForSale: true,
                quantityAvailable: 10
            },
            {
                id: 'gid://shopify/ProductVariant/1002',
                color: 'Black',
                size: 'M',
                price: 79.99,
                comparePrice: 99.99,
                availableForSale: true,
                quantityAvailable: 15
            },
            {
                id: 'gid://shopify/ProductVariant/1003',
                color: 'Black',
                size: 'L',
                price: 79.99,
                comparePrice: 99.99,
                availableForSale: true,
                quantityAvailable: 8
            },
            {
                id: 'gid://shopify/ProductVariant/1004',
                color: 'Black',
                size: 'XL',
                price: 79.99,
                comparePrice: 99.99,
                availableForSale: true,
                quantityAvailable: 5
            }
        ],
        colors: [
            { name: 'Black', code: '#000000' }
        ],
        sizes: ['S', 'M', 'L', 'XL'],
        colorImages: {
            'Black': [
                'mockups/unisex-premium-hoodie-black-front-683f9021c6f6d.png',
                'mockups/unisex-premium-hoodie-black-back-683f9021c7dbc.png',
                'mockups/unisex-premium-hoodie-black-side-683f9021c454e.png'
            ]
        },
        featured: true,
        new: true,
        sale: true,
        tags: ['featured', 'new', 'sale'],
        productType: 'Hoodie',
        inventory: {
            'Black-S': 10,
            'Black-M': 15,
            'Black-L': 8,
            'Black-XL': 5
        },
        features: [
            { icon: '🐰', text: 'Bobby the Tech Animal approved' },
            { icon: '⚡', text: 'Elite GooberMcGeet club exclusive' },
            { icon: '🧵', text: '100% cotton face for ultimate comfort' },
            { icon: '♻️', text: '65% ring-spun cotton, 35% polyester blend' }
        ],
        details: 'This premium hoodie runs small. For the perfect fit, we recommend ordering one size larger than your usual size.',
        care: 'Machine wash cold, tumble dry low, do not bleach, iron on low heat if needed.',
        shipping: 'This product is made especially for you as soon as you place an order, which is why it takes us a bit longer to deliver it to you.',
        rating: 4.8,
        reviewCount: 127
    },
    {
        id: 'bungi-tshirt-white',
        handle: 'bungi-tshirt-white',
        shopifyId: 'gid://shopify/Product/987654321',
        title: 'BUNGI X BOBBY Tech Animal T-Shirt - White',
        description: 'Lightweight tech animal t-shirt featuring the iconic Bobby Rabbit design. Perfect for casual everyday wear.',
        category: 'T-Shirts',
        price: 39.99,
        comparePrice: 49.99,
        images: [
            'mockups/unisex-t-shirt-white-front-683f9c9fdcac3.png',
            'mockups/unisex-t-shirt-white-back-683f9c9fdcb95.png'
        ],
        variants: [
            {
                id: 'gid://shopify/ProductVariant/2001',
                color: 'White',
                size: 'S',
                price: 39.99,
                comparePrice: 49.99,
                availableForSale: true,
                quantityAvailable: 12
            },
            {
                id: 'gid://shopify/ProductVariant/2002',
                color: 'White',
                size: 'M',
                price: 39.99,
                comparePrice: 49.99,
                availableForSale: true,
                quantityAvailable: 18
            },
            {
                id: 'gid://shopify/ProductVariant/2003',
                color: 'White',
                size: 'L',
                price: 39.99,
                comparePrice: 49.99,
                availableForSale: true,
                quantityAvailable: 10
            }
        ],
        colors: [
            { name: 'White', code: '#FFFFFF' }
        ],
        sizes: ['S', 'M', 'L'],
        colorImages: {
            'White': [
                'mockups/unisex-t-shirt-white-front-683f9c9fdcac3.png',
                'mockups/unisex-t-shirt-white-back-683f9c9fdcb95.png'
            ]
        },
        featured: false,
        new: true,
        sale: true,
        tags: ['new', 'sale'],
        productType: 'T-Shirt',
        inventory: {
            'White-S': 12,
            'White-M': 18,
            'White-L': 10
        },
        features: [
            { icon: '🐰', text: 'Bobby the Tech Animal approved' },
            { icon: '⚡', text: 'Elite GooberMcGeet club exclusive' },
            { icon: '🧵', text: '100% premium cotton' },
            { icon: '👕', text: 'Durable rib neckband' }
        ],
        details: 'This t-shirt is made from high-quality cotton for maximum comfort and durability.',
        care: 'Machine wash cold with like colors, tumble dry low, do not bleach.',
        shipping: 'This product is made especially for you as soon as you place an order, which is why it takes us a bit longer to deliver it to you.',
        rating: 4.6,
        reviewCount: 94
    }
];

// Convert to Shopify API format for compatibility
const MOCK_SHOPIFY_PRODUCTS = MOCK_PRODUCTS.map(product => {
    return {
        id: product.shopifyId,
        handle: product.handle,
        title: product.title,
        description: product.description,
        productType: product.productType,
        tags: product.tags,
        priceRange: {
            minVariantPrice: {
                amount: product.price.toString()
            }
        },
        images: {
            edges: product.images.map(url => ({
                node: {
                    url: url
                }
            }))
        },
        variants: {
            edges: product.variants.map(variant => ({
                node: {
                    id: variant.id,
                    price: {
                        amount: variant.price.toString()
                    },
                    compareAtPrice: variant.comparePrice ? {
                        amount: variant.comparePrice.toString()
                    } : null,
                    availableForSale: variant.availableForSale,
                    quantityAvailable: variant.quantityAvailable,
                    selectedOptions: [
                        {
                            name: 'Color',
                            value: variant.color
                        },
                        {
                            name: 'Size',
                            value: variant.size
                        }
                    ],
                    image: {
                        url: product.colorImages[variant.color][0]
                    }
                }
            }))
        }
    };
});

// Create global window variable to store mock products
window.PRODUCT_MAPPING = {};
MOCK_PRODUCTS.forEach(product => {
    window.PRODUCT_MAPPING[product.handle] = {
        shopifyProductId: product.shopifyId,
        variants: product.variants.map(v => ({
            id: v.id,
            image: product.colorImages[v.color][0]
        }))
    };
});

// Mock API response function
async function mockNetlifyFunction() {
    console.log('🔄 Using mock product data instead of Netlify function');
    return MOCK_SHOPIFY_PRODUCTS;
}

// Intercept fetch calls to Netlify function
const originalFetch = window.fetch;
window.fetch = function(url, options) {
    if (url.includes('netlify/functions/get-products')) {
        console.log('🔄 Intercepting Netlify function call with mock data');
        return Promise.resolve({
            ok: true,
            json: async () => mockNetlifyFunction()
        });
    }
    
    if (url.includes('netlify/functions/create-checkout')) {
        console.log('🔄 Intercepting checkout function call with mock data');
        return Promise.resolve({
            ok: true,
            json: async () => ({ 
                checkoutUrl: 'https://bobbytherabbit.myshopify.com/cart' 
            })
        });
    }
    
    return originalFetch.apply(this, arguments);
};

console.log('🎭 Mock product data loaded successfully');