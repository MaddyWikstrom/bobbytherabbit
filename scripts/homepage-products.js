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
            console.error('⚠️ This app requires deployment to Netlify to function properly');
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
                console.error('⚠️ This app requires deployment to Netlify to function properly');
                return [];
            }

            // Check if data has a products array (new API format) or is an array directly
            if (data.products && Array.isArray(data.products)) {
                console.log('Processing products from new API format');
                return data.products.map(product => this.transformShopifyProduct(product.node || product));
            } else if (Array.isArray(data)) {
                console.log('Processing products from legacy API format');
                return data.map(product => this.transformShopifyProduct(product.node || product));
            } else {
                console.error('Unexpected data format from API:', data);
                return [];
            }
        } catch (error) {
            console.error('Error loading Shopify products:', error);
            console.error('⚠️ This app requires deployment to Netlify to function properly');
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
        
        // Get images from Shopify only - no fallbacks
        const shopifyImages = product.images.edges.map(edge => edge.node.url);
        
        // No local fallbacks - use empty array if no Shopify images
        const images = shopifyImages.length > 0 ? shopifyImages : [];
        
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

    renderProducts() {
        const container = document.getElementById('homepage-products');
        if (!container) return;

        if (this.products.length === 0) {
            container.innerHTML = `
                <div class="loading-products">
                    <p>No products available</p>
                    <p class="small-text">This app requires deployment to Netlify to load products</p>
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
        // Skip products with no images
        if (!product.mainImage) {
            return '';
        }
        
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