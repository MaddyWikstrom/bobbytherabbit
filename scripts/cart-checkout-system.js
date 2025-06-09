/**
 * Comprehensive Cart and Checkout System for Bobby Streetwear
 * This script completely rebuilds the cart and checkout functionality
 * with proper image handling and Shopify integration
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize our cart system
    BobbyCarts.init();
    
    // Load cart animations CSS
    if (!document.querySelector('link[href*="add-to-cart-animations.css"]')) {
        const cartAnimationsLink = document.createElement('link');
        cartAnimationsLink.rel = 'stylesheet';
        cartAnimationsLink.href = '/styles/add-to-cart-animations.css';
        document.head.appendChild(cartAnimationsLink);
    }
});

// Main Cart System Namespace
const BobbyCarts = {
    // Configuration
    config: {
        cartStorageKey: 'bobby-streetwear-cart',
        cartVersion: '2.0',
        assetsBasePath: '/assets/',
        shopifyDomain: 'mfdkk3-7g.myshopify.com',
        checkoutEndpoint: '/.netlify/functions/create-checkout-fixed',
        debug: true
    },
    
    // Cart state
    state: {
        items: [],
        isOpen: false,
        isLoading: false,
        total: 0,
        itemCount: 0,
        lastError: null
    },
    
    // DOM elements cache
    elements: {
        cartContainer: null,
        cartItems: null,
        cartCount: null,
        cartTotal: null,
        checkoutButton: null,
        cartIcons: null
    },
    
    // Initialize the cart system
    init: function() {
        console.log('🛒 Initializing Bobby Cart System v2.0...');
        
        // Load cart from storage
        this.loadCartFromStorage();
        
        // Fix existing cart images (for already stored items)
        this.fixExistingCartImages();
        
        // Cache DOM elements
        this.cacheElements();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Update cart display
        this.updateCartDisplay();
        
        // Hijack all add to cart buttons
        this.setupAddToCartButtons();
        
        console.log('✅ Cart system initialized with', this.state.items.length, 'items');
    },
    
    // Fix existing cart images that might be broken in storage
    fixExistingCartImages: function() {
        console.log('🔄 Checking cart images for repair...');
        
        if (!this.state.items || this.state.items.length === 0) {
            console.log('ℹ️ No cart items to fix');
            return;
        }
        
        let fixedCount = 0;
        
        // Loop through all cart items
        this.state.items.forEach(item => {
            // First check if the image is a Shopify CDN URL
            if (item.image && item.image.includes('cdn.shopify.com')) {
                // Shopify URLs are generally fine, but check if they have version parameters
                if (item.image.includes('?v=')) {
                    // Strip version parameters which might cause issues
                    item.image = item.image.split('?')[0];
                    fixedCount++;
                }
            }
            // If not a Shopify URL or missing, try to fix with product mapping
            else if (window.PRODUCT_MAPPING) {
                // Look for this product in our mappings
                for (const handle in window.PRODUCT_MAPPING) {
                    const product = window.PRODUCT_MAPPING[handle];
                    
                    // Try to match by ID or title
                    if (
                        (item.productId && item.productId === handle) ||
                        (item.shopifyId && product.shopifyProductId === item.shopifyId) ||
                        (item.title && product.shopifyProductId.toLowerCase().includes(item.title.toLowerCase()))
                    ) {
                        // Found a match! Use the first variant image
                        if (product.variants && product.variants.length > 0) {
                            item.image = product.variants[0].image;
                            console.log('✅ Fixed image for', item.title, 'using product mapping');
                            fixedCount++;
                        }
                        break;
                    }
                }
            }
        });
        
        // Save fixed cart back to storage
        if (fixedCount > 0) {
            console.log(`🛠️ Fixed ${fixedCount} cart images`);
            this.saveCartToStorage();
        } else {
            console.log('✅ No cart images needed fixing');
        }
    },
    
    // Cache DOM elements for better performance
    cacheElements: function() {
        // Cart elements in modals
        this.elements.cartContainer = document.querySelector('#cart-modal, #cart-sidebar');
        this.elements.cartItems = document.querySelector('#cart-items');
        this.elements.cartTotal = document.querySelector('.total-amount, #cart-total');
        this.elements.checkoutButton = document.querySelector('.checkout-btn');
        
        // Cart count badges - explicitly look in the navigation and any other places
        const cartCounts = document.querySelectorAll('.cart-count, #cart-btn .cart-count, .nav-actions .cart-count');
        if (cartCounts.length > 0) {
            this.elements.cartCount = cartCounts;
            console.log('Found', cartCounts.length, 'cart count elements');
        } else {
            console.warn('No cart count elements found');
        }
        
        // Cache cart icons - explicitly look in the navigation
        const cartIcons = document.querySelectorAll('.cart-icon, #cart-btn .cart-icon, .nav-actions .cart-icon');
        if (cartIcons.length > 0) {
            this.elements.cartIcons = cartIcons;
            console.log('Found', cartIcons.length, 'cart icon elements');
        } else {
            console.warn('No cart icon elements found');
        }
        
        // Create elements if they don't exist
        if (!this.elements.cartContainer) {
            this.createCartElements();
        }
    },
    
    // Create cart elements if they don't exist in the DOM
    createCartElements: function() {
        console.log('Creating cart elements...');
        
        // Create cart sidebar
        const cartSidebar = document.createElement('div');
        cartSidebar.id = 'cart-sidebar';
        cartSidebar.className = 'cart-sidebar';
        cartSidebar.innerHTML = `
            <div class="cart-header">
                <h3>Your Cart</h3>
                <button class="cart-close">&times;</button>
            </div>
            <div class="cart-items-container">
                <div id="cart-items" class="cart-items"></div>
            </div>
            <div class="cart-footer">
                <div class="cart-total">
                    <span>Total:</span>
                    <span>$<span id="cart-total">0.00</span></span>
                </div>
                <button class="checkout-btn">
                    <span>Checkout</span>
                </button>
            </div>
        `;
        
        // Create cart overlay
        const cartOverlay = document.createElement('div');
        cartOverlay.id = 'cart-overlay';
        cartOverlay.className = 'cart-overlay';
        
        // Append to body
        document.body.appendChild(cartOverlay);
        document.body.appendChild(cartSidebar);
        
        // Update cached elements
        this.elements.cartContainer = cartSidebar;
        this.elements.cartItems = cartSidebar.querySelector('#cart-items');
        this.elements.cartTotal = cartSidebar.querySelector('#cart-total');
        this.elements.checkoutButton = cartSidebar.querySelector('.checkout-btn');
        
        // Add necessary styles
        this.addCartStyles();
    },
    
    // Add cart styles if needed
    addCartStyles: function() {
        // Check if styles already exist
        if (document.querySelector('#bobby-cart-styles')) return;
        
        const cartStyles = `
            .cart-sidebar {
                position: fixed;
                top: 0;
                right: 0;
                width: 380px;
                max-width: 90vw;
                height: 100vh;
                background: rgba(20, 20, 35, 0.95);
                backdrop-filter: blur(10px);
                border-left: 1px solid rgba(120, 119, 198, 0.3);
                z-index: 10000;
                display: flex;
                flex-direction: column;
                transform: translateX(100%);
                transition: transform 0.3s ease, opacity 0.3s ease, visibility 0.3s ease;
                opacity: 0;
                visibility: hidden;
                box-shadow: -5px 0 25px rgba(0, 0, 0, 0.5);
            }
            
            .cart-sidebar.active {
                transform: translateX(0);
                opacity: 1;
                visibility: visible;
            }
            
            .cart-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.5);
                z-index: 9999;
                display: none;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .cart-overlay.active {
                display: block;
                opacity: 1;
            }
            
            .cart-header {
                padding: 20px;
                border-bottom: 1px solid rgba(120, 119, 198, 0.3);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .cart-header h3 {
                margin: 0;
                color: #ffffff;
                font-size: 1.2rem;
            }
            
            .cart-close {
                background: none;
                border: none;
                color: rgba(255, 255, 255, 0.7);
                font-size: 1.5rem;
                cursor: pointer;
                transition: color 0.2s ease;
            }
            
            .cart-close:hover {
                color: #ffffff;
            }
            
            .cart-items-container {
                flex: 1;
                overflow-y: auto;
                padding: 10px 20px;
            }
            
            .cart-item {
                display: flex;
                padding: 15px;
                margin-bottom: 10px;
                border-bottom: 1px solid rgba(120, 119, 198, 0.2);
                position: relative;
                background: rgba(30, 30, 50, 0.5);
                border-radius: 8px;
                transition: all 0.3s ease;
            }
            
            .cart-item:hover {
                background: rgba(40, 40, 60, 0.7);
            }
            
            .cart-item-image-container {
                width: 70px;
                height: 70px;
                position: relative;
                margin-right: 15px;
                border-radius: 8px;
                overflow: hidden;
                border: 1px solid rgba(120, 119, 198, 0.3);
                background: rgba(20, 20, 35, 0.5);
            }
            
            .cart-item-image {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.3s ease;
            }
            
            .cart-item:hover .cart-item-image {
                transform: scale(1.05);
            }
            
            .cart-item-placeholder {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
                color: rgba(120, 119, 198, 0.7);
                font-size: 24px;
            }
            
            .cart-item-info {
                flex: 1;
            }
            
            .cart-item-title {
                font-weight: bold;
                color: #fff;
                margin-bottom: 5px;
            }
            
            .cart-item-variant {
                color: rgba(255, 255, 255, 0.5);
                font-size: 0.8rem;
                margin-bottom: 5px;
            }
            
            .cart-item-price {
                color: #a855f7;
                font-weight: bold;
                margin-top: 5px;
            }
            
            .cart-item-controls {
                display: flex;
                align-items: center;
                margin-top: 10px;
            }
            
            .quantity-btn {
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(120, 119, 198, 0.2);
                border: none;
                color: white;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .quantity-btn:hover {
                background: rgba(120, 119, 198, 0.4);
            }
            
            .quantity-display {
                margin: 0 10px;
                color: white;
                min-width: 20px;
                text-align: center;
            }
            
            .remove-item-btn {
                position: absolute;
                top: 10px;
                right: 10px;
                background: none;
                border: none;
                color: rgba(255, 255, 255, 0.5);
                cursor: pointer;
                transition: color 0.2s ease;
                font-size: 16px;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
            }
            
            .remove-item-btn:hover {
                color: #ff5555;
                background: rgba(255, 85, 85, 0.1);
            }
            
            .cart-footer {
                padding: 20px;
                border-top: 1px solid rgba(120, 119, 198, 0.3);
            }
            
            .cart-total {
                display: flex;
                justify-content: space-between;
                margin-bottom: 15px;
                color: #ffffff;
                font-weight: bold;
            }
            
            .checkout-btn {
                width: 100%;
                padding: 12px;
                background: linear-gradient(45deg, #a855f7, #3b82f6);
                border: none;
                border-radius: 8px;
                color: #ffffff;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }
            
            .checkout-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(120, 119, 198, 0.4);
            }
            
            .checkout-btn:disabled {
                background: #555;
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
            }
            
            .checkout-btn::after {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                transition: left 0.5s ease;
            }
            
            .checkout-btn:hover::after {
                left: 100%;
            }
            
            .empty-cart {
                text-align: center;
                padding: 2rem 1rem;
                color: rgba(255, 255, 255, 0.7);
            }
            
            .empty-cart-icon {
                margin-bottom: 1rem;
                opacity: 0.5;
            }
            
            .empty-cart h3 {
                color: #ffffff;
                margin-bottom: 0.5rem;
            }
            
            .empty-cart p {
                margin-bottom: 1rem;
            }
            
            .continue-shopping-btn {
                background: rgba(120, 119, 198, 0.2);
                border: 1px solid rgba(120, 119, 198, 0.4);
                color: #ffffff;
                padding: 0.5rem 1rem;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .continue-shopping-btn:hover {
                background: rgba(120, 119, 198, 0.3);
                transform: translateY(-2px);
            }
            
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(20, 20, 35, 0.9);
                border-left: 4px solid #a855f7;
                border-radius: 4px;
                padding: 15px 20px;
                color: #fff;
                z-index: 10000;
                transform: translateX(120%);
                transition: transform 0.3s ease;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                max-width: 300px;
                display: flex;
                align-items: center;
            }
            
            .notification-icon {
                margin-right: 12px;
                font-size: 18px;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(255, 255, 255, 0.2);
            }
            
            .notification-content {
                flex: 1;
                position: relative;
            }
            
            .notification.show {
                transform: translateX(0);
            }
            
            .notification.success {
                border-left-color: #10b981;
            }
            
            .notification.error {
                border-left-color: #ef4444;
            }
            
            .notification-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: #a855f7;
                width: 100%;
                animation: notification-progress 5s linear;
            }
            
            @keyframes notification-progress {
                0% { width: 100%; }
                100% { width: 0; }
            }
            
            .cart-loading {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10001;
                visibility: hidden;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .cart-loading.active {
                visibility: visible;
                opacity: 1;
            }
            
            .cart-spinner {
                width: 40px;
                height: 40px;
                border: 3px solid rgba(168, 85, 247, 0.3);
                border-top: 3px solid #a855f7;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .image-retry-btn {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(59, 130, 246, 0.7);
                color: white;
                border: none;
                border-radius: 4px;
                padding: 2px 8px;
                font-size: 10px;
                cursor: pointer;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .cart-item-image-container:hover .image-retry-btn {
                opacity: 1;
            }
            
            @media (max-width: 480px) {
                .cart-sidebar {
                    width: 100%;
                }
            }
        `;
        
        const styleEl = document.createElement('style');
        styleEl.id = 'bobby-cart-styles';
        styleEl.textContent = cartStyles;
        document.head.appendChild(styleEl);
    },
    
    // Set up event listeners
    setupEventListeners: function() {
        const self = this;
        
        // Cart toggle
        document.addEventListener('click', function(e) {
            const cartToggle = e.target.closest('#cart-btn, .cart-btn, .cart-icon, .nav-actions .cart-btn');
            if (cartToggle) {
                e.preventDefault();
                console.log('Cart toggle clicked');
                self.toggleCart();
            }
        });
        
        // Cart close
        document.addEventListener('click', function(e) {
            const cartClose = e.target.closest('.cart-close, #cart-close');
            if (cartClose) {
                e.preventDefault();
                self.closeCart();
            }
        });
        
        // Cart overlay click to close
        document.addEventListener('click', function(e) {
            const overlay = e.target.closest('#cart-overlay, .cart-overlay');
            if (overlay && overlay === e.target) {
                self.closeCart();
            }
        });
        
        // Escape key to close cart
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && self.state.isOpen) {
                self.closeCart();
            }
        });
        
        // Checkout button
        if (this.elements.checkoutButton) {
            this.elements.checkoutButton.addEventListener('click', function() {
                self.proceedToCheckout();
            });
        }
    },
    
    // Set up all add to cart buttons on the page
    setupAddToCartButtons: function() {
        const self = this;
        
        // Listen for add to cart clicks
        document.addEventListener('click', function(e) {
            const addToCartBtn = e.target.closest('.add-to-cart-btn, [data-add-to-cart], button[data-product-id]');
            
            if (addToCartBtn) {
                e.preventDefault();
                
                // Get data directly from button attributes if available (for direct cart adds)
                if (addToCartBtn.dataset.productId || addToCartBtn.dataset.product) {
                    let product;
                    
                    // First try JSON data if available
                    if (addToCartBtn.dataset.product) {
                        try {
                            product = JSON.parse(addToCartBtn.dataset.product);
                        } catch (e) {
                            console.warn('Failed to parse product data from button', e);
                        }
                    }
                    
                    // If we don't have product data yet, try the ID-based approach
                    if (!product && addToCartBtn.dataset.productId) {
                        // Simple product with minimal data
                        product = {
                            id: addToCartBtn.dataset.productId,
                            title: addToCartBtn.dataset.title || 'Product',
                            price: parseFloat(addToCartBtn.dataset.price || '0'),
                            image: addToCartBtn.dataset.image || '',
                            variants: {
                                size: addToCartBtn.dataset.size,
                                color: addToCartBtn.dataset.color
                            }
                        };
                    }
                    
                    if (product) {
                        // Add to cart
                        self.addToCart(product);
                        
                        // Visual feedback
                        self.showAddedFeedback(addToCartBtn);
                        return;
                    }
                }
                
                // Traditional approach with product container
                const productContainer = addToCartBtn.closest('.product-card, .product-item, [data-product-id]');
                
                if (productContainer) {
                    // Extract product data
                    const product = self.extractProductData(productContainer);
                    
                    // Add to cart
                    self.addToCart(product);
                    
                    // Visual feedback
                    self.showAddedFeedback(addToCartBtn);
                } else {
                    console.error('Could not find product container');
                    self.showNotification('Could not add product to cart', 'error');
                }
            }
        });
    },
    
    // Extract product data from a product container element
    extractProductData: function(container) {
        // Get product ID
        const productId = container.dataset.productId || 
                          container.id || 
                          'product_' + new Date().getTime();
        
        // Get product title
        const titleEl = container.querySelector('.product-name, .product-title, h3');
        const title = titleEl ? titleEl.textContent.trim() : 'Unnamed Product';
        
        // Get product price
        const priceEl = container.querySelector('.product-price, .price');
        const priceText = priceEl ? priceEl.textContent.trim() : '0';
        const price = this.extractPrice(priceText);
        
        // Get product image - with careful extraction to avoid broken URLs
        const image = this.extractProductImage(container);
        
        // Get any variant information
        const variantSelects = container.querySelectorAll('select');
        const variants = {};
        
        variantSelects.forEach(select => {
            const name = select.name || select.dataset.variant;
            if (name && select.value) {
                variants[name] = select.value;
            }
        });
        
        // Get Shopify product ID if available
        const shopifyId = container.dataset.shopifyProductId || 
                          container.dataset.shopifyId || 
                          null;
        
        return {
            id: productId,
            title: title,
            price: price,
            image: image,
            variants: variants,
            shopifyId: shopifyId
        };
    },
    
    // Extract a numeric price from a price string
    extractPrice: function(priceString) {
        if (typeof priceString === 'number') return priceString;
        
        // Extract digits and decimal point
        const match = priceString.match(/(\d+[.,]?\d*)/);
        if (match) {
            return parseFloat(match[0].replace(',', '.'));
        }
        
        return 0;
    },
    
    // Extract product image with careful handling
    extractProductImage: function(container) {
        // Get Shopify ID if available (for direct lookup in product data)
        const shopifyId = container.dataset.shopifyProductId || container.dataset.shopifyId;
        
        // First check if the product is in our direct product mappings from product.js
        if (shopifyId && window.PRODUCT_MAPPING) {
            for (const handle in window.PRODUCT_MAPPING) {
                const product = window.PRODUCT_MAPPING[handle];
                if (product.shopifyProductId === shopifyId && product.variants && product.variants.length > 0) {
                    return product.variants[0].image; // Return first variant image
                }
            }
        }
        
        // Try to find image element
        const imgEl = container.querySelector('img');
        
        if (imgEl && imgEl.src) {
            // For Shopify CDN images, return directly without cleaning
            if (imgEl.src.includes('cdn.shopify.com')) {
                return imgEl.src;
            }
            // Otherwise clean up URL to prevent domain issues
            return this.cleanImageUrl(imgEl.src);
        }
        
        // Try data attributes which may have direct image URLs
        if (container.dataset.productImage) {
            return container.dataset.productImage;
        }
        
        // Try main-image or hover-image data attributes (used in homepage products)
        const imgWithData = container.querySelector('img[data-main-image]');
        if (imgWithData && imgWithData.dataset.mainImage) {
            return imgWithData.dataset.mainImage;
        }
        
        // Try background image
        const elementWithBg = container.querySelector('[style*="background-image"]');
        if (elementWithBg) {
            const style = elementWithBg.getAttribute('style');
            const match = style.match(/url\(['"]?([^'"]+)['"]?\)/);
            if (match) {
                return this.cleanImageUrl(match[1]);
            }
        }
        
        // Try data attribute
        if (container.dataset.image) {
            return this.cleanImageUrl(container.dataset.image);
        }
        
        // Return empty string if no image
        return '';
    },
    
    // Clean image URL to prevent domain duplication issues
    cleanImageUrl: function(url) {
        if (!url) return '';
        
        try {
            // Preserve Shopify CDN URLs - they should work as-is
            if (url.includes('cdn.shopify.com')) {
                return url;
            }
            
            // Remove domain to get relative path
            const currentDomain = window.location.origin;
            let cleanUrl = url;
            
            // Fix domain duplication
            if (url.includes(currentDomain + '/' + currentDomain) ||
                url.includes(currentDomain + 'https://') ||
                url.includes(currentDomain + 'http://')) {
                
                // Extract the path part after all domain references
                const pathMatch = url.match(new RegExp(`${currentDomain}.*?/(assets)/`));
                if (pathMatch) {
                    const pathIndex = url.indexOf(pathMatch[1]);
                    cleanUrl = '/' + url.substring(pathIndex);
                } else {
                    // Try to extract filename as last resort
                    const parts = url.split('/');
                    const filename = parts[parts.length - 1];
                    
                    // Add to assets folder
                    cleanUrl = `${this.config.assetsBasePath}${filename}`;
                }
            }
            
            // Ensure URL is properly formed
            if (!cleanUrl.startsWith('http') && !cleanUrl.startsWith('/')) {
                cleanUrl = '/' + cleanUrl;
            }
            
            return cleanUrl;
        } catch (error) {
            console.error('Error cleaning image URL:', error);
            return '';
        }
    },
    
    // Add product to cart
    addToCart: function(product) {
        console.log('Adding to cart:', product);
        
        // Validate product
        if (!product || !product.id || !product.title) {
            console.error('Invalid product:', product);
            this.showNotification('Invalid product data', 'error');
            return false;
        }
        
        // Check for size selection - allow both variants.size and selectedSize
        if ((!product.variants || !product.variants.size) && !product.selectedSize) {
            console.error('Size not selected for product:', product);
            this.showNotification('Please select a size before adding to cart', 'error');
            return false;
        }
        
        try {
            // Generate cart item ID (unique per variant combination)
            const variantString = product.variants ? 
                Object.values(product.variants).join('-') : '';
            const itemId = `${product.id}-${variantString}`;
            
            // Check if item already in cart
            const existingItem = this.state.items.find(item => item.id === itemId);
            
            if (existingItem) {
                // Update quantity
                existingItem.quantity += 1;
                this.showNotification(`Added another ${product.title} to your cart`, 'success');
                this.showAddedFeedback(null, existingItem.title, existingItem.image, existingItem.price);
            } else {
                // Create new item
                const variantText = product.variants ?
                    Object.entries(product.variants)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(', ') : '';
                
                const newItem = {
                    id: itemId,
                    productId: product.id,
                    title: product.title,
                    price: product.price,
                    image: product.image,
                    variantText: variantText,
                    variants: product.variants || {},
                    quantity: 1,
                    shopifyId: product.shopifyId,
                    dateAdded: new Date().toISOString()
                };
                
                this.state.items.push(newItem);
                this.showNotification(`${product.title} added to your cart`, 'success');
                this.showAddedFeedback(null, product.title, product.image, product.price);
            }
            
            // Update everything
            this.saveCartToStorage();
            this.updateCartDisplay();
            this.updateCartCount();
            
            // Open cart
            setTimeout(() => {
                this.openCart();
            }, 300);
            
            return true;
        } catch (error) {
            console.error('Error adding to cart:', error);
            this.showNotification('Error adding item to cart', 'error');
            return false;
        }
    },
    
    // Remove item from cart
    removeItem: function(itemId) {
        const itemIndex = this.state.items.findIndex(item => item.id === itemId);
        
        if (itemIndex !== -1) {
            // Get item for notification
            const item = this.state.items[itemIndex];
            
            // Remove item
            this.state.items.splice(itemIndex, 1);
            
            // Update
            this.saveCartToStorage();
            this.updateCartDisplay();
            this.updateCartCount();
            
            // Notify
            this.showNotification(`Removed ${item.title} from cart`, 'info');
            
            return true;
        }
        
        return false;
    },
    
    // Update item quantity
    updateQuantity: function(itemId, quantity) {
        const item = this.state.items.find(item => item.id === itemId);
        
        if (item) {
            if (quantity <= 0) {
                // Remove item if quantity is zero or negative
                return this.removeItem(itemId);
            } else {
                // Update quantity
                item.quantity = quantity;
                
                // Update
                this.saveCartToStorage();
                this.updateCartDisplay();
                this.updateCartCount();
                
                return true;
            }
        }
        
        return false;
    },
    
    // Clear the entire cart
    clearCart: function() {
        if (this.state.items.length > 0) {
            // Clear items
            this.state.items = [];
            
            // Update
            this.saveCartToStorage();
            this.updateCartDisplay();
            this.updateCartCount();
            
            this.showNotification('Your cart has been cleared', 'info');
            
            return true;
        }
        
        return false;
    },
    
    // Toggle cart visibility
    toggleCart: function() {
        if (this.state.isOpen) {
            this.closeCart();
        } else {
            this.openCart();
        }
    },
    
    // Open the cart
    openCart: function() {
        // Find cart elements
        const cartSidebar = document.querySelector('#cart-sidebar, .cart-sidebar');
        const cartOverlay = document.querySelector('#cart-overlay, .cart-overlay');
        const cartModal = document.querySelector('#cart-modal');
        
        if (cartSidebar && cartOverlay) {
            // Show sidebar style cart
            cartSidebar.style.display = 'flex';
            cartSidebar.classList.add('active');
            
            cartOverlay.style.display = 'block';
            cartOverlay.classList.add('active');
            
            // Update state
            this.state.isOpen = true;
            
            // Prevent body scrolling
            document.body.style.overflow = 'hidden';
        } else if (cartModal) {
            // Show modal style cart
            cartModal.style.display = 'flex';
            cartModal.classList.remove('hidden');
            
            // Update state
            this.state.isOpen = true;
            
            // Prevent body scrolling
            document.body.style.overflow = 'hidden';
        } else {
            console.error('No cart elements found');
            this.showNotification('Could not open cart', 'error');
        }
    },
    
    // Close the cart
    closeCart: function() {
        // Find cart elements
        const cartSidebar = document.querySelector('#cart-sidebar, .cart-sidebar');
        const cartOverlay = document.querySelector('#cart-overlay, .cart-overlay');
        const cartModal = document.querySelector('#cart-modal');
        
        if (cartSidebar && cartOverlay) {
            // Hide sidebar style cart
            cartSidebar.classList.remove('active');
            cartOverlay.classList.remove('active');
            
            // Update state
            this.state.isOpen = false;
            
            // Restore body scrolling
            document.body.style.overflow = '';
            
            // Delay hiding to allow animation to complete
            setTimeout(() => {
                if (!this.state.isOpen) {
                    cartOverlay.style.display = 'none';
                }
            }, 300);
        } else if (cartModal) {
            // Hide modal style cart
            cartModal.classList.add('hidden');
            
            // Update state
            this.state.isOpen = false;
            
            // Restore body scrolling
            document.body.style.overflow = '';
            
            // Delay hiding to allow animation to complete
            setTimeout(() => {
                if (!this.state.isOpen) {
                    cartModal.style.display = 'none';
                }
            }, 300);
        }
    },
    
    // Update cart display with current items
    updateCartDisplay: function() {
        // Calculate totals
        this.calculateTotal();
        
        // Get cart items container
        const cartItems = this.elements.cartItems || document.querySelector('#cart-items');
        if (!cartItems) {
            console.error('Cart items container not found');
            return;
        }
        
        // Check if cart is empty
        if (this.state.items.length === 0) {
            cartItems.innerHTML = this.getEmptyCartHTML();
        } else {
            // Render all items
            const itemsHTML = this.state.items.map(item => this.getCartItemHTML(item)).join('');
            cartItems.innerHTML = itemsHTML;
        }
        
        // Update total display
        this.updateTotalDisplay();
        
        // Set up item event handlers with a longer delay
        // to ensure elements are properly in DOM
        setTimeout(() => {
            this.setupCartItemEvents();
        }, 50); // Increased from 0 to 50ms for better DOM rendering
    },
    
    // Set up event handlers for cart items
    setupCartItemEvents: function() {
        const self = this;
        
        // Quantity buttons
        document.querySelectorAll('.quantity-btn.decrease').forEach(btn => {
            const cartItemEl = btn.closest('.cart-item');
            if (!cartItemEl) {
                console.warn('Cart item element not found for decrease button');
                return;
            }
            const itemId = cartItemEl.dataset.itemId;
            const item = self.state.items.find(item => item.id === itemId);
            
            if (item) {
                // Remove existing listener to prevent duplicates
                btn.removeEventListener('click', self._decreaseQuantityHandler);
                self._decreaseQuantityHandler = () => self.updateQuantity(itemId, item.quantity - 1);
                btn.addEventListener('click', self._decreaseQuantityHandler);
            }
        });
        
        document.querySelectorAll('.quantity-btn.increase').forEach(btn => {
            const cartItemEl = btn.closest('.cart-item');
            if (!cartItemEl) {
                console.warn('Cart item element not found for increase button');
                return;
            }
            const itemId = cartItemEl.dataset.itemId;
            const item = self.state.items.find(item => item.id === itemId);
            
            if (item) {
                // Remove existing listener to prevent duplicates
                btn.removeEventListener('click', self._increaseQuantityHandler);
                self._increaseQuantityHandler = () => self.updateQuantity(itemId, item.quantity + 1);
                btn.addEventListener('click', self._increaseQuantityHandler);
            }
        });
        
        // Set up delegated event handler for remove buttons
        // This is more reliable than attaching to each button individually
        const cartItemsContainer = document.querySelector('#cart-items');
        if (cartItemsContainer) {
            // Remove any existing listeners to prevent duplicates
            if (typeof self._removeButtonDelegateHandler === 'function') {
                cartItemsContainer.removeEventListener('click', self._removeButtonDelegateHandler);
            }
            
            // Create a new delegate handler for all remove buttons
            self._removeButtonDelegateHandler = function(event) {
                const removeButton = event.target.closest('.remove-item-btn');
                if (!removeButton) return; // Not a remove button click
                
                try {
                    const cartItemEl = removeButton.closest('.cart-item');
                    if (!cartItemEl) {
                        console.warn('Cart item element not found for remove button');
                        return;
                    }
                    
                    const itemId = cartItemEl.dataset.itemId;
                    if (!itemId) {
                        console.warn('No item ID found for cart item');
                        return;
                    }
                    
                    // Remove the item
                    self.removeItem(itemId);
                } catch (error) {
                    console.error('Error removing item:', error);
                }
            };
            
            // Add the delegate handler to the container
            cartItemsContainer.addEventListener('click', self._removeButtonDelegateHandler);
            console.log('Set up cart remove button delegate handler');
        } else {
            console.log('Cart items container not found, could not set up remove button handlers');
        }
    },
    
    // Simple image error handler - no alternative sources
    handleImageError: function(imgElement) {
        // Hide the image
        if (imgElement) {
            imgElement.style.display = 'none';
            
            // Show a placeholder question mark
            const container = imgElement.closest('.cart-item-image-container');
            if (container) {
                // Create a simple placeholder
                const placeholder = document.createElement('div');
                placeholder.className = 'cart-item-placeholder';
                placeholder.innerHTML = '?';
                placeholder.style.display = 'flex';
                container.appendChild(placeholder);
            }
        }
    },
    
    // Get HTML for an empty cart
    getEmptyCartHTML: function() {
        return `
            <div class="empty-cart">
                <div class="empty-cart-icon">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                </div>
                <h3>Your cart is empty</h3>
                <p>Add some products to get started</p>
                <button class="continue-shopping-btn" onclick="BobbyCarts.closeCart()">
                    Continue Shopping
                </button>
            </div>
        `;
    },
    
    // Get HTML for a cart item
    getCartItemHTML: function(item) {
        const price = item.price * item.quantity;
        
        return `
            <div class="cart-item" data-item-id="${item.id}" data-product-id="${item.productId}" data-shopify-id="${item.shopifyId || ''}">
                <div class="cart-item-image-container">
                    <img src="${item.image}" alt="${item.title}" class="cart-item-image"
                         data-product-id="${item.productId}"
                         data-shopify-id="${item.shopifyId || ''}"
                         data-title="${item.title}"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="cart-item-placeholder" style="display:none;">?</div>
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.title}</div>
                    ${item.variantText ? `<div class="cart-item-variant">${item.variantText}</div>` : ''}
                    <div class="cart-item-price">$${price.toFixed(2)}</div>
                    <div class="cart-item-controls">
                        <button class="quantity-btn decrease">-</button>
                        <span class="quantity-display">${item.quantity}</span>
                        <button class="quantity-btn increase">+</button>
                    </div>
                </div>
                <button class="remove-item-btn" title="Remove item">&times;</button>
            </div>
        `;
    },
    
    // Calculate cart total
    calculateTotal: function() {
        this.state.total = 0;
        this.state.itemCount = 0;
        
        this.state.items.forEach(item => {
            this.state.total += item.price * item.quantity;
            this.state.itemCount += item.quantity;
        });
    },
    
    // Update total display
    updateTotalDisplay: function() {
        const cartTotal = this.elements.cartTotal || 
                          document.querySelector('.total-amount, #cart-total');
        
        if (cartTotal) {
            if (cartTotal.tagName === 'SPAN') {
                cartTotal.textContent = this.state.total.toFixed(2);
            } else {
                cartTotal.textContent = '$' + this.state.total.toFixed(2);
            }
        }
        
        // Update checkout button state
        const checkoutBtn = this.elements.checkoutButton || 
                            document.querySelector('.checkout-btn');
        
        if (checkoutBtn) {
            if (this.state.items.length === 0) {
                checkoutBtn.disabled = true;
            } else {
                checkoutBtn.disabled = false;
            }
        }
    },
    
    // Update cart count
    updateCartCount: function() {
        // Try to get cart counts again in case new elements were added after initialization
        const cartCounts = this.elements.cartCount ||
                           document.querySelectorAll('.cart-count, #cart-btn .cart-count, .nav-actions .cart-count');
        
        if (!cartCounts || (!cartCounts.length && !cartCounts.textContent)) {
            console.warn('No cart count elements found to update');
            return;
        }
        
        console.log('Updating cart count to', this.state.itemCount);
        
        if (NodeList.prototype.isPrototypeOf(cartCounts)) {
            // Handle nodelist
            cartCounts.forEach(countEl => {
                countEl.textContent = this.state.itemCount;
                
                if (this.state.itemCount > 0) {
                    countEl.style.display = 'flex';
                } else {
                    countEl.style.display = 'none';
                }
                
                // Add updated class for animation if count changed
                countEl.classList.add('updated');
                setTimeout(() => {
                    countEl.classList.remove('updated');
                }, 600);
            });
        } else {
            // Handle single element
            cartCounts.textContent = this.state.itemCount;
            
            if (this.state.itemCount > 0) {
                cartCounts.style.display = 'flex';
            } else {
                cartCounts.style.display = 'none';
            }
            
            // Add updated class for animation
            cartCounts.classList.add('updated');
            setTimeout(() => {
                cartCounts.classList.remove('updated');
            }, 600);
        }
    },
    
    // Show added to cart feedback
    showAddedFeedback: function(button, productTitle, productImage, price) {
        if (button) {
            // Add animation class instead of changing styles directly
            button.classList.add('adding');
            
            // Reset after animation completes
            setTimeout(() => {
                button.classList.remove('adding');
            }, 1200);
        }
        
        // Animate cart icon
        this.animateCartIcon();
        
        // Show notification
        this.showCartNotification(productTitle, productImage, price);
    },
    
    // Show cart notification with product details
    showCartNotification: function(productTitle, productImage, price) {
        // Get product details if not provided
        if (!productTitle || !productImage) {
            // Try to get from the most recently added item
            if (this.state.items.length > 0) {
                const latestItem = this.state.items[this.state.items.length - 1];
                productTitle = productTitle || latestItem.title;
                productImage = productImage || latestItem.image;
                price = price || latestItem.price;
            }
        }
        
        // Create or get existing notification
        let notification = document.querySelector('.cart-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'cart-notification';
            document.body.appendChild(notification);
        }
        
        // Set notification content
        notification.innerHTML = `
            <img src="${productImage || ''}" class="cart-notification-image"
                 alt="${productTitle || 'Product'}"
                 onerror="this.style.display='none';">
            <div class="cart-notification-content">
                <div class="cart-notification-title">${productTitle || 'Item'} added to cart</div>
                <div class="cart-notification-info">
                    <span class="cart-notification-variant">${this.state.itemCount} items in cart</span>
                    <span class="cart-notification-price">$${(price || 0).toFixed(2)}</span>
                </div>
                <div class="cart-notification-buttons">
                    <button class="cart-notification-btn view-cart-btn" onclick="BobbyCarts.toggleCart()">View Cart</button>
                    <button class="cart-notification-btn checkout-btn" onclick="BobbyCarts.proceedToCheckout()">Checkout</button>
                </div>
            </div>
            <button class="cart-notification-close" onclick="this.parentNode.classList.remove('show')">&times;</button>
        `;
        
        // Show notification
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Auto-hide after delay
        setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
    },
    
    // Animate the cart icon when item is added
    animateCartIcon: function() {
        // Find all cart count elements
        const cartCounts = document.querySelectorAll('.cart-count');
        if (!cartCounts.length) return;
        
        // Find cart icons
        const cartIcons = document.querySelectorAll('.cart-icon');
        
        // Add animation class to cart counts
        cartCounts.forEach(count => {
            // Remove existing animation class if present
            count.classList.remove('updated');
            
            // Trigger reflow to restart animation
            void count.offsetWidth;
            
            // Add animation class
            count.classList.add('updated');
            
            // Remove animation class after animation completes
            setTimeout(() => {
                count.classList.remove('updated');
            }, 600);
        });
        
        // Add animation to cart icons
        cartIcons.forEach(icon => {
            // Remove existing animation class if present
            icon.classList.remove('pop');
            
            // Trigger reflow to restart animation
            void icon.offsetWidth;
            
            // Add animation class
            icon.classList.add('pop');
            
            // Remove animation class after animation completes
            setTimeout(() => {
                icon.classList.remove('pop');
            }, 500);
        });
    },
    
    // Save cart to local storage
    saveCartToStorage: function() {
        try {
            const cartData = {
                version: this.config.cartVersion,
                timestamp: new Date().toISOString(),
                items: this.state.items
            };
            
            localStorage.setItem(this.config.cartStorageKey, JSON.stringify(cartData));
        } catch (error) {
            console.error('Error saving cart to storage:', error);
            this.showNotification('Error saving cart', 'error');
        }
    },
    
    // Load cart from local storage
    loadCartFromStorage: function() {
        try {
            const storedCart = localStorage.getItem(this.config.cartStorageKey);
            
            if (storedCart) {
                const cartData = JSON.parse(storedCart);
                
                // Version check to handle format changes
                if (cartData.version === this.config.cartVersion) {
                    this.state.items = cartData.items || [];
                } else {
                    // Try to convert old format to new format
                    if (Array.isArray(cartData)) {
                        this.state.items = cartData;
                    } else if (cartData.items && Array.isArray(cartData.items)) {
                        this.state.items = cartData.items;
                    } else {
                        this.state.items = [];
                    }
                }
            } else {
                this.state.items = [];
            }
            
            // Calculate totals based on loaded items
            this.calculateTotal();
        } catch (error) {
            console.error('Error loading cart from storage:', error);
            this.state.items = [];
            this.calculateTotal();
        }
    },
    
    // Show notification
    showNotification: function(message, type = 'info') {
        // Create or reuse notification element
        let notification = document.querySelector('.notification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'notification';
            document.body.appendChild(notification);
        } else {
            // Reset classes
            notification.className = 'notification';
        }
        
        // Add type-specific class
        if (type) {
            notification.classList.add(type);
        }
        
        // Set content
        notification.innerHTML = `
            <div class="notification-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</div>
            <div class="notification-content">
                ${message}
                <div class="notification-progress"></div>
            </div>
        `;
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Hide after delay
        setTimeout(() => {
            notification.classList.remove('show');
            
            // Remove after animation
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 5000);
        
        // Update cart count display immediately
        this.updateCartCount();
    },
    
    // Validate cart items before checkout
    validateCartItems: function() {
        const invalidItems = [];
        
        this.state.items.forEach(item => {
            // Check if item has required properties
            if (!item.title) {
                invalidItems.push('Item missing title');
            }
            
            // Check if item has quantity
            if (!item.quantity || item.quantity <= 0) {
                invalidItems.push(`${item.title || 'Item'} has invalid quantity`);
            }
            
            // Check if item has price
            if (!item.price || isNaN(item.price) || item.price <= 0) {
                invalidItems.push(`${item.title || 'Item'} has invalid price`);
            }
            
            // Check if item has valid image
            if (!item.image) {
                console.warn(`Item ${item.title} missing image`);
                // No fallback image
            }
            
            // Check if Shopify variant ID is present
            if (!item.shopifyId) {
                console.warn(`Item ${item.title} missing Shopify variant ID`);
                // Not adding to invalidItems as this might be handled later
            }
        });
        
        return invalidItems;
    },
    
    // Proceed to checkout
    proceedToCheckout: function() {
        if (this.state.items.length === 0) {
            this.showNotification('Your cart is empty', 'error');
            return;
        }
        
        // Validate cart items before proceeding
        const invalidItems = this.validateCartItems();
        if (invalidItems.length > 0) {
            this.showNotification(`Please check your cart: ${invalidItems.join(', ')}`, 'error');
            return;
        }
        
        // Show loading state
        this.setCheckoutLoading(true);
        this.showNotification('Preparing your checkout...', 'info');
        
        // Prepare items for checkout
        const checkoutItems = this.prepareCheckoutItems();
        
        if (this.config.debug) {
            console.log('Checkout items prepared:', checkoutItems);
        }
        
        // Call checkout endpoint
        fetch(this.config.checkoutEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                items: checkoutItems
            })
        })
        .then(response => {
            if (this.config.debug) {
                console.log('Checkout response status:', response.status);
            }
            
            // Log the response status for debugging
            console.log('Checkout response status:', response.status);
            
            if (!response.ok) {
                return response.json().then(err => {
                    console.error('Checkout error details:', err);
                    // Extract more detailed error information if available
                    const errorMessage = err.error || 'Error creating checkout';
                    const errorDetails = err.details || err.message || '';
                    
                    // Log full error object for debugging
                    console.error('Full error object:', JSON.stringify(err, null, 2));
                    
                    // Throw a more informative error
                    throw new Error(`${errorMessage}${errorDetails ? ': ' + errorDetails : ''}`);
                }).catch(jsonError => {
                    // If we can't parse JSON, try to get the raw text
                    return response.text().then(text => {
                        console.error('Raw error response:', text);
                        throw new Error(`Error creating checkout (Status ${response.status})`);
                    }).catch(() => {
                        // If we can't even get the text, throw a generic error
                        throw new Error(`Error creating checkout (Status ${response.status})`);
                    });
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            
            // Clear loading state
            this.setCheckoutLoading(false);
            
            if (data.checkoutUrl) {
                // Show success notification
                this.showNotification('Redirecting to checkout...', 'success');
                
                // Store order information in localStorage for confirmation
                try {
                    localStorage.setItem('bobby-last-order', JSON.stringify({
                        items: this.state.items,
                        total: this.state.total,
                        timestamp: new Date().toISOString(),
                        checkoutUrl: data.checkoutUrl
                    }));
                } catch (e) {
                    console.error('Could not save order info to localStorage', e);
                }
                
                // Clear cart
                this.clearCart();
                
                // Redirect to checkout
                setTimeout(() => {
                    window.location.href = data.checkoutUrl;
                }, 1000);
            } else {
                throw new Error('No checkout URL returned');
            }
        })
        .catch(error => {
            console.error('Checkout error:', error);
            
            // Clear loading state
            this.setCheckoutLoading(false);
            
            // Show error notification
            this.showNotification('Checkout error: ' + error.message, 'error');
        });
    },
    
    // Set checkout loading state
    setCheckoutLoading: function(isLoading) {
        this.state.isLoading = isLoading;
        
        // Get checkout button
        const checkoutBtn = this.elements.checkoutButton || 
                            document.querySelector('.checkout-btn');
        
        if (checkoutBtn) {
            if (isLoading) {
                checkoutBtn.disabled = true;
                
                // Get button text span
                const btnText = checkoutBtn.querySelector('span') || checkoutBtn;
                btnText.textContent = 'Processing...';
                
                // Add loading spinner if not present
                if (!checkoutBtn.querySelector('.cart-spinner')) {
                    const spinner = document.createElement('div');
                    spinner.className = 'cart-spinner';
                    spinner.style.width = '16px';
                    spinner.style.height = '16px';
                    spinner.style.display = 'inline-block';
                    spinner.style.marginLeft = '10px';
                    
                    checkoutBtn.appendChild(spinner);
                }
            } else {
                checkoutBtn.disabled = false;
                
                // Restore button text
                const btnText = checkoutBtn.querySelector('span') || checkoutBtn;
                btnText.textContent = 'Checkout';
                
                // Remove spinner if present
                const spinner = checkoutBtn.querySelector('.cart-spinner');
                if (spinner) {
                    spinner.remove();
                }
            }
        }
        
        // Find or create cart loading overlay
        let cartLoading = document.querySelector('.cart-loading');
        
        if (!cartLoading && isLoading) {
            cartLoading = document.createElement('div');
            cartLoading.className = 'cart-loading';
            cartLoading.innerHTML = '<div class="cart-spinner"></div>';
            
            // Add to cart container
            const cartContainer = this.elements.cartContainer || 
                                 document.querySelector('#cart-modal, #cart-sidebar');
            
            if (cartContainer) {
                cartContainer.appendChild(cartLoading);
            } else {
                document.body.appendChild(cartLoading);
            }
        }
        
        if (cartLoading) {
            if (isLoading) {
                cartLoading.classList.add('active');
            } else {
                cartLoading.classList.remove('active');
            }
        }
    },
    
    // Prepare items for checkout
    prepareCheckoutItems: function() {
        // First try to convert any items that might not have proper Shopify variant IDs
        this.ensureShopifyVariantIds();
        
        return this.state.items.map(item => {
            // For Shopify checkout, we need variantId and quantity
            let variantId = item.shopifyId || item.variantId || item.id;
            
            // Format check - Shopify variant IDs often start with "gid://"
            if (!variantId.includes('gid://') && !variantId.includes('/')) {
                // Try to convert from numeric ID if needed
                if (/^\d+$/.test(variantId)) {
                    variantId = `gid://shopify/ProductVariant/${variantId}`;
                }
            }
            
            if (this.config.debug) {
                console.log(`Prepared checkout item: ${item.title}, variantId: ${variantId}, quantity: ${item.quantity}`);
            }
            
            return {
                variantId: variantId,
                quantity: item.quantity
            };
        });
    },
    
    // Ensure all cart items have proper Shopify variant IDs
    ensureShopifyVariantIds: function() {
        if (this.config.debug) {
            console.log('Ensuring all cart items have proper Shopify variant IDs');
        }
        
        let updatedItems = false;
        
        // Try to fix any items without proper Shopify IDs
        this.state.items.forEach(item => {
            // Skip items that already have shopifyId
            if (item.shopifyId && item.shopifyId.includes('gid://')) {
                return;
            }
            
            // Try to find variant ID from product mapping
            if (window.PRODUCT_MAPPING) {
                for (const handle in window.PRODUCT_MAPPING) {
                    const product = window.PRODUCT_MAPPING[handle];
                    
                    // Check if this product matches our item
                    if (item.productId === handle ||
                        (item.title && product.shopifyProductId.toLowerCase().includes(item.title.toLowerCase()))) {
                        
                        // Use first variant ID
                        if (product.variants && product.variants.length > 0) {
                            const variant = product.variants[0];
                            item.shopifyId = `gid://shopify/ProductVariant/${variant.sku.split('_')[1]}`;
                            updatedItems = true;
                            
                            if (this.config.debug) {
                                console.log(`Fixed shopifyId for ${item.title}: ${item.shopifyId}`);
                            }
                            break;
                        }
                    }
                }
            }
        });
        
        // Save if we made changes
        if (updatedItems) {
            this.saveCartToStorage();
        }
    }
};

// Add to window for global access
window.BobbyCarts = BobbyCarts;