// Wishlist Management System
class WishlistManager {
    constructor() {
        this.items = [];
        this.isOpen = false;
        
        this.loadWishlistFromStorage();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateWishlistDisplay();
        this.updateWishlistCount();
    }

    setupEventListeners() {
        // Wishlist toggle
        const wishlistToggle = document.getElementById('wishlist-toggle');
        const wishlistSidebar = document.getElementById('wishlist-sidebar');
        const wishlistClose = document.getElementById('wishlist-close');
        const wishlistOverlay = document.getElementById('wishlist-overlay');

        if (wishlistToggle) {
            wishlistToggle.addEventListener('click', () => this.toggleWishlist());
        }

        if (wishlistClose) {
            wishlistClose.addEventListener('click', () => this.closeWishlist());
        }

        if (wishlistOverlay) {
            wishlistOverlay.addEventListener('click', () => this.closeWishlist());
        }

        // Close wishlist on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeWishlist();
            }
        });
    }

    toggleItem(productId) {
        const existingIndex = this.items.findIndex(item => item.id === productId);
        
        if (existingIndex > -1) {
            this.items.splice(existingIndex, 1);
            this.showNotification('Removed from wishlist', 'info');
        } else {
            // Get product data from product manager
            const product = this.getProductData(productId);
            if (product) {
                this.items.push({
                    id: product.id,
                    title: product.title,
                    price: product.price,
                    comparePrice: product.comparePrice,
                    image: product.mainImage,
                    category: product.category,
                    addedAt: new Date().toISOString()
                });
                this.showNotification('Added to wishlist!', 'success');
            }
        }

        this.saveWishlistToStorage();
        this.updateWishlistDisplay();
        this.updateWishlistCount();
        this.updateWishlistButtons();
        
        // Analytics tracking
        this.trackWishlistAction(productId, existingIndex === -1 ? 'add' : 'remove');
    }

    removeItem(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.saveWishlistToStorage();
        this.updateWishlistDisplay();
        this.updateWishlistCount();
        this.updateWishlistButtons();
        this.showNotification('Removed from wishlist', 'info');
    }

    clearWishlist() {
        this.items = [];
        this.saveWishlistToStorage();
        this.updateWishlistDisplay();
        this.updateWishlistCount();
        this.updateWishlistButtons();
        this.showNotification('Wishlist cleared', 'info');
    }

    toggleWishlist() {
        if (this.isOpen) {
            this.closeWishlist();
        } else {
            this.openWishlist();
        }
    }

    openWishlist() {
        const wishlistSidebar = document.getElementById('wishlist-sidebar');
        const wishlistOverlay = document.getElementById('wishlist-overlay');
        
        if (wishlistSidebar && wishlistOverlay) {
            wishlistSidebar.classList.add('active');
            wishlistOverlay.classList.add('active');
            this.isOpen = true;
            document.body.style.overflow = 'hidden';
            
            // Focus management for accessibility
            const firstFocusable = wishlistSidebar.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (firstFocusable) {
                firstFocusable.focus();
            }
        }
    }

    closeWishlist() {
        const wishlistSidebar = document.getElementById('wishlist-sidebar');
        const wishlistOverlay = document.getElementById('wishlist-overlay');
        
        if (wishlistSidebar && wishlistOverlay) {
            wishlistSidebar.classList.remove('active');
            wishlistOverlay.classList.remove('active');
            this.isOpen = false;
            document.body.style.overflow = '';
        }
    }

    updateWishlistDisplay() {
        const wishlistItems = document.getElementById('wishlist-items');
        
        if (!wishlistItems) return;

        if (this.items.length === 0) {
            wishlistItems.innerHTML = `
                <div class="empty-wishlist">
                    <div class="empty-wishlist-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </div>
                    <h3>Your wishlist is empty</h3>
                    <p>Save items you love for later</p>
                    <button class="continue-shopping-btn" onclick="wishlistManager.closeWishlist()">
                        Continue Shopping
                    </button>
                </div>
            `;
        } else {
            wishlistItems.innerHTML = this.items.map(item => this.createWishlistItemHTML(item)).join('');
            this.attachWishlistItemListeners();
        }
    }

    createWishlistItemHTML(item) {
        const discount = item.comparePrice ? Math.round(((item.comparePrice - item.price) / item.comparePrice) * 100) : 0;
        
        return `
            <div class="wishlist-item" data-item-id="${item.id}">
                <img src="${item.image}" alt="${item.title}" class="wishlist-item-image" onclick="wishlistManager.viewProduct('${item.id}')">
                <div class="wishlist-item-info">
                    <div class="wishlist-item-title" onclick="wishlistManager.viewProduct('${item.id}')">${item.title}</div>
                    <div class="wishlist-item-category">${item.category.replace('-', ' ')}</div>
                    <div class="wishlist-item-price">
                        <span class="price-current">$${item.price.toFixed(2)}</span>
                        ${item.comparePrice ? `<span class="price-original">$${item.comparePrice.toFixed(2)}</span>` : ''}
                        ${discount > 0 ? `<span class="price-discount">-${discount}%</span>` : ''}
                    </div>
                    <div class="wishlist-item-actions">
                        <button class="add-to-cart-btn small" onclick="wishlistManager.addToCart('${item.id}')">
                            Add to Cart
                        </button>
                        <button class="move-to-cart-btn" onclick="wishlistManager.moveToCart('${item.id}')" title="Move to cart">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="9" cy="21" r="1"></circle>
                                <circle cx="20" cy="21" r="1"></circle>
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                <button class="remove-item-btn" onclick="wishlistManager.removeItem('${item.id}')" title="Remove from wishlist">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3,6 5,6 21,6"></polyline>
                        <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </button>
            </div>
        `;
    }

    attachWishlistItemListeners() {
        // Add hover effects and animations
        document.querySelectorAll('.wishlist-item').forEach(item => {
            item.addEventListener('mouseenter', () => {
                item.style.transform = 'translateX(5px)';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.transform = '';
            });
        });

        // Add button animations
        document.querySelectorAll('.wishlist-item .add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                btn.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    btn.style.transform = '';
                }, 150);
            });
        });
    }

    updateWishlistCount() {
        const wishlistCount = document.getElementById('wishlist-count');
        if (wishlistCount) {
            wishlistCount.textContent = this.items.length;
            wishlistCount.style.display = this.items.length > 0 ? 'flex' : 'none';
            
            // Add bounce animation
            if (this.items.length > 0) {
                wishlistCount.style.animation = 'bounce 0.5s ease';
                setTimeout(() => {
                    wishlistCount.style.animation = '';
                }, 500);
            }
        }
    }

    updateWishlistButtons() {
        // Update all wishlist buttons on the page
        document.querySelectorAll('.wishlist-btn').forEach(btn => {
            const productId = btn.dataset.productId;
            const isInWishlist = this.items.some(item => item.id === productId);
            
            if (isInWishlist) {
                btn.classList.add('active');
                btn.style.color = '#ef4444';
            } else {
                btn.classList.remove('active');
                btn.style.color = '';
            }
        });
    }

    addToCart(productId) {
        const product = this.getProductData(productId);
        if (product && window.cartManager) {
            window.cartManager.addItem(product);
            this.showNotification('Added to cart!', 'success');
        }
    }

    moveToCart(productId) {
        this.addToCart(productId);
        this.removeItem(productId);
        this.showNotification('Moved to cart!', 'success');
    }

    viewProduct(productId) {
        // Navigate to product page or show quick view
        if (window.productManager) {
            window.productManager.viewProduct(productId);
        }
    }

    getProductData(productId) {
        // Get product data from product manager
        if (window.productManager && window.productManager.products) {
            return window.productManager.products.find(p => p.id === productId);
        }
        return null;
    }

    saveWishlistToStorage() {
        try {
            localStorage.setItem('bobby-streetwear-wishlist', JSON.stringify(this.items));
        } catch (error) {
            console.error('Error saving wishlist to storage:', error);
        }
    }

    loadWishlistFromStorage() {
        try {
            const savedWishlist = localStorage.getItem('bobby-streetwear-wishlist');
            if (savedWishlist) {
                this.items = JSON.parse(savedWishlist);
            }
        } catch (error) {
            console.error('Error loading wishlist from storage:', error);
            this.items = [];
        }
    }

    trackWishlistAction(productId, action) {
        // Analytics tracking
        if (typeof gtag !== 'undefined') {
            gtag('event', action === 'add' ? 'add_to_wishlist' : 'remove_from_wishlist', {
                item_id: productId,
                action: action
            });
        }

        // Facebook Pixel tracking
        if (typeof fbq !== 'undefined') {
            fbq('track', action === 'add' ? 'AddToWishlist' : 'RemoveFromWishlist', {
                content_ids: [productId],
                content_type: 'product'
            });
        }
    }

    showNotification(message, type = 'info') {
        // Use the same notification system as products.js
        if (window.productManager && window.productManager.showNotification) {
            window.productManager.showNotification(message, type);
        } else {
            // Fallback notification
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    // Public API methods
    getWishlistData() {
        return {
            items: this.items,
            count: this.items.length
        };
    }

    isInWishlist(productId) {
        return this.items.some(item => item.id === productId);
    }

    exportWishlist() {
        // Export wishlist as shareable link or email
        const wishlistData = {
            items: this.items.map(item => ({
                id: item.id,
                title: item.title,
                price: item.price
            })),
            createdAt: new Date().toISOString()
        };

        const encodedData = btoa(JSON.stringify(wishlistData));
        const shareUrl = `${window.location.origin}/wishlist?data=${encodedData}`;
        
        // Copy to clipboard
        navigator.clipboard.writeText(shareUrl).then(() => {
            this.showNotification('Wishlist link copied to clipboard!', 'success');
        }).catch(() => {
            this.showNotification('Could not copy link', 'error');
        });

        return shareUrl;
    }

    importWishlist(encodedData) {
        try {
            const wishlistData = JSON.parse(atob(encodedData));
            if (wishlistData.items && Array.isArray(wishlistData.items)) {
                // Merge with existing wishlist
                wishlistData.items.forEach(item => {
                    if (!this.isInWishlist(item.id)) {
                        const fullProduct = this.getProductData(item.id);
                        if (fullProduct) {
                            this.items.push({
                                ...fullProduct,
                                addedAt: new Date().toISOString()
                            });
                        }
                    }
                });
                
                this.saveWishlistToStorage();
                this.updateWishlistDisplay();
                this.updateWishlistCount();
                this.updateWishlistButtons();
                this.showNotification('Wishlist imported successfully!', 'success');
            }
        } catch (error) {
            this.showNotification('Invalid wishlist data', 'error');
        }
    }
}

// Initialize wishlist manager
document.addEventListener('DOMContentLoaded', () => {
    window.wishlistManager = new WishlistManager();
    
    // Check for imported wishlist data in URL
    const urlParams = new URLSearchParams(window.location.search);
    const wishlistData = urlParams.get('data');
    if (wishlistData) {
        setTimeout(() => {
            window.wishlistManager.importWishlist(wishlistData);
        }, 1000);
    }
});

// Add wishlist-specific styles
const wishlistStyles = `
    .empty-wishlist {
        text-align: center;
        padding: 3rem 1rem;
        color: rgba(255, 255, 255, 0.7);
    }

    .empty-wishlist-icon {
        margin-bottom: 1rem;
        opacity: 0.5;
        color: #ef4444;
    }

    .empty-wishlist h3 {
        color: #ffffff;
        margin-bottom: 0.5rem;
    }

    .wishlist-item {
        display: flex;
        gap: 1rem;
        padding: 1rem;
        background: rgba(168, 85, 247, 0.1);
        border-radius: 12px;
        margin-bottom: 1rem;
        transition: all 0.3s ease;
        position: relative;
    }

    .wishlist-item:hover {
        background: rgba(168, 85, 247, 0.15);
    }

    .wishlist-item-image {
        width: 80px;
        height: 80px;
        object-fit: cover;
        border-radius: 8px;
        cursor: pointer;
        transition: transform 0.3s ease;
    }

    .wishlist-item-image:hover {
        transform: scale(1.05);
    }

    .wishlist-item-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .wishlist-item-title {
        color: #ffffff;
        font-weight: 600;
        font-size: 0.9rem;
        cursor: pointer;
        transition: color 0.3s ease;
        line-height: 1.3;
    }

    .wishlist-item-title:hover {
        color: #a855f7;
    }

    .wishlist-item-category {
        font-size: 0.75rem;
        color: rgba(168, 85, 247, 0.8);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .wishlist-item-price {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .wishlist-item-price .price-current {
        color: #ffffff;
        font-weight: 600;
        font-size: 0.9rem;
    }

    .wishlist-item-price .price-original {
        color: rgba(255, 255, 255, 0.5);
        text-decoration: line-through;
        font-size: 0.8rem;
    }

    .wishlist-item-price .price-discount {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
        padding: 0.125rem 0.375rem;
        border-radius: 4px;
        font-size: 0.7rem;
        font-weight: 600;
    }

    .wishlist-item-actions {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        margin-top: auto;
    }

    .wishlist-item-actions .add-to-cart-btn.small {
        padding: 0.5rem 1rem;
        font-size: 0.8rem;
        border-radius: 6px;
    }

    .move-to-cart-btn {
        background: rgba(59, 130, 246, 0.2);
        border: none;
        color: #3b82f6;
        padding: 0.5rem;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .move-to-cart-btn:hover {
        background: rgba(59, 130, 246, 0.4);
        transform: scale(1.05);
    }

    .wishlist-item .remove-item-btn {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        background: rgba(239, 68, 68, 0.2);
        border: none;
        color: #ef4444;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .wishlist-item .remove-item-btn:hover {
        background: rgba(239, 68, 68, 0.4);
        transform: scale(1.1);
    }

    .wishlist-btn.active {
        color: #ef4444 !important;
        background: rgba(239, 68, 68, 0.1) !important;
    }

    .wishlist-btn.active svg {
        fill: #ef4444;
    }

    /* Wishlist sharing modal */
    .wishlist-share-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10000;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
    }

    .wishlist-share-modal.active {
        opacity: 1;
        visibility: visible;
    }

    .wishlist-share-content {
        background: rgba(26, 26, 46, 0.95);
        border-radius: 20px;
        padding: 2rem;
        max-width: 400px;
        width: 90vw;
        border: 1px solid rgba(168, 85, 247, 0.2);
        backdrop-filter: blur(20px);
        text-align: center;
    }

    .wishlist-share-content h3 {
        color: #ffffff;
        margin-bottom: 1rem;
    }

    .wishlist-share-content p {
        color: rgba(255, 255, 255, 0.8);
        margin-bottom: 1.5rem;
    }

    .share-url-input {
        width: 100%;
        background: rgba(168, 85, 247, 0.1);
        border: 1px solid rgba(168, 85, 247, 0.3);
        color: #ffffff;
        padding: 0.75rem;
        border-radius: 8px;
        margin-bottom: 1rem;
        font-size: 0.9rem;
    }

    .share-buttons {
        display: flex;
        gap: 0.5rem;
        justify-content: center;
    }

    .share-btn {
        background: rgba(168, 85, 247, 0.2);
        border: 1px solid rgba(168, 85, 247, 0.3);
        color: #ffffff;
        padding: 0.75rem 1rem;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 0.9rem;
    }

    .share-btn:hover {
        background: rgba(168, 85, 247, 0.4);
        transform: translateY(-2px);
    }

    @media (max-width: 768px) {
        .wishlist-item {
            flex-direction: column;
            text-align: center;
        }

        .wishlist-item-image {
            width: 100%;
            height: 120px;
            margin-bottom: 0.5rem;
        }

        .wishlist-item-actions {
            justify-content: center;
        }

        .wishlist-item .remove-item-btn {
            position: static;
            margin-top: 0.5rem;
            width: auto;
            height: auto;
            padding: 0.5rem;
            border-radius: 8px;
        }
    }
`;

// Inject wishlist styles
const wishlistStyleSheet = document.createElement('style');
wishlistStyleSheet.textContent = wishlistStyles;
document.head.appendChild(wishlistStyleSheet);