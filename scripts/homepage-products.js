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
                
                // Successfully loaded filtered products from Shopify
            } else {
                // No products found
                this.products = [];
                // No products found in Shopify
            }
        } catch (error) {
            console.error('Error loading products:', error);
            this.products = [];
            // This app requires deployment to Netlify to function properly
        }
    }

    async loadShopifyProducts() {
        try {
            // Fetching products from Shopify
            const response = await fetch('/.netlify/functions/get-products');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                console.error('Shopify API Error:', data.error);
                // This app requires deployment to Netlify to function properly
                return [];
            }

            // Check if data has a products array (new API format) or is an array directly
            if (data.products && Array.isArray(data.products)) {
                // Processing products from new API format
                return data.products.map(product => this.transformShopifyProduct(product.node || product));
            } else if (Array.isArray(data)) {
                // Processing products from legacy API format
                return data.map(product => this.transformShopifyProduct(product.node || product));
            } else {
                console.error('Unexpected data format from API');
                return [];
            }
        } catch (error) {
            console.error('Error loading Shopify products:', error);
            // This app requires deployment to Netlify to function properly
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
        
        // Get the first available color for the product (for data attributes)
        const firstColor = product.colors && product.colors.length > 0 ? product.colors[0] : '';
        
        // Store all colors as a JSON string (escaped for HTML safety)
        const allColorsJson = product.colors && product.colors.length > 0
            ? JSON.stringify(product.colors).replace(/"/g, '&quot;')
            : '[]';
            
        // Determine if this is a one-size product based on category
        const isOneSize = (product.category === 'beanie' || product.category === 'hat') &&
                          !(product.category === 'hoodie' ||
                            product.category === 't-shirt' ||
                            product.category === 'sweatshirt' ||
                            product.category === 'joggers' ||
                            product.category === 'windbreaker');
        
        return `
            <div class="product-card"
                data-product-id="${product.id}"
                data-shopify-id="${product.shopifyId}"
                data-product-category="${product.category}"
                data-product-color="${firstColor}"
                data-product-colors='${allColorsJson}'
                data-product-one-size="${isOneSize}">
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
                        <!-- Quick add button removed -->
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
                
                try {
                    console.log(`Card clicked, navigating to product: ${productId}`);
                    this.viewProduct(productId);
                } catch (err) {
                    console.error('Error navigating to product page:', err);
                    // Fallback navigation in case of error
                    window.location.href = `product.html?id=${productId}`;
                }
            });
            
            // Add quick view button handler
            const quickViewBtn = card.querySelector('.quick-view-btn');
            if (quickViewBtn) {
                quickViewBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.showQuickView(productId);
                });
            }
            
            // Quick add button functionality removed
        });
    }
    
    // Quick add to cart functionality removed
    quickAddToCart(productId) {
        console.log('Quick add functionality has been removed');
        this.showNotification('Quick add functionality has been removed', 'info');
        
        // Redirect to product page instead
        this.viewProduct(productId);
    }
    
    // Show notification
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">×</button>
            </div>
        `;

        // Add styles for notification if they don't exist
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    max-width: 350px;
                    background: white;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    border-radius: 4px;
                    overflow: hidden;
                    transform: translateX(420px);
                    transition: transform 0.3s ease;
                    z-index: 9999;
                }
                .notification.show {
                    transform: translateX(0);
                }
                .notification-content {
                    display: flex;
                    align-items: center;
                    padding: 12px 15px;
                }
                .notification-success {
                    border-left: 4px solid #10B981;
                }
                .notification-error {
                    border-left: 4px solid #EF4444;
                }
                .notification-info {
                    border-left: 4px solid #3B82F6;
                }
                .notification-message {
                    flex: 1;
                    margin-right: 10px;
                }
                .notification-close {
                    background: none;
                    border: none;
                    font-size: 20px;
                    cursor: pointer;
                    color: #9CA3AF;
                }
            `;
            document.head.appendChild(style);
        }

        // Add to page
        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => notification.classList.add('show'), 10);

        // Auto hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);

        // Manual close
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });
    }

    setupScrolling() {
        const scrollContainer = document.querySelector('.product-grid-scroll');
        const leftArrow = document.getElementById('scroll-left');
        const rightArrow = document.getElementById('scroll-right');

        // Setting up scrolling with available elements

        if (!scrollContainer || !leftArrow || !rightArrow) {
            console.error('Missing scroll elements');
            return;
        }

        let currentIndex = 0;
        
        // Calculate actual card dimensions
        const firstCard = scrollContainer.querySelector('.product-card');
        if (!firstCard) {
            console.error('No product cards found');
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
        
        // Card width and scroll parameters calculated

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
            if (currentIndex > 0) {
                currentIndex--;
                updateTransform();
                updateArrows();
            }
        });

        rightArrow.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (currentIndex < maxIndex) {
                currentIndex++;
                updateTransform();
                updateArrows();
            }
        });

        // Arrow navigation setup complete

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
        try {
            console.log(`View product called for ID: ${productId}`);
            
            // Get the product with error handling
            const product = this.products.find(p => p.id === productId || p.shopifyId === productId);
            if (!product) {
                console.warn(`Product not found in local data, redirecting with ID only: ${productId}`);
                window.location.href = `product.html?id=${productId}`;
                return;
            }
            
            console.log(`Found product: ${product.title}, handle: ${product.handle}`);
            
            // Check if a specific color was selected
            let selectedColor = '';
            const productCard = document.querySelector(`.product-card[data-product-id="${productId}"]`);
            
            if (productCard && productCard.dataset.productColor) {
                // Get color from the data attribute (more reliable)
                selectedColor = productCard.dataset.productColor;
                console.log(`Using color from data attribute: ${selectedColor}`);
            } else if (product.colors && product.colors.length > 0) {
                // Fallback to first color in product data
                selectedColor = product.colors[0];
                console.log(`Using first available color: ${selectedColor}`);
            }
            
            console.log(`Selected color for navigation: ${selectedColor || 'none'}`);
            
            // Ensure we have a valid ID to navigate with
            const navigateId = product.handle || product.id || productId;
            console.log(`Navigating with ID: ${navigateId}`);
            
            // Navigate to product detail page with handle/ID and selected color
            if (selectedColor) {
                const url = `product.html?id=${navigateId}&color=${encodeURIComponent(selectedColor)}`;
                console.log(`Navigating to: ${url}`);
                window.location.href = url;
            } else {
                const url = `product.html?id=${navigateId}`;
                console.log(`Navigating to: ${url}`);
                window.location.href = url;
            }
        } catch (error) {
            console.error('Error in viewProduct:', error);
            // Fallback navigation
            window.location.href = `product.html?id=${productId}`;
        }
    }
    
    showQuickView(productId) {
        try {
            console.log(`Quick view requested for product ID: ${productId}`);
            
            // Find the product with better error handling
            const product = this.products.find(p => p.id === productId || p.shopifyId === productId);
            if (!product) {
                console.warn(`Product not found for quick view: ${productId}, falling back to product page`);
                this.viewProduct(productId);
                return;
            }
            
            console.log(`Quick view for product: ${product.title} (${product.category})`);
            
            // Get color from data attribute if available, or from product data
            const productCard = document.querySelector(`.product-card[data-product-id="${productId}"]`);
            let selectedColor = '';
            
            if (productCard && productCard.dataset.productColor) {
                // Get color from the data attribute (more reliable)
                selectedColor = productCard.dataset.productColor;
                console.log(`Using color from data attribute for quick view: ${selectedColor}`);
            } else if (product.colors && product.colors.length > 0) {
                // Fallback to first color in product data
                selectedColor = product.colors[0];
                console.log(`Using first available color for quick view: ${selectedColor}`);
            }
            
            console.log(`Selected color for quick view: ${selectedColor || 'none'}`);
            
            // Log available colors for debugging
            if (product.colors && product.colors.length > 0) {
                console.log(`Available colors: ${product.colors.join(', ')}`);
            }
            
            // Use the main product manager's showQuickView if available
            if (window.productManager && typeof window.productManager.showQuickView === 'function') {
                // Pass the product ID and color to the main product manager
                if (selectedColor) {
                    // If we have a color, explicitly pass it for better image filtering
                    console.log(`Opening quick view with color: ${selectedColor}`);
                    window.productManager.showQuickView(product.id || productId, selectedColor);
                } else {
                    console.log(`Opening quick view without color parameter`);
                    window.productManager.showQuickView(product.id || productId);
                }
            } else {
                // Product manager not available, navigating to product page instead
                console.warn('Quick view not available, redirecting to product page');
                this.viewProduct(productId);
            }
        } catch (error) {
            console.error('Error in showQuickView:', error);
            // Fallback to product page in case of error
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