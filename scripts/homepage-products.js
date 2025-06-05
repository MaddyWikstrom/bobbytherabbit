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
        this.setupScrolling();
    }

    async loadProducts() {
        try {
            // Try to load from Shopify via Netlify function first
            const shopifyProducts = await this.loadShopifyProducts();
            if (shopifyProducts && shopifyProducts.length > 0) {
                this.products = shopifyProducts.slice(0, 12); // Limit to 12 products for homepage
                console.log('✅ Loaded products from Shopify:', this.products.length);
            } else {
                // Fallback to sample products
                this.products = this.getSampleProducts();
                console.log('⚠️ Using sample products as fallback');
            }
        } catch (error) {
            console.error('Error loading products:', error);
            this.products = this.getSampleProducts();
            console.log('⚠️ Using sample products due to error');
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
        const mainImage = product.images.edges.length > 0 ? product.images.edges[0].node.url : 'assets/placeholder-product.png';

        return {
            id: product.handle,
            title: product.title,
            description: this.cleanDescription(product.description),
            category: this.extractCategory(product.title),
            price: minPrice,
            comparePrice: compareAtPrice && compareAtPrice > minPrice ? compareAtPrice : null,
            mainImage: mainImage,
            featured: product.tags.includes('featured') || Math.random() > 0.7,
            new: product.tags.includes('new') || Math.random() > 0.8,
            sale: compareAtPrice && compareAtPrice > minPrice,
            shopifyId: product.id,
            handle: product.handle
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

    getSampleProducts() {
        return [
            {
                id: 'bungi-hoodie-black',
                title: 'BUNGI X BOBBY RABBIT HARDWARE Hoodie - Vintage Black',
                description: 'Premium streetwear hoodie with unique rabbit hardware design featuring Bobby the Tech Animal.',
                category: 'hoodie',
                price: 50.00,
                comparePrice: 65.00,
                mainImage: 'mockups/unisex-premium-hoodie-vintage-black-front-683f90235e599.png',
                featured: true,
                new: true,
                sale: true
            },
            {
                id: 'bungi-hoodie-navy',
                title: 'BUNGI X BOBBY RABBIT HARDWARE Hoodie - Navy Blazer',
                description: 'Premium streetwear hoodie with unique rabbit hardware design featuring Bobby the Tech Animal.',
                category: 'hoodie',
                price: 50.00,
                comparePrice: null,
                mainImage: 'mockups/unisex-premium-hoodie-navy-blazer-front-683f9021dc77b.png',
                featured: true,
                new: false,
                sale: false
            },
            {
                id: 'bungi-hoodie-maroon',
                title: 'BUNGI X BOBBY RABBIT HARDWARE Hoodie - Maroon',
                description: 'Premium streetwear hoodie with unique rabbit hardware design featuring Bobby the Tech Animal.',
                category: 'hoodie',
                price: 50.00,
                comparePrice: null,
                mainImage: 'mockups/unisex-premium-hoodie-maroon-front-683f90223b06f.png',
                featured: false,
                new: true,
                sale: false
            },
            {
                id: 'bungi-hoodie-charcoal',
                title: 'BUNGI X BOBBY RABBIT HARDWARE Hoodie - Charcoal Heather',
                description: 'Premium streetwear hoodie with unique rabbit hardware design featuring Bobby the Tech Animal.',
                category: 'hoodie',
                price: 50.00,
                comparePrice: 58.00,
                mainImage: 'mockups/unisex-premium-hoodie-charcoal-heather-right-front-683f90234190a.png',
                featured: false,
                new: false,
                sale: true
            },
            {
                id: 'bungi-hoodie-white',
                title: 'BUNGI X BOBBY RABBIT HARDWARE Hoodie - White',
                description: 'Premium streetwear hoodie with unique rabbit hardware design featuring Bobby the Tech Animal.',
                category: 'hoodie',
                price: 50.00,
                comparePrice: null,
                mainImage: 'mockups/unisex-premium-hoodie-white-front-683f8fddcb92e.png',
                featured: true,
                new: false,
                sale: false
            },
            {
                id: 'bungi-hoodie-navy-back',
                title: 'BUNGI X BOBBY RABBIT HARDWARE Hoodie - Navy (Back Design)',
                description: 'Premium streetwear hoodie with unique rabbit hardware design featuring Bobby the Tech Animal.',
                category: 'hoodie',
                price: 50.00,
                comparePrice: null,
                mainImage: 'mockups/unisex-premium-hoodie-navy-blazer-back-683f9021f12b2.png',
                featured: false,
                new: true,
                sale: false
            }
        ];
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
            <div class="product-card" data-product-id="${product.id}" onclick="homepageProductLoader.viewProduct('${product.id}')">
                <div class="product-image">
                    <img src="${product.mainImage}" alt="${product.title}" loading="lazy">
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
        // Add hover effects
        document.querySelectorAll('#homepage-products .product-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-10px)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });
        });
    }

    setupScrolling() {
        const scrollContainer = document.querySelector('.product-grid-scroll');
        const leftArrow = document.getElementById('scroll-left');
        const rightArrow = document.getElementById('scroll-right');

        if (!scrollContainer || !leftArrow || !rightArrow) return;

        const scrollAmount = 320; // Width of one card plus gap

        leftArrow.addEventListener('click', () => {
            scrollContainer.scrollBy({
                left: -scrollAmount,
                behavior: 'smooth'
            });
        });

        rightArrow.addEventListener('click', () => {
            scrollContainer.scrollBy({
                left: scrollAmount,
                behavior: 'smooth'
            });
        });

        // Update arrow states based on scroll position
        const updateArrows = () => {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
            leftArrow.disabled = scrollLeft <= 0;
            rightArrow.disabled = scrollLeft >= scrollWidth - clientWidth - 10;
        };

        scrollContainer.addEventListener('scroll', updateArrows);
        updateArrows(); // Initial state

        // Touch/swipe support for mobile
        let startX = 0;
        let scrollStart = 0;

        scrollContainer.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            scrollStart = scrollContainer.scrollLeft;
        });

        scrollContainer.addEventListener('touchmove', (e) => {
            if (!startX) return;
            
            const currentX = e.touches[0].clientX;
            const diff = startX - currentX;
            scrollContainer.scrollLeft = scrollStart + diff;
        });

        scrollContainer.addEventListener('touchend', () => {
            startX = 0;
            scrollStart = 0;
        });
    }

    viewProduct(productId) {
        // Navigate to product detail page
        window.location.href = `product.html?id=${productId}`;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if we're on the homepage and the main site is visible
    if (document.getElementById('homepage-products')) {
        window.homepageProductLoader = new HomepageProductLoader();
    }
});