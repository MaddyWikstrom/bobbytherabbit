/**
 * Precise Discount System - Only applies discounts to specific eligible products
 * Prevents incorrect sale pricing on items that shouldn't be discounted
 */

// Precise discount system with strict product matching
window.PreciseDiscountSystem = {
    items: [],
    
    // Define EXACT products that should have discounts
    discountEligibleProducts: {
        // Add specific product IDs or handles that should have discounts
        // Format: 'product-id': { percentage: 12, description: '12% off' }
        
        // EMPTY BY DEFAULT - NO PRODUCTS WILL SHOW DISCOUNTS UNTIL YOU ADD THEM HERE
        // Example: 'your-actual-product-id': { percentage: 12, description: '12% off hoodies' },
    },
    
    // DISABLED: No automatic pattern matching - only specific product IDs get discounts
    discountPatterns: [
        // Patterns are disabled to prevent unwanted discounts
        // Add specific product IDs to discountEligibleProducts instead
    ],
    
    isInitialized: false,
    
    init() {
        if (this.isInitialized) return;
        
        console.log('🎯 Initializing precise discount system...');
        this.loadFromStorage();
        this.updateCount();
        this.setupEventListeners();
        this.isInitialized = true;
        
        console.log('✅ Precise discount system ready');
    },
    
    loadFromStorage() {
        try {
            const stored = localStorage.getItem('precise-bobby-cart');
            this.items = stored ? JSON.parse(stored) : [];
            
            // Re-validate all discounts to ensure accuracy
            this.items = this.items.map(item => this.validateAndApplyDiscounts(item));
        } catch (e) {
            console.warn('Failed to load cart:', e);
            this.items = [];
        }
    },
    
    saveToStorage() {
        try {
            localStorage.setItem('precise-bobby-cart', JSON.stringify(this.items));
        } catch (e) {
            console.warn('Failed to save cart:', e);
        }
    },
    
    validateAndApplyDiscounts(item) {
        // Create clean item without any existing discount info
        const cleanItem = {
            id: item.id,
            variantId: item.variantId || item.id,
            title: item.title,
            quantity: item.quantity || 1,
            basePrice: item.basePrice || item.originalPrice || item.price,
            image: item.image,
            tags: item.tags || [],
            handle: item.handle || '',
            addedAt: item.addedAt || Date.now()
        };
        
        // Set price to base price (no discount by default)
        cleanItem.price = cleanItem.basePrice;
        cleanItem.originalPrice = cleanItem.basePrice;
        cleanItem.hasDiscount = false;
        
        // Check if this specific product should have a discount
        const discount = this.getDiscountForProduct(cleanItem);
        
        if (discount) {
            console.log(`🎯 Applying ${discount.percentage}% discount to: ${cleanItem.title}`);
            
            cleanItem.salePrice = cleanItem.basePrice * (1 - discount.percentage / 100);
            cleanItem.discountPercentage = discount.percentage;
            cleanItem.discountAmount = cleanItem.basePrice - cleanItem.salePrice;
            cleanItem.price = cleanItem.salePrice;
            cleanItem.hasDiscount = true;
            cleanItem.discountDescription = discount.description;
        } else {
            console.log(`ℹ️ No discount applied to: ${cleanItem.title}`);
        }
        
        return cleanItem;
    },
    
    getDiscountForProduct(item) {
        // Method 1: Check by exact product ID/handle
        if (item.id && this.discountEligibleProducts[item.id]) {
            return this.discountEligibleProducts[item.id];
        }
        
        if (item.handle && this.discountEligibleProducts[item.handle]) {
            return this.discountEligibleProducts[item.handle];
        }
        
        // Method 2: Automatic pattern matching for specific BUNGI X BOBBY products
        if (item.title) {
            const title = item.title.toLowerCase();
            
            // Only BUNGI X BOBBY products with these specific types
            const isBungiProduct = title.includes('bungi x bobby');
            
            if (isBungiProduct) {
                // Specific product types that should get discounts
                const discountTypes = [
                    'sweatshirt',
                    'joggers',
                    'hoodie'
                ];
                
                // Check if this BUNGI X BOBBY product is one of the discount types
                const hasDiscountType = discountTypes.some(type => title.includes(type));
                
                if (hasDiscountType) {
                    return { percentage: 12, description: '12% off BUNGI X BOBBY collection' };
                }
            }
        }
        
        return null; // No discount for other items
    },
    
    isDefinitelyDiscountEligible(title, pattern) {
        // More strict validation to prevent false positives
        if (!pattern.pattern.test(title)) {
            return false;
        }
        
        // Additional checks to ensure this is actually a hoodie/sweatshirt
        const hoodieIndicators = ['hoodie', 'sweatshirt', 'sweatpants', 'pullover'];
        const hasHoodieIndicator = hoodieIndicators.some(indicator => title.includes(indicator));
        
        if (!hasHoodieIndicator) {
            return false;
        }
        
        // Exclude items that shouldn't be discounted even if they contain keywords
        const exclusions = ['gift card', 'shipping', 'tax', 'fee', 'accessory'];
        const hasExclusion = exclusions.some(exclusion => title.includes(exclusion));
        
        if (hasExclusion) {
            return false;
        }
        
        return true;
    },
    
    updateCount() {
        const count = this.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const countElements = document.querySelectorAll('.cart-count');
        countElements.forEach(el => el.textContent = count);
    },
    
    addItem(product) {
        console.log('➕ Adding item to precise cart:', product.title);
        
        const existingItem = this.items.find(item => 
            item.id === product.id && item.variantId === (product.variantId || product.id)
        );
        
        if (existingItem) {
            existingItem.quantity += product.quantity || 1;
            // Re-validate discount
            const updatedItem = this.validateAndApplyDiscounts(existingItem);
            Object.assign(existingItem, updatedItem);
        } else {
            const newItem = this.validateAndApplyDiscounts({
                id: product.id,
                variantId: product.variantId || product.id,
                title: product.title,
                basePrice: product.price,
                price: product.price,
                image: product.image,
                quantity: product.quantity || 1,
                tags: product.tags || [],
                handle: product.handle || ''
            });
            this.items.push(newItem);
        }
        
        this.saveToStorage();
        this.updateCount();
        this.showNotification(product);
    },
    
    removeItem(productId, variantId = null) {
        console.log('🗑️ Removing item from precise cart:', productId);
        
        const originalLength = this.items.length;
        this.items = this.items.filter(item => {
            if (variantId) {
                return !(item.id === productId && item.variantId === variantId);
            }
            return item.id !== productId;
        });
        
        if (this.items.length < originalLength) {
            console.log('✅ Item removed successfully');
            
            // Re-validate discounts for all remaining items
            this.items = this.items.map(item => this.validateAndApplyDiscounts(item));
            
            this.saveToStorage();
            this.updateCount();
            this.renderCart();
        }
    },
    
    updateQuantity(productId, quantity, variantId = null) {
        console.log('🔢 Updating quantity:', productId, quantity);
        
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
                // Re-validate discount
                const updatedItem = this.validateAndApplyDiscounts(item);
                Object.assign(item, updatedItem);
                
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
        
        console.log('🎨 Rendering precise cart with', this.items.length, 'items');
        
        if (this.items.length === 0) {
            cartItems.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Your cart is empty</p>';
            if (cartTotal) cartTotal.innerHTML = 'Total: $0.00';
            return;
        }
        
        let subtotal = 0;
        let totalSavings = 0;
        
        cartItems.innerHTML = this.items.map(item => {
            const currentPrice = item.salePrice || item.price;
            const originalPrice = item.basePrice || item.originalPrice || item.price;
            const itemTotal = currentPrice * item.quantity;
            const itemSavings = (originalPrice - currentPrice) * item.quantity;
            
            subtotal += itemTotal;
            totalSavings += itemSavings;
            
            let priceDisplay = '';
            if (item.hasDiscount && item.salePrice) {
                priceDisplay = `
                    <div class="precise-cart-price">
                        <span class="sale-price">$${currentPrice.toFixed(2)}</span>
                        <span class="original-price">$${originalPrice.toFixed(2)}</span>
                        <span class="discount-badge">${item.discountPercentage}% OFF</span>
                    </div>
                    <div class="discount-info">${item.discountDescription || ''}</div>
                `;
            } else {
                priceDisplay = `<div class="precise-cart-price">$${currentPrice.toFixed(2)}</div>`;
            }
            
            return `
                <div class="precise-cart-item">
                    <img src="${item.image || 'assets/product-placeholder.png'}" alt="${item.title}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;">
                    <div class="precise-cart-info">
                        <div class="precise-cart-title">${item.title}</div>
                        ${priceDisplay}
                        <div class="precise-cart-controls">
                            <button onclick="PreciseDiscountSystem.updateQuantity('${item.id}', ${item.quantity - 1}, '${item.variantId}')" style="background: #333; border: none; color: white; width: 30px; height: 30px; border-radius: 4px; cursor: pointer;">-</button>
                            <span style="margin: 0 1rem;">${item.quantity}</span>
                            <button onclick="PreciseDiscountSystem.updateQuantity('${item.id}', ${item.quantity + 1}, '${item.variantId}')" style="background: #333; border: none; color: white; width: 30px; height: 30px; border-radius: 4px; cursor: pointer;">+</button>
                            <button onclick="PreciseDiscountSystem.removeItem('${item.id}', '${item.variantId}')" style="background: #ff4444; border: none; color: white; width: 30px; height: 30px; border-radius: 4px; cursor: pointer; margin-left: 1rem;">×</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        if (cartTotal) {
            let totalDisplay = `<div style="font-size: 1.2rem; font-weight: 600; color: #00ff88;">Total: $${subtotal.toFixed(2)}</div>`;
            if (totalSavings > 0) {
                totalDisplay += `<div style="color: #00ff88; font-size: 0.9rem; margin-top: 0.5rem;">You saved: $${totalSavings.toFixed(2)}</div>`;
            }
            cartTotal.innerHTML = totalDisplay;
        }
        
        this.addPreciseCartStyles();
    },
    
    addPreciseCartStyles() {
        if (document.getElementById('precise-cart-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'precise-cart-styles';
        style.textContent = `
            .precise-cart-item {
                display: flex;
                gap: 1rem;
                padding: 1rem 0;
                border-bottom: 1px solid #333;
            }
            .precise-cart-info {
                flex: 1;
            }
            .precise-cart-title {
                font-weight: 600;
                margin-bottom: 0.5rem;
                color: white;
            }
            .precise-cart-price {
                display: flex;
                align-items: center;
                gap: 0.5rem;
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
            }
            .discount-info {
                color: #00ff88;
                font-size: 0.8rem;
                font-style: italic;
                margin-bottom: 0.5rem;
            }
            .precise-cart-controls {
                display: flex;
                align-items: center;
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
        // Remove any existing cart elements
        const existingSidebar = document.getElementById('cart-sidebar');
        const existingOverlay = document.getElementById('cart-overlay');
        if (existingSidebar) existingSidebar.remove();
        if (existingOverlay) existingOverlay.remove();
        
        const sidebar = document.createElement('div');
        sidebar.id = 'cart-sidebar';
        sidebar.style.cssText = `
            position: fixed;
            top: 0;
            right: -400px;
            width: 400px;
            height: 100vh;
            background: #1a1a1a;
            color: white;
            z-index: 10001;
            transition: right 0.3s ease;
            display: flex;
            flex-direction: column;
            box-shadow: -2px 0 10px rgba(0,0,0,0.3);
        `;
        sidebar.className = 'cart-sidebar';
        sidebar.innerHTML = `
            <div style="padding: 1rem; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center;">
                <h3>Shopping Cart</h3>
                <button onclick="PreciseDiscountSystem.closeCart()" style="background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer;">×</button>
            </div>
            <div id="cart-items" style="flex: 1; overflow-y: auto; padding: 1rem;"></div>
            <div style="padding: 1rem; border-top: 1px solid #333;">
                <div id="cart-total">Total: $0.00</div>
                <button onclick="PreciseDiscountSystem.checkout()" style="width: 100%; background: #00ff88; border: none; padding: 1rem; color: black; font-weight: 600; border-radius: 4px; cursor: pointer; font-size: 1rem; margin-top: 1rem;">Checkout</button>
            </div>
        `;
        
        const overlay = document.createElement('div');
        overlay.id = 'cart-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0,0,0,0.5);
            z-index: 10000;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        `;
        overlay.onclick = () => this.closeCart();
        
        // Add active styles
        const activeStyle = document.createElement('style');
        activeStyle.textContent = `
            .cart-sidebar.active { right: 0 !important; }
            .cart-overlay.active { opacity: 1 !important; visibility: visible !important; }
        `;
        document.head.appendChild(activeStyle);
        
        document.body.appendChild(sidebar);
        document.body.appendChild(overlay);
    },
    
    showNotification(product) {
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
        `;
        
        // Check if this product has a discount
        const discount = this.getDiscountForProduct(product);
        let message = `Added ${product.title} to cart`;
        if (discount) {
            const savings = product.price * (discount.percentage / 100);
            message += ` (${discount.percentage}% off - Save $${savings.toFixed(2)})`;
        }
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 3000);
    },
    
    checkout() {
        if (this.items.length === 0) {
            alert('Your cart is empty');
            return;
        }
        window.location.href = 'products.html';
    },
    
    setupEventListeners() {
        // Cart button handler
        document.addEventListener('click', (e) => {
            if (e.target.matches('.cart-btn, .cart-btn *')) {
                e.preventDefault();
                this.openCart();
            }
        });
        
        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeCart();
            }
        });
    }
};

