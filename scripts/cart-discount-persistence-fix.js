/**
 * Cart Discount Persistence Fix
 * Ensures discounts and sale prices persist through all cart operations
 */

// Enhanced cart system with bulletproof discount persistence
window.BobbyCartDiscountFix = {
    items: [],
    discounts: {},
    discountRules: {},
    isLoaded: false,
    
    init() {
        console.log('🛒 Initializing enhanced cart with discount persistence...');
        this.loadDiscountRules();
        this.loadFromStorage();
        this.updateCount();
        this.setupEventListeners();
        this.isLoaded = true;
        console.log('✅ Cart with discount persistence ready');
    },
    
    loadDiscountRules() {
        // Define discount rules that persist regardless of cart operations
        this.discountRules = {
            hoodie: {
                percentage: 12,
                keywords: ['hoodie', 'sweatshirt', 'sweatpants', 'pullover', 'jumper'],
                description: '12% off hoodies and sweatshirts'
            },
            general: {
                percentage: 10,
                tags: ['sale', 'discount'],
                description: '10% off sale items'
            }
        };
        
        console.log('📋 Discount rules loaded:', this.discountRules);
    },
    
    loadFromStorage() {
        try {
            const stored = localStorage.getItem('bobby-cart-enhanced');
            this.items = stored ? JSON.parse(stored) : [];
            
            const storedDiscounts = localStorage.getItem('bobby-cart-discounts-enhanced');
            this.discounts = storedDiscounts ? JSON.parse(storedDiscounts) : {};
            
            // Re-apply discount rules to ensure consistency
            this.items = this.items.map(item => this.ensureDiscountApplied(item));
            
        } catch (e) {
            console.warn('Failed to load cart from storage:', e);
            this.items = [];
            this.discounts = {};
        }
    },
    
    saveToStorage() {
        try {
            localStorage.setItem('bobby-cart-enhanced', JSON.stringify(this.items));
            localStorage.setItem('bobby-cart-discounts-enhanced', JSON.stringify(this.discounts));
        } catch (e) {
            console.warn('Failed to save cart to storage:', e);
        }
    },
    
    ensureDiscountApplied(item) {
        // Always re-calculate and apply discounts to ensure they persist
        const originalItem = { ...item };
        
        // Reset to original price first
        if (item.basePrice) {
            item.price = item.basePrice;
        } else {
            item.basePrice = item.originalPrice || item.price;
            item.price = item.basePrice;
        }
        
        // Clear existing discount info
        delete item.salePrice;
        delete item.discountPercentage;
        delete item.discountAmount;
        
        // Re-apply hoodie discount
        if (this.isHoodieOrSweatshirt(item)) {
            const discount = this.discountRules.hoodie;
            item.originalPrice = item.basePrice;
            item.salePrice = item.basePrice * (1 - discount.percentage / 100);
            item.discountPercentage = discount.percentage;
            item.discountAmount = item.basePrice - item.salePrice;
            item.price = item.salePrice;
            item.discountType = 'hoodie';
            item.discountDescription = discount.description;
        }
        
        // Re-apply tag-based discounts
        if (item.tags && Array.isArray(item.tags)) {
            for (const tag of item.tags) {
                if (this.discountRules.general.tags.includes(tag.toLowerCase())) {
                    const discount = this.discountRules.general;
                    if (!item.salePrice) { // Don't double-discount
                        item.originalPrice = item.basePrice;
                        item.salePrice = item.basePrice * (1 - discount.percentage / 100);
                        item.discountPercentage = discount.percentage;
                        item.discountAmount = item.basePrice - item.salePrice;
                        item.price = item.salePrice;
                        item.discountType = 'tag';
                        item.discountDescription = discount.description;
                        break;
                    }
                }
            }
        }
        
        console.log('🔄 Discount re-applied to item:', item.title, {
            basePrice: item.basePrice,
            salePrice: item.salePrice,
            discountPercentage: item.discountPercentage
        });
        
        return item;
    },
    
    isHoodieOrSweatshirt(item) {
        const hoodieKeywords = this.discountRules.hoodie.keywords;
        const title = (item.title || '').toLowerCase();
        const tags = (item.tags || []).map(tag => tag.toLowerCase());
        
        return hoodieKeywords.some(keyword => 
            title.includes(keyword) || tags.includes(keyword)
        );
    },
    
    updateCount() {
        const count = this.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const countElements = document.querySelectorAll('.cart-count');
        countElements.forEach(el => el.textContent = count);
    },
    
    addItem(product) {
        const existingItem = this.items.find(item => 
            item.id === product.id && 
            item.variantId === (product.variantId || product.id)
        );
        
        if (existingItem) {
            existingItem.quantity += product.quantity || 1;
            // Re-apply discounts to ensure they persist
            this.ensureDiscountApplied(existingItem);
        } else {
            // Create new item with complete information
            const cartItem = {
                id: product.id,
                variantId: product.variantId || product.id,
                title: product.title,
                basePrice: product.price, // Store original price
                price: product.price,
                originalPrice: product.price,
                image: product.image,
                quantity: product.quantity || 1,
                variant: product.variant,
                handle: product.handle,
                tags: product.tags || [],
                addedAt: Date.now()
            };
            
            // Apply discounts
            const enhancedItem = this.ensureDiscountApplied(cartItem);
            this.items.push(enhancedItem);
        }
        
        this.saveToStorage();
        this.updateCount();
        this.showAddedNotification(product);
    },
    
    removeItem(productId, variantId = null) {
        console.log('🗑️ Removing item:', productId, variantId);
        
        this.items = this.items.filter(item => {
            if (variantId) {
                return !(item.id === productId && item.variantId === variantId);
            }
            return item.id !== productId;
        });
        
        // Re-apply discounts to all remaining items to ensure consistency
        this.items = this.items.map(item => this.ensureDiscountApplied(item));
        
        this.saveToStorage();
        this.updateCount();
        this.renderCart();
        
        console.log('✅ Item removed, discounts preserved on remaining items');
    },
    
    updateQuantity(productId, quantity, variantId = null) {
        console.log('🔢 Updating quantity:', productId, quantity, variantId);
        
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
                // Re-apply discounts to ensure they persist
                this.ensureDiscountApplied(item);
                this.saveToStorage();
                this.updateCount();
                this.renderCart();
            }
        }
        
        console.log('✅ Quantity updated, discounts preserved');
    },
    
    renderCart() {
        const cartItems = document.getElementById('cart-items');
        const cartTotal = document.getElementById('cart-total');
        
        if (!cartItems) return;
        
        if (this.items.length === 0) {
            cartItems.innerHTML = '<p style="text-align: center; color: #666;">Your cart is empty</p>';
            if (cartTotal) cartTotal.innerHTML = 'Total: $0.00';
            return;
        }
        
        let subtotal = 0;
        let totalSavings = 0;
        let originalTotal = 0;
        
        cartItems.innerHTML = this.items.map(item => {
            // Ensure discounts are applied before rendering
            const enhancedItem = this.ensureDiscountApplied(item);
            
            const currentPrice = enhancedItem.salePrice || enhancedItem.price;
            const originalPrice = enhancedItem.basePrice || enhancedItem.originalPrice || enhancedItem.price;
            const itemTotal = currentPrice * (enhancedItem.quantity || 0);
            const itemOriginalTotal = originalPrice * (enhancedItem.quantity || 0);
            const itemSavings = itemOriginalTotal - itemTotal;
            
            subtotal += itemTotal;
            originalTotal += itemOriginalTotal;
            totalSavings += itemSavings;
            
            // Create price display with persistent discount info
            let priceDisplay = '';
            if (enhancedItem.salePrice && enhancedItem.discountPercentage) {
                priceDisplay = `
                    <div class="cart-item-price">
                        <span class="sale-price">$${currentPrice.toFixed(2)}</span>
                        <span class="original-price">$${originalPrice.toFixed(2)}</span>
                        <span class="discount-badge">${enhancedItem.discountPercentage}% OFF</span>
                    </div>
                    <div class="discount-info">${enhancedItem.discountDescription || ''}</div>
                `;
            } else {
                priceDisplay = `<div class="cart-item-price">$${currentPrice.toFixed(2)}</div>`;
            }
            
            return `
                <div class="cart-item">
                    <img src="${enhancedItem.image || 'assets/product-placeholder.png'}" alt="${enhancedItem.title}">
                    <div class="cart-item-info">
                        <div class="cart-item-title">${enhancedItem.title}</div>
                        ${priceDisplay}
                        <div class="quantity-controls">
                            <button class="quantity-btn" onclick="BobbyCartDiscountFix.updateQuantity('${enhancedItem.id}', ${enhancedItem.quantity - 1}, '${enhancedItem.variantId || ''}')">-</button>
                            <span>${enhancedItem.quantity}</span>
                            <button class="quantity-btn" onclick="BobbyCartDiscountFix.updateQuantity('${enhancedItem.id}', ${enhancedItem.quantity + 1}, '${enhancedItem.variantId || ''}')">+</button>
                            <button class="quantity-btn remove-btn" onclick="BobbyCartDiscountFix.removeItem('${enhancedItem.id}', '${enhancedItem.variantId || ''}')" style="margin-left: 1rem; background: #ff4444;">×</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Update total display with persistent savings
        if (cartTotal) {
            let totalDisplay = `
                <div class="cart-subtotal">Subtotal: $${subtotal.toFixed(2)}</div>
            `;
            
            if (totalSavings > 0) {
                totalDisplay += `
                    <div class="total-savings">You saved: $${totalSavings.toFixed(2)}</div>
                    <div class="original-total">Original: $${originalTotal.toFixed(2)}</div>
                `;
            }
            
            totalDisplay += `<div class="cart-final-total">Total: $${subtotal.toFixed(2)}</div>`;
            cartTotal.innerHTML = totalDisplay;
        }
        
        // Add enhanced cart styles
        this.addEnhancedCartStyles();
        
        console.log('🎨 Cart rendered with persistent discounts:', {
            items: this.items.length,
            subtotal: subtotal.toFixed(2),
            savings: totalSavings.toFixed(2)
        });
    },
    
    addEnhancedCartStyles() {
        if (document.getElementById('enhanced-cart-styles-v2')) return;
        
        const style = document.createElement('style');
        style.id = 'enhanced-cart-styles-v2';
        style.textContent = `
            .cart-item-price {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                flex-wrap: wrap;
                margin-bottom: 0.25rem;
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
            .discount-info {
                color: #00ff88;
                font-size: 0.8rem;
                font-style: italic;
                margin-bottom: 0.5rem;
            }
            .cart-subtotal {
                font-size: 1.1rem;
                margin-bottom: 0.5rem;
            }
            .total-savings {
                color: #00ff88;
                font-size: 0.9rem;
                margin-bottom: 0.25rem;
                font-weight: 500;
            }
            .original-total {
                color: #999;
                font-size: 0.8rem;
                text-decoration: line-through;
                margin-bottom: 0.5rem;
            }
            .cart-final-total {
                color: #00ff88;
                font-size: 1.3rem;
                font-weight: 700;
                border-top: 1px solid #333;
                padding-top: 0.5rem;
                margin-top: 0.5rem;
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
        
        const sidebar = document.createElement('div');
        sidebar.id = 'cart-sidebar';
        sidebar.className = 'cart-sidebar';
        sidebar.innerHTML = `
            <div class="cart-header">
                <h3>Shopping Cart</h3>
                <button class="cart-close" onclick="BobbyCartDiscountFix.closeCart()">×</button>
            </div>
            <div class="cart-items" id="cart-items"></div>
            <div class="cart-footer">
                <div class="cart-total" id="cart-total">Total: $0.00</div>
                <button class="checkout-btn" onclick="BobbyCartDiscountFix.checkout()">Checkout</button>
            </div>
        `;
        
        const overlay = document.createElement('div');
        overlay.id = 'cart-overlay';
        overlay.className = 'cart-overlay';
        overlay.onclick = () => this.closeCart();
        
        document.body.appendChild(sidebar);
        document.body.appendChild(overlay);
        
        // Add cart styles
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
        
        // Check if this item would have a discount
        const tempItem = { ...product, basePrice: product.price };
        const enhancedItem = this.ensureDiscountApplied(tempItem);
        
        if (enhancedItem.salePrice && enhancedItem.discountPercentage) {
            const savings = enhancedItem.basePrice - enhancedItem.salePrice;
            message += ` (${enhancedItem.discountPercentage}% off - Save $${savings.toFixed(2)})`;
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
        document.addEventListener('click', (e) => {
            if (e.target.matches('.cart-btn, .cart-btn *')) {
                e.preventDefault();
                this.openCart();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeCart();
            }
        });
    }
};

// Replace all existing cart systems
if (window.BobbyCart) {
    // Migrate existing items
    if (window.BobbyCart.items && window.BobbyCart.items.length > 0) {
        BobbyCartDiscountFix.items = window.BobbyCart.items.map(item => ({
            ...item,
            basePrice: item.basePrice || item.originalPrice || item.price,
            variantId: item.variantId || item.id,
            addedAt: item.addedAt || Date.now()
        }));
    }
    
    // Replace methods
    window.BobbyCart.addItem = (product) => BobbyCartDiscountFix.addItem(product);
    window.BobbyCart.removeItem = (productId, variantId) => BobbyCartDiscountFix.removeItem(productId, variantId);
    window.BobbyCart.updateQuantity = (productId, quantity, variantId) => BobbyCartDiscountFix.updateQuantity(productId, quantity, variantId);
    window.BobbyCart.openCart = () => BobbyCartDiscountFix.openCart();
    window.BobbyCart.closeCart = () => BobbyCartDiscountFix.closeCart();
    window.BobbyCart.renderCart = () => BobbyCartDiscountFix.renderCart();
}

if (window.BobbyCartEnhanced) {
    // Migrate from enhanced cart
    if (window.BobbyCartEnhanced.items && window.BobbyCartEnhanced.items.length > 0) {
        BobbyCartDiscountFix.items = window.BobbyCartEnhanced.items;
        BobbyCartDiscountFix.discounts = window.BobbyCartEnhanced.discounts || {};
    }
    
    // Replace methods
    window.BobbyCartEnhanced.addItem = (product) => BobbyCartDiscountFix.addItem(product);
    window.BobbyCartEnhanced.removeItem = (productId, variantId) => BobbyCartDiscountFix.removeItem(productId, variantId);
    window.BobbyCartEnhanced.updateQuantity = (productId, quantity, variantId) => BobbyCartDiscountFix.updateQuantity(productId, quantity, variantId);
    window.BobbyCartEnhanced.openCart = () => BobbyCartDiscountFix.openCart();
    window.BobbyCartEnhanced.closeCart = () => BobbyCartDiscountFix.closeCart();
    window.BobbyCartEnhanced.renderCart = () => BobbyCartDiscountFix.renderCart();
}

// Initialize the fixed cart system
document.addEventListener('DOMContentLoaded', function() {
    BobbyCartDiscountFix.init();
});

// Export for global access
window.BobbyCartDiscountFix = BobbyCartDiscountFix;

console.log('🛒✨ Cart discount persistence fix loaded - discounts will NEVER disappear!');