/**
 * Performance-Optimized Bundle for Bobby Streetwear
 * Combines essential functionality to reduce HTTP requests and improve loading times
 */

// Performance monitoring
window.BobbyPerformance = {
    marks: {},
    
    mark(name) {
        this.marks[name] = performance.now();
        if (window.performance && performance.mark) {
            performance.mark(name);
        }
    },
    
    measure(name, startMark, endMark) {
        const start = this.marks[startMark] || 0;
        const end = this.marks[endMark] || performance.now();
        console.log(`${name}: ${(end - start).toFixed(2)}ms`);
    }
};

// Optimized Script Loader (simplified version)
window.BobbyScriptLoader = {
    loadedScripts: new Set(),
    
    loadOnce(src, callback) {
        if (this.loadedScripts.has(src)) {
            if (callback) callback(false);
            return;
        }
        
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        
        script.onload = () => {
            this.loadedScripts.add(src);
            if (callback) callback(true);
        };
        
        script.onerror = () => {
            console.error(`Failed to load: ${src}`);
            if (callback) callback(false);
        };
        
        document.head.appendChild(script);
    }
};

// Optimized Cart System
window.BobbyCart = {
    items: [],
    isLoaded: false,
    
    init() {
        BobbyPerformance.mark('cart-init-start');
        this.loadFromStorage();
        this.updateCount();
        this.setupEventListeners();
        this.isLoaded = true;
        BobbyPerformance.mark('cart-init-end');
        BobbyPerformance.measure('Cart Initialization', 'cart-init-start', 'cart-init-end');
    },
    
    loadFromStorage() {
        try {
            const stored = localStorage.getItem('bobby-cart');
            this.items = stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.warn('Failed to load cart from storage:', e);
            this.items = [];
        }
    },
    
    saveToStorage() {
        try {
            localStorage.setItem('bobby-cart', JSON.stringify(this.items));
        } catch (e) {
            console.warn('Failed to save cart to storage:', e);
        }
    },
    
    updateCount() {
        const count = this.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const countElements = document.querySelectorAll('.cart-count');
        countElements.forEach(el => el.textContent = count);
    },
    
    addItem(product) {
        const existingItem = this.items.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += product.quantity || 1;
        } else {
            this.items.push({
                id: product.id,
                title: product.title,
                price: product.price,
                image: product.image,
                quantity: product.quantity || 1,
                variant: product.variant
            });
        }
        
        this.saveToStorage();
        this.updateCount();
        this.showAddedNotification(product);
    },
    
    removeItem(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.saveToStorage();
        this.updateCount();
        this.renderCart();
    },
    
    updateQuantity(productId, quantity) {
        const item = this.items.find(item => item.id === productId);
        if (item) {
            if (quantity <= 0) {
                this.removeItem(productId);
            } else {
                item.quantity = quantity;
                this.saveToStorage();
                this.updateCount();
                this.renderCart();
            }
        }
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
        
        // Create cart sidebar
        const sidebar = document.createElement('div');
        sidebar.id = 'cart-sidebar';
        sidebar.className = 'cart-sidebar';
        sidebar.innerHTML = `
            <div class="cart-header">
                <h3>Shopping Cart</h3>
                <button class="cart-close" onclick="BobbyCart.closeCart()">×</button>
            </div>
            <div class="cart-items" id="cart-items"></div>
            <div class="cart-footer">
                <div class="cart-total" id="cart-total">Total: $0.00</div>
                <button class="checkout-btn" onclick="BobbyCart.checkout()">Checkout</button>
            </div>
        `;
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'cart-overlay';
        overlay.className = 'cart-overlay';
        overlay.onclick = () => this.closeCart();
        
        document.body.appendChild(sidebar);
        document.body.appendChild(overlay);
        
        // Add cart styles
        this.addCartStyles();
    },
    
    addCartStyles() {
        if (document.getElementById('cart-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'cart-styles';
        style.textContent = `
            .cart-sidebar {
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
            }
            .cart-sidebar.active { right: 0; }
            .cart-overlay {
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
            }
            .cart-overlay.active {
                opacity: 1;
                visibility: visible;
            }
            .cart-header {
                padding: 1rem;
                border-bottom: 1px solid #333;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .cart-close {
                background: none;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
            }
            .cart-items {
                flex: 1;
                overflow-y: auto;
                padding: 1rem;
            }
            .cart-item {
                display: flex;
                gap: 1rem;
                padding: 1rem 0;
                border-bottom: 1px solid #333;
            }
            .cart-item img {
                width: 60px;
                height: 60px;
                object-fit: cover;
                border-radius: 4px;
            }
            .cart-item-info {
                flex: 1;
            }
            .cart-item-title {
                font-weight: 600;
                margin-bottom: 0.5rem;
            }
            .cart-item-price {
                color: #00ff88;
            }
            .quantity-controls {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-top: 0.5rem;
            }
            .quantity-btn {
                background: #333;
                border: none;
                color: white;
                width: 30px;
                height: 30px;
                border-radius: 4px;
                cursor: pointer;
            }
            .cart-footer {
                padding: 1rem;
                border-top: 1px solid #333;
            }
            .cart-total {
                font-size: 1.2rem;
                font-weight: 600;
                margin-bottom: 1rem;
                color: #00ff88;
            }
            .checkout-btn {
                width: 100%;
                background: #00ff88;
                border: none;
                padding: 1rem;
                color: black;
                font-weight: 600;
                border-radius: 4px;
                cursor: pointer;
                font-size: 1rem;
            }
            @media (max-width: 480px) {
                .cart-sidebar {
                    width: 100vw;
                    right: -100vw;
                }
            }
        `;
        document.head.appendChild(style);
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
        
        let total = 0;
        cartItems.innerHTML = this.items.map(item => {
            const itemTotal = (item.price || 0) * (item.quantity || 0);
            total += itemTotal;
            
            return `
                <div class="cart-item">
                    <img src="${item.image || 'assets/product-placeholder.png'}" alt="${item.title}">
                    <div class="cart-item-info">
                        <div class="cart-item-title">${item.title}</div>
                        <div class="cart-item-price">$${(item.price || 0).toFixed(2)}</div>
                        <div class="quantity-controls">
                            <button class="quantity-btn" onclick="BobbyCart.updateQuantity('${item.id}', ${item.quantity - 1})">-</button>
                            <span>${item.quantity}</span>
                            <button class="quantity-btn" onclick="BobbyCart.updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                            <button class="quantity-btn" onclick="BobbyCart.removeItem('${item.id}')" style="margin-left: 1rem; background: #ff4444;">×</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        if (cartTotal) {
            cartTotal.textContent = `Total: $${total.toFixed(2)}`;
        }
    },
    
    showAddedNotification(product) {
        // Create temporary notification
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
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = `Added ${product.title} to cart`;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    },
    
    checkout() {
        if (this.items.length === 0) {
            alert('Your cart is empty');
            return;
        }
        
        // Load checkout system on demand
        BobbyScriptLoader.loadOnce('scripts/shopify-integration.js', (success) => {
            if (success && window.ShopifyIntegration) {
                window.ShopifyIntegration.createCheckout(this.items);
            } else {
                // Fallback to products page
                window.location.href = 'products.html';
            }
        });
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

// Optimized Mobile Navigation
window.BobbyMobile = {
    init() {
        this.setupMobileMenu();
        this.setupTouchEnhancements();
    },
    
    setupMobileMenu() {
        const toggle = document.getElementById('mobile-menu-toggle');
        const menu = document.getElementById('nav-menu');
        
        if (!toggle || !menu) return;
        
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('active');
            menu.classList.toggle('active');
            document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
        });
        
        // Close on link click
        menu.addEventListener('click', (e) => {
            if (e.target.matches('.nav-link')) {
                toggle.classList.remove('active');
                menu.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    },
    
    setupTouchEnhancements() {
        // Improve touch responsiveness
        document.addEventListener('touchstart', () => {}, { passive: true });
        
        // Prevent zoom on double tap for buttons
        document.addEventListener('touchend', (e) => {
            if (e.target.matches('button, .btn, .cart-btn')) {
                e.preventDefault();
            }
        });
    }
};

// Optimized Product Loading
window.BobbyProducts = {
    cache: new Map(),
    
    async loadHomepageProducts() {
        BobbyPerformance.mark('products-load-start');
        
        const container = document.getElementById('homepage-products');
        if (!container) return;
        
        try {
            // Check cache first
            if (this.cache.has('homepage')) {
                this.renderProducts(this.cache.get('homepage'), container);
                return;
            }
            
            // Load products (simplified for performance)
            const products = await this.fetchProducts();
            this.cache.set('homepage', products);
            this.renderProducts(products, container);
            
        } catch (error) {
            console.error('Failed to load products:', error);
            container.innerHTML = '<p>Failed to load products. Please try again later.</p>';
        }
        
        BobbyPerformance.mark('products-load-end');
        BobbyPerformance.measure('Product Loading', 'products-load-start', 'products-load-end');
    },
    
    async fetchProducts() {
        // Simplified product fetching - replace with actual Shopify integration
        return [
            {
                id: '1',
                title: 'Tech Animal Hoodie',
                price: 59.99,
                image: 'assets/featured-hoodie.svg'
            },
            {
                id: '2',
                title: 'Bobby Tee',
                price: 29.99,
                image: 'assets/tee-1.png'
            }
        ];
    },
    
    renderProducts(products, container) {
        container.innerHTML = products.map(product => `
            <div class="product-card" data-product-id="${product.id}">
                <img src="${product.image}" alt="${product.title}" loading="lazy">
                <h3>${product.title}</h3>
                <p class="price">$${product.price}</p>
                <button class="add-to-cart-btn" onclick="BobbyProducts.addToCart('${product.id}')">
                    Add to Cart
                </button>
            </div>
        `).join('');
    },
    
    addToCart(productId) {
        // Find product and add to cart
        const products = this.cache.get('homepage') || [];
        const product = products.find(p => p.id === productId);
        
        if (product) {
            BobbyCart.addItem(product);
        }
    }
};

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    BobbyPerformance.mark('init-start');
    
    // Initialize core systems
    BobbyCart.init();
    BobbyMobile.init();
    
    // Load products after a short delay to prioritize above-the-fold content
    setTimeout(() => {
        BobbyProducts.loadHomepageProducts();
    }, 100);
    
    BobbyPerformance.mark('init-end');
    BobbyPerformance.measure('Total Initialization', 'init-start', 'init-end');
});

// Export for global access
window.Bobby = {
    Cart: BobbyCart,
    Mobile: BobbyMobile,
    Products: BobbyProducts,
    Performance: BobbyPerformance,
    ScriptLoader: BobbyScriptLoader
};