// CORS-Free Shopify Integration using Netlify Functions
// This replaces the Shopify Buy SDK to prevent CORS issues

class ShopifyBuySDKManager {
    constructor() {
        this.client = null;
        this.products = [];
        this.isLoaded = false;
        this.init();
    }

    async init() {
        try {
            console.log('🔄 Initializing CORS-free Shopify integration...');
            console.log('💡 Using Netlify functions instead of direct SDK calls');
            
            this.isLoaded = true;
            
            // Load products via Netlify function
            await this.loadProducts();
            
        } catch (error) {
            console.error('❌ Failed to initialize Shopify integration:', error);
            this.isLoaded = false;
        }
    }

    // Note: loadShopifySDK() removed to prevent CORS issues
    // All functionality now uses Netlify functions

    async loadProducts() {
        try {
            console.log('🛍️ Fetching products via Netlify function...');
            
            const response = await fetch('/.netlify/functions/get-products');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            const products = data.products || [];
            console.log(`✅ Loaded ${products.length} products via Netlify function`);
            
            // Convert to our format
            this.products = this.convertShopifyProducts(products);
            
            return this.products;
            
        } catch (error) {
            console.error('❌ Error fetching products via Netlify function:', error);
            console.log('💡 Make sure environment variables are set in Netlify Dashboard');
            throw error;
        }
    }

    convertShopifyProducts(shopifyProducts) {
        return shopifyProducts.map(product => {
            // Extract images from Shopify
            const shopifyImages = product.images.map(img => img.src);
            
            // Get local mockup images
            const localImages = this.getLocalMockupImages(product.handle, product.title);
            
            // Combine both image sources - local mockups first, then Shopify images
            const images = [...localImages, ...shopifyImages];
            
            // Extract variants and organize by color/size
            const variants = [];
            const colors = new Set();
            const sizes = new Set();
            
            product.variants.forEach(variant => {
                let color = '';
                let size = '';
                
                variant.selectedOptions.forEach(option => {
                    if (option.name.toLowerCase() === 'color') {
                        color = option.value;
                        colors.add(color);
                    } else if (option.name.toLowerCase() === 'size') {
                        size = option.value;
                        sizes.add(size);
                    }
                });
                
                variants.push({
                    id: variant.id,
                    color: color,
                    size: size,
                    price: parseFloat(variant.price.amount),
                    comparePrice: variant.compareAtPrice ? parseFloat(variant.compareAtPrice.amount) : null,
                    availableForSale: variant.available,
                    image: images[0] || ''
                });
            });
            
            // Determine category from product type or title
            const category = this.extractCategory(product.title);
            
            // Calculate pricing
            const minPrice = Math.min(...variants.map(v => v.price));
            const maxPrice = Math.max(...variants.map(v => v.price));
            const comparePrice = variants.find(v => v.comparePrice)?.comparePrice || null;
            
            return {
                id: product.handle,
                shopifyId: product.id,
                title: product.title,
                description: this.cleanDescription(product.description),
                category: category,
                price: minPrice,
                comparePrice: comparePrice,
                images: images.length > 0 ? images : [],
                mainImage: images[0] || '',
                variants: variants,
                colors: Array.from(colors),
                sizes: Array.from(sizes),
                featured: product.tags.includes('featured') || Math.random() > 0.7,
                new: product.tags.includes('new') || Math.random() > 0.8,
                sale: comparePrice > minPrice,
                tags: product.tags,
                productType: product.productType
            };
        });
    }

    extractCategory(title) {
        const titleLower = title.toLowerCase();
        if (titleLower.includes('hoodie')) return 'hoodie';
        if (titleLower.includes('t-shirt') || titleLower.includes('tee')) return 't-shirt';
        if (titleLower.includes('sweatshirt')) return 'sweatshirt';
        if (titleLower.includes('joggers') || titleLower.includes('pants')) return 'joggers';
        if (titleLower.includes('windbreaker') || titleLower.includes('jacket')) return 'windbreaker';
        if (titleLower.includes('beanie') || titleLower.includes('hat')) return 'beanie';
        return 'other';
    }

    cleanDescription(description) {
        if (!description) return '';
        return description
            .replace(/<[^>]*>/g, '')
            .replace(/&[^;]+;/g, ' ')
            .trim()
            .substring(0, 200) + '...';
    }