// Replace the clean cart system with precise system
if (window.CleanCartSystem) {
    // Migrate items if they exist
    if (window.CleanCartSystem.items && window.CleanCartSystem.items.length > 0) {
        PreciseDiscountSystem.items = window.CleanCartSystem.items.map(item => 
            PreciseDiscountSystem.validateAndApplyDiscounts(item)
        );
    }
}

// Replace all cart references
window.CleanCartSystem = PreciseDiscountSystem;
window.BobbyCart = PreciseDiscountSystem;
window.BobbyCartEnhanced = PreciseDiscountSystem;
window.BobbyCartDiscountFix = PreciseDiscountSystem;

// Clear any cached discount data and reset cart
PreciseDiscountSystem.clearCachedDiscounts = function() {
    console.log('🧹 Clearing cached discount data...');
    
    // Clear localStorage
    localStorage.removeItem('precise-bobby-cart');
    localStorage.removeItem('bobby-cart');
    localStorage.removeItem('clean-bobby-cart');
    
    // Reset items array
    this.items = [];
    
    // Update display
    this.updateCount();
    if (document.getElementById('cart-items')) {
        this.renderCart();
    }
    
    console.log('✅ All cached discount data cleared');
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Clear any old cached data first
    PreciseDiscountSystem.clearCachedDiscounts();
    PreciseDiscountSystem.init();
});

// If DOM is already loaded
if (document.readyState !== 'loading') {
    // Clear any old cached data first
    PreciseDiscountSystem.clearCachedDiscounts();
    PreciseDiscountSystem.init();
}

console.log('🎯✅ Precise discount system loaded - only eligible products will be discounted');