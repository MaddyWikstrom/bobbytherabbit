/**
 * Cart System Cleanup - Disables all conflicting cart systems
 * Prevents multiple cart systems from interfering with each other
 */

// Disable all conflicting cart systems immediately
console.log('🧹 Starting cart system cleanup...');

// List of conflicting scripts to disable
const conflictingScripts = [
    'discount-display.js',
    'subtle-hoodie-sale.js',
    'cart-pricing-fix.js',
    'cart-bridge-fix.js',
    'cart-duplicate-fix.js',
    'cart-render-fix.js',
    'cart-persistence.js',
    'simple-cart-system.js',
    'cart-manager-fix.js',
    'universal-cart-fix.js',
    'cart-cleanup.js'
];

// Disable conflicting global variables
const conflictingGlobals = [
    'window.discountDisplay',
    'window.subtleHoodieSale',
    'window.cartManager',
    'window.simpleCartSystem',
    'window.BobbyCart',
    'window.BobbyCartEnhanced'
];

// Clean up conflicting systems
function cleanupConflictingSystems() {
    console.log('🚫 Disabling conflicting cart systems...');
    
    // Disable global variables
    conflictingGlobals.forEach(globalVar => {
        try {
            const parts = globalVar.split('.');
            let obj = window;
            for (let i = 1; i < parts.length - 1; i++) {
                obj = obj[parts[i]];
            }
            if (obj && obj[parts[parts.length - 1]]) {
                obj[parts[parts.length - 1]] = null;
                console.log(`✅ Disabled: ${globalVar}`);
            }
        } catch (e) {
            // Ignore errors
        }
    });
    
    // Stop any running intervals/timeouts
    const highestTimeoutId = setTimeout(() => {}, 0);
    for (let i = 0; i < highestTimeoutId; i++) {
        clearTimeout(i);
        clearInterval(i);
    }
    
    // Remove conflicting event listeners
    const elements = document.querySelectorAll('[data-cart-processed], [data-discount-processed], [data-sale-processed]');
    elements.forEach(el => {
        el.removeAttribute('data-cart-processed');
        el.removeAttribute('data-discount-processed');
        el.removeAttribute('data-sale-processed');
    });
    
    console.log('✅ Conflicting systems disabled');
}

