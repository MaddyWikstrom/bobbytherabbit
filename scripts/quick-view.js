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
        console.log('QuickView system initialized');
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
                background: #fff;
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
                color: #333;
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
                color: #666;
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
                color: #333;
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
                background: #f8f8f8;
                border: 1px solid #ddd;
                color: #333;
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
                background: #f0f0f0;
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
                color: #333;
                font-weight: 600;
                font-size: 0.95rem;
            }
            
            .quick-view-quantity-selector {
                display: flex;
                align-items: center;
                background: #f8f8f8;
                border: 1px solid #ddd;
                border-radius: 4px;
                overflow: hidden;
            }
            
            .quick-view-quantity-btn {
                background: none;
                border: none;
                color: #333;
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
                color: #333;
                font-weight: 600;
                min-width: 40px;
                text-align: center;
                border-left: 1px solid #ddd;
                border-right: 1px solid #ddd;
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
            
            /* Quick View Icon */
            .product-card {
                position: relative;
            }
            
            .product-quick-view-icon {
                position: absolute;
                top: 10px;
                right: 10px;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: rgba(20, 20, 35, 0.7);
                backdrop-filter: blur(5px);
                border: 1px solid rgba(168, 85, 247, 0.3);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.3s ease;
                opacity: 0;
                transform: scale(0.8);
                z-index: 5;
            }
            
            .product-card:hover .product-quick-view-icon {
                opacity: 1;
                transform: scale(1);
            }
            
            .product-quick-view-icon:hover {
                background: rgba(59, 130, 246, 0.7);
                border-color: rgba(59, 130, 246, 0.8);
                transform: scale(1.1);
                box-shadow: 0 0 15px rgba(59, 130, 246, 0.5);
            }
            
            .product-quick-view-icon svg {
                width: 20px;
                height: 20px;
                stroke: white;
                stroke-width: 2;
                transition: all 0.3s ease;
            }
            
            .product-quick-view-icon:hover svg {
                stroke: #ffffff;
                transform: scale(1.1);
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
                        <button class="quick-add-btn" id="quick-add-btn">Add to Cart</button>
                        <button class="quick-view-btn" id="quick-view-full-btn">View Details</button>
                    </div>
                </div>
            </div>
            <div class="quick-view-loading" id="quick-view-loading" style="display: none;">
                <div class="quick-view-spinner"></div>
            </div>
            <div id="debug-info" style="position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.5); color: white; padding: 5px; font-size: 10px; display: none;"></div>
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
        
        // Handle product card quick view buttons
        document.addEventListener('click', function(e) {
            // Quick View icon
            if (e.target.matches('.product-quick-view-icon, .product-quick-view-icon svg, .product-quick-view-icon *') ||
                e.target.closest('.product-quick-view-icon')) {
                e.preventDefault();
                e.stopPropagation();
                
                const productCard = e.target.closest('.product-card');
                if (productCard) {
                    const productId = productCard.getAttribute('data-product-id');
                    if (productId) {
                        self.openQuickView(productId);
                    }
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
                
                self.selectedVariant.color = colorOption.getAttribute('data-color');
                self.updateQuickViewState();
            }
            
            // Size selection
            if (e.target.matches('.quick-view-size-option')) {
                if (e.target.classList.contains('unavailable')) {
                    console.log('QuickView: Cannot select unavailable size');
                    return;
                }
                
                const selectedSize = e.target.getAttribute('data-size');
                console.log(`QuickView: User selected size: ${selectedSize}`);
                
                const debugInfo = document.getElementById('debug-info');
                debugInfo.textContent = `Selected size: ${selectedSize}`;
                debugInfo.style.display = 'block';
                
                const sizeOptions = document.querySelectorAll('.quick-view-size-option');
                sizeOptions.forEach(option => option.classList.remove('active'));
                e.target.classList.add('active');
                
                self.selectedVariant.size = selectedSize;
                
                // Force UI update
                document.getElementById('quick-add-btn').textContent = 'Add to Cart';
                
                // Hide debug info after a delay
                setTimeout(() => {
                    debugInfo.style.display = 'none';
                }, 3000);
                
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
            
            // Add to cart button
            if (e.target.matches('#quick-add-btn')) {
                self.addToCart();
            }
            
            // View full details button
            if (e.target.matches('#quick-view-full-btn')) {
                if (self.currentProduct) {
                    window.location.href = `product.html?id=${self.currentProduct.id}`;
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
        // Check if card already has quick view buttons
        if (card.querySelector('.product-quick-view-icon')) return;
        
        const quickViewIcon = document.createElement('button');
        quickViewIcon.className = 'product-quick-view-icon';
        quickViewIcon.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            </svg>
        `;
        
        card.appendChild(quickViewIcon);
    }
    
    async openQuickView(productId) {
        console.log('QuickView: Opening quick view for product ID:', productId);
        this.showLoading(true);
        this.openModal();
        
        const debugInfo = document.getElementById('debug-info');
        debugInfo.style.display = 'block';
        debugInfo.textContent = `Loading product: ${productId}`;
        
        try {
            // Reset selected variant
            this.selectedVariant = {
                color: null,
                size: null,
                quantity: 1
            };
            
            debugInfo.textContent = `Fetching product data for: ${productId}`;
            // Fetch product data
            const product = await this.fetchProductData(productId);
            
            if (!product) {
                debugInfo.textContent = `Error: Product not found for ID: ${productId}`;
                this.closeQuickView();
                console.error('Product not found');
                return;
            }
            
            this.currentProduct = product;
            debugInfo.textContent = `Rendering product: ${product.title}`;
            this.renderQuickView();
            
            // Hide debug info after successful rendering
            setTimeout(() => {
                debugInfo.style.display = 'none';
            }, 2000);
            
        } catch (error) {
            debugInfo.textContent = `Error: ${error.message}`;
            console.error('Error opening quick view:', error);
        } finally {
            this.showLoading(false);
        }
    }
    
    async quickAddToCart(productId) {
        // Instead of automatically adding to cart, open the quick view modal
        // to force user to select size before adding to cart
        this.openQuickView(productId);
        
        // Show a notification reminding users to select a size
        setTimeout(() => {
            if (window.productManager && typeof window.productManager.showNotification === 'function') {
                window.productManager.showNotification('Please select a size before adding to cart', 'info');
            } else if (window.BobbyCart && typeof window.BobbyCart.showNotification === 'function') {
                window.BobbyCart.showNotification('Please select a size before adding to cart', 'info');
            } else if (window.BobbyCarts && typeof window.BobbyCarts.showNotification === 'function') {
                window.BobbyCarts.showNotification('Please select a size before adding to cart', 'info');
            } else {
                console.log('INFO: Please select a size before adding to cart');
            }
        }, 500);
    }
    
    async fetchProductData(productId) {
        try {
            console.log('QuickView: Fetching product data for:', productId);
            
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
                console.log(`QuickView: Received ${data.products.length} products from API (new format)`);
                products = data.products;
            } else if (Array.isArray(data)) {
                // Old API format with direct array
                console.log(`QuickView: Received ${data.length} products from API (legacy format)`);
                products = data;
            } else if (data.error) {
                console.error('QuickView: Netlify function error:', data.error);
                return null;
            } else {
                console.error('QuickView: Unexpected data format:', typeof data, data);
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
                console.error(`QuickView: Product with ID "${productId}" not found in API response`);
                return null;
            }
            
            console.log('QuickView: Found product:', product.node?.title || product.title);
            return this.processProductData(product.node || product);
            
        } catch (error) {
            console.error('QuickView: Error fetching product data:', error);
            return null;
        }
    }
    
    processProductData(shopifyProduct) {
        console.log('QuickView: Processing product data:', shopifyProduct.title);
        
        // Extract images
        const shopifyImages = shopifyProduct.images?.edges?.map(imgEdge => imgEdge.node.url) || [];
        
        // Extract variants
        const variants = [];
        const colorMap = {};
        const sizes = new Set();
        const inventory = {};
        
        // DIRECT DEBUG: Log all variant data
        console.log("QuickView: AVAILABLE VARIANTS:", shopifyProduct.variants?.edges?.length || 0);
        
        // Debug variant data structure
        console.log('QuickView: Processing variants structure:',
            shopifyProduct.variants ?
            (shopifyProduct.variants.edges ? 'Has edges array' : 'No edges property') :
            'No variants property');
        
        // Handle different variant data structures
        let variantsToProcess = [];
        
        if (shopifyProduct.variants && shopifyProduct.variants.edges) {
            // Standard format with edges
            variantsToProcess = shopifyProduct.variants.edges.map(edge => edge.node);
            console.log(`QuickView: Found ${variantsToProcess.length} variants in edges format`);
            
            // Log each variant for debugging
            variantsToProcess.forEach((variant, i) => {
                console.log(`QuickView: VARIANT ${i+1}:`, JSON.stringify(variant, null, 2));
            });
        } else if (shopifyProduct.variants && Array.isArray(shopifyProduct.variants)) {
            // Direct array format
            variantsToProcess = shopifyProduct.variants;
            console.log(`QuickView: Found ${variantsToProcess.length} variants in direct array format`);
        } else {
            console.log('QuickView: No recognizable variant format found');
        }
        
        console.log(`QuickView: Processing ${variantsToProcess.length} variants`);
        
        // DIRECTLY EXTRACT ALL VARIANTS AND SIZES
        // This will preserve the exact variant structure from Shopify
        const directSizes = new Set();
        const directVariantMapping = new Map();
        
        variantsToProcess.forEach(variant => {
            console.log('QuickView: Processing variant:', variant.title || variant.id);
            console.log('QuickView: Variant options:', JSON.stringify(variant.selectedOptions));
            
            // CRITICAL DEBUG: Log the entire variant object
            console.log('QuickView: FULL VARIANT DATA:', JSON.stringify(variant));
            
            let color = '';
            let size = '';
            
            // IMPORTANT: Always add the variant title as a size option first
            // This ensures we capture all possible variants regardless of structure
            if (variant.title && variant.title !== 'Default Title') {
                size = variant.title;
                sizes.add(size);
                console.log(`QuickView: Added variant title directly as size: ${size}`);
            }
            
            // Handle different selectedOptions formats
            if (variant.selectedOptions && Array.isArray(variant.selectedOptions)) {
                console.log('QuickView: Processing selectedOptions array:', JSON.stringify(variant.selectedOptions));
                
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
                        size = optionValue;
                        foundSize = true;
                        console.log(`QuickView: Found direct size option: ${size}`);
                        sizes.add(size);
                    }
                    
                    // IMPORTANT: Add ALL option values as potential sizes
                    // This ensures we don't miss any possible size variants
                    if (optionValue && optionValue !== 'Default Title') {
                        sizes.add(optionValue);
                        console.log(`QuickView: Added option value as potential size: ${optionValue}`);
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
                            
                            console.log(`QuickView: Detected size "${optionValue}" from option "${optionName}"`);
                            size = optionValue;
                            sizes.add(size);
                            foundSize = true;
                        }
                    });
                }
            } else if (variant.title) {
                // Alternative format: parse from title (e.g. "Black / XL")
                const variantTitle = variant.title.trim();
                console.log(`QuickView: Parsing variant from title: "${variantTitle}"`);
                
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
                            console.log(`QuickView: Split title into parts:`, parts);
                            // Assume first part is color, second is size (common Shopify pattern)
                            color = parts[0].trim();
                            size = parts[1].trim();
                            
                            if (color && !colorMap[color]) {
                                colorMap[color] = {
                                    name: color,
                                    code: this.getColorCode(color)
                                };
                            }
                            
                            if (size) {
                                console.log(`QuickView: Adding size from title: ${size}`);
                                sizes.add(size);
                            }
                        }
                    }
                    // Check for "One Size" variants
                    else if (variantTitle.toLowerCase().includes('one size')) {
                        size = 'One Size';
                        console.log(`QuickView: Found "One Size" variant`);
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
                            
                            size = variantTitle;
                            console.log(`QuickView: Using variant title "${size}" as size`);
                            sizes.add(size);
                        }
                        // For single variants with no size specified
                        else if (variantTitle !== 'Default Title') {
                            // For a product with only one variant, it might not have size
                            // Use title as is or default to "One Size"
                            size = 'One Size';
                            console.log(`QuickView: Single variant with title "${variantTitle}", using "One Size"`);
                            sizes.add(size);
                        }
                    }
                }
            }
            
            // Check for options.size directly (alternative format)
            if (!size && variant.options) {
                if (typeof variant.options.size === 'string') {
                    size = variant.options.size;
                    console.log(`QuickView: Found size in options object: ${size}`);
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
        
        console.log(`QuickView: Found ${sizes.size} unique sizes:`, Array.from(sizes));
        
        // Calculate pricing
        let minPrice = 0;
        try {
            minPrice = parseFloat(shopifyProduct.priceRange?.minVariantPrice?.amount || 0);
            if (isNaN(minPrice) || minPrice === 0) {
                // Fallback to first variant price if available
                minPrice = variants.length > 0 ? variants[0].price : 0;
            }
        } catch (e) {
            console.error('QuickView: Error parsing price:', e);
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
    
    getColorCode(colorName) {
        const colorMap = {
            'Black': '#000000',
            'White': '#FFFFFF',
            'Navy': '#001f3f',
            'Navy Blazer': '#001f3f',
            'Maroon': '#800000',
            'Charcoal Heather': '#36454F',
            'Vintage Black': '#2C2C2C',
            'Heather Grey': '#D3D3D3',
            'French Navy': '#002868',
            'Forest Green': '#228B22',
            'Red': '#FF0000',
            'Blue': '#0000FF',
            'Green': '#00FF00',
            'Yellow': '#FFFF00',
            'Purple': '#800080',
            'Pink': '#FFC0CB',
            'Orange': '#FFA500',
            'Brown': '#A52A2A',
            'Gray': '#808080',
            'Grey': '#808080'
        };
        
        return colorMap[colorName] || '#a855f7';
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
            
            thumbnailsContainer.innerHTML = this.currentProduct.images.map((image, index) => `
                <img src="${image}" alt="${this.currentProduct.title}" class="quick-view-thumbnail ${index === 0 ? 'active' : ''}">
            `).join('');
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
        const debugInfo = document.getElementById('debug-info');
        
        console.log('QuickView: Rendering size options:',
            this.currentProduct.sizes ? Array.from(this.currentProduct.sizes) : 'None');
        debugInfo.textContent = `Available sizes: ${this.currentProduct.sizes ? Array.from(this.currentProduct.sizes).join(', ') : 'None'}`;
        debugInfo.style.display = 'block';
        
        // Create a local sizes Set using the product's sizes or an empty set
        const sizes = new Set(this.currentProduct.sizes || []);
        
        // Get variant data from product
        const variantsToProcess = this.currentProduct.variants || [];
        
        // Log all discovered sizes before processing
        console.log(`QuickView: All discovered sizes before processing: ${Array.from(sizes).join(', ')}`);
        
        // Special handling if no sizes were found
        if (!sizes.size || sizes.size === 0) {
            console.log(`QuickView: No sizes found after processing, adding emergency fallbacks`);
            
            // First, extract ANY variant titles available
            if (variantsToProcess && variantsToProcess.length > 0) {
                console.log(`QuickView: Extracting ALL variant titles as emergency fallback`);
                
                variantsToProcess.forEach(variant => {
                    // Add EVERY variant title without filtering
                    if (variant.title) {
                        const title = variant.title.trim();
                        sizes.add(title);
                        console.log(`QuickView: Emergency - Added raw variant title: "${title}"`);
                    }
                    
                    // Also add any raw option values
                    if (variant.selectedOptions && Array.isArray(variant.selectedOptions)) {
                        variant.selectedOptions.forEach(opt => {
                            if (opt.value) {
                                sizes.add(opt.value);
                                console.log(`QuickView: Emergency - Added raw option value: "${opt.value}"`);
                            }
                        });
                    }
                });
            }
            
            // If still no sizes found, we'll rely on the raw variant data that was already added
            if (!sizes.size) {
                console.log(`QuickView: No sizes detected - using raw variant data only`);
            }
        }
        
        // Convert the sizes Set to an array and assign to the product
        this.currentProduct.sizes = Array.from(sizes);
        console.log(`QuickView: Final sizes list (${this.currentProduct.sizes.length}): ${this.currentProduct.sizes.join(', ')}`);
        
        // Add inventory entries for all sizes
        if (this.currentProduct.colors && this.currentProduct.colors.length > 0) {
            this.currentProduct.colors.forEach(color => {
                this.currentProduct.sizes.forEach(size => {
                    const inventoryKey = `${color.name}-${size}`;
                    this.currentProduct.inventory[inventoryKey] = 10; // Default stock of 10
                    console.log(`QuickView: Added inventory for ${inventoryKey}`);
                });
            });
        } else {
            // If no colors, add inventory for sizes without color
            this.currentProduct.sizes.forEach(size => {
                const inventoryKey = `-${size}`; // No color
                this.currentProduct.inventory[inventoryKey] = 10;
                console.log(`QuickView: Added inventory for ${inventoryKey} (no color)`);
            });
        }
        
        if (this.currentProduct.sizes && this.currentProduct.sizes.length > 0) {
            console.log(`QuickView: Rendering ${this.currentProduct.sizes.length} size options`);
            
            sizeOptionsContainer.innerHTML = this.currentProduct.sizes.map((size) => {
                const inventoryKey = this.selectedVariant.color ?
                    `${this.selectedVariant.color}-${size}` : null;
                const stockLevel = inventoryKey ?
                    (this.currentProduct.inventory[inventoryKey] || 0) : 10;
                const available = inventoryKey ? (stockLevel > 0) : true;
                
                console.log(`QuickView: Size ${size} - Stock: ${stockLevel}, Available: ${available}`);
                
                return `
                    <div class="quick-view-size-option ${available ? '' : 'unavailable'}"
                         data-size="${size}">
                        ${size}
                    </div>
                `;
            }).join('');
            
            sizeGroup.style.display = 'block';
        } else {
            console.log('QuickView: No sizes available to render');
            sizeGroup.style.display = 'none';
            
            // Add a message to the debug display
            debugInfo.textContent = 'No size options found for this product';
        }
        
        // Hide debug info after a delay
        setTimeout(() => {
            debugInfo.style.display = 'none';
        }, 3000);
        
        // Reset quantity
        document.getElementById('quick-view-quantity-display').textContent = '1';
        
        // Update buttons state
        this.updateQuickViewState();
    }
    
    updateQuickViewState() {
        if (!this.currentProduct) {
            console.error('QuickView: Cannot update state - no current product');
            return;
        }
        
        const debugInfo = document.getElementById('debug-info');
        debugInfo.textContent = `Updating state: Color=${this.selectedVariant.color}, Size=${this.selectedVariant.size}`;
        debugInfo.style.display = 'block';
        
        // Update size availability based on selected color
        if (this.selectedVariant.color) {
            const sizeOptions = document.querySelectorAll('.quick-view-size-option');
            console.log(`QuickView: Updating ${sizeOptions.length} size options based on color: ${this.selectedVariant.color}`);
            
            if (sizeOptions.length === 0) {
                console.warn('QuickView: No size options found in DOM to update');
                debugInfo.textContent = 'Warning: Size options not found';
                
                // Attempt to re-render sizes if they're missing
                if (this.currentProduct.sizes && this.currentProduct.sizes.length > 0) {
                    console.log('QuickView: Attempting to re-render size options');
                    const sizeOptionsContainer = document.getElementById('quick-view-size-options');
                    const sizeGroup = document.getElementById('quick-view-size-group');
                    
                    if (sizeOptionsContainer && sizeGroup) {
                        sizeOptionsContainer.innerHTML = this.currentProduct.sizes.map((size) => {
                            const inventoryKey = `${this.selectedVariant.color}-${size}`;
                            const stockLevel = this.currentProduct.inventory[inventoryKey] || 0;
                            const available = stockLevel > 0;
                            
                            return `
                                <div class="quick-view-size-option ${available ? '' : 'unavailable'}"
                                    data-size="${size}">
                                    ${size}
                                </div>
                            `;
                        }).join('');
                        
                        sizeGroup.style.display = 'block';
                        debugInfo.textContent = 'Size options regenerated';
                    }
                }
            } else {
                // Normal flow - update existing size options
                let availableSizes = [];
                
                sizeOptions.forEach(option => {
                    const size = option.getAttribute('data-size');
                    const inventoryKey = `${this.selectedVariant.color}-${size}`;
                    const stockLevel = this.currentProduct.inventory[inventoryKey] || 0;
                    const available = stockLevel > 0;
                    
                    console.log(`QuickView: Size ${size} availability: ${available} (stock: ${stockLevel})`);
                    option.classList.toggle('unavailable', !available);
                    
                    if (available) {
                        availableSizes.push(size);
                    }
                    
                    // If the currently selected size is now unavailable, deselect it
                    if (!available && this.selectedVariant.size === size) {
                        this.selectedVariant.size = null;
                        option.classList.remove('active');
                    }
                });
                
                debugInfo.textContent = `Available sizes for ${this.selectedVariant.color}: ${availableSizes.join(', ')}`;
            }
        }
        
        // Update add to cart button
        const addButton = document.getElementById('quick-add-btn');
        if (!addButton) {
            console.error('QuickView: Add to cart button not found');
            return;
        }
        
        if (this.currentProduct.sizes && this.currentProduct.sizes.length > 0) {
            // Need to select size
            if (!this.selectedVariant.size) {
                addButton.disabled = true;
                addButton.textContent = 'Select Size';
                console.log('QuickView: Size selection required');
            } else if (!this.selectedVariant.color && this.currentProduct.colors.length > 0) {
                addButton.disabled = true;
                addButton.textContent = 'Select Color';
                console.log('QuickView: Color selection required');
            } else {
                const stock = this.getAvailableStock();
                console.log(`QuickView: Stock available: ${stock}`);
                
                if (stock > 0) {
                    addButton.disabled = false;
                    addButton.textContent = 'Add to Cart';
                } else {
                    addButton.disabled = true;
                    addButton.textContent = 'Out of Stock';
                }
            }
        } else {
            // No sizes needed
            if (!this.selectedVariant.color && this.currentProduct.colors.length > 0) {
                addButton.disabled = true;
                addButton.textContent = 'Select Color';
            } else {
                addButton.disabled = false;
                addButton.textContent = 'Add to Cart';
            }
        }
        
        // Hide debug info after a delay
        setTimeout(() => {
            debugInfo.style.display = 'none';
        }, 3000);
    }
    
    getAvailableStock() {
        if (!this.currentProduct || !this.selectedVariant.color || !this.selectedVariant.size) {
            return 0;
        }
        
        const variantKey = `${this.selectedVariant.color}-${this.selectedVariant.size}`;
        return this.currentProduct.inventory[variantKey] || 0;
    }
    
    addToCart() {
        const debugInfo = document.getElementById('debug-info');
        debugInfo.style.display = 'block';
        
        if (!this.currentProduct) {
            console.error('QuickView: Cannot add to cart - no current product');
            debugInfo.textContent = 'Error: No product selected';
            return;
        }
        
        debugInfo.textContent = 'Validating product selections...';
        
        // Check if we have all required selections
        if (this.currentProduct.colors.length > 0 && !this.selectedVariant.color) {
            console.error('QuickView: Color not selected');
            debugInfo.textContent = 'Error: Please select a color';
            
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
            console.error('QuickView: Size not selected');
            debugInfo.textContent = 'Error: Please select a size';
            
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
        
        debugInfo.textContent = `Adding to cart: ${this.currentProduct.title}, Size: ${this.selectedVariant.size}, Color: ${this.selectedVariant.color}`;
        
        debugInfo.textContent = 'Adding item to cart...';
        
        // Add to cart
        const addButton = document.getElementById('quick-add-btn');
        
        // Show animation
        addButton.classList.add('adding');
        addButton.textContent = 'Adding...';
        setTimeout(() => {
            addButton.classList.remove('adding');
        }, 1200);
        
        // Try all available cart systems
        try {
            let cartAddSuccess = false;
            
            // Use consolidated cart system
            if (window.BobbyCart) {
                window.BobbyCart.addToCart(cartItem);
                console.log('QuickView: Added to cart using BobbyCart');
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
                console.log('QuickView: Added to cart using BobbyCarts');
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
                console.log('QuickView: Added to cart using cartManager');
                cartAddSuccess = true;
                
                // Try to force cart to open
                setTimeout(() => {
                    if (typeof window.cartManager.openCart === 'function') {
                        window.cartManager.openCart();
                    }
                }, 500);
            } else {
                console.error('QuickView: No cart system available');
                debugInfo.textContent = 'Error: Cart system not available';
                addButton.textContent = 'Add to Cart';
                
                // Show an alert to the user
                alert('The cart system is not available. This is likely because the site needs to be deployed to work correctly.');
                return;
            }
            
            if (cartAddSuccess) {
                debugInfo.textContent = 'Success! Added to cart';
                addButton.textContent = 'Added to Cart ✓';
                
                // Close modal after a delay
                setTimeout(() => {
                    this.closeQuickView();
                }, 1500);
            }
        } catch (error) {
            console.error('QuickView: Error adding to cart:', error);
            debugInfo.textContent = `Error adding to cart: ${error.message}`;
            addButton.textContent = 'Add to Cart';
            addButton.classList.remove('adding');
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
});