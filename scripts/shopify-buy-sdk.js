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
            console.log('⚠️ This app requires deployment to Netlify to function properly');
            
            this.isLoaded = true;
            
            // Load products via Netlify function
            await this.loadProducts();
            
        } catch (error) {
            console.error('❌ Failed to initialize Shopify integration:', error);
            console.error('⚠️ This app requires deployment to Netlify to function properly');
            this.isLoaded = false;
        }
    }

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
            console.error('⚠️ This app requires deployment to Netlify to function properly');
            console.error('💡 Make sure environment variables are set in Netlify Dashboard');
            
            // Return empty array instead of throwing to prevent UI errors
            this.products = [];
            return [];
        }
    }

    convertShopifyProducts(shopifyProducts) {
        return shopifyProducts.map(product => {
            // Extract images from Shopify
            const shopifyImages = product.images?.edges?.map(edge => edge.node.url) || [];
            
            // Use only Shopify images - no fallbacks
            const images = shopifyImages.length > 0 ? [...shopifyImages] : [];
            
            // Extract variants and organize by color/size
            const variants = [];
            const colors = new Set();
            const sizes = new Set();
            
            if (product.variants && product.variants.edges) {
                product.variants.edges.forEach(edge => {
                    const variant = edge.node;
                    let color = '';
                    let size = '';
                    
                    if (variant.selectedOptions) {
                        variant.selectedOptions.forEach(option => {
                            if (option.name.toLowerCase() === 'color') {
                                color = option.value;
                                colors.add(color);
                            } else if (option.name.toLowerCase() === 'size') {
                                size = option.value;
                                sizes.add(size);
                            }
                        });
                    }
                    
                    variants.push({
                        id: variant.id,
                        color: color,
                        size: size,
                        price: parseFloat(variant.price?.amount || 0),
                        comparePrice: variant.compareAtPrice ? parseFloat(variant.compareAtPrice.amount) : null,
                        availableForSale: variant.availableForSale || false,
                        image: images[0] || ''
                    });
                });
            }
            
            // Determine category from product type or title
            const category = this.extractCategory(product.title);
            
            // Calculate pricing
            const prices = variants.map(v => v.price).filter(p => p > 0);
            const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
            const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
            const comparePrice = variants.find(v => v.comparePrice)?.comparePrice || null;
            
            return {
                id: product.node?.handle || product.handle || '',
                shopifyId: product.node?.id || product.id || '',
                title: product.node?.title || product.title || 'Untitled Product',
                description: this.cleanDescription(product.node?.description || product.description || ''),
                category: category,
                price: minPrice,
                comparePrice: comparePrice,
                images: images,
                mainImage: images[0] || '',
                variants: variants,
                colors: Array.from(colors),
                sizes: Array.from(sizes),
                featured: (product.tags || []).includes('featured'),
                new: (product.tags || []).includes('new'),
                sale: comparePrice > minPrice,
                tags: product.tags || [],
                productType: product.productType || ''
            };
        });
    }

    extractCategory(title) {
        if (!title) return 'other';
        
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

    // Create checkout via Netlify function
    async createCheckout(cart) {
        try {
            console.log('🛒 Creating checkout via Netlify function...');
            
            const response = await fetch('/.netlify/functions/create-checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ cart })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            console.log('✅ Checkout created via Netlify function');
            return data;
            
        } catch (error) {
            console.error('❌ Error creating checkout:', error);
            console.error('⚠️ This app requires deployment to Netlify to function properly');
            throw new Error('Failed to create checkout. This app requires deployment to Netlify.');
        }
    }

    // Get product by handle
    async getProductByHandle(handle) {
        try {
            if (!handle) {
                console.error('❌ Invalid product handle provided');
                return null;
            }
            
            // Find product in already loaded products
            const product = this.products.find(p => 
                p.id === handle || 
                p.shopifyId === handle
            );
            
            if (product) {
                return product;
            }
            
            // If not found, reload all products and try again
            console.log('🔄 Product not found in cache, reloading products...');
            await this.loadProducts();
            
            return this.products.find(p => 
                p.id === handle || 
                p.shopifyId === handle
            ) || null;
            
        } catch (error) {
            console.error('❌ Error fetching product by handle:', error);
            console.error('⚠️ This app requires deployment to Netlify to function properly');
            return null;
        }
    }
}

// Export for use in other scripts
window.ShopifyBuySDKManager = ShopifyBuySDKManager;