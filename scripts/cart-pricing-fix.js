/**
 * Cart Pricing Fix - Maintains sale prices and discount information
 * Fixes the issue where sale prices disappear when cart items are removed
 */

// Enhanced cart system that preserves all pricing information
window.BobbyCartEnhanced = {
    items: [],
    discounts: {},
    isLoaded: false,
    
    init() {
        this.loadFromStorage();
        this.loadDiscounts();
        this.updateCount();
        this.setupEventListeners();
        this.isLoaded = true;
    },
    
    loadFromStorage() {
        try {
            const stored = localStorage.getItem('bobby-cart');
            this.items = stored ? JSON.parse(stored) : [];
            
            // Load discount information
            const storedDiscounts = localStorage.getItem('bobby-cart-discounts');
            this.discounts = storedDiscounts ? JSON.parse(storedDiscounts) : {};
        } catch (e) {
            console.warn('Failed to load cart from storage:', e);
            this.items = [];
            this.discounts = {};
        }
    },
    
    saveToStorage() {
        try {
            localStorage.setItem('bobby-cart', JSON.stringify(this.items));
            localStorage.setItem('bobby-cart-discounts', JSON.stringify(this.discounts));
        } catch (e) {
            console.warn('Failed to save cart to storage:', e);
        }
    },
    
    loadDiscounts() {
        // Load current discount information to apply to cart
        if (window.discountData) {
            this.discounts = { ...window.discountData };
        }
    },
    
    updateCount() {
        const count = this.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const countElements = document.querySelectorAll('.cart-count');
        countElements.forEach(el => el.textContent = count);
    },
    
    addItem(product) {
        const existingItem = this.items.find(item => 
            item.id === product.id && 
            item.variantId === product.variantId
        );
        
        if (existingItem) {
            existingItem.quantity += product.quantity || 1;
        } else {
            // Store complete pricing information
            const cartItem = {
                id: product.id,
                variantId: product.variantId || product.id,
                title: product.title,
                price: product.price,
                originalPrice: product.originalPrice || product.price,
                comparePrice: product.comparePrice,
                salePrice: product.salePrice,
                discountAmount: product.discountAmount,
                discountPercentage: product.discountPercentage,
                image: product.image,
                quantity: product.quantity || 1,
                variant: product.variant,
                handle: product.handle,
                tags: product.tags || [],
                addedAt: Date.now()
            };
            
            // Apply any active discounts
            this.applyDiscountsToItem(cartItem);
            this.items.push(cartItem);
        }
        
        this.saveToStorage();
        this.updateCount();
        this.showAddedNotification(product);
    },
    
    applyDiscountsToItem(item) {
        // Check for hoodie/sweatshirt discounts
        if (this.isHoodieOrSweatshirt(item)) {
            const discount = this.discounts.hoodie || { percentage: 12 };
            if (discount.percentage) {
                item.originalPrice = item.price;
                item.salePrice = item.price * (1 - discount.percentage / 100);
                item.discountPercentage = discount.percentage;
                item.discountAmount = item.price - item.salePrice;
                item.price = item.salePrice; // Use sale price as current price
            }
        }
        
        // Check for tag-based discounts
        if (item.tags && Array.isArray(item.tags)) {
            for (const tag of item.tags) {
                if (this.discounts[tag]) {
                    const discount = this.discounts[tag];
                    if (discount.percentage && !item.salePrice) {
                        item.originalPrice = item.price;
                        item.salePrice = item.price * (1 - discount.percentage / 100);
                        item.discountPercentage = discount.percentage;
                        item.discountAmount = item.price - item.salePrice;
                        item.price = item.salePrice;
                        break;
                    }
                }
            }
        }
    },
    
    isHoodieOrSweatshirt(item) {
        const hoodieKeywords = ['hoodie', 'sweatshirt', 'sweatpants', 'pullover', 'jumper'];
        const title = (item.title || '').toLowerCase();
        const tags = (item.tags || []).map(tag => tag.toLowerCase());
        
        return hoodieKeywords.some(keyword => 
            title.includes(keyword) || tags.includes(keyword)
        );
    },
    
    removeItem(productId, variantId = null) {
        this.items = this.items.filter(item => {
            if (variantId) {
                return !(item.id === productId && item.variantId === variantId);
            }
            return item.id !== productId;
        });
        
        this.saveToStorage();
        this.updateCount();
        this.renderCart();
    },
    
    updateQuantity(productId, quantity, variantId = null) {
        const item = this.items.find(item => {
            if (variantId) {
                return item.id === productId && item.variantId === variantId;
            }
            return item.id === productId;
        });
        
        if (item) {
            if (quantity <= 0) {
                this.removeItem(productId, variantId);
            } else {
                item.quantity = quantity;
                this.saveToStorage();
                this.updateCount();
                this.renderCart();
            }
        }
    },
    
    renderCart() {
        const cartItems = document.getElementById('cart-items');
        const cartTotal = document.getElementById('cart-total');
        
        if (!cartItems) return;
        
        if (this.items.length === 0) {
            cartItems.innerHTML = '<p style="text-align: center; color: #666;">Your cart is empty</p>';
            if (cartTotal) cartTotal.textContent = 'Total: $0.00';
            return;
        }
        
        let subtotal = 0;
        let totalSavings = 0;
        
        cartItems.innerHTML = this.items.map(item => {
            const currentPrice = item.salePrice || item.price;
            const originalPrice = item.originalPrice || item.price;
            const itemTotal = currentPrice * (item.quantity || 0);
            const itemSavings = (originalPrice - currentPrice) * (item.quantity || 0);
            
            subtotal += itemTotal;
            totalSavings += itemSavings;
            
            // Create price display
            let priceDisplay = '';
            if (item.salePrice && item.originalPrice && item.salePrice < item.originalPrice) {
                priceDisplay = `
                    <div class="cart-item-price">
                        <span class="sale-price">$${currentPrice.toFixed(2)}</span>
                        <span class="original-price">$${originalPrice.toFixed(2)}</span>
                        ${item.discountPercentage ? `<span class="discount-badge">${item.discountPercentage}% OFF</span>` : ''}
                    </div>
                `;
            } else {
                priceDisplay = `<div class="cart-item-price">$${currentPrice.toFixed(2)}</div>`;
            }
            
            return `
                <div class="cart-item">
                    <img src="${item.image || 'assets/product-placeholder.png'}" alt="${item.title}">
                    <div class="cart-item-info">
                        <div class="cart-item-title">${item.title}</div>
                        ${priceDisplay}
                        <div class="quantity-controls">
                            <button class="quantity-btn" onclick="BobbyCartEnhanced.updateQuantity('${item.id}', ${item.quantity - 1}, '${item.variantId || ''}')">-</button>
                            <span>${item.quantity}</span>
                            <button class="quantity-btn" onclick="BobbyCartEnhanced.updateQuantity('${item.id}', ${item.quantity + 1}, '${item.variantId || ''}')">+</button>
                            <button class="quantity-btn remove-btn" onclick="BobbyCartEnhanced.removeItem('${item.id}', '${item.variantId || ''}')" style="margin-left: 1rem; background: #ff4444;">×</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Update total display
        if (cartTotal) {
            let totalDisplay = `Total: $${subtotal.toFixed(2)}`;
            if (totalSavings > 0) {
                totalDisplay += `<div class="total-savings">You saved: $${totalSavings.toFixed(2)}</div>`;
            }
            cartTotal.innerHTML = totalDisplay;
        }
        
        // Add enhanced cart styles
        this.addEnhancedCartStyles();
    },
    
    addEnhancedCartStyles() {
        if (document.getElementById('enhanced-cart-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'enhanced-cart-styles';
        style.textContent = `
            .cart-item-price {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                flex-wrap: wrap;
            }
            .sale-price {
                color: #00ff88;
                font-weight: 600;
                font-size: 1.1rem;
            }
            .original-price {
                color: #999;
                text-decoration: line-through;
                font-size: 0.9rem;
            }
            .discount-badge {
                background: #ff4444;
                color: white;
                padding: 0.2rem 0.4rem;
                border-radius: 3px;
                font-size: 0.7rem;
                font-weight: 600;
                text-transform: uppercase;
            }
            .total-savings {
                color: #00ff88;
                font-size: 0.9rem;
                margin-top: 0.5rem;
                font-weight: 500;
            }
            .remove-btn:hover {
                background: #cc0000 !important;
            }
        `;
        document.head.appendChild(style);
    },
    
    openCart() {
        this.createCartElements();
        this.renderCart();
        
        const sidebar = document.getElementById('cart-sidebar');
        const overlay = document.getElementById('cart-overlay');
        
        if (sidebar && overlay) {
            sidebar.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },
    
    closeCart() {
        const sidebar = document.getElementById('cart-sidebar');
        const overlay = document.getElementById('cart-overlay');
        
        if (sidebar && overlay) {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    },
    
    createCartElements() {
        if (document.getElementById('cart-sidebar')) return;
        
        // Create cart sidebar with enhanced styling
        const sidebar = document.createElement('div');
        sidebar.id = 'cart-sidebar';
        sidebar.className = 'cart-sidebar';
        sidebar.innerHTML = `
            <div class="cart-header">
                <h3>Shopping Cart</h3>
                <button class="cart-close" onclick="BobbyCartEnhanced.closeCart()">×</button>
            </div>
            <div class="cart-items" id="cart-items"></div>
            <div class="cart-footer">
                <div class="cart-total" id="cart-total">Total: $0.00</div>
                <button class="checkout-btn" onclick="BobbyCartEnhanced.checkout()">Checkout</button>
            </div>
        `;
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'cart-overlay';
        overlay.className = 'cart-overlay';
        overlay.onclick = () => this.closeCart();
        
        document.body.appendChild(sidebar);
        document.body.appendChild(overlay);
        
        // Add cart styles (reuse existing styles)
        if (window.BobbyCart && typeof window.BobbyCart.addCartStyles === 'function') {
            window.BobbyCart.addCartStyles();
        }
    },
    
    showAddedNotification(product) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: #00ff88;
            color: black;
            padding: 1rem;
            border-radius: 4px;
            z-index: 10002;
            font-weight: 600;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        
        let message = `Added ${product.title} to cart`;
        if (product.salePrice && product.originalPrice && product.salePrice < product.originalPrice) {
            const savings = product.originalPrice - product.salePrice;
            message += ` (Save $${savings.toFixed(2)})`;
        }
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },
    
    checkout() {
        if (this.items.length === 0) {
            alert('Your cart is empty');
            return;
        }
        
        // Load checkout system on demand
        if (window.BobbyScriptLoader) {
            window.BobbyScriptLoader.loadOnce('scripts/shopify-integration.js', (success) => {
                if (success && window.ShopifyIntegration) {
                    window.ShopifyIntegration.createCheckout(this.items);
                } else {
                    window.location.href = 'products.html';
                }
            });
        } else {
            window.location.href = 'products.html';
        }
    },
    
    setupEventListeners() {
        // Cart button click handler
        document.addEventListener('click', (e) => {
            if (e.target.matches('.cart-btn, .cart-btn *')) {
                e.preventDefault();
                this.openCart();
            }
        });
        
        // Escape key to close cart
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeCart();
            }
        });
    }
};

// Replace the original cart system
if (window.BobbyCart) {
    // Migrate existing items to enhanced cart
    if (window.BobbyCart.items && window.BobbyCart.items.length > 0) {
        BobbyCartEnhanced.items = window.BobbyCart.items.map(item => ({
            ...item,
            originalPrice: item.originalPrice || item.price,
            variantId: item.variantId || item.id,
            addedAt: item.addedAt || Date.now()
        }));
    }
    
    // Replace methods
    window.BobbyCart.addItem = (product) => BobbyCartEnhanced.addItem(product);
    window.BobbyCart.removeItem = (productId, variantId) => BobbyCartEnhanced.removeItem(productId, variantId);
    window.BobbyCart.updateQuantity = (productId, quantity, variantId) => BobbyCartEnhanced.updateQuantity(productId, quantity, variantId);
    window.BobbyCart.openCart = () => BobbyCartEnhanced.openCart();
    window.BobbyCart.closeCart = () => BobbyCartEnhanced.closeCart();
    window.BobbyCart.renderCart = () => BobbyCartEnhanced.renderCart();
}

// Initialize enhanced cart system
document.addEventListener('DOMContentLoaded', function() {
    BobbyCartEnhanced.init();
});

// Export enhanced cart
window.BobbyCartEnhanced = BobbyCartEnhanced;

console.log('✅ Cart pricing fix loaded - sale prices will now persist when items are removed');