// Shopify Buy SDK Integration
// This bypasses CORS issues by using Shopify's official SDK

class ShopifyBuySDKManager {
    constructor() {
        this.client = null;
        this.products = [];
        this.isLoaded = false;
        this.init();
    }

    async init() {
        try {
            // Load Shopify Buy SDK
            await this.loadShopifySDK();
            
            // Initialize client
            this.client = ShopifyBuy.buildClient({
                domain: 'bobbytherabbit.myshopify.com',
                storefrontAccessToken: '8c6bd66766da4553701a1f1fe7d94dc4',
                apiVersion: '2024-01'
            });

            console.log('✅ Shopify Buy SDK initialized successfully');
            this.isLoaded = true;
            
            // Load products
            await this.loadProducts();
            
        } catch (error) {
            console.error('❌ Failed to initialize Shopify Buy SDK:', error);
            this.isLoaded = false;
        }
    }

    loadShopifySDK() {
        return new Promise((resolve, reject) => {
            // Check if SDK is already loaded
            if (window.ShopifyBuy) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js';
            script.onload = () => {
                console.log('📦 Shopify Buy SDK loaded');
                resolve();
            };
            script.onerror = () => {
                console.error('❌ Failed to load Shopify Buy SDK');
                reject(new Error('Failed to load Shopify Buy SDK'));
            };
            
            document.head.appendChild(script);
        });
    }

    async loadProducts() {
        if (!this.client) {
            throw new Error('Shopify client not initialized');
        }

        try {
            console.log('🛍️ Fetching products via Shopify Buy SDK...');
            
            // Fetch products using the SDK
            const products = await this.client.product.fetchAll();
            
            console.log(`✅ Loaded ${products.length} products via Shopify Buy SDK`);
            
            // Convert to our format
            this.products = this.convertShopifyProducts(products);
            
            return this.products;
            
        } catch (error) {
            console.error('❌ Error fetching products via SDK:', error);
            throw error;
        }
    }

    convertShopifyProducts(shopifyProducts) {
        return shopifyProducts.map(product => {
            // Extract images
            const images = product.images.map(img => img.src);
            
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
                    image: images[0] || 'assets/placeholder.jpg'
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
                images: images.length > 0 ? images : ['assets/placeholder.jpg'],
                mainImage: images[0] || 'assets/placeholder.jpg',
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

    // Create checkout
    async createCheckout() {
        if (!this.client) {
            throw new Error('Shopify client not initialized');
        }

        try {
            const checkout = await this.client.checkout.create();
            return checkout;
        } catch (error) {
            console.error('❌ Error creating checkout:', error);
            throw error;
        }
    }

    // Add items to checkout
    async addToCheckout(checkoutId, lineItemsToAdd) {
        if (!this.client) {
            throw new Error('Shopify client not initialized');
        }

        try {
            const checkout = await this.client.checkout.addLineItems(checkoutId, lineItemsToAdd);
            return checkout;
        } catch (error) {
            console.error('❌ Error adding to checkout:', error);
            throw error;
        }
    }

    // Get product by handle
    async getProductByHandle(handle) {
        if (!this.client) {
            throw new Error('Shopify client not initialized');
        }

        try {
            const product = await this.client.product.fetchByHandle(handle);
            return this.convertShopifyProducts([product])[0];
        } catch (error) {
            console.error('❌ Error fetching product by handle:', error);
            throw error;
        }
    }
}

// Export for use in other scripts
window.ShopifyBuySDKManager = ShopifyBuySDKManager;