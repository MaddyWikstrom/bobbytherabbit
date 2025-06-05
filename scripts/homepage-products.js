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
                hoverImage: 'mockups/unisex-premium-hoodie-vintage-black-back-683f90236b8c4.png',
                featured: true,
                new: true,
                sale: true
            },
            {
                id: 'bungi-hat-black',
                title: 'BUNGI X BOBBY Tech Animal Beanie - Black',
                description: 'Premium tech-inspired beanie featuring Bobby the Tech Animal branding.',
                category: 'hat',
                price: 25.00,
                comparePrice: null,
                mainImage: 'mockups/unisex-premium-hoodie-black-front-683f9021c6f6d.png',
                hoverImage: 'mockups/unisex-premium-hoodie-black-left-683f9021d2cb7.png',
                featured: true,
                new: false,
                sale: false
            },
            {
                id: 'bungi-tshirt-white',
                title: 'BUNGI X BOBBY Tech Animal T-Shirt - White',
                description: 'Classic streetwear t-shirt with cyberpunk Bobby design.',
                category: 't-shirt',
                price: 30.00,
                comparePrice: 35.00,
                mainImage: 'mockups/unisex-premium-hoodie-white-front-683f8fddcb92e.png',
                hoverImage: 'mockups/unisex-premium-hoodie-white-back-683f8fddd1d6d.png',
                featured: true,
                new: false,
                sale: true
            },
            {
                id: 'bungi-sweater-gray',
                title: 'BUNGI X BOBBY Tech Sweater - Heather Gray',
                description: 'Cozy tech-inspired sweater with premium Bobby branding.',
                category: 'sweater',
                price: 55.00,
                comparePrice: null,
                mainImage: 'mockups/unisex-premium-hoodie-charcoal-heather-front-683f9022aad72.png',
                hoverImage: 'mockups/unisex-premium-hoodie-charcoal-heather-back-683f9022d94ea.png',
                featured: true,
                new: true,
                sale: false
            },
            {
                id: 'bungi-windbreaker-black',
                title: 'BUNGI X BOBBY Tech Windbreaker - Black',
                description: 'High-tech windbreaker with reflective Bobby elements.',
                category: 'windbreaker',
                price: 75.00,
                comparePrice: 85.00,
                mainImage: 'mockups/unisex-premium-hoodie-navy-blazer-front-683f9021dc77b.png',
                hoverImage: 'mockups/unisex-premium-hoodie-navy-blazer-back-683f9021f12b2.png',
                featured: true,
                new: true,
                sale: true
            },
            {
                id: 'bungi-sweatpants-white',
                title: 'BUNGI X BOBBY Tech Sweatpants - White',
                description: 'Premium white sweatpants with tech animal styling.',
                category: 'sweatpants',
                price: 45.00,
                comparePrice: null,
                mainImage: 'mockups/unisex-premium-hoodie-maroon-front-683f90223b06f.png',
                hoverImage: 'mockups/unisex-premium-hoodie-maroon-back-683f90225ac87.png',
                featured: true,
                new: false,
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
                    <img src="${product.mainImage}"
                         alt="${product.title}"
                         loading="lazy"
                         data-main-image="${product.mainImage}"
                         data-hover-image="${product.hoverImage || product.mainImage}"
                         class="product-main-img">
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
        // Add hover effects with image switching
        document.querySelectorAll('#homepage-products .product-card').forEach(card => {
            const img = card.querySelector('.product-main-img');
            const mainImage = img.dataset.mainImage;
            const hoverImage = img.dataset.hoverImage;
            
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
        });
    }

    setupScrolling() {
        const scrollContainer = document.querySelector('.product-grid-scroll');
        const leftArrow = document.getElementById('scroll-left');
        const rightArrow = document.getElementById('scroll-right');

        if (!scrollContainer || !leftArrow || !rightArrow) return;

        let currentIndex = 0;
        
        // Calculate actual card dimensions
        const firstCard = scrollContainer.querySelector('.product-card');
        if (!firstCard) return;
        
        const cardStyle = window.getComputedStyle(firstCard);
        const cardWidth = firstCard.offsetWidth + parseInt(cardStyle.marginRight) + parseInt(cardStyle.marginLeft);
        
        // Get container width
        const containerWidth = scrollContainer.parentElement.clientWidth;
        
        // Calculate how many cards can be visible at once
        const visibleCards = Math.floor(containerWidth / cardWidth);
        
        // Calculate maximum scroll index - only scroll if we have more products than visible
        const maxIndex = Math.max(0, this.products.length - visibleCards);

        console.log('Scroll setup:', {
            totalProducts: this.products.length,
            cardWidth,
            containerWidth,
            visibleCards,
            maxIndex
        });

        const updateTransform = () => {
            const translateX = -currentIndex * cardWidth;
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

        leftArrow.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                updateTransform();
                updateArrows();
                console.log('Scrolled left to index:', currentIndex);
            }
        });

        rightArrow.addEventListener('click', () => {
            if (currentIndex < maxIndex) {
                currentIndex++;
                updateTransform();
                updateArrows();
                console.log('Scrolled right to index:', currentIndex);
            }
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
            const translateX = -startIndex * cardWidth - diff;
            
            // Prevent scrolling beyond bounds
            const minTranslate = -maxIndex * cardWidth;
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
            const newContainerWidth = scrollContainer.parentElement.clientWidth;
            const newVisibleCards = Math.floor(newContainerWidth / cardWidth);
            const newMaxIndex = Math.max(0, this.products.length - newVisibleCards);
            
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