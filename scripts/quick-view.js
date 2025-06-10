/**
 * Quick View and Quick Add to Cart Functionality
 * Allows users to quickly view product details and add items to cart
 * without navigating to the full product page
 */

class QuickViewManager {
    constructor() {
        this.currentProduct = null;
        this.selectedVariant = {
            color: null,
            size: null,
            quantity: 1
        };
        this.isLoading = false;
        this.modalCreated = false;
        this.isColorFiltering = false;
        
        this.init();
    }
    
    init() {
        this.createQuickViewModal();
        this.addQuickViewStyles();
        this.setupEventListeners();
        
        // Hide all unwanted buttons in product cards
        this.addButtonHidingStyles();
        
        // QuickView system initialized
    }
    
    // Create the Quick View modal that will be displayed when a product is clicked
    createQuickViewModal() {
        // Check if modal already exists
        if (this.modalCreated) return;
        
        // Create modal elements
        const modalHtml = `
            <div id="quick-view-overlay" class="quick-view-overlay">
                <div id="quick-view-modal" class="quick-view-modal">
                    <button id="quick-view-close" class="quick-view-close">&times;</button>
                    
                    <div class="quick-view-content">
                        <div class="quick-view-left">
                            <div class="quick-view-image-container">
                                <img id="quick-view-main-image" class="quick-view-main-image" src="" alt="Product Image">
                                <div id="quick-view-loading" class="quick-view-loading">
                                    <div class="quick-view-spinner"></div>
                                </div>
                            </div>
                            <div id="quick-view-thumbnails" class="quick-view-thumbnails"></div>
                        </div>
                        
                        <div class="quick-view-right">
                            <div class="quick-view-header">
                                <h3 id="quick-view-title" class="quick-view-title"></h3>
                                <div id="quick-view-category" class="quick-view-category"></div>
                            </div>
                            
                            <div class="quick-view-price">
                                <span id="quick-view-price-current" class="quick-view-price-current"></span>
                                <span id="quick-view-price-original" class="quick-view-price-original"></span>
                                <span id="quick-view-price-discount" class="quick-view-price-discount"></span>
                            </div>
                            
                            <div class="quick-view-options">
                                <!-- Size selection -->
                                <div id="quick-view-size-group" class="quick-view-option-group">
                                    <div class="quick-view-option-label">Size:</div>
                                    <div id="quick-view-size-options" class="quick-view-size-options"></div>
                                </div>
                                
                                <!-- Color selection -->
                                <div id="quick-view-color-group" class="quick-view-option-group">
                                    <div class="quick-view-option-label">Color:</div>
                                    <div id="quick-view-color-options" class="quick-view-color-options"></div>
                                </div>
                            </div>
                            
                            <div class="quick-view-actions">
                                <button id="quick-view-add-btn" class="quick-view-add-btn">Add to Cart</button>
                            </div>
                            
                            <div id="quick-view-description" class="quick-view-description"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to the DOM
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHtml;
        document.body.appendChild(modalContainer);
        
        this.modalCreated = true;
    }
    
    // Add styles for the Quick View functionality
    addQuickViewStyles() {
        // Check if styles already exist
        if (document.getElementById('quick-view-styles')) return;
        
        const styles = `
            /* Quick View Overlay */
            .quick-view-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                z-index: 9999;
                display: flex;
                justify-content: center;
                align-items: center;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s ease;
            }
            
            .quick-view-overlay.active {
                opacity: 1;
                visibility: visible;
            }
            
            /* Quick View Modal */
            .quick-view-modal {
                background-color: #fff;
                border-radius: 8px;
                max-width: 900px;
                width: 90%;
                max-height: 90vh;
                position: relative;
                transform: translateY(20px);
                opacity: 0;
                transition: transform 0.3s ease, opacity 0.3s ease;
                overflow: hidden;
            }
            
            .quick-view-modal.active {
                transform: translateY(0);
                opacity: 1;
            }
            
            /* Close Button */
            .quick-view-close {
                position: absolute;
                top: 15px;
                right: 15px;
                font-size: 24px;
                background: none;
                border: none;
                cursor: pointer;
                z-index: 10;
                color: #333;
            }
            
            /* Content Layout */
            .quick-view-content {
                display: flex;
                flex-direction: row;
                height: 100%;
                max-height: 90vh;
                overflow: hidden;
            }
            
            /* Left Side - Images */
            .quick-view-left {
                flex: 1;
                padding: 20px;
                max-width: 50%;
                display: flex;
                flex-direction: column;
            }
            
            .quick-view-image-container {
                position: relative;
                width: 100%;
                padding-top: 100%; /* 1:1 Aspect Ratio */
            }
            
            .quick-view-main-image {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                object-fit: contain;
            }
            
            .quick-view-thumbnails {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                margin-top: 15px;
            }
            
            .quick-view-thumbnail {
                width: 60px;
                height: 60px;
                object-fit: cover;
                border-radius: 4px;
                cursor: pointer;
                border: 2px solid transparent;
            }
            
            .quick-view-thumbnail.active {
                border-color: #000;
            }
            
