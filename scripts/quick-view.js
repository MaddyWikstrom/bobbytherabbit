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
        
        // Create modal elements with updated structure to match the CSS in styles/quick-view.css
        const modalHtml = `
            <div id="quick-view-overlay" class="quick-view-overlay">
                <div id="quick-view-modal" class="quick-view-modal">
                    <button id="quick-view-close" class="quick-view-close">&times;</button>
                    
                    <div class="quick-view-content">
                        <!-- Left side - Gallery with better image display -->
                        <div class="quick-view-gallery">
                            <div class="quick-view-image-container">
                                <img id="quick-view-main-image" class="quick-view-main-image" src="" alt="Product Image">
                                <div id="quick-view-loading" class="quick-view-loading">
                                    <div class="quick-view-spinner"></div>
                                </div>
                            </div>
                            <div id="quick-view-thumbnails" class="quick-view-thumbnails"></div>
                        </div>
                        
                        <!-- Right side - Product information and options -->
                        <div class="quick-view-info">
                            <div class="quick-view-header">
                                <h3 id="quick-view-title" class="quick-view-title"></h3>
                                <div id="quick-view-category" class="quick-view-category"></div>
                            </div>
                            
                            <div class="quick-view-price">
                                <span id="quick-view-price-current" class="quick-view-price-current"></span>
                                <span id="quick-view-price-original" class="quick-view-price-original"></span>
                                <span id="quick-view-price-discount" class="quick-view-price-discount"></span>
                            </div>
                            
                            <div id="quick-view-description" class="quick-view-description"></div>
                            
                            <div class="quick-view-options">
                                <!-- Color selection - Displayed only for products with multiple colors -->
                                <div id="quick-view-color-group" class="quick-view-option-group">
                                    <div class="quick-view-option-label">Color: <span class="required-indicator">*</span></div>
                                    <div id="quick-view-color-options" class="quick-view-color-options"></div>
                                </div>
                                
                                <!-- Size selection -->
                                <div id="quick-view-size-group" class="quick-view-option-group">
                                    <div class="quick-view-option-label">Size: <span class="required-indicator">*</span></div>
                                    <div id="quick-view-size-options" class="quick-view-size-options"></div>
                                </div>
                                
                                <!-- Quantity selection -->
                                <div id="quick-view-quantity" class="quick-view-quantity">
                                    <span class="quick-view-quantity-label">Quantity:</span>
                                    <div class="quick-view-quantity-selector">
                                        <button id="quick-view-decrement" class="quick-view-quantity-btn">-</button>
                                        <span id="quick-view-quantity-display" class="quick-view-quantity-display">1</span>
                                        <button id="quick-view-increment" class="quick-view-quantity-btn">+</button>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Validation message area -->
                            <div id="quick-view-validation-message" class="quick-view-validation-message" style="display: none;"></div>
                            
                            <div class="quick-view-actions">
                                <button id="quick-view-add-btn" class="quick-add-btn">Add to Cart</button>
                                <button id="quick-view-view-details" class="quick-view-btn">View Details</button>
                            </div>
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
                top: 0; /* Position at the top instead of bottom */
                left: 0;
                width: 100%;
                background-color: rgba(32, 32, 50, 0.95); /* Slightly blueish black to match theme */
                padding: 8px;
                transition: opacity 0.3s ease;
                opacity: 0;
                visibility: hidden;
                z-index: 5;
                pointer-events: auto; /* Allow interaction */
                height: auto;
                box-shadow: 0 4px 8px rgba(0,0,0,0.5);
                border-bottom: 2px solid #6c5ce7; /* Purple accent border */
            }
            
            .product-quick-add-title {
                font-weight: bold;
                font-size: 14px;
                margin-bottom: 6px;
                text-align: center;
                color: white;
                text-shadow: 0 1px 2px rgba(0,0,0,0.5);
            }
            
            .product-quick-add-sizes {
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                gap: 5px;
                margin-bottom: 8px;
                min-height: 30px; /* Ensure there's always space for sizes */
            }
            
            .quick-add-size-btn {
                min-width: 30px;
                height: 30px;
                border: 1px solid #6c5ce7; /* Purple border */
                background: #2d2d44; /* Dark blue-purple background */
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                font-size: 12px;
                padding: 0 8px;
                border-radius: 3px;
                margin: 0 2px;
                font-weight: bold;
            }
            
            .quick-add-size-btn:hover {
                border-color: #8e44ad; /* Brighter purple on hover */
                background-color: #3d3d5c; /* Lighter background on hover */
                box-shadow: 0 0 5px rgba(108, 92, 231, 0.5);
            }
            
            .quick-add-size-btn.selected {
                background-color: #6c5ce7; /* Purple background when selected */
                color: white;
                border-color: white;
                box-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
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
                background-color: #6c5ce7; /* Purple background to match the theme */
                color: white;
                border: none;
                padding: 8px;
                cursor: pointer;
                font-size: 13px;
                border-radius: 3px;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 1px;
                transition: all 0.2s ease;
            }
            
            .quick-add-to-cart-btn:hover {
                background-color: #8e44ad; /* Darker purple on hover */
                box-shadow: 0 0 10px rgba(108, 92, 231, 0.7);
            }
            
            .quick-add-to-cart-btn:disabled {
                background-color: #444;
                color: #999;
                cursor: not-allowed;
                box-shadow: none;
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
        
        // Add to cart button click with visual feedback
        document.getElementById('quick-view-add-btn').addEventListener('click', () => {
            // Add visual feedback animation to the button when clicked
            const addBtn = document.getElementById('quick-view-add-btn');
            addBtn.classList.add('adding');
            
            // Attempt to add to cart
            this.addToCart();
            
            // Reset animation after a delay
            setTimeout(() => {
                addBtn.classList.remove('adding');
            }, 1500);
        });
        
        // View Details button - Navigate to the product page
        const viewDetailsBtn = document.getElementById('quick-view-view-details');
        if (viewDetailsBtn) {
            viewDetailsBtn.addEventListener('click', () => {
                if (this.currentProduct) {
                    // Navigate to the product page with color parameter if color is selected
                    let url = `product.html?id=${this.currentProduct.id}`;
                    if (this.selectedVariant.color) {
                        url += `&color=${encodeURIComponent(this.selectedVariant.color)}`;
                    }
                    if (this.selectedVariant.size) {
                        url += `&size=${encodeURIComponent(this.selectedVariant.size)}`;
                    }
                    window.location.href = url;
                }
            });
        }
        
        // Quantity controls
        const quantityDisplay = document.getElementById('quick-view-quantity-display');
        const incrementBtn = document.getElementById('quick-view-increment');
        const decrementBtn = document.getElementById('quick-view-decrement');
        
        if (incrementBtn && decrementBtn && quantityDisplay) {
            incrementBtn.addEventListener('click', () => {
                const currentQty = parseInt(this.selectedVariant.quantity);
                if (currentQty < 10) { // Maximum quantity of 10
                    this.selectedVariant.quantity = currentQty + 1;
                    quantityDisplay.textContent = this.selectedVariant.quantity;
                }
            });
            
            decrementBtn.addEventListener('click', () => {
                const currentQty = parseInt(this.selectedVariant.quantity);
                if (currentQty > 1) { // Minimum quantity of 1
                    this.selectedVariant.quantity = currentQty - 1;
                    quantityDisplay.textContent = this.selectedVariant.quantity;
                }
            });
        }
        
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
                
                // Update thumbnails for this color
                this.updateThumbnailsForColor(color, this.currentProduct);
                
                // Update size availability based on color
                this.updateSizesForColor(color, this.currentProduct);
                
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
    
    // Add quick view button to product card - simplified to use same logic as product page
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
        
        // Fetch product data first, so we display accurate options
        // IMPORTANT: We don't add default sizes immediately anymore
        this.fetchProductData(productId, productHandle)
            .then(product => {
                if (!product) return;
                
                // Only update if we get product data
                console.log('Got product data:', product.title);
                
                // Process color-specific images for this product
                this.prepareColorImagesForProduct(product);
                
                // Only add size options if product has them
                if (product.sizes && product.sizes.length > 0) {
                    sizesContainer.innerHTML = '';
                    
                    product.sizes.forEach(size => {
                        const sizeBtn = document.createElement('button');
                        sizeBtn.className = 'quick-add-size-btn';
                        sizeBtn.setAttribute('data-size', size);
                        sizeBtn.textContent = this.simplifySize(size);
                        
                        sizeBtn.addEventListener('click', (e) => {
                            // Deselect all other size buttons
                            card.querySelectorAll('.quick-add-size-btn').forEach(btn => {
                                btn.classList.remove('selected');
                            });
                            
                            // Select this size
                            sizeBtn.classList.add('selected');
                            
                            // If the product has colors, check if a color is selected
                            if (product.colors && product.colors.length > 0) {
                                const selectedColor = card.querySelector('.quick-add-color-btn.selected');
                                if (selectedColor) {
                                    // Both size and color selected, auto-add to cart
                                    const color = selectedColor.getAttribute('data-color');
                                    const selectedSize = size;
                                    
                                    // Auto-add to cart with small delay for visual feedback
                                    setTimeout(() => {
                                        this.quickAddToCart(productId, productHandle, color, selectedSize);
                                        this.showNotification(`Added ${this.simplifySize(selectedSize)} ${color} to bag`, 'success');
                                    }, 300);
                                }
                                // If no color selected, wait for color selection
                                addButton.disabled = true;
                            } else {
                                // No colors for this product, auto-add with just size
                                const selectedSize = size;
                                
                                // Auto-add to cart with small delay for visual feedback
                                setTimeout(() => {
                                    this.quickAddToCart(productId, productHandle, null, selectedSize);
                                    this.showNotification(`Added ${this.simplifySize(selectedSize)} to bag`, 'success');
                                }, 300);
                                
                                addButton.disabled = false;
                            }
                        });
                        
                        sizesContainer.appendChild(sizeBtn);
                    });
                } else {
                    // Don't add "One Size" by default
                    // Hide size container if no sizes
                    sizesContainer.style.display = 'none';
                }
                
                // CRITICAL FIX: Only add color options if the product TRULY has variant colors
                // Not because we added default colors in processProductData
                console.log('Product color check:', product.title, '- has', (product.colors?.length || 0), 'colors');
                
                // We need to be ABSOLUTELY SURE this product has real color variants
                // This is the root cause of showing Black/White on products without variants
                const hasRealColorVariants = product.colors &&
                                           product.colors.length > 0 &&
                                           !product.colors.every(c =>
                                               (typeof c === 'object' ? c.name : c) === 'Black' ||
                                               (typeof c === 'object' ? c.name : c) === 'White');
                
                if (hasRealColorVariants) {
                    console.log('Product has REAL COLOR VARIANTS:', product.colors.length);
                    console.log('Colors:', product.colors.map(c => typeof c === 'object' ? c.name : c).join(', '));
                    
                    colorsContainer.style.display = 'flex';
                    colorsContainer.innerHTML = '';
                    
                    product.colors.forEach(color => {
                        const colorName = typeof color === 'object' ? color.name : color;
                        const colorCode = typeof color === 'object' ? color.code : this.getColorCode(color);
                        
                        console.log(`Adding color button: ${colorName} (${colorCode})`);
                        
                        const colorBtn = document.createElement('div');
                        colorBtn.className = 'quick-add-color-btn';
                        colorBtn.setAttribute('data-color', colorName);
                        colorBtn.style.backgroundColor = colorCode;
                        colorBtn.title = colorName;
                        
                        // If we have a color-specific image, store it
                        if (product.colorImages && product.colorImages[colorName] && product.colorImages[colorName].length > 0) {
                            colorBtn.setAttribute('data-color-image', product.colorImages[colorName][0]);
                        }
                        
                        colorBtn.addEventListener('click', (e) => {
                            card.querySelectorAll('.quick-add-color-btn').forEach(btn => {
                                btn.classList.remove('selected');
                            });
                            colorBtn.classList.add('selected');
                            
                            // Update product card image if we have a color-specific image
                            if (colorBtn.getAttribute('data-color-image')) {
                                const cardImage = card.querySelector('img.product-image');
                                if (cardImage) {
                                    cardImage.src = colorBtn.getAttribute('data-color-image');
                                }
                            }
                            
                            // If size is already selected, auto-add to cart
                            const selectedSize = card.querySelector('.quick-add-size-btn.selected');
                            if (selectedSize) {
                                const size = selectedSize.getAttribute('data-size');
                                
                                // Auto-add to cart with small delay for visual feedback
                                setTimeout(() => {
                                    this.quickAddToCart(productId, productHandle, colorName, size);
                                    this.showNotification(`Added ${this.simplifySize(size)} ${colorName} to bag`, 'success');
                                }, 300);
                            }
                        });
                        
                        colorsContainer.appendChild(colorBtn);
                    });
                    
                    // Select first color by default
                    const firstColorBtn = colorsContainer.querySelector('.quick-add-color-btn');
                    if (firstColorBtn) {
                        firstColorBtn.classList.add('selected');
                        
                        // Update product card image if we have a color-specific image
                        if (firstColorBtn.getAttribute('data-color-image')) {
                            const cardImage = card.querySelector('img.product-image');
                            if (cardImage) {
                                cardImage.src = firstColorBtn.getAttribute('data-color-image');
                            }
                        }
                    }
                } else {
                    // No REAL colors available - hide the container and clear it
                    console.log('No real color variants for this product - hiding color options');
                    colorsContainer.style.display = 'none';
                    colorsContainer.innerHTML = '';
                    
                    // CRITICAL FIX: Also update the product.colors array to be empty
                    // This prevents the auto-add code from trying to use colors
                    product.colors = [];
                }
            })
            .catch(error => {
                console.error('Error fetching product data:', error);
                // No fallback sizes - just leave empty if we can't get product data
                sizesContainer.innerHTML = '<div style="padding: 5px; text-align: center; color: white;">Unable to load options</div>';
            });
        
        // Click handler for the "Add to Bag" button in overlay
        addButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Get selected options from overlay
            const selectedColor = card.querySelector('.quick-add-color-btn.selected');
            const selectedSize = card.querySelector('.quick-add-size-btn.selected');
            
            // Get color if available, otherwise null
            const color = selectedColor ? selectedColor.getAttribute('data-color') : null;
            
            // Size is required
            if (selectedSize) {
                const size = selectedSize.getAttribute('data-size');
                
                // Quick add to cart without opening modal
                this.quickAddToCart(productId, productHandle, color, size);
                
                // Show confirmation notification
                this.showNotification(`Added to bag: ${this.simplifySize(size)} ${color || ''}`, 'success');
            } else {
                // If somehow the button is enabled without size, show error
                this.showNotification('Please select a size', 'error');
            }
        });
    }
    
    // Process color-specific images for a product
    prepareColorImagesForProduct(product) {
        if (!product || product.colorImages) return;
        
        // Initialize color images map
        product.colorImages = {};
        
        if (!product.colors || product.colors.length === 0 || !product.images || product.images.length === 0) {
            return;
        }
        
        // Get all color names
        const colorNames = product.colors.map(color =>
            typeof color === 'object' ? color.name : color
        );
        
        // For each color, find matching images
        colorNames.forEach(colorName => {
            product.colorImages[colorName] = [];
            
            // Find images containing this color name in URL
            const colorLower = colorName.toLowerCase();
            const matchingImages = product.images.filter(url => {
                if (!url) return false;
                const urlLower = url.toLowerCase();
                return urlLower.includes(colorLower) ||
                    (colorLower === 'vintage black' && urlLower.includes('vintage')) ||
                    (colorLower === 'charcoal gray' && urlLower.includes('charcoal'));
            });
            
            if (matchingImages.length > 0) {
                product.colorImages[colorName] = matchingImages;
            }
            // NO FALLBACK - if no color-specific images found, leave empty
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
        if (!productId && !productHandle) {
            console.error('No product ID or handle provided');
            this.showNotification('Cannot display product: missing ID', 'error');
            return;
        }
        
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
            
            // If product is null (API failure), close modal and show error
            if (!product) {
                this.showLoading(false);
                this.closeQuickView();
                this.showNotification(`Unable to load product data`, 'error');
                return;
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
    
    // Fetch product data from API - improved to handle different API response formats
    async fetchProductData(productId, productHandle) {
        // Extract human-readable name from handle for display purposes
        const formatProductName = (handle) => {
            if (!handle) return 'Product';
            return handle.split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        };
        
        // First, check if we have product data on the page (for product detail pages)
        if (window.product) {
            console.log("Using existing product data from page");
            return this.processProductData(window.product);
        }

        try {
            // Try to use the same API endpoint as product details page
            const timestamp = new Date().getTime();
            const url = `/.netlify/functions/get-products?id=${productId || ''}&handle=${productHandle || ''}&_=${timestamp}`;
            
            // REDUCED LOGGING: Just log the essential
            console.log(`Fetching product: ${productId || productHandle || 'unknown'}`);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            // Parse the response
            const text = await response.text();
            let data;
            
            try {
                data = JSON.parse(text);
            } catch (parseError) {
                throw new Error("Invalid JSON response");
            }
            
            // Handle different API response formats
            let productData = null;
            
            // Format 1: { product: {...} }
            if (data && data.product) {
                productData = data.product;
            }
            // Format 2: { products: [...] } - Products list from Netlify function with edges/node format
            else if (data && data.products && Array.isArray(data.products)) {
                // Check if we're dealing with Shopify GraphQL edges/node format
                const hasEdgeNodeFormat = data.products[0] && data.products[0].node;
                
                if (hasEdgeNodeFormat) {
                    // If looking for a specific product
                    if (productId || productHandle) {
                        const matchingEdge = data.products.find(edge => {
                            const node = edge.node;
                            return (productId && node.id.includes(productId)) ||
                                  (productHandle && node.handle === productHandle);
                        });
                        
                        if (matchingEdge) {
                            productData = matchingEdge.node;
                        } else if (data.products.length > 0) {
                            productData = data.products[0].node;
                        }
                    } else if (data.products.length > 0) {
                        productData = data.products[0].node;
                    }
                } else {
                    // Regular array of products without GraphQL structure
                    if (productId || productHandle) {
                        const matchingProduct = data.products.find(product =>
                            (productId && product.id && product.id.includes(productId)) ||
                            (productHandle && product.handle === productHandle)
                        );
                        
                        if (matchingProduct) {
                            productData = matchingProduct;
                        } else if (data.products.length > 0) {
                            productData = data.products[0];
                        }
                    } else if (data.products.length > 0) {
                        productData = data.products[0];
                    }
                }
            }
            // Format 3: Array of products
            else if (Array.isArray(data) && data.length > 0) {
                if (productId || productHandle) {
                    const matchingProduct = data.find(product =>
                        (productId && product.id && product.id.includes(productId)) ||
                        (productHandle && product.handle === productHandle)
                    );
                    
                    if (matchingProduct) {
                        productData = matchingProduct;
                    } else {
                        productData = data[0];
                    }
                } else {
                    productData = data[0];
                }
            }
            // Format 4: Direct product object with title/id
            else if (data && (data.title || data.id)) {
                productData = data;
            }
            
            // If we found valid product data, process it
            if (productData && (productData.title || productData.id)) {
                console.log(`Found product: ${productData.title || productId || productHandle}`);
                return this.processProductData(productData);
            } else {
                // Product not found
                throw new Error(`Product not found: ${productId || productHandle}`);
            }
            
        } catch (error) {
            console.error('Error fetching product data:', error);
            return null;
        }
    }
    
    // Process raw product data into a standardized format with improved error handling
    processProductData(rawProduct) {
        if (!rawProduct) {
            // Minimal error message - no fallback product
            console.error("Product data is missing");
            return null;
        }
        
        try {
            // Extract basic product info - no fallbacks for critical fields
            const product = {
                id: rawProduct.id,
                title: rawProduct.title || '',
                handle: rawProduct.handle || '',
                description: rawProduct.description || rawProduct.body_html || '',
                price: 0,
                comparePrice: 0,
                images: [],
                colors: [],
                sizes: [],
                inventory: {},
                category: this.extractCategory(rawProduct.title || ''),
            };
            
            // SIMPLIFIED: Extract price with less logging
            if (rawProduct.price) {
                product.price = parseFloat(rawProduct.price) || 0;
            } else if (rawProduct.variants && rawProduct.variants.length > 0 && rawProduct.variants[0].price) {
                product.price = parseFloat(rawProduct.variants[0].price) || 0;
            }
            
            // SIMPLIFIED: Extract compare price with less logging
            if (rawProduct.compare_at_price) {
                product.comparePrice = parseFloat(rawProduct.compare_at_price) || 0;
            } else if (rawProduct.variants && rawProduct.variants.length > 0 && rawProduct.variants[0].compare_at_price) {
                product.comparePrice = parseFloat(rawProduct.variants[0].compare_at_price) || 0;
            }
            
            // Process images efficiently
            if (rawProduct.images) {
                if (Array.isArray(rawProduct.images)) {
                    product.images = rawProduct.images
                        .map(img => typeof img === 'string' ? img : (img && img.src ? img.src : ''))
                        .filter(url => url); // Remove empty strings
                } else if (typeof rawProduct.images === 'string') {
                    product.images = [rawProduct.images];
                } else if (rawProduct.images.src) {
                    product.images = [rawProduct.images.src];
                }
            }
            
            // Check featured_image as backup
            if (product.images.length === 0 && rawProduct.featured_image) {
                if (typeof rawProduct.featured_image === 'string') {
                    product.images = [rawProduct.featured_image];
                } else if (rawProduct.featured_image.src) {
                    product.images = [rawProduct.featured_image.src];
                }
            }
            
            // Process variants to extract colors and sizes
            const colorSet = new Set();
            const sizeSet = new Set();
            
            if (rawProduct.variants && Array.isArray(rawProduct.variants)) {
                rawProduct.variants.forEach(variant => {
                    let color = null;
                    let size = null;
                    
                    // Format 1: Direct option properties
                    if (variant.option1) color = variant.option1;
                    if (variant.option2) size = variant.option2;
                    
                    // Format 2: Options array
                    if (variant.options && Array.isArray(variant.options)) {
                        const colorOption = variant.options.find(opt =>
                            opt.name && (opt.name.toLowerCase() === 'color' || opt.name.toLowerCase() === 'colour'));
                        
                        const sizeOption = variant.options.find(opt =>
                            opt.name && opt.name.toLowerCase() === 'size');
                        
                        if (colorOption) color = colorOption.value;
                        if (sizeOption) size = sizeOption.value;
                    }
                    
                    // Format 3: Variant title as fallback
                    if (!color && !size && variant.title && variant.title !== 'Default Title') {
                        if (variant.title.includes('/')) {
                            const parts = variant.title.split('/').map(p => p.trim());
                            if (parts.length >= 1) color = parts[0];
                            if (parts.length >= 2) size = parts[1];
                        } else {
                            // Use title as size for single-option variants
                            size = variant.title;
                        }
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
            
            // Don't add default sizes if none found
            // This ensures we only show actual product data
            
            // CRITICAL FIX: Only add colors if we actually found multiple color variants
            if (colorSet.size > 1) {
                product.colors = Array.from(colorSet).map(colorName => ({
                    name: colorName,
                    code: this.getColorCode(colorName)
                }));
                console.log(`Product ${product.title}: ${product.colors.length} colors`);
            } else if (colorSet.size === 1) {
                // If only one color, add it but mark the product as single-color
                const singleColor = Array.from(colorSet)[0];
                product.colors = [{
                    name: singleColor,
                    code: this.getColorCode(singleColor)
                }];
                product.hasSingleColor = true;
                console.log(`Product ${product.title}: Single color product (${singleColor})`);
            } else {
                product.colors = []; // Empty array = no color options
            }
            
            product.sizes = Array.from(sizeSet);
            
            return product;
            
        } catch (error) {
            console.error("Error processing product data:", error);
            return null; // Return null instead of creating a fallback product
        }
    }
    
    // Simplify and update color variants to match product details page
    updateProductVariantDisplay(product) {
        if (!product || !product.colors || product.colors.length === 0) {
            return;
        }
        
        // Get the appropriate containers
        const colorOptions = document.getElementById('quick-view-color-options');
        const colorGroup = document.getElementById('quick-view-color-group');
        
        // Clear current options
        colorOptions.innerHTML = '';
        
        // Make sure color section is visible
        colorGroup.style.display = 'block';
        
        // Create new color options with the same structure as product details page
        product.colors.forEach((color, index) => {
            // Handle both string and object formats for colors
            const colorName = typeof color === 'object' ? color.name : color;
            const colorCode = typeof color === 'object' ? color.code : this.getColorCode(color);
            
            // Create color option element
            const option = document.createElement('div');
            option.className = 'quick-view-color-option';
            option.setAttribute('data-color', colorName);
            option.style.backgroundColor = colorCode;
            option.title = colorName;
            
            // Add a color name tooltip
            const colorNameSpan = document.createElement('span');
            colorNameSpan.className = 'quick-view-color-name';
            colorNameSpan.textContent = colorName;
            option.appendChild(colorNameSpan);
            
            // Try to find an image for this color
            if (product.colorImages && product.colorImages[colorName]) {
                option.setAttribute('data-color-image', product.colorImages[colorName][0]);
            }
            
            // Add event listeners matching product details page
            option.addEventListener('mouseenter', () => {
                if (product.colorImages && product.colorImages[colorName]) {
                    const mainImage = document.getElementById('quick-view-main-image');
                    mainImage.dataset.originalSrc = mainImage.dataset.originalSrc || mainImage.src;
                    mainImage.src = product.colorImages[colorName][0];
                }
            });
            
            option.addEventListener('mouseleave', () => {
                // Only restore if not the selected color
                if (!option.classList.contains('selected')) {
                    const mainImage = document.getElementById('quick-view-main-image');
                    if (mainImage.dataset.originalSrc) {
                        mainImage.src = mainImage.dataset.originalSrc;
                    }
                }
            });
            
            option.addEventListener('click', () => {
                // Update UI to show this as selected
                document.querySelectorAll('.quick-view-color-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                option.classList.add('selected');
                
                // Update selected variant state
                this.selectedVariant.color = colorName;
                
                // Update main image permanently
                if (product.colorImages && product.colorImages[colorName]) {
                    const mainImage = document.getElementById('quick-view-main-image');
                    mainImage.src = product.colorImages[colorName][0];
                    mainImage.dataset.originalSrc = product.colorImages[colorName][0];
                    
                    // Also update thumbnails to show color-specific images
                    this.updateThumbnailsForColor(colorName, product);
                }
                
                // Update available sizes based on selected color
                this.updateSizesForColor(colorName, product);
                
                // Update the add to cart button state
                this.updateQuickViewState();
            });
            
            colorOptions.appendChild(option);
        });
        
        // Select first color by default
        const firstColorOption = colorOptions.querySelector('.quick-view-color-option');
        if (firstColorOption) {
            firstColorOption.classList.add('selected');
            this.selectedVariant.color = firstColorOption.getAttribute('data-color');
        }
    }
    
    // Update thumbnails when color is selected
    updateThumbnailsForColor(colorName, product) {
        if (!product || !colorName) return;
        
        const thumbnailsContainer = document.getElementById('quick-view-thumbnails');
        thumbnailsContainer.innerHTML = '';
        
        // Get color-specific images
        let images = [];
        if (product.colorImages && product.colorImages[colorName]) {
            images = product.colorImages[colorName];
        } else {
            // Fallback to all product images
            images = product.images;
        }
        
        // Create thumbnails
        images.forEach((imageUrl, index) => {
            const thumbnail = document.createElement('img');
            thumbnail.className = `quick-view-thumbnail ${index === 0 ? 'active' : ''}`;
            thumbnail.src = imageUrl;
            thumbnail.alt = `${product.title} - ${colorName} - Image ${index + 1}`;
            
            thumbnailsContainer.appendChild(thumbnail);
        });
    }
    
    // Update available sizes based on selected color
    updateSizesForColor(colorName, product) {
        const sizeOptions = document.getElementById('quick-view-size-options');
        sizeOptions.innerHTML = '';
        
        if (!product.sizes || product.sizes.length === 0) {
            return;
        }
        
        // Create size options for this color
        product.sizes.forEach(size => {
            const option = document.createElement('div');
            option.className = 'quick-view-size-option';
            option.setAttribute('data-size', size);
            
            // Check inventory if we have it
            let isAvailable = true;
            if (product.inventory && colorName) {
                const inventoryKey = `${colorName}-${size}`;
                const stockLevel = product.inventory[inventoryKey] || 0;
                isAvailable = stockLevel > 0;
                
                if (!isAvailable) {
                    option.classList.add('unavailable');
                }
            }
            
            // Use simplified size display
            option.textContent = this.simplifySize(size);
            
            // Add click handler
            option.addEventListener('click', () => {
                if (option.classList.contains('unavailable')) {
                    return; // Don't select unavailable sizes
                }
                
                // Update UI
                document.querySelectorAll('.quick-view-size-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                option.classList.add('selected');
                
                // Update state
                this.selectedVariant.size = size;
                
                // Update add button state
                this.updateQuickViewState();
            });
            
            sizeOptions.appendChild(option);
        });
    }
    
    // Quick add to cart directly from the overlay
    async quickAddToCart(productId, productHandle, color, size) {
        try {
            console.log(`Quick adding to cart: ${productId || productHandle} (${color || 'N/A'} / ${size || 'N/A'})`);
            
            // Always re-fetch product data to ensure it's fresh
            const product = await this.fetchProductData(productId, productHandle);
            if (!product) {
                this.showNotification(`Sorry, we couldn't find this product`, 'error');
                return false;
            }
            
            // Store as current product
            this.currentProduct = product;
            
            // IMPROVED: More robust validation that matches other methods
            console.log(`Validating selection - Product has ${product.colors?.length || 0} colors and ${product.sizes?.length || 0} sizes`);
            
            const validationResults = {
                colorNeeded: product.colors && product.colors.length > 0,
                sizeNeeded: product.sizes && product.sizes.length > 0,
                colorValid: true,
                sizeValid: true,
                errorMessage: ''
            };
            
            // Only validate color if product actually has color variants
            if (validationResults.colorNeeded) {
                console.log(`Color validation needed: selected=${color || 'none'}`);
                
                if (!color) {
                    validationResults.colorValid = false;
                    validationResults.errorMessage = 'Please select a color';
                } else {
                    // Check if this is a valid color for this product
                    const isValidColor = product.colors.some(c =>
                        (typeof c === 'object' ? c.name : c) === color
                    );
                    
                    if (!isValidColor) {
                        validationResults.colorValid = false;
                        validationResults.errorMessage = `Color "${color}" is not available for this product`;
                    }
                }
            } else {
                // No colors needed - ignore any color that was passed
                console.log('Product has no color variants - ignoring color selection');
            }
            
            // Only validate size if product has sizes
            if (validationResults.colorValid && validationResults.sizeNeeded) {
                console.log(`Size validation needed: selected=${size || 'none'}`);
                
                if (!size) {
                    validationResults.sizeValid = false;
                    validationResults.errorMessage = 'Please select a size';
                } else {
                    // Check if this is a valid size for this product
                    const isValidSize = product.sizes.includes(size);
                    
                    if (!isValidSize) {
                        validationResults.sizeValid = false;
                        validationResults.errorMessage = `Size "${size}" is not available for this product`;
                    }
                }
            } else if (!validationResults.colorValid) {
                // Skip size validation if color validation already failed
            } else {
                // No sizes needed - ignore any size that was passed
                console.log('Product has no size variants - ignoring size selection');
            }
            
            // Check overall validation result
            const isValidSelection = (!validationResults.colorNeeded || validationResults.colorValid) &&
                                     (!validationResults.sizeNeeded || validationResults.sizeValid);
            
            if (!isValidSelection) {
                throw new Error(validationResults.errorMessage || 'Invalid selection');
            }
            
            // Set selected variant
            this.selectedVariant.color = color;
            this.selectedVariant.size = size;
            this.selectedVariant.quantity = 1;
            
            // Add to cart with more detailed logging
            console.log(`Adding to cart: ${product.title} - ${color || ''} ${size || ''}`);
            this.addToCart();
            
            return true;
        } catch (error) {
            console.error('Quick add error:', error);
            this.showNotification(error.message || 'Error adding to cart', 'error');
            return false;
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
                pointer-events: auto !important;
                visibility: visible !important;
            }
            
            /* Debugging helper class */
            .force-visible {
                opacity: 1 !important;
                visibility: visible !important;
                pointer-events: auto !important;
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
        
        // Prepare color-specific image mapping (just like product details page)
        this.prepareColorImages();
        
        // Render images
        this.renderImages();
        
        // Hide color selection if product has only one color or no colors
        const colorGroup = document.getElementById('quick-view-color-group');
        if (this.currentProduct.hasSingleColor || !this.currentProduct.colors || this.currentProduct.colors.length <= 1) {
            colorGroup.style.display = 'none';
            
            // If we have a single color, pre-select it
            if (this.currentProduct.colors && this.currentProduct.colors.length === 1) {
                const singleColor = typeof this.currentProduct.colors[0] === 'object' ?
                    this.currentProduct.colors[0].name : this.currentProduct.colors[0];
                this.selectedVariant.color = singleColor;
            }
        } else {
            // Show the color selection for multiple colors
            colorGroup.style.display = 'block';
            
            // Update product variant display for colors
            this.updateProductVariantDisplay(this.currentProduct);
            
            // Add a "required" indicator if colors need to be selected
            if (this.isRequiredField('color')) {
                const colorLabel = colorGroup.querySelector('.quick-view-option-label');
                if (colorLabel) {
                    colorLabel.innerHTML = 'Color: <span class="required-indicator">*</span>';
                }
            }
        }
        
        // Handle sizes
        const sizeGroup = document.getElementById('quick-view-size-group');
        if (!this.currentProduct.sizes || this.currentProduct.sizes.length === 0) {
            sizeGroup.style.display = 'none';
        } else {
            sizeGroup.style.display = 'block';
            
            // Update sizes based on the first color or single color
            const firstColor = this.selectedVariant.color ||
                (this.currentProduct.colors && this.currentProduct.colors.length > 0 ?
                    (typeof this.currentProduct.colors[0] === 'object' ?
                        this.currentProduct.colors[0].name : this.currentProduct.colors[0]) :
                    null);
            
            if (firstColor) {
                this.updateSizesForColor(firstColor, this.currentProduct);
            }
            
            // Add a "required" indicator if sizes need to be selected
            if (this.isRequiredField('size')) {
                const sizeLabel = sizeGroup.querySelector('.quick-view-option-label');
                if (sizeLabel) {
                    sizeLabel.innerHTML = 'Size: <span class="required-indicator">*</span>';
                }
            }
        }
        
        // Add validation message area
        const validationMsg = document.createElement('div');
        validationMsg.id = 'quick-view-validation-message';
        validationMsg.className = 'quick-view-validation-message';
        validationMsg.style.display = 'none';
        document.querySelector('.quick-view-actions').insertAdjacentElement('beforebegin', validationMsg);
        
        // Initialize the add to cart button state
        this.updateQuickViewState();
        
        // Add CSS for required indicators
        if (!document.getElementById('quick-view-validation-styles')) {
            const validationStyles = document.createElement('style');
            validationStyles.id = 'quick-view-validation-styles';
            validationStyles.textContent = `
                .required-indicator {
                    color: #ef4444;
                    margin-left: 4px;
                }
                .quick-view-validation-message {
                    color: #ef4444;
                    font-size: 0.9rem;
                    margin-bottom: 1rem;
                    padding: 0.5rem;
                    border-radius: 4px;
                    background-color: rgba(239, 68, 68, 0.1);
                    text-align: center;
                }
                .selection-made .required-indicator {
                    color: #10b981;
                }
                .quick-view-option-group {
                    transition: all 0.3s ease;
                }
                .quick-view-option-group.highlight {
                    animation: highlight-field 2s ease;
                }
                @keyframes highlight-field {
                    0%, 100% { background-color: transparent; }
                    50% { background-color: rgba(239, 68, 68, 0.1); }
                }
            `;
            document.head.appendChild(validationStyles);
        }
    }
    
    // Helper method to check if a field is required for adding to cart
    isRequiredField(field) {
        if (field === 'color') {
            return this.currentProduct && this.currentProduct.colors && this.currentProduct.colors.length > 1;
        } else if (field === 'size') {
            return this.currentProduct && this.currentProduct.sizes && this.currentProduct.sizes.length > 0;
        }
        return false;
    }
    
    // Process color-specific images - same logic as product details page
    prepareColorImages() {
        // Skip if no product or already processed
        if (!this.currentProduct || this.currentProduct.colorImages) {
            return;
        }
        
        // Initialize color images map
        this.currentProduct.colorImages = {};
        
        // Skip if no colors
        if (!this.currentProduct.colors || this.currentProduct.colors.length === 0) {
            return;
        }
        
        // Extract colors to a simple array of names for easier processing
        const colorNames = this.currentProduct.colors.map(color =>
            typeof color === 'object' ? color.name : color
        );
        
        // For each color, find matching images
        colorNames.forEach(colorName => {
            // Initialize with empty array
            this.currentProduct.colorImages[colorName] = [];
            
            // First, try to find variant-specific images from variants
            if (this.currentProduct.variants && this.currentProduct.variants.length > 0) {
                const colorVariants = this.currentProduct.variants.filter(variant =>
                    variant.color === colorName && variant.image
                );
                
                if (colorVariants.length > 0) {
                    colorVariants.forEach(variant => {
                        if (variant.image && !this.currentProduct.colorImages[colorName].includes(variant.image)) {
                            this.currentProduct.colorImages[colorName].push(variant.image);
                        }
                    });
                }
            }
            
            // If no variant images found, try to find images with color name in URL
            if (this.currentProduct.colorImages[colorName].length === 0 && this.currentProduct.images) {
                const colorLower = colorName.toLowerCase();
                const matchingImages = this.currentProduct.images.filter(url => {
                    const urlLower = url.toLowerCase();
                    return urlLower.includes(colorLower) ||
                        (colorLower === 'vintage black' && urlLower.includes('vintage')) ||
                        (colorLower === 'charcoal gray' && urlLower.includes('charcoal'));
                });
                
                if (matchingImages.length > 0) {
                    this.currentProduct.colorImages[colorName] = matchingImages;
                }
            }
            
            // NO FALLBACKS - if no color-specific images, we leave the array empty
        });
    }
    
    // Render product images with improved event handling
    renderImages() {
        if (!this.currentProduct || !this.currentProduct.images || this.currentProduct.images.length === 0) {
            // No images available - don't attempt to set any image source
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
            
            // Add click handler
            thumbnail.addEventListener('click', () => {
                // Update active thumbnail
                document.querySelectorAll('.quick-view-thumbnail').forEach(thumb => {
                    thumb.classList.remove('active');
                });
                thumbnail.classList.add('active');
                
                // Update main image
                mainImage.src = imageUrl;
                mainImage.dataset.originalSrc = imageUrl;
            });
            
            thumbnailsContainer.appendChild(thumbnail);
        });
    }
    
    // Update thumbnails when color is selected
    updateThumbnailsForColor(colorName, product) {
        if (!product || !colorName) return;
        
        const thumbnailsContainer = document.getElementById('quick-view-thumbnails');
        thumbnailsContainer.innerHTML = '';
        
        // Get color-specific images
        let images = [];
        if (product.colorImages && product.colorImages[colorName]) {
            images = product.colorImages[colorName];
        }
        
        // No fallback - if no images for this color, don't show any
        if (images.length === 0) {
            return;
        }
        
        // Create thumbnails
        images.forEach((imageUrl, index) => {
            const thumbnail = document.createElement('img');
            thumbnail.className = `quick-view-thumbnail ${index === 0 ? 'active' : ''}`;
            thumbnail.src = imageUrl;
            thumbnail.alt = `${product.title} - ${colorName} - Image ${index + 1}`;
            
            // Add click handler
            thumbnail.addEventListener('click', () => {
                // Update active thumbnail
                document.querySelectorAll('.quick-view-thumbnail').forEach(thumb => {
                    thumb.classList.remove('active');
                });
                thumbnail.classList.add('active');
                
                // Update main image
                const mainImage = document.getElementById('quick-view-main-image');
                mainImage.src = imageUrl;
                mainImage.dataset.originalSrc = imageUrl;
            });
            
            thumbnailsContainer.appendChild(thumbnail);
        });
        
        // Update main image to first thumbnail
        if (images.length > 0) {
            const mainImage = document.getElementById('quick-view-main-image');
            mainImage.src = images[0];
            mainImage.dataset.originalSrc = images[0];
        }
    }
    
    // Enhanced update button states with validation messages
    updateQuickViewState() {
        const addBtn = document.getElementById('quick-view-add-btn');
        const validationMsg = document.getElementById('quick-view-validation-message');
        
        // FIXED: More robust handling of products without color variants
        // Only require color selection if product actually has multiple colors
        const hasColorIfNeeded = (!this.isRequiredField('color')) || this.selectedVariant.color;
        const hasSizeIfNeeded = (!this.isRequiredField('size')) || this.selectedVariant.size;
        
        const shouldEnable = hasColorIfNeeded && hasSizeIfNeeded;
        
        // Update button state
        addBtn.disabled = !shouldEnable;
        
        // Update button text for clarity
        addBtn.textContent = shouldEnable ? "Add to Cart" : "Select Options";
        
        // Show/hide validation message
        if (validationMsg) {
            if (!shouldEnable) {
                validationMsg.style.display = 'block';
                
                // Create specific message based on what's missing
                let message = 'Please select: ';
                const missing = [];
                
                if (!hasColorIfNeeded) {
                    missing.push('Color');
                    // Highlight the color group
                    const colorGroup = document.getElementById('quick-view-color-group');
                    if (colorGroup && !colorGroup.classList.contains('highlight')) {
                        colorGroup.classList.add('highlight');
                        setTimeout(() => colorGroup.classList.remove('highlight'), 2000);
                    }
                }
                
                if (!hasSizeIfNeeded) {
                    missing.push('Size');
                    // Highlight the size group
                    const sizeGroup = document.getElementById('quick-view-size-group');
                    if (sizeGroup && !sizeGroup.classList.contains('highlight')) {
                        sizeGroup.classList.add('highlight');
                        setTimeout(() => sizeGroup.classList.remove('highlight'), 2000);
                    }
                }
                
                validationMsg.textContent = message + missing.join(' & ');
            } else {
                validationMsg.style.display = 'none';
            }
        }
        
        // Mark fields as selected in the UI
        if (this.selectedVariant.color && this.isRequiredField('color')) {
            const colorGroup = document.getElementById('quick-view-color-group');
            if (colorGroup) colorGroup.classList.add('selection-made');
        }
        
        if (this.selectedVariant.size && this.isRequiredField('size')) {
            const sizeGroup = document.getElementById('quick-view-size-group');
            if (sizeGroup) sizeGroup.classList.add('selection-made');
        }
        
        console.log(`Add button state: hasColorIfNeeded=${hasColorIfNeeded}, hasSizeIfNeeded=${hasSizeIfNeeded}, enabled=${shouldEnable}`);
    }
    
    // Get available stock for selected variant
    getAvailableStock() {
        if (!this.currentProduct || !this.selectedVariant.color || !this.selectedVariant.size) {
            return 0; // Don't provide default stock, return 0 to trigger out-of-stock behavior
        }
        
        // Get stock from inventory
        const inventoryKey = `${this.selectedVariant.color}-${this.selectedVariant.size}`;
        return this.currentProduct.inventory[inventoryKey] || 0; // No fallback stock
    }
    
    // Enhanced add to cart with better validation and feedback
    addToCart() {
        // Validate before proceeding
        if (!this.currentProduct) {
            console.error("Cannot add to cart: No product selected");
            this.showNotification("Product data missing", "error");
            return;
        }
        
        // Validate color selection only if product has multiple colors
        const needsColor = this.isRequiredField('color');
        const colorSelected = !needsColor || this.selectedVariant.color;
        
        // Validate size selection only if product has sizes
        const needsSize = this.isRequiredField('size');
        const sizeSelected = !needsSize || this.selectedVariant.size;
        
        // Check if we can proceed
        if (!colorSelected || !sizeSelected) {
            let errorMessage = "Please select: ";
            const missing = [];
            
            if (!colorSelected) missing.push("Color");
            if (!sizeSelected) missing.push("Size");
            
            errorMessage += missing.join(" & ");
            
            console.error("Cannot add to cart: Required options not selected", {
                needsColor, colorSelected, needsSize, sizeSelected
            });
            
            this.showNotification(errorMessage, "error");
            
            // Highlight the missing selections
            if (!colorSelected) {
                const colorGroup = document.getElementById('quick-view-color-group');
                if (colorGroup) {
                    colorGroup.classList.add('highlight');
                    setTimeout(() => colorGroup.classList.remove('highlight'), 2000);
                }
            }
            
            if (!sizeSelected) {
                const sizeGroup = document.getElementById('quick-view-size-group');
                if (sizeGroup) {
                    sizeGroup.classList.add('highlight');
                    setTimeout(() => sizeGroup.classList.remove('highlight'), 2000);
                }
            }
            
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
            
            // Find the correct image for the selected color - use only current main image
            const mainImage = document.getElementById('quick-view-main-image');
            if (mainImage && mainImage.src) {
                cartItem.image = mainImage.src;
                cartItem.mainImage = mainImage.src;
            }
            // No fallback image handling - if there's no image, there's no image
            
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
    
    // This method is now replaced by updateThumbnailsForColor
    // We keep it as a wrapper for backward compatibility
    filterImagesByColor(colorName) {
        if (!colorName || !this.currentProduct) return;
        
        // Just use our new method instead
        this.updateThumbnailsForColor(colorName, this.currentProduct);
    }
    
    // Update product card image when color is selected - ONLY use color-specific images
    updateProductCardImage(colorName, card) {
        if (!card || !colorName || !this.currentProduct) return;
        
        try {
            // Only use images from colorImages map - no searching through all images
            if (this.currentProduct.colorImages &&
                this.currentProduct.colorImages[colorName] &&
                this.currentProduct.colorImages[colorName].length > 0) {
                
                const cardImage = card.querySelector('img.product-image');
                if (cardImage) {
                    cardImage.src = this.currentProduct.colorImages[colorName][0];
                }
            }
            // No fallbacks - if no color-specific image exists, don't change anything
        } catch (error) {
            console.error("Error updating product card image:", error);
            // Don't attempt any recovery
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

// Debug helper function - can be used to force show a specific overlay
function debugForceShowOverlay(cardSelector) {
    const cards = document.querySelectorAll(cardSelector || '.product-card');
    cards.forEach(card => {
        const overlay = card.querySelector('.product-quick-add-overlay');
        if (overlay) {
            overlay.classList.add('force-visible');
            
            // Log for debugging
            console.log('Forced overlay visible on:', card);
            
            // Ensure it has size and color options
            const sizesContainer = overlay.querySelector('.product-quick-add-sizes');
            const colorsContainer = overlay.querySelector('.product-quick-add-colors');
            
            if (sizesContainer && !sizesContainer.children.length) {
                console.warn('No size options in overlay', card);
            }
            
            if (colorsContainer && !colorsContainer.children.length) {
                console.warn('No color options in overlay', card);
            }
        } else {
            console.error('No overlay found on card:', card);
        }
    });
}

// Run a final check after page has fully loaded
window.addEventListener('load', () => {
    ensureQuickViewOnAllCards();
    
    // Uncomment the line below to force show all overlays for debugging
    // setTimeout(() => debugForceShowOverlay(), 3000);
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { quickViewManager };
}