/**
 * Cart Bridge Fix for Bobby Streetwear
 * This script bridges the gap between the new BobbyCarts system and the older CartManager
 * to ensure consistent cart functionality across all pages.
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Initializing Cart Bridge Fix...');
    
    // Wait for either cart system to be available
    const initBridge = setInterval(() => {
        // Check if either cart system is available
        if (window.BobbyCarts || window.cartManager) {
            clearInterval(initBridge);
            CartBridgeFix.init();
        }
    }, 100);

    // Only wait for a maximum of 5 seconds
    setTimeout(() => {
        clearInterval(initBridge);
        // If no cart system is available after 5 seconds, try to initialize the bridge anyway
        if (!window.BobbyCarts && !window.cartManager) {
            console.warn('⚠️ No cart system detected after timeout, attempting to initialize bridge...');
            CartBridgeFix.init();
        }
    }, 5000);
});

// Main Bridge Fix Object
const CartBridgeFix = {
    // Track if we've already initialized
    initialized: false,
    
    // Initialize the bridge
    init: function() {
        // Prevent multiple initializations
        if (this.initialized) return;
        this.initialized = true;
        
        console.log('🛠️ Setting up Cart Bridge Fix...');
        
        // Determine which cart system is active
        const hasBobbyCarts = !!window.BobbyCarts;
        const hasCartManager = !!window.cartManager;
        
        console.log(`📊 Detected cart systems: BobbyCarts: ${hasBobbyCarts}, CartManager: ${hasCartManager}`);
        
        // Ensure we always have both cart systems, regardless of which one was loaded
        if (hasBobbyCarts && !hasCartManager) {
            this.createCartManagerFromBobbyCarts();
        } else if (hasCartManager && !hasBobbyCarts) {
            this.createBobbyCartsFromCartManager();
        } else if (hasBobbyCarts && hasCartManager) {
            // Both systems exist, but might need synchronizing
            this.syncCartSystems();
        } else if (!hasBobbyCarts && !hasCartManager) {
            console.error('❌ No cart system available to bridge!');
            this.injectEmergencyCartSystem();
        }
        
        // Wait a moment for cart systems to fully initialize
        setTimeout(() => {
            // Fix cart UI elements
            this.fixCartUI();
            
            // Add global event handlers for cart buttons
            this.setupGlobalCartEvents();
            
            console.log('✅ Cart Bridge Fix initialized successfully');
        }, 100);
    },
    
    // Create CartManager interface from BobbyCarts
    createCartManagerFromBobbyCarts: function() {
        console.log('🔄 Creating CartManager interface from BobbyCarts...');
        
        // Create a CartManager proxy that delegates to BobbyCarts
        window.cartManager = {
            items: [],
            isOpen: false,
            total: 0,
            itemCount: 0,
            
            // Core cart methods
            addItem: function(product, variant) {
                console.log('CartManager.addItem -> BobbyCarts', product, variant);
                
                // Format color and size info to match what BobbyCarts expects
                const formattedProduct = {
                    ...product,
                    id: product.id || product.productId || `product_${Date.now()}`,
                    title: product.title,
                    price: product.price || 0,
                    image: product.image || product.mainImage
                };
                
                // Map variant info
                const variantData = variant || {
                    color: product.selectedColor || product.color || 'Default',
                    size: product.selectedSize || product.size || 'One Size',
                    quantity: product.quantity || 1,
                    price: product.price || 0,
                    shopifyVariantId: product.shopifyVariantId || null
                };
                
                const result = window.BobbyCarts.addToCart(formattedProduct);
                
                // Ensure cart opens
                if (result && !window.BobbyCarts.state.isOpen) {
                    setTimeout(() => window.BobbyCarts.openCart(), 100);
                }
                
                return result;
            },
            
            removeItem: function(itemId) {
                return window.BobbyCarts.removeItem(itemId);
            },
            
            updateQuantity: function(itemId, quantity) {
                return window.BobbyCarts.updateQuantity(itemId, quantity);
            },
            
            clearCart: function() {
                return window.BobbyCarts.clearCart();
            },
            
            // Cart open/close methods
            toggleCart: function() {
                console.log('CartManager.toggleCart -> BobbyCarts');
                return window.BobbyCarts.toggleCart();
            },
            
            openCart: function() {
                console.log('CartManager.openCart -> BobbyCarts');
                return window.BobbyCarts.openCart();
            },
            
            closeCart: function() {
                return window.BobbyCarts.closeCart();
            },
            
            // Checkout methods
            proceedToCheckout: function() {
                return window.BobbyCarts.proceedToCheckout();
            },
            
            initiateShopifyCheckout: async function() {
                console.log('CartManager.initiateShopifyCheckout -> BobbyCarts');
                return window.BobbyCarts.proceedToCheckout();
            },
            
            // Display methods
            updateCartDisplay: function() {
                this.updateFromBobbyCarts();
                return window.BobbyCarts.updateCartDisplay();
            },
            
            updateCartCount: function() {
                this.updateFromBobbyCarts();
                return window.BobbyCarts.updateCartCount();
            },
            
            showNotification: function(message, type) {
                return window.BobbyCarts.showNotification(message, type);
            },
            
            showSilentNotification: function(message, type) {
                return window.BobbyCarts.showNotification(message, type);
            },
            
            // Helper to update CartManager state from BobbyCarts
            updateFromBobbyCarts: function() {
                this.items = window.BobbyCarts.state.items;
                this.isOpen = window.BobbyCarts.state.isOpen;
                this.total = window.BobbyCarts.state.total;
                this.itemCount = window.BobbyCarts.state.itemCount;
            }
        };
        
        // Initial state update
        window.cartManager.updateFromBobbyCarts();
    },
    
    // Create BobbyCarts interface from CartManager
    createBobbyCartsFromCartManager: function() {
        console.log('🔄 Creating BobbyCarts interface from CartManager...');
        
        // Create a simplified BobbyCarts object that delegates to CartManager
        window.BobbyCarts = {
            // State object that mirrors CartManager
            state: {
                items: window.cartManager.items || [],
                isOpen: window.cartManager.isOpen || false,
                total: window.cartManager.total || 0,
                itemCount: window.cartManager.itemCount || 0
            },
            
            // Core methods
            init: function() {
                // Already initialized via CartManager
                console.log('BobbyCarts.init -> CartManager already initialized');
                this.updateFromCartManager();
            },
            
            addToCart: function(product) {
                console.log('BobbyCarts.addToCart -> CartManager', product);
                
                // Check for size selection
                if ((!product.variants || !product.variants.size) && !product.selectedSize) {
                    console.error('Size not selected for product:', product);
                    if (this.showNotification) {
                        this.showNotification('Please select a size before adding to cart', 'error');
                    } else if (window.cartManager && window.cartManager.showNotification) {
                        window.cartManager.showNotification('Please select a size before adding to cart', 'error');
                    }
                    return false;
                }
                
                // Extract variant info if present
                const variant = {
                    color: product.variants?.color || product.selectedColor || 'Default',
                    size: product.variants?.size || product.selectedSize || 'One Size',
                    quantity: product.quantity || 1,
                    price: product.price || 0
                };
                
                const result = window.cartManager.addItem(product, variant);
                this.updateFromCartManager();
                return result;
            },
            
            removeItem: function(itemId) {
                const result = window.cartManager.removeItem(itemId);
                this.updateFromCartManager();
                return result;
            },
            
            updateQuantity: function(itemId, quantity) {
                const result = window.cartManager.updateQuantity(itemId, quantity);
                this.updateFromCartManager();
                return result;
            },
            
            clearCart: function() {
                const result = window.cartManager.clearCart();
                this.updateFromCartManager();
                return result;
            },
            
            // Cart visibility methods
            toggleCart: function() {
                console.log('BobbyCarts.toggleCart -> CartManager');
                return window.cartManager.toggleCart();
            },
            
            openCart: function() {
                console.log('BobbyCarts.openCart -> CartManager');
                return window.cartManager.openCart();
            },
            
            closeCart: function() {
                return window.cartManager.closeCart();
            },
            
            // Checkout methods
            proceedToCheckout: function() {
                return window.cartManager.proceedToCheckout();
            },
            
            // Display methods
            updateCartDisplay: function() {
                this.updateFromCartManager();
                return window.cartManager.updateCartDisplay();
            },
            
            updateCartCount: function() {
                this.updateFromCartManager();
                return window.cartManager.updateCartCount();
            },
            
            showNotification: function(message, type) {
                return window.cartManager.showNotification(message, type);
            },
            
            // Helper to update BobbyCarts state from CartManager
            updateFromCartManager: function() {
                this.state.items = window.cartManager.items;
                this.state.isOpen = window.cartManager.isOpen;
                this.state.total = window.cartManager.total;
                this.state.itemCount = window.cartManager.itemCount;
            }
        };
    },
    
    // Emergency fallback to create minimal cart system if no system is available
    injectEmergencyCartSystem: function() {
        console.warn('⚠️ Injecting emergency cart system...');
        
        // Try to load the CartManager class if it exists
        if (typeof CartManager === 'function') {
            console.log('Found CartManager class, instantiating...');
            window.cartManager = new CartManager();
            setTimeout(() => this.createBobbyCartsFromCartManager(), 100);
            return;
        }
        
        // Create a minimal cart system
        window.cartManager = {
            items: [],
            isOpen: false,
            total: 0,
            itemCount: 0,
            
            // Basic cart functionality
            addItem: function(product, variant) {
                console.log('Emergency CartManager: Adding item', product, variant);
                
                const variantStr = variant ? `${variant.color || 'Default'}-${variant.size || 'One Size'}` : 'default';
                const itemId = `${product.id || 'product'}-${variantStr}`;
                
                // Check if item already exists
                const existingItem = this.items.find(item => item.id === itemId);
                
                if (existingItem) {
                    existingItem.quantity = (existingItem.quantity || 1) + (variant?.quantity || 1);
                } else {
                    this.items.push({
                        id: itemId,
                        productId: product.id,
                        title: product.title,
                        price: product.price || 0,
                        image: product.image || product.mainImage,
                        color: variant?.color || 'Default',
                        size: variant?.size || 'One Size',
                        quantity: variant?.quantity || 1
                    });
                }
                
                this.updateCartCount();
                this.updateCartDisplay();
                this.saveCartToStorage();
                this.openCart();
                
                this.showNotification(`Added ${product.title} to cart`, 'success');
                return true;
            },
            
            removeItem: function(itemId) {
                this.items = this.items.filter(item => item.id !== itemId);
                this.updateCartCount();
                this.updateCartDisplay();
                this.saveCartToStorage();
                return true;
            },
            
            updateQuantity: function(itemId, quantity) {
                const item = this.items.find(item => item.id === itemId);
                if (item) {
                    if (quantity <= 0) {
                        return this.removeItem(itemId);
                    }
                    item.quantity = quantity;
                    this.updateCartCount();
                    this.updateCartDisplay();
                    this.saveCartToStorage();
                    return true;
                }
                return false;
            },
            
            clearCart: function() {
                this.items = [];
                this.updateCartCount();
                this.updateCartDisplay();
                this.saveCartToStorage();
                return true;
            },
            
            saveCartToStorage: function() {
                try {
                    localStorage.setItem('bobby-streetwear-cart', JSON.stringify(this.items));
                } catch (e) {
                    console.error('Failed to save cart to storage', e);
                }
            },
            
            loadCartFromStorage: function() {
                try {
                    const savedCart = localStorage.getItem('bobby-streetwear-cart');
                    if (savedCart) {
                        this.items = JSON.parse(savedCart);
                        this.updateCartCount();
                    }
                } catch (e) {
                    console.error('Failed to load cart from storage', e);
                }
            },
            
            updateCartCount: function() {
                this.itemCount = this.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
                this.total = this.items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
                
                document.querySelectorAll('.cart-count').forEach(el => {
                    el.textContent = this.itemCount.toString();
                    el.style.display = this.itemCount > 0 ? 'flex' : 'none';
                });
            },
            
            updateCartDisplay: function() {
                const cartItems = document.getElementById('cart-items');
                const cartTotal = document.getElementById('cart-total');
                
                if (cartItems) {
                    if (this.items.length === 0) {
                        cartItems.innerHTML = `
                            <div class="empty-cart">
                                <div class="empty-cart-icon">🛒</div>
                                <h3>Your cart is empty</h3>
                                <p>Add some products to get started</p>
                                <button class="continue-shopping-btn" onclick="cartManager.closeCart()">
                                    Continue Shopping
                                </button>
                            </div>
                        `;
                    } else {
                        cartItems.innerHTML = this.items.map(item => `
                            <div class="cart-item" data-item-id="${item.id}">
                                <div class="cart-item-image-container">
                                    <img src="${item.image}" alt="${item.title}" class="cart-item-image">
                                </div>
                                <div class="cart-item-info">
                                    <div class="cart-item-title">${item.title}</div>
                                    <div class="cart-item-variant">
                                        ${item.color !== 'Default' ? `Color: ${item.color}` : ''}
                                        ${item.size !== 'One Size' ? ` • Size: ${item.size}` : ''}
                                    </div>
                                    <div class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
                                    <div class="cart-item-controls">
                                        <button class="quantity-btn decrease" onclick="cartManager.updateQuantity('${item.id}', ${item.quantity - 1})">-</button>
                                        <span class="quantity-display">${item.quantity}</span>
                                        <button class="quantity-btn increase" onclick="cartManager.updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                                    </div>
                                </div>
                                <button class="remove-item-btn" onclick="cartManager.removeItem('${item.id}')" title="Remove item">×</button>
                            </div>
                        `).join('');
                    }
                }
                
                if (cartTotal) {
                    cartTotal.textContent = this.total.toFixed(2);
                }
            },
            
            toggleCart: function() {
                if (this.isOpen) {
                    this.closeCart();
                } else {
                    this.openCart();
                }
            },
            
            openCart: function() {
                console.log('Emergency CartManager: Opening cart');
                this.isOpen = true;
                
                // Try to find cart elements
                const cartSidebar = document.getElementById('cart-sidebar');
                const cartOverlay = document.getElementById('cart-overlay');
                
                if (cartSidebar) {
                    cartSidebar.style.display = 'flex';
                    cartSidebar.classList.add('active');
                    cartSidebar.style.transform = 'translateX(0)';
                    cartSidebar.style.opacity = '1';
                    cartSidebar.style.visibility = 'visible';
                }
                
                if (cartOverlay) {
                    cartOverlay.style.display = 'block';
                    cartOverlay.style.opacity = '1';
                }
                
                document.body.style.overflow = 'hidden';
            },
            
            closeCart: function() {
                console.log('Emergency CartManager: Closing cart');
                this.isOpen = false;
                
                // Try to find cart elements
                const cartSidebar = document.getElementById('cart-sidebar');
                const cartOverlay = document.getElementById('cart-overlay');
                
                if (cartSidebar) {
                    cartSidebar.classList.remove('active');
                    cartSidebar.style.transform = 'translateX(100%)';
                    cartSidebar.style.opacity = '0';
                    
                    setTimeout(() => {
                        if (!this.isOpen) {
                            cartSidebar.style.visibility = 'hidden';
                        }
                    }, 300);
                }
                
                if (cartOverlay) {
                    cartOverlay.style.opacity = '0';
                    
                    setTimeout(() => {
                        if (!this.isOpen) {
                            cartOverlay.style.display = 'none';
                        }
                    }, 300);
                }
                
                document.body.style.overflow = '';
            },
            
            proceedToCheckout: function() {
                if (this.items.length === 0) {
                    this.showNotification('Your cart is empty', 'error');
                    return;
                }
                
                this.showNotification('Redirecting to checkout...', 'info');
                
                // Simple checkout redirect
                setTimeout(() => {
                    window.location.href = '/cart';
                }, 1000);
            },
            
            initiateShopifyCheckout: function() {
                return this.proceedToCheckout();
            },
            
            showNotification: function(message, type = 'info') {
                console.log(`${type.toUpperCase()}: ${message}`);
                
                const notification = document.createElement('div');
                notification.className = `notification notification-${type}`;
                notification.innerHTML = `
                    <div class="notification-content">
                        <span class="notification-message">${message}</span>
                        <button class="notification-close">×</button>
                    </div>
                `;
                
                document.body.appendChild(notification);
                
                setTimeout(() => notification.classList.add('show'), 10);
                
                setTimeout(() => {
                    notification.classList.remove('show');
                    setTimeout(() => notification.remove(), 300);
                }, 3000);
                
                notification.querySelector('.notification-close').addEventListener('click', () => {
                    notification.classList.remove('show');
                    setTimeout(() => notification.remove(), 300);
                });
            }
        };
        
        // Load any saved cart items
        window.cartManager.loadCartFromStorage();
        
        // Create BobbyCarts reference
        this.createBobbyCartsFromCartManager();
    },
    
    // Synchronize cart systems when both exist
    syncCartSystems: function() {
        console.log('🔄 Synchronizing cart systems...');
        
        // Determine which has more items to use as source of truth
        let primarySystem;
        let secondarySystem;
        
        if (window.BobbyCarts && window.BobbyCarts.state &&
            window.cartManager && window.cartManager.items) {
            
            if (window.BobbyCarts.state.items.length >= window.cartManager.items.length) {
                primarySystem = 'BobbyCarts';
                secondarySystem = 'CartManager';
            } else {
                primarySystem = 'CartManager';
                secondarySystem = 'BobbyCarts';
            }
            
            console.log(`Using ${primarySystem} as source of truth`);
            
            // Sync from primary to secondary
            if (primarySystem === 'BobbyCarts') {
                window.cartManager.items = window.BobbyCarts.state.items;
                window.cartManager.isOpen = window.BobbyCarts.state.isOpen;
                window.cartManager.total = window.BobbyCarts.state.total;
                window.cartManager.itemCount = window.BobbyCarts.state.itemCount;
            } else {
                window.BobbyCarts.state.items = window.cartManager.items;
                window.BobbyCarts.state.isOpen = window.cartManager.isOpen;
                window.BobbyCarts.state.total = window.cartManager.total;
                window.BobbyCarts.state.itemCount = window.cartManager.itemCount;
            }
        }
    },

    // Fix cart UI elements
    fixCartUI: function() {
        console.log('🛠️ Fixing cart UI elements...');
        
        try {
            // Fix cart sidebar styling
            const cartSidebar = document.getElementById('cart-sidebar');
            if (cartSidebar) {
                // Ensure cart-sidebar has proper styling for visibility
                cartSidebar.style.position = 'fixed';
                cartSidebar.style.top = '0';
                cartSidebar.style.right = '0';
                cartSidebar.style.width = '380px';
                cartSidebar.style.maxWidth = '90vw';
                cartSidebar.style.height = '100vh';
                cartSidebar.style.zIndex = '10000';
                cartSidebar.style.background = 'rgba(20, 20, 35, 0.95)';
                cartSidebar.style.display = 'flex';
                cartSidebar.style.flexDirection = 'column';
                cartSidebar.style.transform = 'translateX(100%)';
                cartSidebar.style.transition = 'transform 0.3s ease, opacity 0.3s ease, visibility 0.3s ease';
                cartSidebar.style.opacity = '0';
                cartSidebar.style.visibility = 'hidden';
            }
            
            // Fix cart overlay styling
            const cartOverlay = document.getElementById('cart-overlay');
            if (cartOverlay) {
                cartOverlay.style.position = 'fixed';
                cartOverlay.style.top = '0';
                cartOverlay.style.left = '0';
                cartOverlay.style.right = '0';
                cartOverlay.style.bottom = '0';
                cartOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                cartOverlay.style.zIndex = '9999';
                cartOverlay.style.display = 'none';
            }
            
            // Create elements if they don't exist
            if (!cartSidebar) {
                console.log('Creating missing cart sidebar');
                this.createCartElements();
            }
            
            // Ensure cart count elements are visible and up to date
            const cartCount = window.BobbyCarts?.state?.itemCount ||
                              window.cartManager?.itemCount || 0;
                              
            document.querySelectorAll('.cart-count').forEach(el => {
                el.textContent = cartCount.toString();
                el.style.display = cartCount > 0 ? 'flex' : 'none';
            });
        } catch (error) {
            console.error('Error fixing cart UI:', error);
        }
    },
    
    // Create cart elements if they don't exist
    createCartElements: function() {
        // Create cart sidebar if it doesn't exist
        if (!document.getElementById('cart-sidebar')) {
            const cartSidebar = document.createElement('div');
            cartSidebar.id = 'cart-sidebar';
            cartSidebar.className = 'cart-sidebar';
            cartSidebar.innerHTML = `
                <div class="cart-header">
                    <h3>Your Cart</h3>
                    <button class="cart-close">&times;</button>
                </div>
                <div class="cart-items-container">
                    <div id="cart-items" class="cart-items"></div>
                </div>
                <div class="cart-footer">
                    <div class="cart-total">
                        <span>Total:</span>
                        <span>$<span id="cart-total">0.00</span></span>
                    </div>
                    <button class="checkout-btn">
                        <span>Checkout</span>
                    </button>
                </div>
            `;
            document.body.appendChild(cartSidebar);
        }
        
        // Create cart overlay if it doesn't exist
        if (!document.getElementById('cart-overlay')) {
            const cartOverlay = document.createElement('div');
            cartOverlay.id = 'cart-overlay';
            cartOverlay.className = 'cart-overlay';
            document.body.appendChild(cartOverlay);
        }
    },
    
    // Set up global cart event handlers
    setupGlobalCartEvents: function() {
        console.log('🔄 Setting up global cart event handlers...');
        
        // Handle cart button clicks
        document.addEventListener('click', (e) => {
            // Find closest cart toggle button
            const cartToggle = e.target.closest('#cart-btn, .cart-btn, .cart-icon, [data-cart-toggle]');
            if (cartToggle) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🛒 Cart button clicked via global bridge handler');
                
                // Call the appropriate cart toggle method
                if (window.BobbyCarts) {
                    window.BobbyCarts.toggleCart();
                } else if (window.cartManager) {
                    window.cartManager.toggleCart();
                }
            }
            
            // Find closest cart close button
            const cartClose = e.target.closest('.cart-close, #cart-close');
            if (cartClose) {
                e.preventDefault();
                
                // Call the appropriate cart close method
                if (window.BobbyCarts) {
                    window.BobbyCarts.closeCart();
                } else if (window.cartManager) {
                    window.cartManager.closeCart();
                }
            }
            
            // Handle overlay click to close
            const overlay = e.target.closest('#cart-overlay, .cart-overlay');
            if (overlay && overlay === e.target) {
                if (window.BobbyCarts) {
                    window.BobbyCarts.closeCart();
                } else if (window.cartManager) {
                    window.cartManager.closeCart();
                }
            }
        });
        
        // Handle escape key to close cart
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const isCartOpen = (window.BobbyCarts && window.BobbyCarts.state.isOpen) || 
                                   (window.cartManager && window.cartManager.isOpen);
                
                if (isCartOpen) {
                    if (window.BobbyCarts) {
                        window.BobbyCarts.closeCart();
                    } else if (window.cartManager) {
                        window.cartManager.closeCart();
                    }
                }
            }
        });
    }
};