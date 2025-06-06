// Homepage Product Loader
class HomepageProductLoader {
    constructor() {
        this.products = [];
        this.currentIndex = 0;
        this.productsPerView = 4;
        this.init();
    }

    async init() {
        await this.loadProducts();
        this.renderProducts();
        // Add a small delay to ensure DOM is fully rendered before setting up scrolling
        setTimeout(() => {
            this.setupScrolling();
        }, 100);
    }

    async loadProducts() {
        try {
            // Specific product IDs to show on homepage
            const targetProductIds = [
                '8535770792103', // show back first, then front on hover
                '8535752868007', // default behavior (front first, then back on hover)
                '8535752376487', // default behavior
                '8535752474791', // default behavior
                '8535759290535', // show front first, then back on hover
                '8535766007975'  // show back first, then front on hover
            ];

            // Product hover configurations
            this.hoverConfig = {
                '8535770792103': { showBackFirst: true },
                '8535752868007': { showBackFirst: false },
                '8535752376487': { showBackFirst: false },
                '8535752474791': { showBackFirst: false },
                '8535759290535': { showBackFirst: false },
                '8535766007975': { showBackFirst: true }
            };

            // Try to load from Shopify via Netlify function first
            const shopifyProducts = await this.loadShopifyProducts();
            if (shopifyProducts && shopifyProducts.length > 0) {
                // Filter products to only show the specific IDs
                this.products = shopifyProducts.filter(product => {
                    // Check if product ID matches any of our target IDs
                    const productId = product.shopifyId ? product.shopifyId.replace('gid://shopify/Product/', '') : null;
                    return targetProductIds.includes(productId);
                }).slice(0, 6); // Limit to 6 specific products
                
                console.log('✅ Loaded filtered products from Shopify:', this.products.length);
                console.log('Product IDs:', this.products.map(p => p.shopifyId));
            } else {
                // No products found
                this.products = [];
                console.log('⚠️ No products found in Shopify');
            }
        } catch (error) {
            console.error('Error loading products:', error);
            this.products = [];
            console.log('⚠️ No products loaded due to error');
        }
    }