            /* Right Side - Info */
            .quick-view-right {
                flex: 1;
                padding: 30px 20px;
                overflow-y: auto;
                max-height: 90vh;
            }
            
            .quick-view-header {
                margin-bottom: 15px;
            }
            
            .quick-view-title {
                font-size: 24px;
                margin: 0 0 5px 0;
            }
            
            .quick-view-category {
                color: #777;
                font-size: 14px;
            }
            
            /* Price Styling */
            .quick-view-price {
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                flex-wrap: wrap;
            }
            
            .quick-view-price-current {
                font-size: 22px;
                font-weight: bold;
                margin-right: 10px;
            }
            
            .quick-view-price-original {
                font-size: 16px;
                color: #777;
                text-decoration: line-through;
                margin-right: 10px;
            }
            
            .quick-view-price-discount {
                font-size: 14px;
                background-color: #e53935;
                color: white;
                padding: 2px 6px;
                border-radius: 3px;
                display: none;
            }
            
            /* Options Styling */
            .quick-view-options {
                margin-bottom: 25px;
            }
            
            .quick-view-option-group {
                margin-bottom: 15px;
            }
            
            .quick-view-option-label {
                font-weight: bold;
                margin-bottom: 8px;
            }
            
            .quick-view-size-options {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
            }
            
            .quick-view-size-option {
                min-width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 1px solid #ddd;
                border-radius: 4px;
                cursor: pointer;
                padding: 0 12px;
                transition: all 0.2s ease;
            }
            
            .quick-view-size-option:hover {
                border-color: #000;
            }
            
            .quick-view-size-option.selected {
                background-color: #000;
                color: #fff;
                border-color: #000;
            }
            
            .quick-view-size-option.unavailable {
                color: #ccc;
                border-color: #eee;
                cursor: not-allowed;
                position: relative;
            }
            
            .quick-view-size-option.unavailable::after {
                content: '';
                position: absolute;
                width: 100%;
                height: 1px;
                background-color: #ccc;
                transform: rotate(45deg);
            }
            
            /* Color Options */
            .quick-view-color-options {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
            }
            
            .quick-view-color-option {
                min-width: 30px;
                height: 30px;
                border-radius: 15px;
                cursor: pointer;
                border: 1px solid #ddd;
                position: relative;
                overflow: hidden;
            }
            
            .quick-view-color-name {
                position: absolute;
                bottom: -25px;
                left: 50%;
                transform: translateX(-50%);
                white-space: nowrap;
                font-size: 10px;
                opacity: 0;
                transition: opacity 0.2s ease;
            }
            
            .quick-view-color-option:hover .quick-view-color-name {
                opacity: 1;
            }
            
            .quick-view-color-option.selected {
                border: 2px solid #000;
            }
            
            /* Action Buttons */
            .quick-view-actions {
                margin-bottom: 20px;
            }
            
            .quick-view-add-btn {
                background-color: #000;
                color: #fff;
                border: none;
                padding: 12px 20px;
                font-size: 16px;
                cursor: pointer;
                width: 100%;
                transition: background-color 0.2s;
            }
            
            .quick-view-add-btn:hover {
                background-color: #333;
            }
            
            .quick-view-add-btn:disabled {
                background-color: #ccc;
                cursor: not-allowed;
            }
            
            /* Description */
            .quick-view-description {
                font-size: 14px;
                line-height: 1.6;
                color: #555;
            }
            
            /* Loading Spinner */
            .quick-view-loading {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(255, 255, 255, 0.8);
                display: none;
                justify-content: center;
                align-items: center;
            }
            