// Clean Cart System - Single source of truth
window.CleanCartSystem = {
    items: [],
    discountRules: {
        hoodie: {
            percentage: 12,
            keywords: ['hoodie', 'sweatshirt', 'sweatpants', 'pullover', 'jumper'],
            description: '12% off hoodies and sweatshirts'
        }
    },
    isInitialized: false,
    
    init() {
        if (this.isInitialized) return;
        
        console.log('🛒 Initializing clean cart system...');
        cleanupConflictingSystems();
        
        this.loadFromStorage();
        this.updateCount();
        this.setupEventListeners();
        this.isInitialized = true;
        
        console.log('✅ Clean cart system ready');
    },
    
    loadFromStorage() {
        try {
            const stored = localStorage.getItem('clean-bobby-cart');
            this.items = stored ? JSON.parse(stored) : [];
            
            // Ensure all items have proper discount info
            this.items = this.items.map(item => this.applyDiscounts(item));
        } catch (e) {
            console.warn('Failed to load cart:', e);
            this.items = [];
        }
    },
    
    saveToStorage() {
        try {
            localStorage.setItem('clean-bobby-cart', JSON.stringify(this.items));
        } catch (e) {
            console.warn('Failed to save cart:', e);
        }
    },
    
    applyDiscounts(item) {
        // Create a clean copy
        const cleanItem = {
            id: item.id,
            variantId: item.variantId || item.id,
            title: item.title,
            quantity: item.quantity || 1,
            basePrice: item.basePrice || item.originalPrice || item.price,
            image: item.image,
            tags: item.tags || [],
            addedAt: item.addedAt || Date.now()
        };
        
        // Set current price to base price initially
        cleanItem.price = cleanItem.basePrice;
        cleanItem.originalPrice = cleanItem.basePrice;
        
        // Apply hoodie discount
        if (this.isHoodieOrSweatshirt(cleanItem)) {
            const discount = this.discountRules.hoodie;
            cleanItem.salePrice = cleanItem.basePrice * (1 - discount.percentage / 100);
            cleanItem.discountPercentage = discount.percentage;
            cleanItem.discountAmount = cleanItem.basePrice - cleanItem.salePrice;
            cleanItem.price = cleanItem.salePrice;
            cleanItem.hasDiscount = true;
            cleanItem.discountType = 'hoodie';
        }
        
        return cleanItem;
    },
    
    isHoodieOrSweatshirt(item) {
        const keywords = this.discountRules.hoodie.keywords;
        const title = (item.title || '').toLowerCase();
        return keywords.some(keyword => title.includes(keyword));
    },
    
    updateCount() {
        const count = this.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const countElements = document.querySelectorAll('.cart-count');
        countElements.forEach(el => el.textContent = count);
    },
    
    addItem(product) {
        console.log('➕ Adding item to clean cart:', product.title);
        
        const existingItem = this.items.find(item => 
            item.id === product.id && item.variantId === (product.variantId || product.id)
        );
        
        if (existingItem) {
            existingItem.quantity += product.quantity || 1;
            this.applyDiscounts(existingItem);
        } else {
            const newItem = this.applyDiscounts({
                id: product.id,
                variantId: product.variantId || product.id,
                title: product.title,
                basePrice: product.price,
                price: product.price,
                image: product.image,
                quantity: product.quantity || 1,
                tags: product.tags || []
            });
            this.items.push(newItem);
        }
        
        this.saveToStorage();
        this.updateCount();
        this.showNotification(product);
    },
    
    removeItem(productId, variantId = null) {
        console.log('🗑️ Removing item from clean cart:', productId);
        
        const originalLength = this.items.length;
        this.items = this.items.filter(item => {
            if (variantId) {
                return !(item.id === productId && item.variantId === variantId);
            }
            return item.id !== productId;
        });
        
        if (this.items.length < originalLength) {
            console.log('✅ Item removed successfully');
            
            // Re-apply discounts to all remaining items
            this.items = this.items.map(item => this.applyDiscounts(item));
            
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
                this.applyDiscounts(item);
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
        
        console.log('🎨 Rendering clean cart with', this.items.length, 'items');
        
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
                    <div class="clean-cart-price">
                        <span class="sale-price">$${currentPrice.toFixed(2)}</span>
                        <span class="original-price">$${originalPrice.toFixed(2)}</span>
                        <span class="discount-badge">${item.discountPercentage}% OFF</span>
                    </div>
                `;
            } else {
                priceDisplay = `<div class="clean-cart-price">$${currentPrice.toFixed(2)}</div>`;
            }
            
            return `
                <div class="clean-cart-item">
                    <img src="${item.image || 'assets/product-placeholder.png'}" alt="${item.title}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;">
                    <div class="clean-cart-info">
                        <div class="clean-cart-title">${item.title}</div>
                        ${priceDisplay}
                        <div class="clean-cart-controls">
                            <button onclick="CleanCartSystem.updateQuantity('${item.id}', ${item.quantity - 1}, '${item.variantId}')" style="background: #333; border: none; color: white; width: 30px; height: 30px; border-radius: 4px; cursor: pointer;">-</button>
                            <span style="margin: 0 1rem;">${item.quantity}</span>
                            <button onclick="CleanCartSystem.updateQuantity('${item.id}', ${item.quantity + 1}, '${item.variantId}')" style="background: #333; border: none; color: white; width: 30px; height: 30px; border-radius: 4px; cursor: pointer;">+</button>
                            <button onclick="CleanCartSystem.removeItem('${item.id}', '${item.variantId}')" style="background: #ff4444; border: none; color: white; width: 30px; height: 30px; border-radius: 4px; cursor: pointer; margin-left: 1rem;">×</button>
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
        
        this.addCleanCartStyles();
    },
    
    addCleanCartStyles() {
        if (document.getElementById('clean-cart-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'clean-cart-styles';
        style.textContent = `
            .clean-cart-item {
                display: flex;
                gap: 1rem;
                padding: 1rem 0;
                border-bottom: 1px solid #333;
            }
            .clean-cart-info {
                flex: 1;
            }
            .clean-cart-title {
                font-weight: 600;
                margin-bottom: 0.5rem;
                color: white;
            }
            .clean-cart-price {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-bottom: 0.5rem;
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
            .clean-cart-controls {
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
                <button onclick="CleanCartSystem.closeCart()" style="background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer;">×</button>
            </div>
            <div id="cart-items" style="flex: 1; overflow-y: auto; padding: 1rem;"></div>
            <div style="padding: 1rem; border-top: 1px solid #333;">
                <div id="cart-total">Total: $0.00</div>
                <button onclick="CleanCartSystem.checkout()" style="width: 100%; background: #00ff88; border: none; padding: 1rem; color: black; font-weight: 600; border-radius: 4px; cursor: pointer; font-size: 1rem; margin-top: 1rem;">Checkout</button>
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
        notification.textContent = `Added ${product.title} to cart`;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 2000);
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

// Initialize immediately and replace all other cart systems
cleanupConflictingSystems();

// Replace all cart references
window.BobbyCart = CleanCartSystem;
window.BobbyCartEnhanced = CleanCartSystem;
window.BobbyCartDiscountFix = CleanCartSystem;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    CleanCartSystem.init();
});

// If DOM is already loaded
if (document.readyState !== 'loading') {
    CleanCartSystem.init();
}

console.log('🧹✅ Cart system cleanup complete - single clean cart system active');