    async loadShopifyProducts() {
        try {
            console.log('🔄 Fetching products from Shopify...');
            const response = await fetch('/.netlify/functions/get-products');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                console.error('Shopify API Error:', data.error);
                return [];
            }

            // Transform Shopify products to our format
            return data.map(product => this.transformShopifyProduct(product.node));
        } catch (error) {
            console.error('Error loading Shopify products:', error);
            return [];
        }
    }

    transformShopifyProduct(product) {
        const minPrice = parseFloat(product.priceRange.minVariantPrice.amount);
        const maxPrice = parseFloat(product.priceRange.maxVariantPrice.amount);
        const hasVariants = product.variants.edges.length > 0;
        const firstVariant = hasVariants ? product.variants.edges[0].node : null;
        const compareAtPrice = firstVariant?.compareAtPrice ? parseFloat(firstVariant.compareAtPrice.amount) : null;
        
        // Get product ID for hover configuration
        const productId = product.id.replace('gid://shopify/Product/', '');
        const hoverConfig = this.hoverConfig && this.hoverConfig[productId];
        
        // Get images from Shopify
        const shopifyImages = product.images.edges.map(edge => edge.node.url);
        
        // Get local mockup images as fallback
        const localImages = this.getLocalMockupImages(product.handle, product.title);
        
        // Prioritize Shopify images over local mockups
        const images = shopifyImages.length > 0 ? shopifyImages : localImages;
        
        let mainImage = images.length > 0 ? images[0] : '';
        let hoverImage = images.length > 1 ? images[1] : mainImage;
        
        // Extract color variants information from product
        const colors = [];
        if (product.variants && product.variants.edges) {
            product.variants.edges.forEach(variantEdge => {
                const variant = variantEdge.node;
                variant.selectedOptions.forEach(option => {
                    if (option.name.toLowerCase() === 'color') {
                        if (!colors.includes(option.value)) {
                            colors.push(option.value);
                        }
                    }
                });
            });
        }
        
        // Configure images based on hover settings
        if (hoverConfig && hoverConfig.showBackFirst && images.length > 1) {
            // Show back first, then front on hover
            mainImage = images[1]; // back image
            hoverImage = images[0]; // front image
        } else if (images.length > 1) {
            // Default: show front first, then back on hover
            mainImage = images[0]; // front image
            hoverImage = images[1]; // back image
        }

        return {
            id: product.handle,
            title: product.title,
            description: this.cleanDescription(product.description),
            category: this.extractCategory(product.title),
            price: minPrice,
            comparePrice: compareAtPrice && compareAtPrice > minPrice ? compareAtPrice : null,
            mainImage: mainImage,
            hoverImage: hoverImage,
            featured: product.tags.includes('featured'),
            new: product.tags.includes('new'),
            sale: compareAtPrice && compareAtPrice > minPrice,
            shopifyId: product.id,
            handle: product.handle,
            colors: colors, // Add available colors
            images: images  // Store all images
        };
    }

    cleanDescription(description) {
        if (!description) return '';
        return description
            .replace(/<[^>]*>/g, '')
            .replace(/&[^;]+;/g, ' ')
            .trim()
            .substring(0, 100) + '...';
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

    getLocalMockupImages(productHandle, productTitle) {
        // Map product handles to their local mockup images
        const mockupMappings = {
            'bungi-x-bobby-rabbit-hardware-unisex-hoodie': [
                // Black variants
                'mockups/unisex-premium-hoodie-black-front-683f9021c6f6d.png',
                'mockups/unisex-premium-hoodie-black-front-683f9021c7dbc.png',
                'mockups/unisex-premium-hoodie-black-front-683f9021c454e.png',
                'mockups/unisex-premium-hoodie-black-front-683f9021c613f.png',
                'mockups/unisex-premium-hoodie-black-front-683f9021c5335.png',
                'mockups/unisex-premium-hoodie-black-front-683f9021d1e6b.png',
                'mockups/unisex-premium-hoodie-black-front-683f9021d10cf.png',
                'mockups/unisex-premium-hoodie-black-left-683f9021d2cb7.png',
                'mockups/unisex-premium-hoodie-black-left-683f9021d48f6.png',
                'mockups/unisex-premium-hoodie-black-left-683f9021d63b0.png',
                'mockups/unisex-premium-hoodie-black-left-front-683f9021d3bb3.png',
                'mockups/unisex-premium-hoodie-black-left-front-683f9021d719b.png',
                'mockups/unisex-premium-hoodie-black-left-front-683f9021d5672.png',
                'mockups/unisex-premium-hoodie-black-product-details-683f9021d031c.png',
                'mockups/unisex-premium-hoodie-black-right-683f9021d7e69.png',
                'mockups/unisex-premium-hoodie-black-right-683f9021d9a41.png',
                'mockups/unisex-premium-hoodie-black-right-683f9021db0c8.png',
                'mockups/unisex-premium-hoodie-black-right-front-683f9021d8c96.png',
                'mockups/unisex-premium-hoodie-black-right-front-683f9021da77d.png',
                'mockups/unisex-premium-hoodie-black-right-front-683f9021db96e.png',
                // Charcoal Heather variants
                'mockups/unisex-premium-hoodie-charcoal-heather-back-683f9022d94ea.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-back-683f9022dda27.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-back-683f9022e79ce.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-back-683f9022e274e.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-back-683f9022ec2ea.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-back-683f9022f0f8b.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-back-683f90230b140.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-back-683f902306bbf.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-back-683f9023029ae.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-back-683f90231150c.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-back-683f902315348.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-front-683f9022aad72.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-front-683f9022af178.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-front-683f9022b4bc6.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-front-683f9022b9614.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-front-683f9022bf4ef.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-front-683f9022c3b59.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-front-683f9022c7f7d.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-front-683f9022cd03c.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-front-683f9022d1c31.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-front-683f9022d56a9.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-front-683f90231dc55.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-front-683f9023221a7.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-left-683f90232db97.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-left-683f902335bde.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-left-683f9023265c1.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-left-front-683f90232a100.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-left-front-683f90233a0a8.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-left-front-683f9023315c6.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-product-details-683f90231950e.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-right-683f90233dd40.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-right-683f90234d7d9.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-right-683f9023457b5.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-right-front-683f90234190a.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-right-front-683f902349507.png',
                'mockups/unisex-premium-hoodie-charcoal-heather-right-front-683f902351581.png',
                // Maroon variants
                'mockups/unisex-premium-hoodie-maroon-back-683f90225ac87.png',
                'mockups/unisex-premium-hoodie-maroon-back-683f90225eace.png',
                'mockups/unisex-premium-hoodie-maroon-back-683f90226c655.png',
                'mockups/unisex-premium-hoodie-maroon-back-683f90226f069.png',
                'mockups/unisex-premium-hoodie-maroon-back-683f90227c5b6.png',
                'mockups/unisex-premium-hoodie-maroon-back-683f902266bfa.png',
                'mockups/unisex-premium-hoodie-maroon-back-683f902278df8.png',
                'mockups/unisex-premium-hoodie-maroon-back-683f9022632e7.png',
                'mockups/unisex-premium-hoodie-maroon-back-683f9022698f9.png',
                'mockups/unisex-premium-hoodie-maroon-back-683f9022725ab.png',
                'mockups/unisex-premium-hoodie-maroon-back-683f9022757a0.png',
                'mockups/unisex-premium-hoodie-maroon-front-683f90223b06f.png',
                'mockups/unisex-premium-hoodie-maroon-front-683f90223e529.png',
                'mockups/unisex-premium-hoodie-maroon-front-683f90224aec2.png',
                'mockups/unisex-premium-hoodie-maroon-front-683f90224f7a0.png',
                'mockups/unisex-premium-hoodie-maroon-front-683f902237f8f.png',
                'mockups/unisex-premium-hoodie-maroon-front-683f902242d51.png',
                'mockups/unisex-premium-hoodie-maroon-front-683f902253f58.png',
                'mockups/unisex-premium-hoodie-maroon-front-683f902257a94.png',
                'mockups/unisex-premium-hoodie-maroon-front-683f902282a52.png',
                'mockups/unisex-premium-hoodie-maroon-front-683f902285fda.png',
                'mockups/unisex-premium-hoodie-maroon-front-683f9022352a8.png',
                'mockups/unisex-premium-hoodie-maroon-front-683f902247897.png',
                'mockups/unisex-premium-hoodie-maroon-left-683f90228e99c.png',
                'mockups/unisex-premium-hoodie-maroon-left-683f902288f36.png',
                'mockups/unisex-premium-hoodie-maroon-left-683f902293d87.png',
                'mockups/unisex-premium-hoodie-maroon-left-front-683f90228c159.png',
                'mockups/unisex-premium-hoodie-maroon-left-front-683f9022912dc.png',
                'mockups/unisex-premium-hoodie-maroon-left-front-683f902296816.png',
                'mockups/unisex-premium-hoodie-maroon-product-details-683f90227f787.png',
                'mockups/unisex-premium-hoodie-maroon-right-683f9022a4ec2.png',
                'mockups/unisex-premium-hoodie-maroon-right-683f90229f0d8.png',
                'mockups/unisex-premium-hoodie-maroon-right-683f9022996fd.png',
                'mockups/unisex-premium-hoodie-maroon-right-front-683f9022a1ecc.png',
                'mockups/unisex-premium-hoodie-maroon-right-front-683f9022a7df8.png',
                'mockups/unisex-premium-hoodie-maroon-right-front-683f90229c199.png',
                // Navy Blazer variants
                'mockups/unisex-premium-hoodie-navy-blazer-back-683f9021f12b2.png',
                'mockups/unisex-premium-hoodie-navy-blazer-back-683f9021f340b.png',
                'mockups/unisex-premium-hoodie-navy-blazer-back-683f90220a49d.png',
                'mockups/unisex-premium-hoodie-navy-blazer-back-683f90220c026.png',
                'mockups/unisex-premium-hoodie-navy-blazer-back-683f902202df1.png',
                'mockups/unisex-premium-hoodie-navy-blazer-back-683f902207edc.png',
                'mockups/unisex-premium-hoodie-navy-blazer-back-683f902211d54.png',
                'mockups/unisex-premium-hoodie-navy-blazer-back-683f9022063c4.png',
                'mockups/unisex-premium-hoodie-navy-blazer-back-683f90220129d.png',
                'mockups/unisex-premium-hoodie-navy-blazer-back-683f90221017f.png',
                'mockups/unisex-premium-hoodie-navy-blazer-back-683f902204828.png',
                'mockups/unisex-premium-hoodie-navy-blazer-front-683f9021dc77b.png',
                'mockups/unisex-premium-hoodie-navy-blazer-front-683f9021df6e7.png',
                'mockups/unisex-premium-hoodie-navy-blazer-front-683f9021e1a2a.png',
                'mockups/unisex-premium-hoodie-navy-blazer-front-683f9021e4de3.png',
                'mockups/unisex-premium-hoodie-navy-blazer-front-683f9021e67ee.png',
                'mockups/unisex-premium-hoodie-navy-blazer-front-683f9021e3452.png',
                'mockups/unisex-premium-hoodie-navy-blazer-front-683f9021e8427.png',
                'mockups/unisex-premium-hoodie-navy-blazer-front-683f9021ea7ca.png',
                'mockups/unisex-premium-hoodie-navy-blazer-front-683f9021ecb13.png',
                'mockups/unisex-premium-hoodie-navy-blazer-front-683f9021eefd9.png',
                'mockups/unisex-premium-hoodie-navy-blazer-front-683f9022165b9.png',
                'mockups/unisex-premium-hoodie-navy-blazer-front-683f9022183ba.png',
                'mockups/unisex-premium-hoodie-navy-blazer-left-683f90221aa90.png',
                'mockups/unisex-premium-hoodie-navy-blazer-left-683f90221f43e.png',
                'mockups/unisex-premium-hoodie-navy-blazer-left-683f902223cf8.png',
                'mockups/unisex-premium-hoodie-navy-blazer-left-front-683f90221cad5.png',
                'mockups/unisex-premium-hoodie-navy-blazer-left-front-683f902221fe4.png',
                'mockups/unisex-premium-hoodie-navy-blazer-left-front-683f9022262e7.png',
                'mockups/unisex-premium-hoodie-navy-blazer-product-details-683f90221408e.png',
                'mockups/unisex-premium-hoodie-navy-blazer-right-683f90222d3ed.png',
                'mockups/unisex-premium-hoodie-navy-blazer-right-683f902227e4c.png',
                'mockups/unisex-premium-hoodie-navy-blazer-right-683f90223094d.png',
                'mockups/unisex-premium-hoodie-navy-blazer-right-front-683f90222a85d.png',
                'mockups/unisex-premium-hoodie-navy-blazer-right-front-683f90222eec5.png',
                'mockups/unisex-premium-hoodie-navy-blazer-right-front-683f902233340.png',
                // Vintage Black variants
                'mockups/unisex-premium-hoodie-vintage-black-back-683f9023a579e.png',
                'mockups/unisex-premium-hoodie-vintage-black-back-683f9023ad2c6.png',
                'mockups/unisex-premium-hoodie-vintage-black-back-683f9023b96cd.png',
                'mockups/unisex-premium-hoodie-vintage-black-back-683f9023b2911.png',
                'mockups/unisex-premium-hoodie-vintage-black-back-683f9023be376.png',
                'mockups/unisex-premium-hoodie-vintage-black-back-683f9023c318e.png',
                'mockups/unisex-premium-hoodie-vintage-black-back-683f90238c9e9.png',
                'mockups/unisex-premium-hoodie-vintage-black-back-683f90239dcd9.png',
                'mockups/unisex-premium-hoodie-vintage-black-back-683f902387cc2.png',
                'mockups/unisex-premium-hoodie-vintage-black-back-683f9023918a7.png',
                'mockups/unisex-premium-hoodie-vintage-black-back-683f902396748.png',
                'mockups/unisex-premium-hoodie-vintage-black-front-683f9023cc9cc.png',
                'mockups/unisex-premium-hoodie-vintage-black-front-683f9023d2ea2.png',
                'mockups/unisex-premium-hoodie-vintage-black-front-683f90235e599.png',
                'mockups/unisex-premium-hoodie-vintage-black-front-683f90236a5e6.png',
                'mockups/unisex-premium-hoodie-vintage-black-front-683f90236fe1c.png',
                'mockups/unisex-premium-hoodie-vintage-black-front-683f90237e394.png',
                'mockups/unisex-premium-hoodie-vintage-black-front-683f902364bee.png',
                'mockups/unisex-premium-hoodie-vintage-black-front-683f902382f2a.png',
                'mockups/unisex-premium-hoodie-vintage-black-front-683f9023749ba.png',
                'mockups/unisex-premium-hoodie-vintage-black-front-683f90235506f.png',
                'mockups/unisex-premium-hoodie-vintage-black-front-683f90235970a.png',
                'mockups/unisex-premium-hoodie-vintage-black-front-683f902379677.png',
                'mockups/unisex-premium-hoodie-vintage-black-left-683f9023d85a1.png',
                'mockups/unisex-premium-hoodie-vintage-black-left-683f9023e21ce.png',
                'mockups/unisex-premium-hoodie-vintage-black-left-683f9023eb72a.png',
                'mockups/unisex-premium-hoodie-vintage-black-left-front-683f9023dd7aa.png',
                'mockups/unisex-premium-hoodie-vintage-black-left-front-683f9023e6e1a.png',
                'mockups/unisex-premium-hoodie-vintage-black-left-front-683f9023f0cab.png',
                'mockups/unisex-premium-hoodie-vintage-black-product-details-683f9023c7e67.png',
                'mockups/unisex-premium-hoodie-vintage-black-right-683f90240cd93.png',
                'mockups/unisex-premium-hoodie-vintage-black-right-683f902402ac4.png',
                'mockups/unisex-premium-hoodie-vintage-black-right-683f902418707.png',
                'mockups/unisex-premium-hoodie-vintage-black-right-front-683f90241faf5.png',
                'mockups/unisex-premium-hoodie-vintage-black-right-front-683f902407984.png',
                'mockups/unisex-premium-hoodie-vintage-black-right-front-683f902413558.png'
            ],
            'bungi-x-bobby-lightmode-rabbit-hardware-unisex-hoodie': [
                // White variants
                'mockups/unisex-premium-hoodie-white-back-683f8fddcabb2.png',
                'mockups/unisex-premium-hoodie-white-back-683f8fddd1d6d.png',
                'mockups/unisex-premium-hoodie-white-back-683f8fddd2d80.png',
                'mockups/unisex-premium-hoodie-white-back-683f8fddd3e2a.png',
                'mockups/unisex-premium-hoodie-white-back-683f8fddd4edf.png',
                'mockups/unisex-premium-hoodie-white-back-683f8fddd5fa6.png',
                'mockups/unisex-premium-hoodie-white-back-683f8fddd14c9.png',
                'mockups/unisex-premium-hoodie-white-back-683f8fddd25c8.png',
                'mockups/unisex-premium-hoodie-white-back-683f8fddd35a9.png',
                'mockups/unisex-premium-hoodie-white-back-683f8fddd4659.png',
                'mockups/unisex-premium-hoodie-white-back-683f8fddd5753.png',
                'mockups/unisex-premium-hoodie-white-front-683f8fddcb92e.png',
                'mockups/unisex-premium-hoodie-white-front-683f8fddcc3c5.png',
                'mockups/unisex-premium-hoodie-white-front-683f8fddccd72.png',
                'mockups/unisex-premium-hoodie-white-front-683f8fddcd618.png',
                'mockups/unisex-premium-hoodie-white-front-683f8fddcdeaf.png',
                'mockups/unisex-premium-hoodie-white-front-683f8fddce7bf.png',
                'mockups/unisex-premium-hoodie-white-front-683f8fddcf039.png',
                'mockups/unisex-premium-hoodie-white-front-683f8fddcf92a.png',
                'mockups/unisex-premium-hoodie-white-front-683f8fddd0bf4.png',
                'mockups/unisex-premium-hoodie-white-front-683f8fddd70e7.png',
                'mockups/unisex-premium-hoodie-white-front-683f8fddd0201.png',
                'mockups/unisex-premium-hoodie-white-front-683f8fddd7977.png',
                'mockups/unisex-premium-hoodie-white-left-683f8fddd825c.png',
                'mockups/unisex-premium-hoodie-white-left-683f8fddd9327.png',
                'mockups/unisex-premium-hoodie-white-left-683f8fddda3b7.png',
                'mockups/unisex-premium-hoodie-white-left-front-683f8fddd8b54.png',
                'mockups/unisex-premium-hoodie-white-left-front-683f8fddd9b64.png',
                'mockups/unisex-premium-hoodie-white-left-front-683f8fdddaba1.png',
                'mockups/unisex-premium-hoodie-white-product-details-683f8fddd68c9.png',
                'mockups/unisex-premium-hoodie-white-right-683f8fdddb49b.png',
                'mockups/unisex-premium-hoodie-white-right-683f8fdddc582.png',
                'mockups/unisex-premium-hoodie-white-right-683f8fdddd5dc.png',
                'mockups/unisex-premium-hoodie-white-right-front-683f8fdddbd08.png',
                'mockups/unisex-premium-hoodie-white-right-front-683f8fdddcda0.png',
                'mockups/unisex-premium-hoodie-white-right-front-683f8fdddde59.png'
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


    renderProducts() {
        const container = document.getElementById('homepage-products');
        if (!container) return;

        if (this.products.length === 0) {
            container.innerHTML = `
                <div class="loading-products">
                    <p>No products available</p>
                </div>
            `;
            return;
        }

        const productsHTML = this.products.map(product => this.createProductCard(product)).join('');
        container.innerHTML = productsHTML;

        // Add click handlers
        this.attachEventListeners();
    }

    createProductCard(product) {
        const discount = product.comparePrice ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0;
        
        return `
            <div class="product-card" data-product-id="${product.id}" data-shopify-id="${product.shopifyId}">
                <div class="product-image">
                    <img src="${product.mainImage}"
                         alt="${product.title}"
                         loading="lazy"
                         data-main-image="${product.mainImage}"
                         data-hover-image="${product.hoverImage || product.mainImage}"
                         class="product-main-img">
                    <div class="product-overlay">
                        <button class="product-action-btn quick-view-btn" title="Quick View">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </button>
                    </div>
                    ${product.new ? '<div class="product-badge new">New</div>' : ''}
                    ${product.sale ? `<div class="product-badge sale">-${discount}%</div>` : ''}
                    ${product.featured ? '<div class="product-badge featured">Featured</div>' : ''}
                </div>
                <div class="product-info">
                    <div class="product-category">${product.category.replace('-', ' ')}</div>
                    <h3 class="product-name">${product.title}</h3>
                    <div class="product-price">
                        $${product.price.toFixed(2)}
                        ${product.comparePrice ? `<span class="original-price">$${product.comparePrice.toFixed(2)}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Add hover effects with image switching and click handlers
        document.querySelectorAll('#homepage-products .product-card').forEach(card => {
            const img = card.querySelector('.product-main-img');
            const mainImage = img.dataset.mainImage;
            const hoverImage = img.dataset.hoverImage;
            const productId = card.dataset.productId;
            
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-10px)';
                if (hoverImage && hoverImage !== mainImage) {
                    img.src = hoverImage;
                }
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
                img.src = mainImage;
            });
            
            // Add click handler with proper event checking
            card.addEventListener('click', (e) => {
                // Check if the click is on a button or arrow
                if (e.target.closest('.arrow') || e.target.classList.contains('arrow') ||
                    e.target.closest('button') || e.target.tagName === 'BUTTON' ||
                    e.target.closest('svg')) {
                    e.stopPropagation(); // Stop event propagation
                    return; // Don't navigate if clicking on controls
                }
                this.viewProduct(productId);
            });
            
            // Add quick view button handler
            const quickViewBtn = card.querySelector('.quick-view-btn');
            if (quickViewBtn) {
                quickViewBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showQuickView(productId);
                });
            }
        });
    }

    setupScrolling() {
        const scrollContainer = document.querySelector('.product-grid-scroll');
        const leftArrow = document.getElementById('scroll-left');
        const rightArrow = document.getElementById('scroll-right');

        console.log('Setting up scrolling:', {
            scrollContainer: !!scrollContainer,
            leftArrow: !!leftArrow,
            rightArrow: !!rightArrow
        });

        if (!scrollContainer || !leftArrow || !rightArrow) {
            console.error('Missing scroll elements:', {
                scrollContainer: !!scrollContainer,
                leftArrow: !!leftArrow,
                rightArrow: !!rightArrow
            });
            return;
        }

        let currentIndex = 0;
        
        // Calculate actual card dimensions
        const firstCard = scrollContainer.querySelector('.product-card');
        if (!firstCard) {
            console.error('No product cards found for scroll calculation');
            return;
        }
        
        // Fixed card width based on CSS
        const gap = 32; // 2rem gap from CSS
        let cardWidth = 350 + gap; // Fixed width from CSS + gap
        let scrollAmount = cardWidth; // Default scroll amount
        
        // Adjust for mobile
        if (window.innerWidth <= 768) {
            cardWidth = 300 + gap;
            scrollAmount = cardWidth;
        } else if (window.innerWidth <= 480) {
            cardWidth = 280 + 16; // smaller gap on mobile
            scrollAmount = cardWidth;
        }
        
        // Get container width
        const containerWidth = scrollContainer.parentElement.clientWidth || 900;
        
        // Calculate how many cards can be visible at once
        const visibleCards = Math.max(1, Math.floor(containerWidth / cardWidth));
        
        // For desktop, scroll by fewer cards to show partial cards
        if (window.innerWidth > 768 && visibleCards > 1) {
            // Scroll by visibleCards - 1 to always show a partial card
            scrollAmount = cardWidth * Math.max(1, visibleCards - 1);
        }
        
        // Calculate maximum scroll position based on actual content width
        const totalWidth = this.products.length * cardWidth;
        const maxScroll = Math.max(0, totalWidth - containerWidth);
        const maxIndex = Math.max(0, Math.ceil(maxScroll / scrollAmount));
        
        console.log('Card width calculation:', {
            cardWidth,
            scrollAmount,
            containerWidth,
            visibleCards,
            totalProducts: this.products.length,
            maxIndex,
            maxScroll
        });

        console.log('Scroll setup:', {
            totalProducts: this.products.length,
            cardWidth,
            scrollAmount,
            containerWidth,
            visibleCards,
            maxIndex
        });

        const updateTransform = () => {
            const translateX = Math.min(0, Math.max(-maxScroll, -currentIndex * scrollAmount));
            scrollContainer.style.transform = `translateX(${translateX}px)`;
            scrollContainer.style.transition = 'transform 0.5s ease';
        };

        const updateArrows = () => {
            leftArrow.disabled = currentIndex <= 0;
            rightArrow.disabled = currentIndex >= maxIndex;
            
            // Add visual feedback for disabled arrows
            leftArrow.style.opacity = currentIndex <= 0 ? '0.5' : '1';
            rightArrow.style.opacity = currentIndex >= maxIndex ? '0.5' : '1';
        };

        leftArrow.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Left arrow clicked! Current index:', currentIndex, 'Max index:', maxIndex);
            if (currentIndex > 0) {
                currentIndex--;
                updateTransform();
                updateArrows();
                console.log('Scrolled left to index:', currentIndex);
            } else {
                console.log('Cannot scroll left - already at beginning');
            }
        });

        rightArrow.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Right arrow clicked! Current index:', currentIndex, 'Max index:', maxIndex);
            if (currentIndex < maxIndex) {
                currentIndex++;
                updateTransform();
                updateArrows();
                console.log('Scrolled right to index:', currentIndex);
            } else {
                console.log('Cannot scroll right - already at end');
            }
        });

        // Add debugging for arrow visibility and styling
        console.log('Arrow setup complete:', {
            leftArrowVisible: window.getComputedStyle(leftArrow).display !== 'none',
            rightArrowVisible: window.getComputedStyle(rightArrow).display !== 'none',
            leftArrowOpacity: window.getComputedStyle(leftArrow).opacity,
            rightArrowOpacity: window.getComputedStyle(rightArrow).opacity,
            leftArrowPointerEvents: window.getComputedStyle(leftArrow).pointerEvents,
            rightArrowPointerEvents: window.getComputedStyle(rightArrow).pointerEvents
        });

        // Touch/swipe support for mobile
        let startX = 0;
        let startIndex = 0;

        scrollContainer.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startIndex = currentIndex;
            scrollContainer.style.transition = 'none';
        });

        scrollContainer.addEventListener('touchmove', (e) => {
            if (!startX) return;
            
            const currentX = e.touches[0].clientX;
            const diff = startX - currentX;
            const translateX = -startIndex * scrollAmount - diff;
            
            // Prevent scrolling beyond bounds
            const minTranslate = -maxScroll;
            const maxTranslate = 0;
            const clampedTranslate = Math.max(minTranslate, Math.min(maxTranslate, translateX));
            
            scrollContainer.style.transform = `translateX(${clampedTranslate}px)`;
        });

        scrollContainer.addEventListener('touchend', (e) => {
            if (!startX) return;
            
            const endX = e.changedTouches[0].clientX;
            const diff = startX - endX;
            const threshold = 100;
            
            if (Math.abs(diff) > threshold) {
                if (diff > 0 && currentIndex < maxIndex) {
                    currentIndex++;
                } else if (diff < 0 && currentIndex > 0) {
                    currentIndex--;
                }
            }
            
            updateTransform();
            updateArrows();
            startX = 0;
        });

        // Handle window resize to recalculate scroll limits
        window.addEventListener('resize', () => {
            // Recalculate card width based on new window size
            let newCardWidth = 350 + 32; // Fixed width from CSS + gap
            let newScrollAmount = newCardWidth;
            
            if (window.innerWidth <= 768) {
                newCardWidth = 300 + 32;
                newScrollAmount = newCardWidth;
            } else if (window.innerWidth <= 480) {
                newCardWidth = 280 + 16;
                newScrollAmount = newCardWidth;
            }
            
            const newContainerWidth = scrollContainer.parentElement.clientWidth;
            const newVisibleCards = Math.floor(newContainerWidth / newCardWidth);
            
            // For desktop, scroll by fewer cards to show partial cards
            if (window.innerWidth > 768 && newVisibleCards > 1) {
                newScrollAmount = newCardWidth * Math.max(1, newVisibleCards - 1);
            }
            
            // Recalculate maximum scroll
            const newTotalWidth = this.products.length * newCardWidth;
            const newMaxScroll = Math.max(0, newTotalWidth - newContainerWidth);
            const newMaxIndex = Math.max(0, Math.ceil(newMaxScroll / newScrollAmount));
            
            // Update values for transform calculations
            cardWidth = newCardWidth;
            scrollAmount = newScrollAmount;
            maxScroll = newMaxScroll;
            maxIndex = newMaxIndex;
            
            // Adjust current index if it's now beyond the new limit
            if (currentIndex > newMaxIndex) {
                currentIndex = newMaxIndex;
                updateTransform();
            }
            updateArrows();
        });

        // Initial state
        updateArrows();
    }

    viewProduct(productId) {
        // Get the product
        const product = this.products.find(p => p.id === productId || p.shopifyId === productId);
        if (!product) {
            window.location.href = `product.html?id=${productId}`;
            return;
        }
        
        // Check if a specific color was selected
        let selectedColor = '';
        const productCard = document.querySelector(`.product-card[data-product-id="${productId}"]`);
        
        if (productCard) {
            // If we had color selectors in homepage products, we would get the selected color here
            // For now, just use the product's first available color if present
            if (product.colors && product.colors.length > 0) {
                selectedColor = product.colors[0];
            }
        }
        
        // Navigate to product detail page with the handle or Shopify ID and selected color
        if (selectedColor) {
            window.location.href = `product.html?id=${product.handle || productId}&color=${encodeURIComponent(selectedColor)}`;
        } else {
            window.location.href = `product.html?id=${product.handle || productId}`;
        }
    }
    
    showQuickView(productId) {
        // Find the product
        const product = this.products.find(p => p.id === productId || p.shopifyId === productId);
        if (!product) return;
        
        // Use the main product manager's showQuickView if available
        if (window.productManager && typeof window.productManager.showQuickView === 'function') {
            // Pass the product ID to the main product manager
            window.productManager.showQuickView(product.id || productId);
            console.log('Opening quick view for product:', product.title);
        } else {
            console.warn('Product manager not available for quick view, navigating to product page instead');
            this.viewProduct(productId);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if we're on the homepage and the main site is visible
    if (document.getElementById('homepage-products')) {
        window.homepageProductLoader = new HomepageProductLoader();
    }
});