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