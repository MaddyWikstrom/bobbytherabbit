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
        
        this.init();
    }
    
    init() {
        this.createQuickViewModal();
        this.addQuickViewStyles();
        this.setupEventListeners();
        // QuickView system initialized
    }
    
    addQuickViewStyles() {
        // Check if styles already exist
        if (document.querySelector('#quick-view-styles')) return;
        
        const styles = `
            /* Quick View Modal Styles */
            .quick-view-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(5px);
                z-index: 10000;
                display: none;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .quick-view-overlay.active {
                opacity: 1;
                display: block;
            }
            
            .quick-view-modal {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0.95);
                width: 90%;
                max-width: 1000px;
                max-height: 90vh;
                background: rgba(15, 15, 30, 0.97);
                border-radius: 16px;
                z-index: 10001;
                overflow: hidden;
                display: none;
                opacity: 0;
                transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                border: 1px solid rgba(168, 85, 247, 0.3);
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            }
            
            .quick-view-modal.active {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
                display: block;
            }
            
            .quick-view-close {
                position: absolute;
                top: 15px;
                right: 15px;
                width: 36px;
                height: 36px;
                background: rgba(30, 30, 50, 0.7);
                border: none;
                color: #fff;
                font-size: 20px;
                border-radius: 50%;
                cursor: pointer;
                z-index: 10;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
            }
            
            .quick-view-close:hover {
                background: rgba(168, 85, 247, 0.5);
                transform: rotate(90deg);
            }
            
            .quick-view-content {
                display: grid;
                grid-template-columns: 1fr 1fr;
                height: 100%;
                overflow: hidden;
            }
            
            .quick-view-gallery {
                padding: 2rem;
                position: relative;
                overflow: hidden;
            }
            
            .quick-view-main-image {
                width: 100%;
                height: 350px;
                object-fit: cover;
                border-radius: 8px;
                margin-bottom: 1rem;
                background: rgba(20, 20, 35, 0.5);
            }
            
            .quick-view-thumbnails {
                display: flex;
                gap: 0.5rem;
                overflow-x: auto;
                padding-bottom: 0.5rem;
                scrollbar-width: thin;
                scrollbar-color: rgba(168, 85, 247, 0.5) rgba(30, 30, 50, 0.3);
            }
            
            .quick-view-thumbnail {
                width: 60px;
                height: 60px;
                border-radius: 4px;
                cursor: pointer;
                border: 2px solid transparent;
                transition: all 0.2s ease;
                object-fit: cover;
                flex-shrink: 0;
            }
            
            .quick-view-thumbnail.active {
                border-color: #a855f7;
                transform: scale(1.05);
            }
            
            .quick-view-info {
                padding: 2rem;
                overflow-y: auto;
                max-height: 80vh;
                position: relative;
            }
            
            .quick-view-info::-webkit-scrollbar {
                width: 6px;
            }
            
            .quick-view-info::-webkit-scrollbar-track {
                background: rgba(30, 30, 50, 0.3);
            }
            
            .quick-view-info::-webkit-scrollbar-thumb {
                background: rgba(168, 85, 247, 0.5);
                border-radius: 3px;
            }
            
            .quick-view-category {
                color: #a855f7;
                font-size: 0.9rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                margin-bottom: 0.5rem;
            }
            
            .quick-view-title {
                font-size: 1.8rem;
                font-weight: 700;
                color: #ffffff;
                margin-bottom: 1rem;
                line-height: 1.2;
            }
            
            .quick-view-price {
                display: flex;
                align-items: center;
                gap: 1rem;
                margin-bottom: 1.5rem;
            }
            
            .quick-view-price-current {
                font-size: 1.5rem;
                font-weight: 700;
                color: #a855f7;
            }
            
            .quick-view-price-original {
                font-size: 1.1rem;
                color: #999;
                text-decoration: line-through;
            }
            
            .quick-view-price-discount {
                background: rgba(239, 68, 68, 0.2);
                color: #ef4444;
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                font-weight: 600;
                font-size: 0.8rem;
            }
            
            .quick-view-description {
                color: rgba(255, 255, 255, 0.8);
                line-height: 1.6;
                margin-bottom: 1.5rem;
                font-size: 0.95rem;
                max-height: 120px;
                overflow-y: auto;
                padding-right: 0.5rem;
            }
            
            .quick-view-options {
                margin-bottom: 1.5rem;
            }
            
            .quick-view-option-group {
                margin-bottom: 1rem;
            }
            
            .quick-view-option-label {
                display: block;
                color: #ffffff;
                font-weight: 600;
                margin-bottom: 0.5rem;
                font-size: 0.95rem;
            }
            
            .quick-view-color-options {
                display: flex;
                gap: 0.5rem;
                flex-wrap: wrap;
            }
            
            .quick-view-color-option {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                border: 2px solid rgba(255, 255, 255, 0.3);
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }
            
            .quick-view-color-option:hover {
                transform: scale(1.1);
                border-color: rgba(255, 255, 255, 0.6);
            }
            
            .quick-view-color-option.active {
                border-color: #a855f7;
                transform: scale(1.15);
                box-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
            }
            
            .quick-view-color-option::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: currentColor;
            }
            
            .quick-view-color-name {
                position: absolute;
                bottom: -25px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.8);
                color: #ffffff;
                padding: 0.15rem 0.4rem;
                border-radius: 3px;
                font-size: 0.65rem;
                white-space: nowrap;
                opacity: 0;
                transition: opacity 0.3s ease;
                pointer-events: none;
            }
            
            .quick-view-color-option:hover .quick-view-color-name {
                opacity: 1;
            }
            
            .quick-view-size-options {
                display: flex;
                gap: 0.5rem;
                flex-wrap: wrap;
            }
            
            .quick-view-size-option {
                background: rgba(26, 26, 46, 0.8);
                border: 1px solid rgba(168, 85, 247, 0.3);
                color: rgba(255, 255, 255, 0.8);
                padding: 0.4rem 0.75rem;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.3s ease;
                font-weight: 500;
                min-width: 40px;
                text-align: center;
                font-size: 0.85rem;
            }
            
            .quick-view-size-option:hover {
                border-color: #a855f7;
                background: rgba(168, 85, 247, 0.2);
                color: #ffffff;
                transform: translateY(-2px);
            }
            
            .quick-view-size-option.active {
                background: rgba(168, 85, 247, 0.1);
                border-color: #a855f7;
                color: #a855f7;
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(168, 85, 247, 0.2);
            }
            
            .quick-view-size-option.unavailable {
                opacity: 0.5;
                cursor: not-allowed;
                position: relative;
            }
            
            .quick-view-size-option.unavailable::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 10%;
                right: 10%;
                height: 1px;
                background: #ef4444;
                transform: translateY(-50%) rotate(-45deg);
            }
            
            .quick-view-quantity {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-bottom: 1.5rem;
            }
            
            .quick-view-quantity-label {
                color: #ffffff;
                font-weight: 600;
                font-size: 0.95rem;
            }
            
            .quick-view-quantity-selector {
                display: flex;
                align-items: center;
                background: rgba(26, 26, 46, 0.8);
                border: 1px solid rgba(168, 85, 247, 0.3);
                border-radius: 4px;
                overflow: hidden;
            }
            
            .quick-view-quantity-btn {
                background: none;
                border: none;
                color: #ffffff;
                padding: 0.4rem 0.7rem;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .quick-view-quantity-btn:hover {
                background: rgba(168, 85, 247, 0.1);
                color: #a855f7;
            }
            
            .quick-view-quantity-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .quick-view-quantity-display {
                padding: 0.4rem 0.7rem;
                color: #ffffff;
                font-weight: 600;
                min-width: 40px;
                text-align: center;
                border-left: 1px solid rgba(168, 85, 247, 0.3);
                border-right: 1px solid rgba(168, 85, 247, 0.3);
            }
            
            .quick-view-actions {
                display: flex;
                gap: 0.7rem;
            }
            
            .quick-add-btn {
                flex: 1;
                background: linear-gradient(45deg, #a855f7, #3b82f6);
                border: none;
                color: #ffffff;
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                font-weight: 600;
                font-size: 0.95rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }
            
            .quick-add-btn::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                transition: left 0.5s ease;
            }
            
            .quick-add-btn:hover::before {
                left: 100%;
            }
            
            .quick-add-btn:hover {
                transform: translateY(-3px);
                box-shadow: 0 10px 25px rgba(168, 85, 247, 0.4);
            }
            
            .quick-add-btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none;
            }
            
            .quick-add-btn.adding {
                animation: addToCartSuccess 1.2s ease forwards;
            }
            
            .quick-view-btn {
                background: rgba(26, 26, 46, 0.8);
                border: 1px solid rgba(168, 85, 247, 0.3);
                color: #ffffff;
                padding: 0.75rem 1rem;
                border-radius: 8px;
                font-weight: 600;
                font-size: 0.95rem;
                cursor: pointer;
                transition: all 0.3s ease;
                white-space: nowrap;
            }
            
            .quick-view-btn:hover {
                background: rgba(26, 26, 46, 0.95);
                border-color: #a855f7;
                transform: translateY(-3px);
            }
            
            .quick-view-loading {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(15, 15, 30, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10;
                backdrop-filter: blur(3px);
            }
            
            .quick-view-spinner {
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
            
            /* Quick Add Overlay */
            .product-card {
                position: relative;
            }
            
            /* Product Card Standardization */
            .product-card {
                position: relative;
                display: flex;
                flex-direction: column;
                height: 100%;
                min-height: 400px; /* Set a minimum height for consistency */
                width: 100%;
            }
            
            .product-card img {
                width: 100%;
                height: 350px; /* Fixed height for product images */
                object-fit: cover;
            }
            
            /* Hide Add to Cart button and eye/cart buttons */
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
            .product-card .buy-now {
                display: none !important;
            }
            
            .product-card-info {
                flex-grow: 1;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
            }
            
            /* Position the overlay to avoid covering color selector */
            .product-quick-add-overlay {
                position: absolute;
                bottom: 80px; /* Increased space for color selector */
                left: 0;
                right: 0;
                background: rgba(0, 0, 0, 0.85);
                backdrop-filter: blur(3px);
                padding: 15px;
                opacity: 0;
                transform: translateY(10px);
                transition: all 0.3s ease;
                pointer-events: none;
                z-index: 5;
                display: flex;
                flex-direction: column;
                align-items: center;
                max-height: calc(100% - 100px); /* Ensure it doesn't take up too much space */
                overflow-y: auto; /* Allow scrolling if needed */
            }
            
            .quick-add-colors {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                justify-content: center;
                width: 100%;
                margin-top: 10px;
            }
            
            .quick-add-color-btn {
                width: 22px;
                height: 22px;
                border-radius: 50%;
                border: 1px solid rgba(255, 255, 255, 0.3);
                cursor: pointer;
                transition: all 0.2s ease;
                position: relative;
            }
            
            .quick-add-color-btn:hover,
            .quick-add-color-btn.selected {
                transform: scale(1.2);
                border-color: white;
                box-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
            }
            
            .quick-add-color-btn:after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background-color: currentColor;
            }
            
            .quick-add-color-name {
                position: absolute;
                bottom: -22px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                font-size: 10px;
                padding: 2px 5px;
                border-radius: 2px;
                white-space: nowrap;
                opacity: 0;
                transition: opacity 0.2s;
                pointer-events: none;
            }
            
            .quick-add-color-btn:hover .quick-add-color-name {
                opacity: 1;
            }
            
            .product-card:hover .product-quick-add-overlay {
                opacity: 1;
                transform: translateY(0);
                pointer-events: auto;
            }
            
            .quick-add-title {
                color: white;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 12px;
                text-align: center;
            }
            
            .quick-add-sizes {
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
                justify-content: center;
                width: 100%;
            }
            
            .quick-add-size-btn {
                background: #000;
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 50px;
                padding: 5px 10px;
                min-width: 40px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
                text-transform: uppercase;
            }
            
            .quick-add-size-btn:hover,
            .quick-add-size-btn.selected {
                background: white;
                color: black;
                border-color: white;
            }
            
            .quick-add-size-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .quick-add-sizes-loading,
            .quick-add-error {
                color: rgba(255, 255, 255, 0.7);
                font-size: 12px;
                text-align: center;
                padding: 5px 0;
            }
            
            /* Simple notification */
            .quick-notification {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%) translateY(100%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 10px 20px;
                border-radius: 4px;
                font-size: 14px;
                z-index: 10000;
                transition: transform 0.3s ease;
            }
            
            .quick-notification.show {
                transform: translateX(-50%) translateY(0);
            }
            
            .quick-notification.success {
                border-left: 3px solid #10b981;
            }
            
            .quick-notification.error {
                border-left: 3px solid #ef4444;
            }
            
            .quick-notification.info {
                border-left: 3px solid #3b82f6;
            }
            
            @media (max-width: 768px) {
                .quick-view-content {
                    grid-template-columns: 1fr;
                    max-height: 90vh;
                    overflow-y: auto;
                }
                
                .quick-view-gallery, .quick-view-info {
                    padding: 1rem;
                }
                
                .quick-view-main-image {
                    height: 250px;
                }
                
                .quick-view-title {
                    font-size: 1.5rem;
                }
            }
        `;
        
        const styleEl = document.createElement('style');
        styleEl.id = 'quick-view-styles';
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);
    }
    
    createQuickViewModal() {
        if (this.modalCreated) return;
        
        const modal = document.createElement('div');
        modal.id = 'quick-view-modal';
        modal.className = 'quick-view-modal';
        modal.innerHTML = `
            <button class="quick-view-close">&times;</button>
            <div class="quick-view-content">
                <div class="quick-view-gallery">
                    <img src="" alt="" class="quick-view-main-image" id="quick-view-main-image">
                    <div class="quick-view-thumbnails" id="quick-view-thumbnails"></div>
                </div>
                <div class="quick-view-info">
                    <div class="quick-view-category" id="quick-view-category"></div>
                    <h2 class="quick-view-title" id="quick-view-title"></h2>
                    <div class="quick-view-price">
                        <span class="quick-view-price-current" id="quick-view-price-current"></span>
                        <span class="quick-view-price-original" id="quick-view-price-original"></span>
                        <span class="quick-view-price-discount" id="quick-view-price-discount"></span>
                    </div>
                    <div class="quick-view-description" id="quick-view-description"></div>
                    <div class="quick-view-options">
                        <div class="quick-view-option-group" id="quick-view-color-group">
                            <label class="quick-view-option-label">Color</label>
                            <div class="quick-view-color-options" id="quick-view-color-options"></div>
                        </div>
                        <div class="quick-view-option-group" id="quick-view-size-group">
                            <label class="quick-view-option-label">Size</label>
                            <div class="quick-view-size-options" id="quick-view-size-options"></div>
                        </div>
                    </div>
                    <div class="quick-view-quantity">
                        <span class="quick-view-quantity-label">Quantity:</span>
                        <div class="quick-view-quantity-selector">
                            <button class="quick-view-quantity-btn decrease" id="quick-view-quantity-decrease">−</button>
                            <span class="quick-view-quantity-display" id="quick-view-quantity-display">1</span>
                            <button class="quick-view-quantity-btn increase" id="quick-view-quantity-increase">+</button>
                        </div>
                    </div>
                    <div class="quick-view-actions">
                        <button class="quick-view-btn" id="quick-view-full-btn" style="width: 100%;">View Details</button>
                    </div>
                </div>
            </div>
            <div class="quick-view-loading" id="quick-view-loading" style="display: none;">
                <div class="quick-view-spinner"></div>
            </div>
            <!-- Debug info element removed for production -->
        `;
        
        const overlay = document.createElement('div');
        overlay.id = 'quick-view-overlay';
        overlay.className = 'quick-view-overlay';
        
        document.body.appendChild(overlay);
        document.body.appendChild(modal);
        
        this.modalCreated = true;
    }
    
    setupEventListeners() {
        const self = this;
        
        // Handle product card clicks
        document.addEventListener('click', function(e) {
            // Delegated event handling for size buttons (they're added dynamically)
            if (e.target.matches('.quick-add-size-btn')) {
                e.preventDefault();
                e.stopPropagation();
                
                const productId = e.target.closest('.quick-add-sizes').getAttribute('data-product-id');
                const size = e.target.getAttribute('data-size');
                
                if (productId && size) {
                    self.quickAddToCart(productId, size);
                }
            }
        });
        
        // Close modal when clicking on overlay or close button
        document.addEventListener('click', function(e) {
            if (e.target.matches('#quick-view-overlay, #quick-view-modal .quick-view-close')) {
                self.closeQuickView();
            }
        });
        
        // Close modal on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                self.closeQuickView();
            }
        });
        
        // Modal internal controls
        document.addEventListener('click', function(e) {
            // Thumbnail clicks
            if (e.target.matches('.quick-view-thumbnail')) {
                const thumbnails = document.querySelectorAll('.quick-view-thumbnail');
                thumbnails.forEach(thumb => thumb.classList.remove('active'));
                e.target.classList.add('active');
                
                const mainImage = document.getElementById('quick-view-main-image');
                mainImage.src = e.target.src;
            }
            
            // Color selection
            if (e.target.matches('.quick-view-color-option, .quick-view-color-option *')) {
                const colorOption = e.target.closest('.quick-view-color-option');
                const colorOptions = document.querySelectorAll('.quick-view-color-option');
                
                colorOptions.forEach(option => option.classList.remove('active'));
                colorOption.classList.add('active');
                
                const selectedColor = colorOption.getAttribute('data-color');
                self.selectedVariant.color = selectedColor;
                
                // Filter images to show only those for this color
                if (self.currentProduct && self.currentProduct.images) {
                    self.filterImagesByColor(selectedColor);
                }
                
                self.updateQuickViewState();
            }
            
            // Size selection
            if (e.target.matches('.quick-view-size-option')) {
                if (e.target.classList.contains('unavailable')) {
                    // Cannot select unavailable size
                    return;
                }
                
                const selectedSize = e.target.getAttribute('data-size');
                // Size selected
                
                const sizeOptions = document.querySelectorAll('.quick-view-size-option');
                sizeOptions.forEach(option => option.classList.remove('active'));
                e.target.classList.add('active');
                
                self.selectedVariant.size = selectedSize;
                
                self.updateQuickViewState();
            }
            
            // Quantity buttons
            if (e.target.matches('#quick-view-quantity-decrease')) {
                if (self.selectedVariant.quantity > 1) {
                    self.selectedVariant.quantity--;
                    document.getElementById('quick-view-quantity-display').textContent = self.selectedVariant.quantity;
                }
            }
            
            if (e.target.matches('#quick-view-quantity-increase')) {
                const maxStock = self.getAvailableStock();
                if (self.selectedVariant.quantity < maxStock) {
                    self.selectedVariant.quantity++;
                    document.getElementById('quick-view-quantity-display').textContent = self.selectedVariant.quantity;
                }
            }
            
            // Add to cart button in modal was removed
            
            // View full details button
            if (e.target.matches('#quick-view-full-btn')) {
                if (self.currentProduct) {
                    // Include the selected color in the URL if available
                    let url = `product.html?id=${self.currentProduct.id}`;
                    if (self.selectedVariant && self.selectedVariant.color) {
                        url += `&color=${encodeURIComponent(self.selectedVariant.color)}`;
                    }
                    window.location.href = url;
                }
            }
        });
        
        // Add quick view buttons to all product cards
        this.addQuickViewButtonsToCards();
        
        // Monitor DOM for new product cards
        this.observeProductCards();
    }
    
    observeProductCards() {
        // Use MutationObserver to watch for newly added product cards
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach((node) => {
                        // Check if the added node is a product card or contains product cards
                        if (node.nodeType === 1) { // ELEMENT_NODE
                            if (node.classList && node.classList.contains('product-card')) {
                                this.addQuickViewButtonToCard(node);
                            } else {
                                const cards = node.querySelectorAll('.product-card');
                                cards.forEach(card => this.addQuickViewButtonToCard(card));
                            }
                        }
                    });
                }
            });
        });
        
        // Start observing the document body for DOM changes
        observer.observe(document.body, { childList: true, subtree: true });
    }
    
    addQuickViewButtonsToCards() {
        const productCards = document.querySelectorAll('.product-card');
        productCards.forEach(card => this.addQuickViewButtonToCard(card));
    }
    
    addQuickViewButtonToCard(card) {
        // Check if card already has quick add to bag overlay
        if (card.querySelector('.product-quick-add-overlay')) return;
        
        // Get product data
        const productId = card.getAttribute('data-product-id');
        if (!productId) return;
        
        // Create the quick add overlay
        const quickAddOverlay = document.createElement('div');
        quickAddOverlay.className = 'product-quick-add-overlay';
        quickAddOverlay.innerHTML = `
            <div class="quick-add-title">QUICK ADD TO BAG</div>
            <div class="quick-add-colors" data-product-id="${productId}" style="display: none;">
                <!-- Color buttons will be added dynamically -->
            </div>
            <div class="quick-add-sizes" data-product-id="${productId}">
                <!-- Size buttons will be added dynamically -->
                <div class="quick-add-sizes-loading">Loading sizes...</div>
            </div>
        `;
        
        card.appendChild(quickAddOverlay);
        
        // Fetch product data (colors and sizes)
        this.fetchProductOptions(productId, quickAddOverlay);
    }
    
    async fetchProductOptions(productId, overlay) {
        try {
            const product = await this.fetchProductData(productId);
            if (!product) {
                overlay.querySelector('.quick-add-sizes').innerHTML = '<div class="quick-add-error">Product not available</div>';
                return;
            }
            
            const colorsContainer = overlay.querySelector('.quick-add-colors');
            const sizesContainer = overlay.querySelector('.quick-add-sizes');
            
            // Product with colors
            if (product.colors && product.colors.length > 0) {
                // Show and populate colors container
                colorsContainer.style.display = 'flex';
                
                // Create color buttons
                colorsContainer.innerHTML = product.colors.map((color, index) => `
                    <div class="quick-add-color-btn ${index === 0 ? 'selected' : ''}"
                         style="color: ${color.code}"
                         data-color="${color.name}">
                        <span class="quick-add-color-name">${color.name}</span>
                    </div>
                `).join('');
                
                // Initially selected color
                const selectedColor = product.colors[0].name;
                
                // Populate sizes for the initially selected color
                this.updateSizesForColor(product, selectedColor, sizesContainer, productId);
                
                // Add event listeners to color buttons
                const colorButtons = colorsContainer.querySelectorAll('.quick-add-color-btn');
                colorButtons.forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // Update UI for selected color
                        colorButtons.forEach(b => b.classList.remove('selected'));
                        btn.classList.add('selected');
                        
                        // Get the selected color
                        const color = btn.getAttribute('data-color');
                        
                        // Update product card image if possible
                        this.updateProductCardImage(color, overlay.closest('.product-card'));
                        
                        // Update sizes based on the selected color
                        this.updateSizesForColor(product, color, sizesContainer, productId);
                    });
                });
            } else {
                // Product without colors - just show sizes
                colorsContainer.style.display = 'none';
                
                if (!product.sizes || product.sizes.length === 0) {
                    sizesContainer.innerHTML = '<div class="quick-add-error">No sizes available</div>';
                    return;
                }
                
                // Render size buttons with simplified display
                sizesContainer.innerHTML = product.sizes.map(size => {
                    // Store original size as data attribute but display simplified version
                    const displaySize = this.simplifySize(size);
                    return `<button class="quick-add-size-btn" data-size="${size}">${displaySize}</button>`;
                }).join('');
                
                // Add click event listeners to size buttons
                const sizeButtons = sizesContainer.querySelectorAll('.quick-add-size-btn');
                sizeButtons.forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const size = btn.getAttribute('data-size');
                        this.quickAddToCart(productId, size);
                    });
                });
            }
        } catch (error) {
            // Error fetching product options
            overlay.querySelector('.quick-add-sizes').innerHTML = '<div class="quick-add-error">Error loading options</div>';
        }
    }
    
    updateSizesForColor(product, colorName, sizesContainer, productId) {
        if (!product || !product.sizes || product.sizes.length === 0) {
            sizesContainer.innerHTML = '<div class="quick-add-error">No sizes available</div>';
            return;
        }
        
        // Filter sizes available for this color based on inventory
        const availableSizes = product.sizes.filter(size => {
            const inventoryKey = `${colorName}-${size}`;
            const stockLevel = product.inventory[inventoryKey] || 0;
            return stockLevel > 0;
        });
        
        if (availableSizes.length === 0) {
            sizesContainer.innerHTML = '<div class="quick-add-error">No sizes available for this color</div>';
            return;
        }
        
        // Render size buttons for this color with simplified display
        sizesContainer.innerHTML = availableSizes.map(size => {
            // Store original size as data attribute but display simplified version
            const displaySize = this.simplifySize(size);
            return `<button class="quick-add-size-btn" data-size="${size}" data-color="${colorName}">${displaySize}</button>`;
        }).join('');
        
        // Add click event listeners to size buttons
        const sizeButtons = sizesContainer.querySelectorAll('.quick-add-size-btn');
        sizeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const size = btn.getAttribute('data-size');
                const color = btn.getAttribute('data-color');
                this.quickAddToCart(productId, size, color);
            });
        });
    }
    
    async openQuickView(productId) {
        // Open quick view for product
        this.showLoading(true);
        this.openModal();
        
        try {
            // Reset selected variant
            this.selectedVariant = {
                color: null,
                size: null,
                quantity: 1
            };
            
            // Fetch product data
            const product = await this.fetchProductData(productId);
            
            if (!product) {
                this.closeQuickView();
                // Product not found
                return;
            }
            
            this.currentProduct = product;
            this.renderQuickView();
            
        } catch (error) {
            // Error opening quick view - silently handle
        } finally {
            this.showLoading(false);
        }
    }
    
    async quickAddToCart(productId, size, color = null) {
        // Adding product to cart
        
        try {
            // Show loading/processing indicator
            this.showAddingFeedback(productId, size, color);
            
            // Fetch product data
            const product = await this.fetchProductData(productId);
            
            if (!product) {
                this.showNotification('Product not found', 'error');
                return;
            }
            
            // Determine which color to use (passed color or first available color)
            const selectedColor = color || (product.colors && product.colors.length > 0 ? product.colors[0].name : null);
            
            // Find the image for the selected color if possible
            let productImage = product.images && product.images.length > 0 ? product.images[0] : null;
            
            // If we have color and multiple images, try to find matching image
            if (selectedColor && product.images && product.images.length > 1 && product.variants) {
                // Try to find a variant with matching color
                const colorVariant = product.variants.find(v => v.color === selectedColor);
                if (colorVariant && colorVariant.id) {
                    // If variant has its own image, use it
                    const variantImageIndex = Math.min(product.variants.indexOf(colorVariant), product.images.length - 1);
                    if (variantImageIndex >= 0) {
                        productImage = product.images[variantImageIndex];
                    }
                }
            }
            
            // Create cart item
            const cartItem = {
                ...product,
                selectedSize: size,
                selectedColor: selectedColor,
                quantity: 1,
                variants: {
                    size: size,
                    color: selectedColor
                },
                variant: {
                    size: size,
                    color: selectedColor
                },
                size: size,
                color: selectedColor,
                image: productImage,
                mainImage: productImage
            };
            
            // Add to cart
            let cartAddSuccess = false;
            
            if (window.BobbyCart) {
                window.BobbyCart.addToCart(cartItem);
                // Added to cart using BobbyCart
                cartAddSuccess = true;
                
                // Open cart after a delay
                setTimeout(() => {
                    if (typeof window.BobbyCart.openCart === 'function') {
                        window.BobbyCart.openCart();
                    }
                }, 500);
            } else if (window.BobbyCarts) {
                window.BobbyCarts.addToCart(cartItem);
                // Added to cart using BobbyCarts
                cartAddSuccess = true;
                
                setTimeout(() => {
                    if (typeof window.BobbyCarts.openCart === 'function') {
                        window.BobbyCarts.openCart();
                    }
                }, 500);
            } else if (window.cartManager) {
                window.cartManager.addItem(cartItem);
                // Added to cart using cartManager
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
                // Use simplified size in notification
                const displaySize = this.simplifySize(size);
                this.showNotification(`Added ${product.title} (${displaySize}) to cart`, 'success');
            }
        } catch (error) {
            // Error adding to cart
            this.showNotification('Error adding to cart', 'error');
        }
    }
    
    showAddingFeedback(productId, selectedSize, selectedColor = null) {
        // Find all size and color containers for this product
        const sizeContainers = document.querySelectorAll(`.quick-add-sizes[data-product-id="${productId}"]`);
        const colorContainers = document.querySelectorAll(`.quick-add-colors[data-product-id="${productId}"]`);
        
        // Highlight the selected size buttons and disable all
        sizeContainers.forEach(container => {
            const sizeButtons = container.querySelectorAll('.quick-add-size-btn');
            
            // Disable all buttons
            sizeButtons.forEach(btn => {
                btn.disabled = true;
                
                // Highlight the selected size
                if (btn.getAttribute('data-size') === selectedSize) {
                    btn.classList.add('selected');
                    btn.innerText = 'Adding...';
                }
            });
            
            // Re-enable after a delay
            setTimeout(() => {
                sizeButtons.forEach(btn => {
                    btn.disabled = false;
                    
                    if (btn.getAttribute('data-size') === selectedSize) {
                        btn.classList.remove('selected');
                        // Reset text with simplified size
                        btn.innerText = this.simplifySize(selectedSize);
                    }
                });
            }, 1500);
        });
        
        // If a color was selected, highlight it
        if (selectedColor) {
            colorContainers.forEach(container => {
                const colorButtons = container.querySelectorAll('.quick-add-color-btn');
                
                colorButtons.forEach(btn => {
                    // Find the color button that matches the selected color
                    if (btn.getAttribute('data-color') === selectedColor) {
                        // Add extra highlight
                        const originalScale = btn.style.transform;
                        btn.style.transform = 'scale(1.3)';
                        btn.style.boxShadow = '0 0 8px rgba(255, 255, 255, 0.8)';
                        
                        // Reset after a delay
                        setTimeout(() => {
                            btn.style.transform = originalScale;
                            btn.style.boxShadow = '';
                        }, 1500);
                    }
                });
            });
        }
    }
    
    showNotification(message, type = 'info') {
        if (window.productManager && typeof window.productManager.showNotification === 'function') {
            window.productManager.showNotification(message, type);
        } else if (window.BobbyCart && typeof window.BobbyCart.showNotification === 'function') {
            window.BobbyCart.showNotification(message, type);
        } else if (window.BobbyCarts && typeof window.BobbyCarts.showNotification === 'function') {
            window.BobbyCarts.showNotification(message, type);
        } else {
            // Log notification message
            
            // Simple fallback notification
            const notification = document.createElement('div');
            notification.className = `quick-notification ${type}`;
            notification.innerText = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.classList.add('show');
            }, 10);
            
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300);
            }, 3000);
        }
    }
    
    async fetchProductData(productId) {
        try {
            // Use the Netlify function to get product data
            const response = await fetch('/.netlify/functions/get-products', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                // Add a timeout to prevent hanging if the server is slow
                signal: AbortSignal.timeout(10000) // 10 second timeout
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Handle both API formats (new format with products array inside object, or old format with direct array)
            let products = [];
            
            if (data.products && Array.isArray(data.products)) {
                // New API format
                products = data.products;
            } else if (Array.isArray(data)) {
                // Old API format with direct array
                products = data;
            } else if (data.error) {
                // Netlify function error
                return null;
            } else {
                // Unexpected data format
                throw new Error('Invalid data format received from API');
            }
            
            // Find the specific product
            const product = products.find(p => {
                if (!p) return false;
                const node = p.node || p;
                const shopifyId = node.id?.replace('gid://shopify/Product/', '');
                return node.handle === productId || shopifyId === productId || node.id === productId;
            });
            
            if (!product) {
                // Product not found in API response
                return null;
            }
            
            return this.processProductData(product.node || product);
            
        } catch (error) {
            // Error fetching product data
            return null;
        }
    }
    
    processProductData(shopifyProduct) {
        
        // Extract images
        const shopifyImages = shopifyProduct.images?.edges?.map(imgEdge => imgEdge.node.url) || [];
        
        // Extract variants
        const variants = [];
        const colorMap = {};
        const sizes = new Set();
        const inventory = {};
        
        // Process variant structure
        // Handle different variant data structures
        let variantsToProcess = [];
        
        if (shopifyProduct.variants && shopifyProduct.variants.edges) {
            variantsToProcess = shopifyProduct.variants.edges.map(edge => edge.node);
        } else if (shopifyProduct.variants && Array.isArray(shopifyProduct.variants)) {
            variantsToProcess = shopifyProduct.variants;
        } else {
            // No recognized variant format
        }
        
        // DIRECTLY EXTRACT ALL VARIANTS AND SIZES
        // This will preserve the exact variant structure from Shopify
        const directSizes = new Set();
        const directVariantMapping = new Map();
        
        variantsToProcess.forEach(variant => {
            // Process variant
            
            let color = '';
            let size = '';
            
            // IMPORTANT: Always add the variant title as a size option first
            // This ensures we capture all possible variants regardless of structure
            if (variant.title && variant.title !== 'Default Title') {
                // Simplify size display by extracting only the size part or simplifying it
                let simplifiedSize = variant.title;
                
                // Check if it contains a slash (like "Black / Small")
                if (simplifiedSize.includes('/')) {
                    // Extract the size part (usually after the slash)
                    simplifiedSize = simplifiedSize.split('/').pop().trim();
                }
                
                // Simplify common size formats
                simplifiedSize = this.simplifySize(simplifiedSize);
                
                size = simplifiedSize;
                sizes.add(size);
            }
            
            // Handle different selectedOptions formats
            if (variant.selectedOptions && Array.isArray(variant.selectedOptions)) {
                // Look for color and size options
                let foundSize = false;
                variant.selectedOptions.forEach(option => {
                    // Safely check option name, normalize to lowercase
                    const optionName = option.name?.toLowerCase() || '';
                    const optionValue = option.value || '';
                    
                    if (optionName === 'color') {
                        color = optionValue;
                        if (color && !colorMap[color]) {
                            colorMap[color] = {
                                name: color,
                                code: this.getColorCode(color)
                            };
                        }
                    } else if (optionName === 'size') {
                        // Simplify the size value
                        size = this.simplifySize(optionValue);
                        foundSize = true;
                        sizes.add(size);
                    }
                    
                    // IMPORTANT: Add ALL option values as potential sizes
                    // This ensures we don't miss any possible size variants
                    if (optionValue && optionValue !== 'Default Title') {
                        // Simplify the size value before adding
                        const simplifiedSize = this.simplifySize(optionValue);
                        sizes.add(simplifiedSize);
                    }
                });
                
                // Second pass: Look for size-like values in any option (if size not found)
                if (!foundSize) {
                    variant.selectedOptions.forEach(option => {
                        const optionName = option.name?.toLowerCase() || '';
                        const optionValue = option.value || '';
                        
                        // Skip options we already processed as color
                        if (optionName === 'color') return;
                        
                        // Check if this looks like a size value
                        const upperValue = optionValue.toUpperCase().trim();
                        if (['S', 'M', 'L', 'XL', '2XL', 'XXL', '3XL', 'XXXL'].includes(upperValue) ||
                            upperValue.includes('SMALL') ||
                            upperValue.includes('MEDIUM') ||
                            upperValue.includes('LARGE') ||
                            /^\d+$/.test(upperValue) || // Numeric sizes
                            /^[0-9]+\.[0-9]+$/.test(upperValue)) { // Decimal sizes
                            
                            // Simplify the size value
                            size = this.simplifySize(optionValue);
                            sizes.add(size);
                            foundSize = true;
                        }
                    });
                }
            } else if (variant.title) {
                // Alternative format: parse from title (e.g. "Black / XL")
                const variantTitle = variant.title.trim();
                
                // Skip if we already found a size
                if (!size) {
                    // Check for slash format (Color / Size)
                    if (variantTitle.includes('/')) {
                        // Try splitting by slash with spaces
                        let parts = variantTitle.split(' / ');
                        
                        // If that didn't work, try simple slash
                        if (parts.length < 2) {
                            parts = variantTitle.split('/');
                        }
                        
                        if (parts.length >= 2) {
                            // Assume first part is color, second is size (common Shopify pattern)
                            color = parts[0].trim();
                            // Simplify the size value
                            size = this.simplifySize(parts[1].trim());
                            
                            if (color && !colorMap[color]) {
                                colorMap[color] = {
                                    name: color,
                                    code: this.getColorCode(color)
                                };
                            }
                            
                            if (size) {
                                sizes.add(size);
                            }
                        }
                    }
                    // Check for "One Size" variants
                    else if (variantTitle.toLowerCase().includes('one size')) {
                        size = 'One Size';
                        sizes.add(size);
                    }
                    // Check for size-only variants
                    else {
                        const upperTitle = variantTitle.toUpperCase();
                        // Check if the entire title is a common size
                        if (['S', 'M', 'L', 'XL', '2XL', 'XXL', '3XL', 'XXXL'].includes(upperTitle) ||
                            upperTitle.includes('SMALL') ||
                            upperTitle.includes('MEDIUM') ||
                            upperTitle.includes('LARGE') ||
                            /^\d+$/.test(upperTitle) || // Numeric sizes
                            upperTitle) { // Just use the title as is if nothing else works
                            
                            // Simplify the size value
                            size = this.simplifySize(variantTitle);
                            sizes.add(size);
                        }
                        // For single variants with no size specified
                        else if (variantTitle !== 'Default Title') {
                            // For a product with only one variant, it might not have size
                            // Use title as is or default to "One Size"
                            size = 'One Size';
                            sizes.add(size);
                        }
                    }
                }
            }
            
            // Check for options.size directly (alternative format)
            if (!size && variant.options) {
                if (typeof variant.options.size === 'string') {
                    size = variant.options.size;
                    sizes.add(size);
                }
            }
            
            // Add to inventory tracking
            if (color && size) {
                inventory[`${color}-${size}`] = variant.quantityAvailable || 10;
            }
            
            variants.push({
                id: variant.id,
                color: color,
                size: size,
                price: parseFloat(variant.price.amount),
                comparePrice: variant.compareAtPrice ? parseFloat(variant.compareAtPrice.amount) : null,
                availableForSale: variant.availableForSale,
                quantityAvailable: variant.quantityAvailable || 10
            });
        });
        
        // Process all discovered sizes
        
        // Calculate pricing
        let minPrice = 0;
        try {
            minPrice = parseFloat(shopifyProduct.priceRange?.minVariantPrice?.amount || 0);
            if (isNaN(minPrice) || minPrice === 0) {
                // Fallback to first variant price if available
                minPrice = variants.length > 0 ? variants[0].price : 0;
            }
        } catch (e) {
            // Error parsing price
            minPrice = variants.length > 0 ? variants[0].price : 0;
        }
        
        const comparePrice = variants.find(v => v.comparePrice)?.comparePrice || null;
        
        return {
            id: shopifyProduct.handle,
            shopifyId: shopifyProduct.id,
            title: shopifyProduct.title,
            description: shopifyProduct.description || 'Premium streetwear with unique design.',
            category: this.extractCategory(shopifyProduct.title),
            price: minPrice,
            comparePrice: comparePrice,
            images: shopifyImages.length > 0 ? shopifyImages : [],
            variants: variants,
            colors: Object.values(colorMap),
            sizes: Array.from(sizes),
            inventory: inventory,
            new: shopifyProduct.tags.includes('new'),
            sale: comparePrice && comparePrice > minPrice
        };
    }
    
    extractCategory(title) {
        const titleLower = title.toLowerCase();
        if (titleLower.includes('hoodie')) return 'Hoodies';
        if (titleLower.includes('t-shirt') || titleLower.includes('tee')) return 'T-Shirts';
        if (titleLower.includes('sweatshirt')) return 'Sweatshirts';
        if (titleLower.includes('joggers') || titleLower.includes('pants')) return 'Joggers';
        if (titleLower.includes('windbreaker') || titleLower.includes('jacket')) return 'Windbreakers';
        if (titleLower.includes('beanie') || titleLower.includes('hat')) return 'Beanies';
        return 'Apparel';
    }
    
    // Helper method to simplify size strings - ONLY returns S, M, L, etc.
    simplifySize(sizeString) {
        if (!sizeString) return '';
        
        // First, aggressively handle any "Color / Size" format by extracting ONLY the size part
        if (sizeString.includes('/')) {
            const parts = sizeString.split('/').map(p => p.trim());
            // Use the last part (typically the size) for further processing
            sizeString = parts[parts.length - 1];
        }
        
        // Expanded list of color names to strip from size strings
        const colorNames = [
            'black', 'white', 'navy', 'blue', 'red', 'green', 'yellow', 'purple',
            'pink', 'orange', 'brown', 'gray', 'grey', 'maroon', 'forest', 'heather',
            'charcoal', 'vintage', 'french', 'navy blazer', 'azure', 'crimson',
            'teal', 'olive', 'burgundy', 'lavender', 'mustard', 'indigo', 'mauve',
            'hunter', 'cream', 'ivory', 'beige', 'khaki', 'tan', 'sage', 'slate'
        ];
        
        // More aggressive color stripping
        colorNames.forEach(color => {
            // Remove color name if it appears anywhere in the string (word boundaries)
            const regexWord = new RegExp(`\\b${color}\\b`, 'i');
            sizeString = sizeString.replace(regexWord, '');
            
            // Remove color with space after
            const regexAfter = new RegExp(`${color}\\s+`, 'i');
            sizeString = sizeString.replace(regexAfter, '');
            
            // Remove color with space before
            const regexBefore = new RegExp(`\\s+${color}`, 'i');
            sizeString = sizeString.replace(regexBefore, '');
        });
        
        // Remove any remaining slashes and trim whitespace
        sizeString = sizeString.replace('/', '').trim();
        
        // Convert to uppercase for comparison
        const upperSize = sizeString.toUpperCase().trim();
        
        // Expanded size mappings
        const sizeMap = {
            'SMALL': 'S',
            'MEDIUM': 'M',
            'LARGE': 'L',
            'EXTRA LARGE': 'XL',
            'EXTRA-LARGE': 'XL',
            'EXTRA SMALL': 'XS',
            'EXTRA-SMALL': 'XS',
            '2XL': 'XXL',
            'XXL': 'XXL',
            '2X': 'XXL',
            '3XL': '3XL',
            'XXXL': '3XL',
            '3X': '3XL',
            'ONE SIZE': 'OS',
            'ONESIZE': 'OS',
            'ONE-SIZE': 'OS'
        };
        
        // Check for exact matches in our mapping
        if (sizeMap[upperSize]) {
            return sizeMap[upperSize];
        }
        
        // Check for common size abbreviations - direct return for clean formats
        if (['S', 'M', 'L', 'XL', 'XXL', 'XS', 'OS'].includes(upperSize)) {
            return upperSize;
        }
        
        // Check for partial matches
        for (const [key, value] of Object.entries(sizeMap)) {
            if (upperSize.includes(key)) {
                return value;
            }
        }
        
        // If it's a numeric size (like 32, 34, etc.), keep it as is
        if (/^\d+$/.test(upperSize)) {
            return upperSize;
        }
        
        // For anything else, try to extract just letter-based sizes if present
        const sizeMatch = upperSize.match(/\b(XS|S|M|L|XL|XXL|XXXL)\b/);
        if (sizeMatch) {
            return sizeMatch[0];
        }
        
        // Fallback to just returning "OS" (one size) if we can't determine
        // This ensures we always show a simple size format
        return 'OS';
    }
    
    getColorCode(colorName) {
        // Enhanced color mapping that fits Bobby Streetwear theme
        const colorMap = {
            // Core colors with theme-matching hues
            'Black': '#000000',
            'White': '#FFFFFF',
            'Red': '#EF4444',  // Tailwind red-500
            'Green': '#10B981', // Tailwind emerald-500
            'Blue': '#3B82F6',  // Tailwind blue-500
            'Yellow': '#F59E0B', // Tailwind amber-500
            'Purple': '#A855F7', // Site's main accent color
            'Orange': '#F97316', // Tailwind orange-500
            'Pink': '#EC4899',   // Tailwind pink-500
            
            // Grays and neutrals
            'Gray': '#6B7280',   // Tailwind gray-500
            'Grey': '#6B7280',   // Tailwind gray-500
            'Slate': '#64748B',  // Tailwind slate-500
            
            // Dark colors
            'Navy': '#1E3A8A',   // Tailwind blue-900
            'Navy Blazer': '#1E3A8A', // Tailwind blue-900
            'Maroon': '#9F1239', // Tailwind rose-900
            'Brown': '#92400E',  // Tailwind amber-900
            'Charcoal': '#1F2937', // Tailwind gray-800
            'Charcoal Heather': '#1F2937', // Tailwind gray-800
            'Vintage Black': '#171717', // Tailwind neutral-900
            
            // Light colors
            'Heather Grey': '#E5E7EB', // Tailwind gray-200
            
            // Fashion colors
            'French Navy': '#1E40AF', // Tailwind blue-800
            'Forest Green': '#166534', // Tailwind green-800
            'Lavender': '#C084FC', // Tailwind purple-400
            'Mint': '#34D399',    // Tailwind emerald-400
            'Coral': '#F87171',   // Tailwind red-400
            'Olive': '#84CC16',   // Tailwind lime-500
            'Wine': '#BE185D',    // Tailwind pink-800
            'Indigo': '#6366F1',  // Site's secondary accent color
            'Cream': '#FEFCE8',   // Tailwind yellow-50
            'Beige': '#FFFBEB'    // Tailwind amber-50
        };
        
        // Return the color code or the site's main accent color as default
        return colorMap[colorName] || '#A855F7';
    }
    
    renderQuickView() {
        if (!this.currentProduct) return;
        
        // Basic info
        document.getElementById('quick-view-category').textContent = this.currentProduct.category;
        document.getElementById('quick-view-title').textContent = this.currentProduct.title;
        document.getElementById('quick-view-description').innerHTML = this.currentProduct.description;
        
        // Price
        document.getElementById('quick-view-price-current').textContent = '$' + this.currentProduct.price.toFixed(2);
        
        const priceOriginal = document.getElementById('quick-view-price-original');
        const priceDiscount = document.getElementById('quick-view-price-discount');
        
        if (this.currentProduct.comparePrice && this.currentProduct.comparePrice > this.currentProduct.price) {
            priceOriginal.textContent = '$' + this.currentProduct.comparePrice.toFixed(2);
            priceOriginal.style.display = 'inline';
            
            const discount = Math.round(((this.currentProduct.comparePrice - this.currentProduct.price) / this.currentProduct.comparePrice) * 100);
            priceDiscount.textContent = '-' + discount + '%';
            priceDiscount.style.display = 'inline';
        } else {
            priceOriginal.style.display = 'none';
            priceDiscount.style.display = 'none';
        }
        
        // Images
        const mainImage = document.getElementById('quick-view-main-image');
        const thumbnailsContainer = document.getElementById('quick-view-thumbnails');
        
        if (this.currentProduct.images && this.currentProduct.images.length > 0) {
            mainImage.src = this.currentProduct.images[0];
            mainImage.alt = this.currentProduct.title;
            
            // Add data-color attributes to all images for better color filtering
            thumbnailsContainer.innerHTML = this.currentProduct.images.map((image, index) => {
                // Try to determine which color this image is for
                let imageColor = '';
                if (this.currentProduct.colors && this.currentProduct.colors.length > 0) {
                    // First try to match color in the URL path
                    const imageUrl = image.toLowerCase();
                    for (const color of this.currentProduct.colors) {
                        const colorName = color.name.toLowerCase();
                        // Check various URL patterns that might indicate color
                        if (
                            imageUrl.includes(`/${colorName}_`) ||
                            imageUrl.includes(`/${colorName}-`) ||
                            imageUrl.includes(`_${colorName}_`) ||
                            imageUrl.includes(`-${colorName}-`) ||
                            imageUrl.includes(`_${colorName}.`) ||
                            imageUrl.includes(`-${colorName}.`) ||
                            imageUrl.includes(`color=${colorName}`) ||
                            imageUrl.includes(`color-${colorName}`)
                        ) {
                            imageColor = color.name;
                            break;
                        }
                    }
                    
                    // If still no match, check if color name appears anywhere in URL
                    if (!imageColor) {
                        for (const color of this.currentProduct.colors) {
                            if (imageUrl.includes(color.name.toLowerCase())) {
                                imageColor = color.name;
                                break;
                            }
                        }
                    }
                }
                
                return `
                    <img src="${image}"
                         alt="${this.currentProduct.title}"
                         class="quick-view-thumbnail ${index === 0 ? 'active' : ''}"
                         data-color="${imageColor}">
                `;
            }).join('');
        }
        
        // Color options
        const colorOptionsContainer = document.getElementById('quick-view-color-options');
        const colorGroup = document.getElementById('quick-view-color-group');
        
        if (this.currentProduct.colors && this.currentProduct.colors.length > 0) {
            colorOptionsContainer.innerHTML = this.currentProduct.colors.map((color, index) => `
                <div class="quick-view-color-option ${index === 0 ? 'active' : ''}" 
                     style="color: ${color.code}" 
                     data-color="${color.name}">
                    <span class="quick-view-color-name">${color.name}</span>
                </div>
            `).join('');
            
            // Set initial selected color
            this.selectedVariant.color = this.currentProduct.colors[0].name;
            colorGroup.style.display = 'block';
        } else {
            colorGroup.style.display = 'none';
        }
        
        // Size options
        const sizeOptionsContainer = document.getElementById('quick-view-size-options');
        const sizeGroup = document.getElementById('quick-view-size-group');
        // Create a local sizes Set using the product's sizes or an empty set
        const sizes = new Set(this.currentProduct.sizes || []);
        
        // Get variant data from product
        const variantsToProcess = this.currentProduct.variants || [];
        
        // Process discovered sizes
        
        // Special handling if no sizes were found
        if (!sizes.size || sizes.size === 0) {
            // Add emergency fallbacks
            
            // First, extract ANY variant titles available
            if (variantsToProcess && variantsToProcess.length > 0) {
                
                variantsToProcess.forEach(variant => {
                    // Add EVERY variant title without filtering
                    if (variant.title) {
                        const title = variant.title.trim();
                        sizes.add(title);
                        // Added title
                    }
                    
                    // Also add any raw option values
                    if (variant.selectedOptions && Array.isArray(variant.selectedOptions)) {
                        variant.selectedOptions.forEach(opt => {
                            if (opt.value) {
                                sizes.add(opt.value);
                                // Added option value
                            }
                        });
                    }
                });
            }
            
            // If still no sizes found, we'll rely on the raw variant data that was already added
            if (!sizes.size) {
                // Using raw variant data
            }
        }
        
        // Convert the sizes Set to an array and assign to the product
        this.currentProduct.sizes = Array.from(sizes);
        
        // Add inventory entries for all sizes
        if (this.currentProduct.colors && this.currentProduct.colors.length > 0) {
            this.currentProduct.colors.forEach(color => {
                this.currentProduct.sizes.forEach(size => {
                    const inventoryKey = `${color.name}-${size}`;
                    this.currentProduct.inventory[inventoryKey] = 10; // Default stock of 10
                });
            });
        } else {
            // If no colors, add inventory for sizes without color
            this.currentProduct.sizes.forEach(size => {
                const inventoryKey = `-${size}`; // No color
                this.currentProduct.inventory[inventoryKey] = 10;
            });
        }
        
        if (this.currentProduct.sizes && this.currentProduct.sizes.length > 0) {
            
            sizeOptionsContainer.innerHTML = this.currentProduct.sizes.map((size) => {
                const inventoryKey = this.selectedVariant.color ?
                    `${this.selectedVariant.color}-${size}` : null;
                const stockLevel = inventoryKey ?
                    (this.currentProduct.inventory[inventoryKey] || 0) : 10;
                const available = inventoryKey ? (stockLevel > 0) : true;
                
                
                // Use simplified size for display
                const displaySize = this.simplifySize(size);
                
                return `
                    <div class="quick-view-size-option ${available ? '' : 'unavailable'}"
                         data-size="${size}"
                         data-display-size="${displaySize}">
                        ${displaySize}
                    </div>
                `;
            }).join('');
            
            sizeGroup.style.display = 'block';
        } else {
            // No sizes available
            sizeGroup.style.display = 'none';
            
            // No sizes available for this product
        }
        
        // Reset quantity
        document.getElementById('quick-view-quantity-display').textContent = '1';
        
        // Update buttons state
        this.updateQuickViewState();
    }
    
    updateQuickViewState() {
        if (!this.currentProduct) {
            // Cannot update state - no current product
            return;
        }
        
        // Check if we're in the quick view modal (product details) or quick add overlay
        const isInQuickViewModal = document.getElementById('quick-view-modal').classList.contains('active');
        
        // In product details view, show all sizes regardless of color selection
        if (isInQuickViewModal) {
            const sizeOptions = document.querySelectorAll('.quick-view-size-option');
            // Showing all sizes regardless of color
            
            if (sizeOptions.length === 0) {
                // No size options found in DOM - attempt to re-render all sizes if they're missing
                if (this.currentProduct.sizes && this.currentProduct.sizes.length > 0) {
                    // Attempting to re-render size options
                    const sizeOptionsContainer = document.getElementById('quick-view-size-options');
                    const sizeGroup = document.getElementById('quick-view-size-group');
                    
                    if (sizeOptionsContainer && sizeGroup) {
                        // Show ALL sizes regardless of color/inventory in product details view
                        sizeOptionsContainer.innerHTML = this.currentProduct.sizes.map((size) => {
                            // Use simplified size for display
                            const displaySize = this.simplifySize(size);
                            return `
                                <div class="quick-view-size-option"
                                    data-size="${size}">
                                    ${displaySize}
                                </div>
                            `;
                        }).join('');
                        
                        sizeGroup.style.display = 'block';
                    }
                }
            } else {
                // In product details view, enable all size options
                sizeOptions.forEach(option => {
                    option.classList.remove('unavailable');
                });
                
            }
        }
        // In quick add overlay, filter sizes by color availability
        else if (this.selectedVariant.color) {
            const sizeOptions = document.querySelectorAll('.quick-add-size-btn');
            // Updating size options based on color
            
            if (sizeOptions.length > 0) {
                // Update existing size options in quick add overlay
                let availableSizes = [];
                
                sizeOptions.forEach(option => {
                    const size = option.getAttribute('data-size');
                    const inventoryKey = `${this.selectedVariant.color}-${size}`;
                    const stockLevel = this.currentProduct.inventory[inventoryKey] || 0;
                    const available = stockLevel > 0;
                    
                    // Checking size availability and stock
                    option.disabled = !available;
                    
                    if (available) {
                        availableSizes.push(size);
                    }
                });
                
            }
        }
        
        // The Add to Cart button has been removed from the modal
        // Update state logic for future reference
        let canAddToCart = false;
        
        if (this.currentProduct.sizes && this.currentProduct.sizes.length > 0) {
            if (!this.selectedVariant.size) {
                // Size selection required
                canAddToCart = false;
            } else if (!this.selectedVariant.color && this.currentProduct.colors.length > 0) {
                // Color selection required
                canAddToCart = false;
            } else {
                const stock = this.getAvailableStock();
                // Checking stock availability
                canAddToCart = stock > 0;
            }
        } else {
            // No sizes needed
            if (!this.selectedVariant.color && this.currentProduct.colors.length > 0) {
                canAddToCart = false;
            } else {
                canAddToCart = true;
            }
        }
        
        // Store the state for potential future use
        this.canAddToCart = canAddToCart;
        
    }
    
    getAvailableStock() {
        if (!this.currentProduct || !this.selectedVariant.color || !this.selectedVariant.size) {
            return 0;
        }
        
        const variantKey = `${this.selectedVariant.color}-${this.selectedVariant.size}`;
        return this.currentProduct.inventory[variantKey] || 0;
    }
    
    // Filter images by color using a direct approach with data-color attributes
    // This method is used by both quick-view and product-detail pages
    filterImagesByColor(colorName) {
        if (!this.currentProduct || !this.currentProduct.images || this.currentProduct.images.length === 0) {
            // No images to filter
            return;
        }
        
        // If no colorName is provided, don't filter
        if (!colorName) {
            return;
        }
        
        // Helper function to deduplicate image URLs with improved accuracy
        const deduplicateImages = (images) => {
            // Create a map to track image URLs we've seen
            const uniqueImagesMap = new Map();
            const uniqueImages = [];
            
            images.forEach(imgUrl => {
                try {
                    // Generate a more comprehensive key using both path and query parameters
                    const urlObj = new URL(imgUrl, window.location.origin);
                    const pathname = urlObj.pathname;
                    
                    // Get the last two path segments if available (more precise than just filename)
                    const pathParts = pathname.split('/').filter(part => part.trim() !== '');
                    const lastSegments = pathParts.slice(-Math.min(2, pathParts.length)).join('/');
                    
                    // Include any 'variant' or 'id' query params if they exist
                    const variantId = urlObj.searchParams.get('variant') || '';
                    const productId = urlObj.searchParams.get('id') || '';
                    
                    // Create a composite key that includes important URL components
                    const key = `${lastSegments}${variantId}${productId}`;
                    
                    // Use the full URL as a fallback if key generation fails
                    const dedupeKey = key || imgUrl;
                    
                    // Only add if we haven't seen this key before
                    if (!uniqueImagesMap.has(dedupeKey)) {
                        uniqueImagesMap.set(dedupeKey, true);
                        uniqueImages.push(imgUrl);
                    }
                } catch (e) {
                    // If URL parsing fails, use the full URL as the key
                    if (!uniqueImagesMap.has(imgUrl)) {
                        uniqueImagesMap.set(imgUrl, true);
                        uniqueImages.push(imgUrl);
                    }
                }
            });
            
            // If deduplication reduced the images too much, revert to original set
            if (uniqueImages.length < Math.max(2, images.length / 3)) {
                console.log(`Deduplication was too aggressive (${images.length} → ${uniqueImages.length}), using all images`);
                return images;
            }
            
            console.log(`Deduplicated from ${images.length} to ${uniqueImages.length} images`);
            return uniqueImages;
        };
        
        // First try to find images in the colorImages mapping if available
        if (this.currentProduct.colorImages && this.currentProduct.colorImages[colorName]) {
            // Use these specific images for this color
            let colorSpecificImages = this.currentProduct.colorImages[colorName];
            
            // Deduplicate images
            colorSpecificImages = deduplicateImages(colorSpecificImages);
            
            // Set these as the filtered images if we're in product-detail.js context
            if (this.filteredImages) {
                this.filteredImages = colorSpecificImages;
            }
            
            if (typeof this.updateThumbnailGrid === 'function') {
                this.updateThumbnailGrid();
            }
            return;
        }
        
        // Try to find variant images in the Shopify product data
        let variantImages = [];
        if (this.currentProduct.variants && this.currentProduct.variants.length > 0) {
            // Look for variants matching this color
            const colorVariants = this.currentProduct.variants.filter(variant =>
                variant.color && variant.color.toLowerCase() === colorName.toLowerCase()
            );
            
            // Extract images from matching variants
            if (colorVariants.length > 0) {
                colorVariants.forEach(variant => {
                    if (variant.image) {
                        variantImages.push(variant.image);
                    }
                });
            }
        }
        
        // If we found variant images, use them (after deduplication)
        if (variantImages.length > 0) {
            // Deduplicate images
            variantImages = deduplicateImages(variantImages);
            
            if (this.filteredImages) {
                this.filteredImages = variantImages;
            }
            
            if (typeof this.updateThumbnailGrid === 'function') {
                this.updateThumbnailGrid();
            }
            return;
        }
        
        // If no explicit color mapping or variant images, proceed with enhanced image filtering
        
        // Get all product images
        const allImages = this.currentProduct.images || [];
        
        // Support both quick-view and product-detail pages for DOM elements
        const thumbnailSelectors = ['.quick-view-thumbnail', '.thumbnail img', '.gallery-item img'];
        const thumbnails = [];
        
        // Collect all thumbnails from both selectors
        thumbnailSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(thumb => {
                thumbnails.push(thumb);
            });
        });
        
        // First: Set data-color attributes for any thumbnails that don't have them
        thumbnails.forEach(thumbnail => {
            if (!thumbnail.hasAttribute('data-color')) {
                // Try to detect color from URL
                const imgUrl = thumbnail.getAttribute('src').toLowerCase();
                const colorNameLower = colorName.toLowerCase();
                let matched = false;
                
                // 1. Standard URL pattern matching
                if (imgUrl.includes(`/${colorNameLower}`) ||
                    imgUrl.includes(`${colorNameLower}.`) ||
                    imgUrl.includes(`_${colorNameLower}`) ||
                    imgUrl.includes(`-${colorNameLower}`) ||
                    imgUrl.includes(`${colorNameLower}_`) ||
                    imgUrl.includes(`${colorNameLower}-`) ||
                    imgUrl.includes(`color=${colorNameLower}`) ||
                    imgUrl.includes(`color-${colorNameLower}`) ||
                    imgUrl.includes(`variant-${colorNameLower}`) ||
                    imgUrl.includes(colorNameLower)) {
                    
                    thumbnail.setAttribute('data-color', colorName);
                    matched = true;
                }
                
                // If already matched, skip further checks
                if (matched) return;
                
                // 2. Handle multi-word color names (e.g., "Forest Green")
                const colorParts = colorNameLower.split(/\s+/);
                if (colorParts.length > 1) {
                    // Check if all parts of the color name appear in the URL
                    const allPartsPresent = colorParts.every(part =>
                        imgUrl.includes(part) && part.length > 2  // Only consider parts with 3+ chars
                    );
                    
                    if (allPartsPresent) {
                        thumbnail.setAttribute('data-color', colorName);
                        matched = true;
                    }
                }
                
                // If already matched, skip further checks
                if (matched) return;
                
                // 3. Handle color initials (e.g., "fg" for "forest green")
                if (colorParts && colorParts.length > 1) {
                    const colorInitials = colorParts.map(part => part[0]).join('');
                    if (colorInitials.length > 1 && imgUrl.includes(colorInitials)) {
                        thumbnail.setAttribute('data-color', colorName);
                    }
                }
            }
        });
        
        // Enhanced image filtering: Two passes for improved matching
        const matchingImages = [];
        const potentiallyMatching = [];
        const nonMatchingImages = [];
        
        // First pass: Find all images with explicit color info
        allImages.forEach(imgUrl => {
            const imgUrlLower = imgUrl.toLowerCase();
            const colorNameLower = colorName.toLowerCase();
            let matched = false;
            
            // 1. Strong match: File contains color in specific URL patterns
            if (imgUrlLower.includes(`/${colorNameLower}/`) ||
                imgUrlLower.includes(`/${colorNameLower}_`) ||
                imgUrlLower.includes(`/${colorNameLower}-`) ||
                imgUrlLower.includes(`_${colorNameLower}_`) ||
                imgUrlLower.includes(`-${colorNameLower}-`) ||
                imgUrlLower.includes(`_${colorNameLower}.`) ||
                imgUrlLower.includes(`-${colorNameLower}.`) ||
                imgUrlLower.includes(`color=${colorNameLower}`) ||
                imgUrlLower.includes(`variant=${colorNameLower}`)) {
                
                matchingImages.push(imgUrl);
                matched = true;
            }
            
            // If already matched, skip further checks
            if (matched) return;
            
            // 2. Weak match: Color name appears somewhere in URL
            if (imgUrlLower.includes(colorNameLower)) {
                potentiallyMatching.push(imgUrl);
                matched = true;
            }
            
            // If already matched, skip further checks
            if (matched) return;
            
            // 3. Handle multi-word color names (e.g., "Forest Green")
            const colorParts = colorNameLower.split(/\s+/);
            if (colorParts.length > 1) {
                // Check if all parts of the color name appear in the URL
                const allPartsPresent = colorParts.every(part =>
                    imgUrlLower.includes(part) && part.length > 2  // Only consider parts with 3+ chars
                );
                
                if (allPartsPresent) {
                    potentiallyMatching.push(imgUrl);
                    matched = true;
                }
            }
            
            // If already matched, skip further checks
            if (matched) return;
            
            // 4. Handle color initials (e.g., "fg" for "forest green")
            if (colorParts.length > 1) {
                const colorInitials = colorParts.map(part => part[0]).join('');
                if (colorInitials.length > 1 && imgUrlLower.includes(colorInitials)) {
                    potentiallyMatching.push(imgUrl);
                    matched = true;
                }
            }
            
            // If not matched by any criteria, it's a non-matching image
            if (!matched) {
                nonMatchingImages.push(imgUrl);
            }
        });
        
        // Second pass: Use potentially matching images if no strong matches
        if (matchingImages.length === 0 && potentiallyMatching.length > 0) {
            matchingImages.push(...potentiallyMatching);
        }
        
        // Deduplicate matching images before updating DOM
        const uniqueMatchingImages = deduplicateImages(matchingImages);
        
        // Update DOM thumbnails based on our matching results
        thumbnails.forEach(thumbnail => {
            const thumbnailParent = thumbnail.closest('.thumbnail') ||
                                    thumbnail.closest('.gallery-item') ||
                                    thumbnail.parentElement;
            const imgUrl = thumbnail.getAttribute('src');
            
            // Show matching images, hide non-matching ones
            if (uniqueMatchingImages.includes(imgUrl)) {
                if (thumbnailParent) {
                    thumbnailParent.style.display = 'block';
                }
                thumbnail.style.display = 'block';
                // Also set data-color attribute for future reference
                thumbnail.setAttribute('data-color', colorName);
            } else {
                if (thumbnailParent) {
                    thumbnailParent.style.display = 'none';
                }
                thumbnail.style.display = 'none';
            }
        });
        
        // Update filtered images array if we're in the product-detail.js context
        if (this.filteredImages) {
            // If we found matching images, use them
            if (uniqueMatchingImages.length > 0) {
                this.filteredImages = uniqueMatchingImages;
            }
            // Otherwise fallback to all product images (deduplicated)
            else {
                this.filteredImages = deduplicateImages(this.currentProduct.images);
            }
        }
        
        // If we didn't find any matching images, show all images
        if (uniqueMatchingImages.length === 0) {
            console.log(`No images found for color: ${colorName}, showing all images`);
            thumbnails.forEach(thumbnail => {
                const thumbnailParent = thumbnail.closest('.thumbnail') ||
                                        thumbnail.closest('.gallery-item') ||
                                        thumbnail.parentElement;
                if (thumbnailParent) {
                    thumbnailParent.style.display = 'block';
                }
                thumbnail.style.display = 'block';
            });
            
            // Reset filtered images to all images (deduplicated)
            if (this.filteredImages) {
                this.filteredImages = deduplicateImages(this.currentProduct.images);
            }
            
            // Use the first thumbnail as the first matching image
            if (thumbnails.length > 0) {
                this.updateMainImage(thumbnails[0]);
            }
        } else {
            // Update main image with the first matching image
            const firstMatchingThumbnail = thumbnails.find(thumb => {
                return uniqueMatchingImages.includes(thumb.getAttribute('src'));
            });
            
            if (firstMatchingThumbnail) {
                this.updateMainImage(firstMatchingThumbnail);
            }
            
            // If we're in product-detail.js context, update the thumbnail grid
            if (typeof this.updateThumbnailGrid === 'function') {
                this.updateThumbnailGrid();
            }
        }
        
        // IMPORTANT: If we're on the product detail page (not in quick view),
        // modify the product-detail.js behavior by injecting our function
        if (window.productDetailManager && typeof window.productDetailManager.filterImagesByColor === 'function') {
            // Overwrite the product detail manager's filterImagesByColor function
            window.productDetailManager.filterImagesByColor = this.filterImagesByColor.bind(this);
        }
    }
    
    // Helper method to update the main image and set active thumbnail
    updateMainImage(thumbnailElement) {
        if (!thumbnailElement) return;
        
        // Update main image - support both quick view and product detail pages
        const mainImageSelectors = ['#quick-view-main-image', '.main-image'];
        let mainImage = null;
        
        for (const selector of mainImageSelectors) {
            const img = document.querySelector(selector);
            if (img) {
                mainImage = img;
                break;
            }
        }
        
        if (mainImage) {
            mainImage.src = thumbnailElement.getAttribute('src');
            
            // Find all thumbnails to update active state
            const thumbnailSelectors = ['.quick-view-thumbnail', '.thumbnail', '.thumbnail img'];
            const allThumbnails = [];
            
            thumbnailSelectors.forEach(selector => {
                document.querySelectorAll(selector).forEach(thumb => {
                    allThumbnails.push(thumb);
                });
            });
            
            // Remove active class from all thumbnails
            allThumbnails.forEach(thumb => {
                thumb.classList.remove('active');
                const thumbParent = thumb.closest('.thumbnail');
                if (thumbParent) {
                    thumbParent.classList.remove('active');
                }
            });
            
            // Add active class to the selected thumbnail
            thumbnailElement.classList.add('active');
            const thumbnailParent = thumbnailElement.closest('.thumbnail');
            if (thumbnailParent) {
                thumbnailParent.classList.add('active');
            }
        }
    }
    
    // Update DOM with filtered images for a specific color
    updateDOMWithFilteredImages(colorName, filteredImages) {
        if (!filteredImages || filteredImages.length === 0) return;
        
        // Find all thumbnails
        const thumbnailSelectors = ['.quick-view-thumbnail', '.thumbnail', '.thumbnail img'];
        const allThumbnails = [];
        
        thumbnailSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(thumb => {
                allThumbnails.push(thumb);
            });
        });
        
        // No thumbnails found to update
        if (allThumbnails.length === 0) return;
        
        // First try to find a matching thumbnail from the filtered images
        let firstMatchingThumbnail = null;
        
        allThumbnails.forEach(thumbnail => {
            const src = thumbnail.getAttribute('src');
            const thumbnailParent = thumbnail.closest('.thumbnail') || thumbnail.parentElement;
            
            if (filteredImages.includes(src)) {
                // Show this thumbnail
                if (thumbnailParent) {
                    thumbnailParent.style.display = 'block';
                }
                thumbnail.style.display = 'block';
                
                // Set color data attribute
                thumbnail.setAttribute('data-color', colorName);
                
                // Store first matching thumbnail
                if (!firstMatchingThumbnail) {
                    firstMatchingThumbnail = thumbnail;
                }
            } else {
                // Hide this thumbnail
                if (thumbnailParent) {
                    thumbnailParent.style.display = 'none';
                }
                thumbnail.style.display = 'none';
            }
        });
        
        // If we found a matching thumbnail, update the main image
        if (firstMatchingThumbnail) {
            this.updateMainImage(firstMatchingThumbnail);
        }
        // If no matching thumbnails were found but we have filtered images,
        // we need to update the thumbnails grid
        else if (document.querySelector('.thumbnail-grid')) {
            if (typeof this.updateThumbnailGrid === 'function') {
                this.updateThumbnailGrid();
            }
        }
    }
    
    // Update product card image when a color is selected
    updateProductCardImage(colorName, productCard) {
        if (!productCard || !colorName) return;
        
        // Try to find cached product data
        const productId = productCard.getAttribute('data-product-id');
        if (!productId) return;
        
        // Updating product card image
        
        // Find the main product image in the card
        const productImage = productCard.querySelector('img');
        if (!productImage) return;
        
        // First, mark the image with data-color attribute for the currently selected color
        // This helps track which color's image is currently showing
        productImage.setAttribute('data-color', colorName);
        
        // Fetch the product data if we need it
        this.fetchProductData(productId).then(product => {
            if (!product || !product.images || product.images.length === 0) return;
            
            // First approach: Find images with matching data-color in product data
            const colorImages = [];
            
            // Try to find images with explicit data-color attribute
            for (const image of product.images) {
                // Check if this image has a data-color attribute (in our metadata)
                const imgUrl = image.toLowerCase();
                const colorNameLower = colorName.toLowerCase();
                
                // Use more robust URL pattern matching for color
                let matched = false;
                
                // Standard pattern matching
                if (imgUrl.includes(`/${colorNameLower}_`) ||
                    imgUrl.includes(`/${colorNameLower}-`) ||
                    imgUrl.includes(`_${colorNameLower}_`) ||
                    imgUrl.includes(`-${colorNameLower}-`) ||
                    imgUrl.includes(`_${colorNameLower}.`) ||
                    imgUrl.includes(`-${colorNameLower}.`) ||
                    imgUrl.includes(`color=${colorNameLower}`) ||
                    imgUrl.includes(`color-${colorNameLower}`) ||
                    imgUrl.includes(colorNameLower)) {
                    
                    colorImages.push(image);
                    matched = true;
                }
                
                // If already matched, continue to next image
                if (matched) continue;
                
                // Handle multi-word color names (e.g., "Forest Green")
                const colorParts = colorNameLower.split(/\s+/);
                if (colorParts.length > 1) {
                    // Check if all parts of the color name appear in the URL
                    const allPartsPresent = colorParts.every(part =>
                        imgUrl.includes(part) && part.length > 2  // Only consider parts with 3+ chars
                    );
                    
                    if (allPartsPresent) {
                        colorImages.push(image);
                        matched = true;
                    }
                }
                
                // If already matched, continue to next image
                if (matched) continue;
                
                // Handle color initials (e.g., "fg" for "forest green")
                if (colorParts && colorParts.length > 1) {
                    const colorInitials = colorParts.map(part => part[0]).join('');
                    if (colorInitials.length > 1 && imgUrl.includes(colorInitials)) {
                        colorImages.push(image);
                    }
                }
            }
            
            if (colorImages.length > 0) {
                // Found images for color
                productImage.src = colorImages[0];
                return;
            }
            
            // If no direct match, try variant index matching
            const colorVariant = product.variants.find(v => v.color === colorName);
            if (colorVariant) {
                const variantIndex = product.variants.indexOf(colorVariant);
                if (variantIndex >= 0 && variantIndex < product.images.length) {
                    // Found image by variant index
                    productImage.src = product.images[variantIndex];
                    productImage.setAttribute('data-color', colorName);
                    return;
                }
            }
            
            // Last resort: Try to find any image that might be for this color
            // by looking for color codes in the product data
            if (product.colors) {
                const colorObj = product.colors.find(c => c.name === colorName);
                if (colorObj && colorObj.code) {
                    // Try to find an image with similar color profile or by color index
                    // Matching image based on color index
                    const colorIndex = product.colors.indexOf(colorObj);
                    if (colorIndex >= 0 && colorIndex < product.images.length) {
                        productImage.src = product.images[colorIndex];
                        productImage.setAttribute('data-color', colorName);
                    }
                }
            }
        });
    }
    
    addToCart() {
        if (!this.currentProduct) {
            // Cannot add to cart - no current product
            alert('Error: No product selected');
            return;
        }
        
        // Check if we have all required selections
        if (this.currentProduct.colors.length > 0 && !this.selectedVariant.color) {
            // Color not selected
            alert('Please select a color');
            
            // Highlight color options section
            const colorGroup = document.getElementById('quick-view-color-group');
            if (colorGroup) {
                colorGroup.style.border = '2px solid #ef4444';
                colorGroup.style.padding = '10px';
                colorGroup.style.borderRadius = '8px';
                setTimeout(() => {
                    colorGroup.style.border = 'none';
                    colorGroup.style.padding = '0';
                }, 2000);
            }
            return;
        }
        
        if (this.currentProduct.sizes.length > 0 && !this.selectedVariant.size) {
            // Size not selected
            alert('Please select a size');
            
            // Highlight size options section
            const sizeGroup = document.getElementById('quick-view-size-group');
            if (sizeGroup) {
                sizeGroup.style.border = '2px solid #ef4444';
                sizeGroup.style.padding = '10px';
                sizeGroup.style.borderRadius = '8px';
                setTimeout(() => {
                    sizeGroup.style.border = 'none';
                    sizeGroup.style.padding = '0';
                }, 2000);
            }
            return;
        }
        
        // Find the variant ID
        let variantId = null;
        if (this.currentProduct.variants) {
            const matchingVariant = this.currentProduct.variants.find(v =>
                v.color === this.selectedVariant.color &&
                v.size === this.selectedVariant.size
            );
            
            if (matchingVariant) {
                variantId = matchingVariant.id;
            }
        }
        
        // Get current product image
        const image = document.getElementById('quick-view-main-image').src;
        
        // Create cart item with multiple variant formats to ensure compatibility
        const cartItem = {
            ...this.currentProduct,
            selectedColor: this.selectedVariant.color,
            selectedSize: this.selectedVariant.size,
            quantity: this.selectedVariant.quantity,
            shopifyVariantId: variantId,
            mainImage: image,
            image: image,
            // Provide variants in multiple formats for different cart systems
            variants: {
                size: this.selectedVariant.size,
                color: this.selectedVariant.color
            },
            // Alternative format needed by cart-checkout-system.js
            variant: {
                size: this.selectedVariant.size,
                color: this.selectedVariant.color
            },
            // Direct properties that might be checked
            size: this.selectedVariant.size,
            color: this.selectedVariant.color
        };
        
        const variantData = {
            ...this.selectedVariant,
            shopifyVariantId: variantId,
            image: image
        };
        
        // Try all available cart systems
        try {
            let cartAddSuccess = false;
            
            // Use consolidated cart system
            if (window.BobbyCart) {
                window.BobbyCart.addToCart(cartItem);
                // Added to cart using BobbyCart
                cartAddSuccess = true;
                
                // Dispatch custom event for other components
                document.dispatchEvent(new CustomEvent('quickview:addtocart', {
                    detail: {
                        product: cartItem,
                        variant: variantData
                    }
                }));
                
                // Try to force cart to open
                setTimeout(() => {
                    if (typeof window.BobbyCart.openCart === 'function') {
                        window.BobbyCart.openCart();
                    }
                }, 500);
            } else if (window.BobbyCarts) {
                // Fallback to old system if present
                window.BobbyCarts.addToCart(cartItem);
                // Added to cart using BobbyCarts
                cartAddSuccess = true;
                
                // Try to force cart to open
                setTimeout(() => {
                    if (typeof window.BobbyCarts.openCart === 'function') {
                        window.BobbyCarts.openCart();
                    }
                }, 500);
            } else if (window.cartManager) {
                // Try legacy cart system
                window.cartManager.addItem(cartItem);
                // Added to cart using cartManager
                cartAddSuccess = true;
                
                // Try to force cart to open
                setTimeout(() => {
                    if (typeof window.cartManager.openCart === 'function') {
                        window.cartManager.openCart();
                    }
                }, 500);
            } else {
                // No cart system available
                alert('The cart system is not available. This is likely because the site needs to be deployed to work correctly.');
                return;
            }
            
            if (cartAddSuccess) {
                // Close modal after a delay
                setTimeout(() => {
                    this.closeQuickView();
                }, 1500);
            }
        } catch (error) {
            // Error adding to cart
            alert('Error adding to cart: ' + error.message);
        }
    }
    
    openModal() {
        const modal = document.getElementById('quick-view-modal');
        const overlay = document.getElementById('quick-view-overlay');
        
        if (modal && overlay) {
            modal.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent body scrolling
        }
    }
    
    closeQuickView() {
        const modal = document.getElementById('quick-view-modal');
        const overlay = document.getElementById('quick-view-overlay');
        
        if (modal && overlay) {
            modal.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = ''; // Restore body scrolling
        }
    }
    
    showLoading(isLoading) {
        const loadingEl = document.getElementById('quick-view-loading');
        
        if (loadingEl) {
            loadingEl.style.display = isLoading ? 'flex' : 'none';
        }
        
        this.isLoading = isLoading;
    }
}

