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
                color: #ffffff;
            }
            
            .quick-view-price-original {
                font-size: 1.1rem;
                color: rgba(255, 255, 255, 0.5);
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
                max-height: 100px;
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
                color: #ffffff;
                transform: translateY(-2px);
            }
            
            .quick-view-size-option.active {
                background: rgba(168, 85, 247, 0.2);
                border-color: #a855f7;
                color: #ffffff;
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(168, 85, 247, 0.3);
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
                background: rgba(168, 85, 247, 0.2);
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
            
            /* Quick View Product Card Button */
            .product-card {
                position: relative;
            }
            
            .product-quick-actions {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                display: flex;
                gap: 0.5rem;
                padding: 0.75rem;
                background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
                opacity: 0;
                transform: translateY(10px);
                transition: all 0.3s ease;
                z-index: 5;
            }
            
            .product-card:hover .product-quick-actions {
                opacity: 1;
                transform: translateY(0);
            }
            
            .product-quick-view-btn, .product-quick-add-btn {
                flex: 1;
                background: rgba(20, 20, 35, 0.8);
                backdrop-filter: blur(5px);
                border: 1px solid rgba(168, 85, 247, 0.3);
                color: white;
                padding: 0.4rem;
                border-radius: 4px;
                font-size: 0.8rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                text-align: center;
            }
            
            .product-quick-view-btn:hover {
                background: rgba(59, 130, 246, 0.5);
                border-color: rgba(59, 130, 246, 0.8);
            }
            
            .product-quick-add-btn:hover {
                background: rgba(168, 85, 247, 0.5);
                border-color: rgba(168, 85, 247, 0.8);
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
            // Quick View button
            if (e.target.matches('.product-quick-view-btn')) {
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
            
            // Quick Add button
            if (e.target.matches('.product-quick-add-btn')) {
                e.preventDefault();
                e.stopPropagation();
                
                const productCard = e.target.closest('.product-card');
                if (productCard) {
                    const productId = productCard.getAttribute('data-product-id');
                    if (productId) {
                        self.quickAddToCart(productId);
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
                if (e.target.classList.contains('unavailable')) return;
                
                const sizeOptions = document.querySelectorAll('.quick-view-size-option');
                sizeOptions.forEach(option => option.classList.remove('active'));
                e.target.classList.add('active');
                
                self.selectedVariant.size = e.target.getAttribute('data-size');
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
        if (card.querySelector('.product-quick-actions')) return;
        
        const quickActions = document.createElement('div');
        quickActions.className = 'product-quick-actions';
        quickActions.innerHTML = `
            <button class="product-quick-view-btn">Quick View</button>
            <button class="product-quick-add-btn">Add to Cart</button>
        `;
        
        card.appendChild(quickActions);
    }
    
    async openQuickView(productId) {
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
                console.error('Product not found');
                return;
            }
            
            this.currentProduct = product;
            this.renderQuickView();
            
        } catch (error) {
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
            } else {
                console.log('INFO: Please select a size before adding to cart');
            }
        }, 500);
    }
    
    async fetchProductData(productId) {
        try {
            console.log('Fetching product data for:', productId);
            
            // Use the Netlify function to get product data
            const response = await fetch('/.netlify/functions/get-products');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                console.error('Netlify function error:', data.error);
                return null;
            }
            
            // Find the specific product
            const product = data.find(p => {
                const node = p.node || p;
                const shopifyId = node.id?.replace('gid://shopify/Product/', '');
                return node.handle === productId || shopifyId === productId || node.id === productId;
            });
            
            if (!product) {
                return null;
            }
            
            return this.processProductData(product.node || product);
            
        } catch (error) {
            console.error('Error fetching product data:', error);
            return null;
        }
    }
    
    processProductData(shopifyProduct) {
        // Extract images
        const shopifyImages = shopifyProduct.images.edges.map(imgEdge => imgEdge.node.url);
        
        // Extract variants
        const variants = [];
        const colorMap = {};
        const sizes = new Set();
        const inventory = {};
        
        shopifyProduct.variants.edges.forEach(variantEdge => {
            const variant = variantEdge.node;
            
            let color = '';
            let size = '';
            
            variant.selectedOptions.forEach(option => {
                if (option.name.toLowerCase() === 'color') {
                    color = option.value;
                    if (!colorMap[color]) {
                        colorMap[color] = {
                            name: color,
                            code: this.getColorCode(color)
                        };
                    }
                } else if (option.name.toLowerCase() === 'size') {
                    size = option.value;
                    sizes.add(size);
                }
            });
            
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
        
        // Calculate pricing
        const minPrice = parseFloat(shopifyProduct.priceRange.minVariantPrice.amount);
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
        
        if (this.currentProduct.sizes && this.currentProduct.sizes.length > 0) {
            sizeOptionsContainer.innerHTML = this.currentProduct.sizes.map((size) => {
                const available = this.selectedVariant.color ? 
                    (this.currentProduct.inventory[`${this.selectedVariant.color}-${size}`] > 0) : true;
                
                return `
                    <div class="quick-view-size-option ${available ? '' : 'unavailable'}" 
                         data-size="${size}">
                        ${size}
                    </div>
                `;
            }).join('');
            
            sizeGroup.style.display = 'block';
        } else {
            sizeGroup.style.display = 'none';
        }
        
        // Reset quantity
        document.getElementById('quick-view-quantity-display').textContent = '1';
        
        // Update buttons state
        this.updateQuickViewState();
    }
    
    updateQuickViewState() {
        if (!this.currentProduct) return;
        
        // Update size availability based on selected color
        if (this.selectedVariant.color) {
            const sizeOptions = document.querySelectorAll('.quick-view-size-option');
            
            sizeOptions.forEach(option => {
                const size = option.getAttribute('data-size');
                const available = this.currentProduct.inventory[`${this.selectedVariant.color}-${size}`] > 0;
                
                option.classList.toggle('unavailable', !available);
            });
        }
        
        // Update add to cart button
        const addButton = document.getElementById('quick-add-btn');
        
        if (this.currentProduct.sizes && this.currentProduct.sizes.length > 0) {
            // Need to select size
            if (!this.selectedVariant.size) {
                addButton.disabled = true;
                addButton.textContent = 'Select Size';
            } else if (!this.selectedVariant.color && this.currentProduct.colors.length > 0) {
                addButton.disabled = true;
                addButton.textContent = 'Select Color';
            } else {
                const stock = this.getAvailableStock();
                
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
    }
    
    getAvailableStock() {
        if (!this.currentProduct || !this.selectedVariant.color || !this.selectedVariant.size) {
            return 0;
        }
        
        const variantKey = `${this.selectedVariant.color}-${this.selectedVariant.size}`;
        return this.currentProduct.inventory[variantKey] || 0;
    }
    
    addToCart() {
        if (!this.currentProduct) return;
        
        // Check if we have all required selections
        if (this.currentProduct.colors.length > 0 && !this.selectedVariant.color) {
            console.error('Color not selected');
            return;
        }
        
        if (this.currentProduct.sizes.length > 0 && !this.selectedVariant.size) {
            console.error('Size not selected');
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
        
        // Create cart item
        const cartItem = {
            ...this.currentProduct,
            selectedColor: this.selectedVariant.color,
            selectedSize: this.selectedVariant.size,
            quantity: this.selectedVariant.quantity,
            shopifyVariantId: variantId,
            mainImage: image,
            image: image
        };
        
        const variantData = {
            ...this.selectedVariant,
            shopifyVariantId: variantId,
            image: image
        };
        
        // Add to cart
        const addButton = document.getElementById('quick-add-btn');
        
        // Show animation
        addButton.classList.add('adding');
        setTimeout(() => {
            addButton.classList.remove('adding');
        }, 1200);
        
        // Use consolidated cart system
        if (window.BobbyCart) {
            window.BobbyCart.addToCart(cartItem);
            
            // Dispatch custom event for other components
            document.dispatchEvent(new CustomEvent('quickview:addtocart', {
                detail: {
                    product: cartItem,
                    variant: variantData
                }
            }));
        } else if (window.BobbyCarts) {
            // Fallback to old system if present
            window.BobbyCarts.addToCart(cartItem);
        } else {
            console.error('Cart system not available');
        }
        
        // Close modal after a delay
        setTimeout(() => {
            this.closeQuickView();
        }, 1500);
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