    getLocalMockupImages(productHandle, productTitle) {
        // Map product handles to their local mockup images
        const mockupMappings = {
            'bungi-x-bobby-rabbit-hardware-unisex-hoodie': [
                // Just include a few key images for each product
                'mockups/unisex-premium-hoodie-black-front-683f9021c6f6d.png',
                'mockups/unisex-premium-hoodie-black-left-683f9021d2cb7.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-front-683f9022aad72.png',
                'mockups/unisex-premium-hoodie-maroon-front-683f90223b06f.png',
                'mockups/unisex-premium-hoodie-navy-blazer-front-683f9021dc77b.png',
                'mockups/unisex-premium-hoodie-vintage-black-front-683f9023cc9cc.png'
            ],
            'bungi-x-bobby-lightmode-rabbit-hardware-unisex-hoodie': [
                'mockups/unisex-premium-hoodie-white-front-683f8fddcb92e.png',
                'mockups/unisex-premium-hoodie-white-back-683f8fddcabb2.png'
            ],
            'bungi-x-bobby-dark-mode-wide-leg-joggers': [
                'mockups/all-over-print-unisex-wide-leg-joggers-white-back-68421e1085cf8.png',
                'mockups/all-over-print-unisex-wide-leg-joggers-white-front-68421e1085cf9.png'
            ],
            'wide-leg-joggers': [
                'mockups/all-over-print-unisex-wide-leg-joggers-white-back-68421e1085d00.png',
                'mockups/all-over-print-unisex-wide-leg-joggers-white-front-68421e1085d01.png'
            ],
            'bungi-x-bobby-lightmode-rabbit-hardware-mens-t-shirt': [
                'mockups/all-over-print-mens-crew-neck-t-shirt-white-front-683f9c9fdcac3.png',
                'mockups/all-over-print-mens-crew-neck-t-shirt-white-back-683f9c9fdd370.png'
            ],
            'bungi-x-bobby-rabbit-hardware-mens-t-shirt': [
                'mockups/all-over-print-mens-crew-neck-t-shirt-white-front-683f9c6a74d70.png'
            ],
            'bungi-x-bobby-rabbit-hardware-unisex-sweatshirt': [
                'mockups/all-over-print-recycled-unisex-sweatshirt-white-front-683f9be9c4dea.png'
            ],
            'bungi-x-bobby-rabbit-hardware-womens-t-shirt': [
                'mockups/all-over-print-womens-crew-neck-t-shirt-white-front-683f9bbadb79f.png'
            ],
            'bungi-x-bobby-rabbit-darkmode-embroidered-unisex-organic-oversized-sweatshirt': [
                'mockups/unisex-organic-oversized-sweatshirt-black-back-683f9b628540b.png',
                'mockups/unisex-organic-oversized-sweatshirt-black-front-683f9b6285f66.png'
            ],
            'bungi-x-bobby-rabbit-hardware-unisex-organic-oversized-sweatshirt': [
                'mockups/unisex-organic-oversized-sweatshirt-black-back-683f9b0bd823b.png',
                'mockups/unisex-organic-oversized-sweatshirt-black-front-683f9b0bd9027.png'
            ],
            'bungi-x-bobby-cuffed-beanie-1': [
                'mockups/cuffed-beanie-black-front-683f9a789ba58.png',
                'mockups/cuffed-beanie-white-front-683f9a789c355.png'
            ],
            'bungi-x-bobby-cowboy-unisex-windbreaker': [
                'mockups/basic-unisex-windbreaker-black-front-683f9890d7838.png'
            ],
            'bungi-x-bobby-cowboy-unisex-sweatshirt': [
                'mockups/all-over-print-recycled-unisex-sweatshirt-white-front-683f985018ab4.png'
            ],
            'bungi-x-bobby-cowboy-mens-t-shirt': [
                'mockups/all-over-print-mens-crew-neck-t-shirt-white-front-683f97ee5c7af.png'
            ]
        };

        // Check if we have mockups for this product
        if (mockupMappings[productHandle]) {
            return mockupMappings[productHandle];
        }

        // Try to find mockups based on product title keywords
        const titleLower = productTitle.toLowerCase();
        for (const [handle, images] of Object.entries(mockupMappings)) {
            if (titleLower.includes(handle.replace(/-/g, ' '))) {
                return images;
            }
        }

        return [];
    }

    // Create checkout (disabled to prevent CORS)
    async createCheckout() {
        console.log('⚠️ Direct checkout creation disabled to prevent CORS issues');
        console.log('💡 Implement checkout via Netlify functions or redirect to Shopify');
        throw new Error('Direct checkout disabled - use Netlify functions instead');
    }

    // Add items to checkout (disabled to prevent CORS)
    async addToCheckout(checkoutId, lineItemsToAdd) {
        console.log('⚠️ Direct checkout modification disabled to prevent CORS issues');
        console.log('💡 Implement checkout via Netlify functions or redirect to Shopify');
        throw new Error('Direct checkout disabled - use Netlify functions instead');
    }

    // Get product by handle
    async getProductByHandle(handle) {
        try {
            // Find product in already loaded products
            const product = this.products.find(p => p.id === handle || p.shopifyId === handle);
            if (product) {
                return product;
            }
            
            // If not found, reload all products and try again
            await this.loadProducts();
            return this.products.find(p => p.id === handle || p.shopifyId === handle) || null;
            
        } catch (error) {
            console.error('❌ Error fetching product by handle:', error);
            throw error;
        }
    }
}

// Export for use in other scripts
window.ShopifyBuySDKManager = ShopifyBuySDKManager;