// Initialize quick view
document.addEventListener('DOMContentLoaded', () => {
    window.quickViewManager = new QuickViewManager();
    
    // More aggressive approach for URL-based color selection
    const urlParams = new URLSearchParams(window.location.search);
    const colorParam = urlParams.get('color');
    
    if (colorParam) {
        // Apply color filtering with multiple attempts to ensure it works
        const applyColorFromURL = () => {
            if (window.productDetailManager && window.productDetailManager.currentProduct) {
                // If the productDetailManager has already selected a color, update it
                if (window.productDetailManager.selectedVariant) {
                    window.productDetailManager.selectedVariant.color = colorParam;
                }
                
                // Mark the correct color button as selected
                const colorButtons = document.querySelectorAll('.color-option');
                colorButtons.forEach(button => {
                    if (button.getAttribute('data-color') === colorParam) {
                        button.classList.add('active');
                    } else {
                        button.classList.remove('active');
                    }
                });
                
                // Apply our enhanced image filtering
                window.quickViewManager.filterImagesByColor.call(window.productDetailManager, colorParam);
                
                // If filteredImages exists (in product-detail.js context), update it directly
                if (window.productDetailManager.filteredImages) {
                    // Check if we have explicit colorImages mapping
                    if (window.productDetailManager.currentProduct.colorImages &&
                        window.productDetailManager.currentProduct.colorImages[colorParam]) {
                        // Use these explicit color images
                        window.productDetailManager.filteredImages =
                            [...window.productDetailManager.currentProduct.colorImages[colorParam]];
                    } else {
                        // Filter based on URL patterns
                        const colorImages = window.productDetailManager.currentProduct.images.filter(img => {
                            const imgUrl = img.toLowerCase();
                            const colorNameLower = colorParam.toLowerCase();
                            
                            // Standard pattern matching
                            if (imgUrl.includes(colorNameLower) ||
                                imgUrl.includes(`-${colorNameLower}`) ||
                                imgUrl.includes(`_${colorNameLower}`)) {
                                return true;
                            }
                            
                            // Handle multi-word color names (e.g., "Forest Green")
                            const colorParts = colorNameLower.split(/\s+/);
                            if (colorParts.length > 1) {
                                // Check if all parts of the color name appear in the URL
                                const allPartsPresent = colorParts.every(part =>
                                    imgUrl.includes(part) && part.length > 2  // Only consider parts with 3+ chars
                                );
                                
                                if (allPartsPresent) {
                                    return true;
                                }
                                
                                // Check for color initials (e.g., "fg" for "forest green")
                                const colorInitials = colorParts.map(part => part[0]).join('');
                                if (colorInitials.length > 1 && imgUrl.includes(colorInitials)) {
                                    return true;
                                }
                            }
                            
                            return false;
                        });
                        
                        if (colorImages.length > 0) {
                            window.productDetailManager.filteredImages = colorImages;
                        }
                    }
                    
                    // Also update the thumbnail grid if it exists
                    if (window.productDetailManager && typeof window.productDetailManager.updateThumbnailGrid === 'function') {
                        window.productDetailManager.updateThumbnailGrid();
                    }
                }
            }
        };
        
        // Try to apply immediately if productDetailManager is already available
        applyColorFromURL();
        
        // And also after a delay to ensure everything is loaded
        setTimeout(applyColorFromURL, 500);
        
        // Apply again after a longer delay as a final fallback
        setTimeout(applyColorFromURL, 1500);
    }
    
    // Patch the product detail manager to use our simplified size display
    if (window.productDetailManager) {
        // Copy our simplifySize method to the product detail manager
        window.productDetailManager.simplifySize = window.quickViewManager.simplifySize;
        
        // Enhance product detail selectColor method to use our better filtering
        const originalSelectColor = window.productDetailManager.selectColor;
        window.productDetailManager.selectColor = function(colorName) {
            // Call original method first
            if (originalSelectColor) {
                originalSelectColor.call(window.productDetailManager, colorName);
            }
            
            // Then apply our enhanced filtering
            window.quickViewManager.filterImagesByColor.call(window.productDetailManager, colorName);
        };
        
        // Replace filterImagesByColor with our improved version
        window.productDetailManager.filterImagesByColor = function(colorName) {
            // Use our enhanced version directly
            window.quickViewManager.filterImagesByColor.call(window.productDetailManager, colorName);
        };
        
        // Patch size display in product detail page - simplify all size buttons
        const updateSizeDisplay = () => {
            const productSizeOptions = document.querySelectorAll('.size-option');
            if (productSizeOptions.length > 0) {
                productSizeOptions.forEach(sizeOption => {
                    const originalSize = sizeOption.textContent.trim();
                    const simplifiedSize = window.quickViewManager.simplifySize(originalSize);
                    
                    // Only update if the simplified size is different
                    if (simplifiedSize !== originalSize) {
                        sizeOption.textContent = simplifiedSize;
                        // Store original size as data attribute for reference
                        sizeOption.setAttribute('data-original-size', originalSize);
                        sizeOption.setAttribute('data-display-size', simplifiedSize);
                    }
                });
            }
        };
        
        // Apply size simplification immediately
        updateSizeDisplay();
        
        // Apply again after a delay to catch any sizes loaded later
        setTimeout(updateSizeDisplay, 1000);
        
        // Monitor for any new thumbnail images being added to the page and add data-color attributes
        const observer = new MutationObserver((mutations) => {
            let sizeElementsAdded = false;
            let thumbnailsAdded = false;
            
            mutations.forEach((mutation) => {
                if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                    // Check added nodes for thumbnails and size elements
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) { // ELEMENT_NODE
                            // Look for thumbnail containers or images
                            const thumbnails = node.querySelectorAll('img');
                            if (thumbnails.length > 0) {
                                thumbnailsAdded = true;
                                
                                // Process all these new thumbnails
                                thumbnails.forEach(thumbnail => {
                                    // Try to detect color from URL if no data-color attribute
                                    if (!thumbnail.hasAttribute('data-color') && thumbnail.src) {
                                        const imgUrl = thumbnail.src.toLowerCase();
                                        
                                        // Check for color names in the URL
                                        if (window.productDetailManager &&
                                            window.productDetailManager.currentProduct &&
                                            window.productDetailManager.currentProduct.colors) {
                                                
                                            window.productDetailManager.currentProduct.colors.forEach(color => {
                                                const colorName = color.name.toLowerCase();
                                                if (imgUrl.includes(colorName)) {
                                                    thumbnail.setAttribute('data-color', color.name);
                                                    // Set data-color attribute
                                                }
                                            });
                                        }
                                    }
                                });
                            }
                            
                            // Check for new size elements
                            const sizeElements = node.querySelectorAll('.size-option');
                            if (sizeElements.length > 0) {
                                sizeElementsAdded = true;
                            }
                        }
                    });
                }
            });
            
            // If new thumbnails were added and we have a color parameter, apply filtering again
            if (thumbnailsAdded && colorParam && window.productDetailManager) {
                window.quickViewManager.filterImagesByColor.call(window.productDetailManager, colorParam);
            }
            
            // If new size elements were added, apply size simplification
            if (sizeElementsAdded) {
                updateSizeDisplay();
            }
        });
        
        // Start observing the document body for thumbnail changes
        observer.observe(document.body, { childList: true, subtree: true });
    }
});