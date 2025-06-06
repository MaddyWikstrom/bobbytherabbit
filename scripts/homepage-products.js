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
        
        // Get product ID for hover configuration
        const productId = product.id.replace('gid://shopify/Product/', '');
        const hoverConfig = this.hoverConfig && this.hoverConfig[productId];
        
        // Get all images
        const images = product.images.edges.map(edge => edge.node.url);
        let mainImage = images.length > 0 ? images[0] : 'assets/placeholder-product.png';
        let hoverImage = images.length > 1 ? images[1] : mainImage;
        
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
        // Sample products representing the specific IDs you requested
        // Since we can't access Shopify API in file:// protocol, these represent your target products
        return [
            {
                id: '8535770792103',
                title: 'BUNGI X BOBBY RABBIT HARDWARE Hoodie - Vintage Black',
                description: 'Premium streetwear hoodie with unique rabbit hardware design featuring Bobby the Tech Animal.',
                category: 'hoodie',
                price: 50.00,
                comparePrice: 65.00,
                // Show back first, then front on hover (as requested)
                mainImage: 'mockups/unisex-premium-hoodie-vintage-black-back-683f90238c9e9.png',
                hoverImage: 'mockups/unisex-premium-hoodie-vintage-black-front-683f90235e599.png',
                featured: true,
                new: true,
                sale: true,
                shopifyId: 'gid://shopify/Product/8535770792103'
            },
            {
                id: '8535752868007',
                title: 'BUNGI X BOBBY Tech Animal Hoodie - White',
                description: 'Premium tech-inspired hoodie featuring Bobby the Tech Animal branding.',
                category: 'hoodie',
                price: 55.00,
                comparePrice: null,
                // Default behavior: front first, then back on hover
                mainImage: 'mockups/unisex-premium-hoodie-white-front-683f8fddcb92e.png',
                hoverImage: 'mockups/unisex-premium-hoodie-white-back-683f8fddd1d6d.png',
                featured: true,
                new: false,
                sale: false,
                shopifyId: 'gid://shopify/Product/8535752868007'
            },
            {
                id: '8535752376487',
                title: 'BUNGI X BOBBY Tech Animal Hoodie - Charcoal Heather',
                description: 'Classic streetwear hoodie with cyberpunk Bobby design.',
                category: 'hoodie',
                price: 52.00,
                comparePrice: 60.00,
                // Default behavior: front first, then back on hover
                mainImage: 'mockups/unisex-premium-hoodie-charcoal-heather-front-683f90232a100.png',
                hoverImage: 'mockups/unisex-premium-hoodie-charcoal-heather-back-683f90232db97.png',
                featured: true,
                new: false,
                sale: true,
                shopifyId: 'gid://shopify/Product/8535752376487'
            },
            {
                id: '8535752474791',
                title: 'BUNGI X BOBBY Tech Animal Hoodie - Navy Blazer',
                description: 'Cozy tech-inspired hoodie with premium Bobby branding.',
                category: 'hoodie',
                price: 55.00,
                comparePrice: null,
                // Default behavior: front first, then back on hover
                mainImage: 'mockups/unisex-premium-hoodie-navy-blazer-front-683f9021dc77b.png',
                hoverImage: 'mockups/unisex-premium-hoodie-navy-blazer-back-683f9021f12b2.png',
                featured: true,
                new: true,
                sale: false,
                shopifyId: 'gid://shopify/Product/8535752474791'
            },
            {
                id: '8535759290535',
                title: 'BUNGI X BOBBY Tech Animal Hoodie - Maroon',
                description: 'High-tech hoodie with reflective Bobby elements.',
                category: 'hoodie',
                price: 58.00,
                comparePrice: 65.00,
                // Front first, then back on hover (as requested)
                mainImage: 'mockups/unisex-premium-hoodie-maroon-front-683f90223b06f.png',
                hoverImage: 'mockups/unisex-premium-hoodie-maroon-back-683f90225eace.png',
                featured: true,
                new: true,
                sale: true,
                shopifyId: 'gid://shopify/Product/8535759290535'
            },
            {
                id: '8535766007975',
                title: 'BUNGI X BOBBY Tech Animal Hoodie - Black',
                description: 'Premium black hoodie with tech animal styling.',
                category: 'hoodie',
                price: 50.00,
                comparePrice: null,
                // Show back first, then front on hover (as requested)
                mainImage: 'mockups/unisex-premium-hoodie-black-back-683f9021c6f6d.png',
                hoverImage: 'mockups/unisex-premium-hoodie-black-front-683f9021c6f6d.png',
                featured: true,
                new: false,
                sale: false,
                shopifyId: 'gid://shopify/Product/8535766007975'
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
            <div class="product-card" data-product-id="${product.id}">
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
                // Check if the click is on an arrow button
                if (e.target.closest('.arrow') || e.target.classList.contains('arrow')) {
                    return; // Don't navigate if clicking on arrow
                }
                this.viewProduct(productId);
            });
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
        
        const cardStyle = window.getComputedStyle(firstCard);
        const marginRight = parseInt(cardStyle.marginRight) || 0;
        const marginLeft = parseInt(cardStyle.marginLeft) || 0;
        let cardWidth = firstCard.offsetWidth + marginRight + marginLeft;
        
        // Fallback if card width is 0 or invalid
        if (cardWidth <= 0) {
            console.warn('Card width is 0, using fallback calculation');
            // Use a fallback based on CSS or default values
            cardWidth = 550 + 32; // min-width from CSS + gap
        }
        
        // Get container width
        const containerWidth = scrollContainer.parentElement.clientWidth || 900;
        
        // Calculate how many cards can be visible at once
        const visibleCards = Math.max(1, Math.floor(containerWidth / cardWidth));
        
        // Calculate maximum scroll index - only scroll if we have more products than visible
        const maxIndex = Math.max(0, this.products.length - visibleCards);
        
        // Validate calculations
        if (isNaN(cardWidth) || cardWidth <= 0) {
            console.error('Invalid card width calculation:', cardWidth, 'using fallback');
            cardWidth = 582; // fallback value
        }
        
        if (isNaN(maxIndex)) {
            console.error('Invalid maxIndex calculation:', maxIndex);
            return;
        }

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