            .quick-view-spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #000;
                border-radius: 50%;
                animation: quick-view-spin 1s linear infinite;
            }
            
            @keyframes quick-view-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            /* Product Card Overlay */
            .product-card {
                position: relative;
                overflow: hidden;
            }
            
            .product-quick-add-overlay {
                position: absolute;
                bottom: 0;
                left: 0;
                width: 100%;
                background-color: rgba(255, 255, 255, 0.95);
                padding: 10px;
                transform: translateY(100%);
                transition: transform 0.3s ease, opacity 0.3s ease;
                opacity: 0;
                visibility: hidden;
                z-index: 5;
                pointer-events: none;
            }
            
            .product-quick-add-title {
                font-weight: bold;
                font-size: 14px;
                margin-bottom: 8px;
                text-align: center;
            }
            
            .product-quick-add-sizes {
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                gap: 5px;
                margin-bottom: 8px;
            }
            
            .quick-add-size-btn {
                min-width: 30px;
                height: 30px;
                border: 1px solid #ddd;
                background: white;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                font-size: 12px;
                padding: 0 8px;
                border-radius: 3px;
            }
            
            .quick-add-size-btn:hover {
                border-color: #000;
            }
            
            .quick-add-size-btn.selected {
                background-color: #000;
                color: white;
                border-color: #000;
            }
            
            .product-quick-add-colors {
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                gap: 5px;
                margin-bottom: 8px;
            }
            
            .quick-add-color-btn {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                cursor: pointer;
                border: 1px solid #ddd;
                position: relative;
            }
            
            .quick-add-color-btn.selected {
                border: 2px solid #000;
            }
            
            .quick-add-to-cart-btn {
                width: 100%;
                background-color: #000;
                color: white;
                border: none;
                padding: 8px;
                cursor: pointer;
                font-size: 13px;
                border-radius: 3px;
            }
            
            .quick-add-to-cart-btn:hover {
                background-color: #333;
            }
            
            /* Notification */
            .quick-view-notification {
                position: fixed;
                bottom: 20px;
                right: 20px;
                padding: 12px 20px;
                background-color: #333;
                color: white;
                border-radius: 4px;
                z-index: 10000;
                opacity: 0;
                transform: translateY(20px);
                transition: opacity 0.3s, transform 0.3s;
                max-width: 300px;
            }
            
            .quick-view-notification.active {
                opacity: 1;
                transform: translateY(0);
            }
            
            .quick-view-notification.success {
                background-color: #4CAF50;
            }
            
            .quick-view-notification.error {
                background-color: #F44336;
            }
            
            /* Mobile Responsive */
            @media (max-width: 768px) {
                .quick-view-content {
                    flex-direction: column;
                    overflow-y: auto;
                }
                
                .quick-view-left,
                .quick-view-right {
                    max-width: 100%;
                    width: 100%;
                    padding: 15px;
                }
                
                .quick-view-image-container {
                    padding-top: 80%;
                }
            }
        `;
        
        const styleEl = document.createElement('style');
        styleEl.id = 'quick-view-styles';
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);
    }
    
    // Set up all event listeners for quick view functionality
    setupEventListeners() {
        // Close modal when clicking close button or overlay
        document.getElementById('quick-view-close').addEventListener('click', () => this.closeQuickView());
        document.getElementById('quick-view-overlay').addEventListener('click', (e) => {
            if (e.target === document.getElementById('quick-view-overlay')) {
                this.closeQuickView();
            }
        });
        
        // Add to cart button click
        document.getElementById('quick-view-add-btn').addEventListener('click', () => this.addToCart());
        
        // Thumbnail click - change main image
        document.getElementById('quick-view-thumbnails').addEventListener('click', (e) => {
            if (e.target.classList.contains('quick-view-thumbnail')) {
                // Update active thumbnail
                document.querySelectorAll('.quick-view-thumbnail').forEach(thumb => {
                    thumb.classList.remove('active');
                });
                e.target.classList.add('active');
                
                // Update main image
                document.getElementById('quick-view-main-image').src = e.target.src;
            }
        });
        
        // Size selection
        document.getElementById('quick-view-size-options').addEventListener('click', (e) => {
            if (e.target.classList.contains('quick-view-size-option') && !e.target.classList.contains('unavailable')) {
                // Update selected size
                document.querySelectorAll('.quick-view-size-option').forEach(option => {
                    option.classList.remove('selected');
                });
                e.target.classList.add('selected');
                
                // Update selected variant
                this.selectedVariant.size = e.target.getAttribute('data-size');
                this.updateQuickViewState();
            }
        });
        
        // Color selection
        document.getElementById('quick-view-color-options').addEventListener('click', (e) => {
            if (e.target.classList.contains('quick-view-color-option')) {
                // Update selected color
                document.querySelectorAll('.quick-view-color-option').forEach(option => {
                    option.classList.remove('selected');
                });
                e.target.classList.add('selected');
                
                // Update selected variant
                const color = e.target.getAttribute('data-color');
                this.selectedVariant.color = color;
                
                // Filter images to show color-specific images
                this.filterImagesByColor(color);
                
                // Update size availability based on color
                this.renderSizeOptions();
                
                // Update state
                this.updateQuickViewState();
            }
        });
        
        // Keyboard event to close with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeQuickView();
            }
        });
    }
    
    // Add quick view button to product card
    addQuickViewButtonToCard(card) {
        if (!card) return;
        
        // Get product info
        const productId = card.getAttribute('data-product-id');
        const productHandle = card.getAttribute('data-product-handle') || '';
        
        if (!productId && !productHandle) {
            // Can't add quick view without a way to identify the product
            return;
        }
        
        // Create quick add overlay
        const overlay = document.createElement('div');
        overlay.className = 'product-quick-add-overlay';
        
        // Add title
        const title = document.createElement('div');
        title.className = 'product-quick-add-title';
        title.textContent = 'Quick Add to Bag';
        
        // Create container for sizes (before colors - matching reference image)
        const sizesContainer = document.createElement('div');
        sizesContainer.className = 'product-quick-add-sizes';
        
        // Create container for colors
        const colorsContainer = document.createElement('div');
        colorsContainer.className = 'product-quick-add-colors';
        
        // Add button
        const addButton = document.createElement('button');
        addButton.className = 'quick-add-to-cart-btn';
        addButton.textContent = 'Add to Bag';
        addButton.disabled = true;
        
        // Assemble overlay
        overlay.appendChild(title);
        overlay.appendChild(sizesContainer);
        overlay.appendChild(colorsContainer);
        overlay.appendChild(addButton);
        
        // Add the overlay to the card
        card.appendChild(overlay);
        
        // Setup click event on the card itself to show quick view
        card.addEventListener('click', (e) => {
            // Only open quick view if we clicked the card itself, not a button inside the overlay
            if (!e.target.closest('.product-quick-add-overlay')) {
                e.preventDefault();
                this.openQuickViewById(productId, productHandle);
            }
        });
        
        // Click handler for the "Add to Bag" button in overlay
        addButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Get selected options from overlay
            const selectedColor = card.querySelector('.quick-add-color-btn.selected');
            const selectedSize = card.querySelector('.quick-add-size-btn.selected');
            
            // Only proceed if both options are selected
            if (selectedColor && selectedSize) {
                const color = selectedColor.getAttribute('data-color');
                const size = selectedSize.getAttribute('data-size');
                
                // Save the selections
                this.selectedVariant.color = color;
                this.selectedVariant.size = size;
                
                // Quick add to cart without opening modal
                this.quickAddToCart(productId, productHandle, color, size);
            }
        });
    }
    
    // Show notification message
    showNotification(message, type = 'success') {
        // Check if notification exists
        let notification = document.querySelector('.quick-view-notification');
        
        // Create if it doesn't exist
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'quick-view-notification';
            document.body.appendChild(notification);
        }
        
        // Set message and type
        notification.textContent = message;
        notification.className = `quick-view-notification ${type}`;
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('active');
        }, 10);
        
        // Hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove('active');
            
            // Remove from DOM after fade out
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    // Open quick view for a specific product by ID or handle
    async openQuickViewById(productId, productHandle) {
        if (!productId && !productHandle) return;
        
        try {
            this.showLoading(true);
            this.openModal();
            
            // Clear any previous selections
            this.selectedVariant = {
                color: null,
                size: null,
                quantity: 1
            };
            
            // Fetch product data
            const product = await this.fetchProductData(productId, productHandle);
            
            if (!product) {
                throw new Error('Product not found');
            }
            
            // Store current product
            this.currentProduct = product;
            
            // Render product details
            this.renderQuickView();
            
            // Hide loading
            this.showLoading(false);
        } catch (error) {
            this.showLoading(false);
            this.showNotification('Error loading product details', 'error');
            console.error('Quick view error:', error);
            
            // Close modal on error
            this.closeQuickView();
        }
    }
    
    // Fetch product data from API
    async fetchProductData(productId, productHandle) {
        try {
            // Prioritize using our Netlify function
            const netlifyUrl = `/api/get-products?id=${productId || ''}&handle=${productHandle || ''}`;
            
            const response = await fetch(netlifyUrl);
            if (!response.ok) {
                throw new Error('Failed to fetch product data from Netlify function');
            }
            
            const data = await response.json();
            
            if (!data || !data.product) {
                throw new Error('Invalid product data received');
            }
            
            // Process the product data
            const product = this.processProductData(data.product);
            return product;
            
        } catch (error) {
            console.error('Error fetching product data:', error);
            
            // Fallback to window.product if available (for product pages)
            if (window.product) {
                return this.processProductData(window.product);
            }
            
            throw error;
        }
    }
    
    // Process raw product data into a standardized format
    processProductData(rawProduct) {
        // Extract basic product info
        const product = {
            id: rawProduct.id,
            title: rawProduct.title,
            handle: rawProduct.handle,
            description: rawProduct.description || rawProduct.body_html || '',
            price: parseFloat(rawProduct.price || rawProduct.variants?.[0]?.price || 0),
            comparePrice: parseFloat(rawProduct.compare_at_price || rawProduct.variants?.[0]?.compare_at_price || 0),
            images: [],
            colors: [],
            sizes: [],
            inventory: {},
            category: this.extractCategory(rawProduct.title),
        };
        
        // Process images
        if (rawProduct.images && Array.isArray(rawProduct.images)) {
            product.images = rawProduct.images.map(img => typeof img === 'string' ? img : img.src);
        }
        
        // Process variants to extract colors and sizes
        const colorSet = new Set();
        const sizeSet = new Set();
        
        if (rawProduct.variants && Array.isArray(rawProduct.variants)) {
            rawProduct.variants.forEach(variant => {
                // Extract color and size from variant
                let color = variant.option1;
                let size = variant.option2;
                
                // Handle variants with different option structure
                if (variant.options) {
                    const colorOption = variant.options.find(opt =>
                        opt.name.toLowerCase() === 'color' ||
                        opt.name.toLowerCase() === 'colour');
                    
                    const sizeOption = variant.options.find(opt =>
                        opt.name.toLowerCase() === 'size');
                    
                    if (colorOption) color = colorOption.value;
                    if (sizeOption) size = sizeOption.value;
                }
                
                // Add to sets (deduplicate)
                if (color) colorSet.add(color);
                if (size) sizeSet.add(size);
                
                // Add to inventory
                if (color && size) {
                    const inventoryKey = `${color}-${size}`;
                    product.inventory[inventoryKey] = variant.inventory_quantity || 10;
                }
            });
        }
        
        // Convert sets to arrays
        product.colors = Array.from(colorSet).map(colorName => ({
            name: colorName,
            code: this.getColorCode(colorName)
        }));
        
        product.sizes = Array.from(sizeSet);
        
        return product;
    }
    
    // Quick add to cart directly from the overlay
    async quickAddToCart(productId, productHandle, color, size) {
        try {
            if (!this.currentProduct || this.currentProduct.id != productId) {
                // Need to fetch product data first
                const product = await this.fetchProductData(productId, productHandle);
                if (!product) {
                    throw new Error('Product not found');
                }
                this.currentProduct = product;
            }
            
            // Set selected variant
            this.selectedVariant.color = color;
            this.selectedVariant.size = size;
            this.selectedVariant.quantity = 1;
            
            // Add to cart
            this.addToCart();
            
        } catch (error) {
            console.error('Quick add error:', error);
            this.showNotification('Error adding to cart', 'error');
        }
    }
    
    // Add specific styles to hide buttons on product cards
    addButtonHidingStyles() {
        // Check if styles already exist
        if (document.querySelector('#quick-view-button-hiding-styles')) return;
        
        const styles = `
           /* Hide ALL buttons and heart/favorite icons on product cards */
           .product-card .add-to-cart-btn,
           .product-card .quick-shop-btn,
           .product-card .cart-btn,
           .product-card .eye-btn,
           .product-card .quick-view-btn,
           .product-card .add-to-bag-btn,
           .product-card .quick-shop-buttons,
           .product-card .button-container,
           .product-card .quick-buttons,
           .product-card [class*="cart"],
           .product-card [class*="Cart"],
           .product-card button:not(.quick-add-size-btn):not(.quick-add-color-btn),
           .product-card .btn,
           .product-card .button,
           .product-card .add-to-cart,
           .product-card .add-to-bag,
           .product-card .buy-now,
           .product-card a.btn,
           .product-card .actions,
           .product-card .product-actions,
           .product-card .hover-actions,
           .product-card .product-buttons,
           .product-card .hover-buttons,
           .product-card .heart,
           .product-card .heart-icon,
           .product-card .favorite,
           .product-card .favorite-icon,
           .product-card .wishlist,
           .product-card .wishlist-icon,
           .product-card [class*="heart"],
           .product-card [class*="favorite"],
           .product-card [class*="wishlist"],
           .product-card svg[class*="heart"],
           .product-card svg[class*="favorite"],
           .product-card svg[class*="wishlist"],
           .product-card .icon-heart,
           .product-card .icon-favorite,
           .product-card .icon-wishlist,
           .product-card i.fa-heart,
           .product-card i.fa-star {
               display: none !important;
               opacity: 0 !important;
               visibility: hidden !important;
               pointer-events: none !important;
               width: 0 !important;
               height: 0 !important;
               overflow: hidden !important;
               position: absolute !important;
               z-index: -1 !important;
           }
            
            /* Ensure the overlay appears on hover */
            .product-card:hover .product-quick-add-overlay {
                opacity: 1 !important;
                transform: translateY(0) !important;
                pointer-events: auto !important;
                visibility: visible !important;
            }
        `;
        
        const styleEl = document.createElement('style');
        styleEl.id = 'quick-view-button-hiding-styles';
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);
    }

    // Extract category from product title
    extractCategory(title) {
        const titleLower = title.toLowerCase();
        
        // Check for common category keywords
        if (titleLower.includes('hoodie')) return 'Hoodie';
        if (titleLower.includes('tee') || titleLower.includes('t-shirt') || titleLower.includes('t shirt')) return 'T-Shirt';
        if (titleLower.includes('beanie')) return 'Beanie';
        if (titleLower.includes('hat') || titleLower.includes('cap')) return 'Hat';
        if (titleLower.includes('joggers') || titleLower.includes('pants')) return 'Joggers';
        if (titleLower.includes('shorts')) return 'Shorts';
        if (titleLower.includes('jacket')) return 'Jacket';
        if (titleLower.includes('socks')) return 'Socks';
        if (titleLower.includes('sweatshirt')) return 'Sweatshirt';
        
        // Default category if no keyword match
        return 'Streetwear';
    }

    // Method to simplify size display
    simplifySize(size) {
        if (!size) return '';
        
        // Handle common size abbreviations
        const sizeUpper = size.toUpperCase();
        if (sizeUpper === 'SMALL') return 'S';
        if (sizeUpper === 'MEDIUM') return 'M';
        if (sizeUpper === 'LARGE') return 'L';
        if (sizeUpper === 'EXTRA LARGE' || sizeUpper === 'XLARGE' || sizeUpper === 'X-LARGE') return 'XL';
        if (sizeUpper === 'EXTRA EXTRA LARGE' || sizeUpper === 'XXLARGE' || sizeUpper === 'XX-LARGE' || sizeUpper === '2XLARGE' || sizeUpper === '2X-LARGE') return '2XL';
        if (sizeUpper === '3XLARGE' || sizeUpper === 'XXXLARGE' || sizeUpper === '3X-LARGE' || sizeUpper === 'XXX-LARGE') return '3XL';
        
        // Return original if it's already simple
        if (['S', 'M', 'L', 'XL', '2XL', '3XL', 'OS', 'ONE SIZE'].includes(sizeUpper)) {
            return sizeUpper;
        }
        
        // Return as is for numeric sizes or other formats
        return size;
    }

    // Get color code for standard colors
    getColorCode(colorName) {
        if (!colorName) return '#000000';
        
        const colorMap = {
            'black': '#000000',
            'white': '#ffffff',
            'red': '#ff0000',
            'blue': '#0000ff',
            'green': '#00ff00',
            'yellow': '#ffff00',
            'purple': '#800080',
            'pink': '#ffc0cb',
            'orange': '#ffa500',
            'brown': '#a52a2a',
            'gray': '#808080',
            'grey': '#808080',
            'navy': '#000080',
            'beige': '#f5f5dc',
            'tan': '#d2b48c',
            'olive': '#808000',
            'maroon': '#800000',
            'cream': '#fffdd0',
            'teal': '#008080',
            'gold': '#ffd700',
            'silver': '#c0c0c0',
            'charcoal': '#36454f',
            'vintage black': '#222222',
        };
        
        // Look for any color word in the name
        const colorLower = colorName.toLowerCase();
        for (const [key, value] of Object.entries(colorMap)) {
            if (colorLower.includes(key)) {
                return value;
            }
        }
        
        // Default to black if no match
        return '#000000';
    }
    
    // Show loading spinner
    showLoading(show) {
        const loadingEl = document.getElementById('quick-view-loading');
        if (loadingEl) {
            loadingEl.style.display = show ? 'flex' : 'none';
        }
        this.isLoading = show;
    }
    
    // Open the modal
    openModal() {
        const modal = document.getElementById('quick-view-modal');
        const overlay = document.getElementById('quick-view-overlay');
        
        if (modal && overlay) {
            // Show overlay first, then modal with slight delay for animation
            overlay.classList.add('active');
            setTimeout(() => {
                modal.classList.add('active');
            }, 50);
        }
    }
    
    // Close the modal
    closeQuickView() {
        const modal = document.getElementById('quick-view-modal');
        const overlay = document.getElementById('quick-view-overlay');
        
        if (modal && overlay) {
            modal.classList.remove('active');
            setTimeout(() => {
                overlay.classList.remove('active');
            }, 300);
        }
    }
    
    // Render the quick view contents
    renderQuickView() {
        if (!this.currentProduct) return;
        
        // Set basic product info
        document.getElementById('quick-view-title').textContent = this.currentProduct.title;
        document.getElementById('quick-view-category').textContent = this.currentProduct.category || 'Streetwear';
        document.getElementById('quick-view-description').innerHTML = this.currentProduct.description;
        
        // Set pricing info
        document.getElementById('quick-view-price-current').textContent = `$${this.currentProduct.price.toFixed(2)}`;
        
        // Display sale price if applicable
        if (this.currentProduct.comparePrice && this.currentProduct.comparePrice > this.currentProduct.price) {
            document.getElementById('quick-view-price-original').textContent = `$${this.currentProduct.comparePrice.toFixed(2)}`;
            
            // Calculate and show discount percentage
            const discountPercent = Math.round(((this.currentProduct.comparePrice - this.currentProduct.price) / this.currentProduct.comparePrice) * 100);
            document.getElementById('quick-view-price-discount').textContent = `${discountPercent}% OFF`;
            document.getElementById('quick-view-price-discount').style.display = 'block';
        } else {
            document.getElementById('quick-view-price-original').textContent = '';
            document.getElementById('quick-view-price-discount').style.display = 'none';
        }
        
        // Render images
        this.renderImages();
        
        // Render color options
        this.renderColorOptions();
        
        // Render size options
        this.renderSizeOptions();
        
        // Initialize the add to cart button state
        this.updateQuickViewState();
    }
    
    // Render product images
    renderImages() {
        if (!this.currentProduct || !this.currentProduct.images || this.currentProduct.images.length === 0) {
            // No images to display
            const mainImage = document.getElementById('quick-view-main-image');
            mainImage.src = 'https://via.placeholder.com/400x400?text=No+Image+Available';
            mainImage.alt = this.currentProduct?.title || 'Product Image';
            
            document.getElementById('quick-view-thumbnails').innerHTML = '';
            return;
        }
        
        // Set main image
        const mainImage = document.getElementById('quick-view-main-image');
        mainImage.src = this.currentProduct.images[0];
        mainImage.alt = this.currentProduct.title;
        
        // Generate thumbnails
        const thumbnailsContainer = document.getElementById('quick-view-thumbnails');
        thumbnailsContainer.innerHTML = '';
        
        this.currentProduct.images.forEach((imageUrl, index) => {
            const thumbnail = document.createElement('img');
            thumbnail.className = `quick-view-thumbnail ${index === 0 ? 'active' : ''}`;
            thumbnail.src = imageUrl;
            thumbnail.alt = `${this.currentProduct.title} - Image ${index + 1}`;
            
            thumbnailsContainer.appendChild(thumbnail);
        });
    }
    
    // Render color options
    renderColorOptions() {
        const colorOptions = document.getElementById('quick-view-color-options');
        const colorGroup = document.getElementById('quick-view-color-group');
        
        // Hide color section if no colors available
        if (!this.currentProduct.colors || this.currentProduct.colors.length === 0) {
            colorGroup.style.display = 'none';
            return;
        }
        
        colorGroup.style.display = 'block';
        colorOptions.innerHTML = '';
        
        // Create a color option for each available color
        this.currentProduct.colors.forEach(color => {
            const option = document.createElement('div');
            option.className = 'quick-view-color-option';
            option.setAttribute('data-color', color.name);
            option.style.color = color.code;
            
            const colorName = document.createElement('span');
            colorName.className = 'quick-view-color-name';
            colorName.textContent = color.name;
            
            option.appendChild(colorName);
            colorOptions.appendChild(option);
        });
    }
    
    // Render size options
    renderSizeOptions() {
        const sizeOptions = document.getElementById('quick-view-size-options');
        const sizeGroup = document.getElementById('quick-view-size-group');
        
        // Hide size section if no sizes available
        if (!this.currentProduct.sizes || this.currentProduct.sizes.length === 0) {
            sizeGroup.style.display = 'none';
            return;
        }
        
        sizeGroup.style.display = 'block';
        sizeOptions.innerHTML = '';
        
        // Create a size option for each available size
        this.currentProduct.sizes.forEach(size => {
            const option = document.createElement('div');
            option.className = 'quick-view-size-option';
            option.setAttribute('data-size', size);
            
            // Check if this size is available for the selected color
            let isAvailable = true;
            if (this.selectedVariant.color) {
                const inventoryKey = `${this.selectedVariant.color}-${size}`;
                const stockLevel = this.currentProduct.inventory[inventoryKey] || 0;
                isAvailable = stockLevel > 0;
                
                if (!isAvailable) {
                    option.classList.add('unavailable');
                }
            }
            
            // Use simplified size display
            option.textContent = this.simplifySize(size);
            
            sizeOptions.appendChild(option);
        });
    }
    
    // Update button states based on selection
    updateQuickViewState() {
        const addBtn = document.getElementById('quick-view-add-btn');
        
        // Disable add button if color or size not selected
        const hasRequiredSelections = this.currentProduct.colors.length === 0 || this.selectedVariant.color;
        const hasSizeIfNeeded = this.currentProduct.sizes.length === 0 || this.selectedVariant.size;
        
        addBtn.disabled = !(hasRequiredSelections && hasSizeIfNeeded);
    }
    
    // Get available stock for selected variant
    getAvailableStock() {
        if (!this.currentProduct || !this.selectedVariant.color || !this.selectedVariant.size) {
            return 10; // Default max if no variant selected
        }
        
        // Get stock from inventory
        const inventoryKey = `${this.selectedVariant.color}-${this.selectedVariant.size}`;
        return this.currentProduct.inventory[inventoryKey] || 10;
    }
    
    // Add current product to cart
    addToCart() {
        if (!this.currentProduct || (this.currentProduct.colors.length > 0 && !this.selectedVariant.color) || (this.currentProduct.sizes.length > 0 && !this.selectedVariant.size)) {
            // Cannot add to cart if required options not selected
            return;
        }
        
        try {
            // Create cart item
            const cartItem = {
                ...this.currentProduct,
                selectedSize: this.selectedVariant.size,
                selectedColor: this.selectedVariant.color,
                quantity: this.selectedVariant.quantity,
                variants: {
                    size: this.selectedVariant.size,
                    color: this.selectedVariant.color
                },
                variant: {
                    size: this.selectedVariant.size,
                    color: this.selectedVariant.color
                },
                size: this.selectedVariant.size,
                color: this.selectedVariant.color
            };
            
            // Find the correct image for the selected color
            if (this.selectedVariant.color && this.currentProduct.images.length > 1) {
                // Select the current main image as the cart image
                const mainImage = document.getElementById('quick-view-main-image');
                cartItem.image = mainImage.src;
                cartItem.mainImage = mainImage.src;
            } else if (this.currentProduct.images.length > 0) {
                cartItem.image = this.currentProduct.images[0];
                cartItem.mainImage = this.currentProduct.images[0];
            }
            
            // Add to cart using available cart system
            let cartAddSuccess = false;
            
            if (window.BobbyCart) {
                window.BobbyCart.addItem(cartItem);
                cartAddSuccess = true;
                
                // Open cart after a delay
                setTimeout(() => {
                    if (typeof window.BobbyCart.openCart === 'function') {
                        window.BobbyCart.openCart();
                    }
                }, 500);
            } else if (window.BobbyCarts) {
                window.BobbyCarts.addToCart(cartItem);
                cartAddSuccess = true;
                
                setTimeout(() => {
                    if (typeof window.BobbyCarts.openCart === 'function') {
                        window.BobbyCarts.openCart();
                    }
                }, 500);
            } else if (window.cartManager) {
                window.cartManager.addItem(cartItem);
                cartAddSuccess = true;
                
                setTimeout(() => {
                    if (typeof window.cartManager.openCart === 'function') {
                        window.cartManager.openCart();
                    }
                }, 500);
            } else {
                this.showNotification('Cart system not available', 'error');
                return;
            }
            
            if (cartAddSuccess) {
                // Close quick view modal
                this.closeQuickView();
                
                // Show confirmation notification
                const sizeText = this.selectedVariant.size ? ` (${this.simplifySize(this.selectedVariant.size)})` : '';
                this.showNotification(`Added ${this.currentProduct.title}${sizeText} to cart`, 'success');
            }
            
        } catch (error) {
            // Error adding to cart
            this.showNotification('Error adding to cart', 'error');
        }
    }
    
    // Filter images by color
    filterImagesByColor(colorName) {
        if (this.isColorFiltering) return; // Prevent multiple simultaneous filters
        
        this.isColorFiltering = true;
        const MAX_IMAGES = 5; // Limit to avoid endless loops
        
        try {
            // If no color or no images, do nothing
            if (!colorName || !this.currentProduct || !this.currentProduct.images || this.currentProduct.images.length <= 1) {
                this.isColorFiltering = false;
                return;
            }
            
            // Get color name in lowercase for matching
            const colorLower = colorName.toLowerCase();
            
            // Find matching images - first, try exact color name in the URL
            let matchedImages = this.currentProduct.images.filter(url => {
                const urlLower = url.toLowerCase();
                return urlLower.includes(colorLower) || 
                       // Special case for vintage black and charcoal gray
                       (colorLower === 'vintage black' && urlLower.includes('vintage')) ||
                       (colorLower === 'charcoal gray' && urlLower.includes('charcoal'));
            });
            
            // Cap the number of images to avoid processing too many
            if (matchedImages.length > MAX_IMAGES) {
                matchedImages = matchedImages.slice(0, MAX_IMAGES);
            }
            
            // If we found at least one matching image, update the gallery
            if (matchedImages.length > 0) {
                // Update main image to first matching image
                const mainImage = document.getElementById('quick-view-main-image');
                mainImage.src = matchedImages[0];
                
                // Update thumbnails
                const thumbnailsContainer = document.getElementById('quick-view-thumbnails');
                thumbnailsContainer.innerHTML = '';
                
                matchedImages.forEach((imageUrl, index) => {
                    const thumbnail = document.createElement('img');
                    thumbnail.className = `quick-view-thumbnail ${index === 0 ? 'active' : ''}`;
                    thumbnail.src = imageUrl;
                    thumbnail.alt = `${this.currentProduct.title} - ${colorName} - Image ${index + 1}`;
                    
                    thumbnailsContainer.appendChild(thumbnail);
                });
            }
        } catch (error) {
            // Error in filtering - silently fail
        } finally {
            // Always clear the filtering flag
            this.isColorFiltering = false;
        }
    }
    
    // Update product card image when color is selected
    updateProductCardImage(colorName, card) {
        if (!card || !colorName || !this.currentProduct) return;
        
        try {
            // Find an image that matches this color
            const colorLower = colorName.toLowerCase();
            const matchingImage = this.currentProduct.images.find(url => {
                const urlLower = url.toLowerCase();
                return urlLower.includes(colorLower) || 
                       // Special cases
                       (colorLower === 'vintage black' && urlLower.includes('vintage')) ||
                       (colorLower === 'charcoal gray' && urlLower.includes('charcoal'));
            });
            
            // If we found a matching image, update the card image
            if (matchingImage) {
                const cardImage = card.querySelector('img');
                if (cardImage) {
                    cardImage.src = matchingImage;
                }
            }
        } catch (error) {
            // Error updating image - silently fail
        }
    }
}

// Function to ensure all product cards have quick view functionality
function ensureQuickViewOnAllCards() {
    const quickViewManager = new QuickViewManager();
    
    // Force add quick view to all product cards on page
    const productCards = document.querySelectorAll('.product-card');
    if (productCards.length > 0) {
        // Don't log to avoid console spam
        productCards.forEach(card => {
            // Remove any existing add-to-cart, heart, or other buttons
            const buttonsToRemove = card.querySelectorAll('.add-to-cart-btn, .quick-shop-btn, .cart-btn, .eye-btn, .button, button:not(.quick-add-size-btn):not(.quick-add-color-btn), .heart, .heart-icon, .favorite, .favorite-icon, .wishlist, .wishlist-icon, [class*="heart"], [class*="favorite"], [class*="wishlist"], svg[class*="heart"], svg[class*="favorite"], svg[class*="wishlist"], .icon-heart, .icon-favorite, .icon-wishlist, i.fa-heart, i.fa-star');
            buttonsToRemove.forEach(btn => btn.remove());
            
            // Add our quick view overlay if it doesn't exist
            if (!card.querySelector('.product-quick-add-overlay')) {
                quickViewManager.addQuickViewButtonToCard(card);
            }
        });
    }
}

// Initialize the quick view manager
const quickViewManager = new QuickViewManager();

// Run immediately and also when the DOM is fully loaded
ensureQuickViewOnAllCards();
document.addEventListener('DOMContentLoaded', ensureQuickViewOnAllCards);

// Run after any potential dynamic content loading
setTimeout(ensureQuickViewOnAllCards, 1000);
setTimeout(ensureQuickViewOnAllCards, 2000);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { quickViewManager };
}