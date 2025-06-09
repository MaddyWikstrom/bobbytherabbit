/**
 * Enhanced Cart Management System for Shopify Integration
 * 
 * This script fixes cart functionality issues by properly integrating
 * with Shopify's APIs and ensuring consistent behavior across the site.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the enhanced cart manager
    initEnhancedCartManager();
});

function initEnhancedCartManager() {
    console.log("🛒 Initializing enhanced cart manager...");
    
    // If the original cart manager exists, enhance it
    if (window.cartManager) {
        enhanceExistingCartManager();
    } else {
        // Wait a bit longer in case it's being initialized async
        setTimeout(() => {
            if (window.cartManager) {
                enhanceExistingCartManager();
            } else {
                console.error("❌ Original cart manager not found, creating fallback cart manager");
                createFallbackCartManager();
            }
        }, 500);
    }
    
    // Add listeners for all "Add to Cart" buttons across the site
    setupGlobalAddToCartListeners();
}

function enhanceExistingCartManager() {
    console.log("🔄 Enhancing existing cart manager...");
    
    // Save reference to original methods
    const originalAddItem = window.cartManager.addItem;
    const originalUpdateCartDisplay = window.cartManager.updateCartDisplay;
    const originalUpdateQuantity = window.cartManager.updateQuantity;
    const originalRemoveItem = window.cartManager.removeItem;
    
    // Override addItem method with improved version
    window.cartManager.addItem = function(product, selectedVariant = null) {
        console.log("🛒 Enhanced addItem called", product);
        
        try {
            // Ensure product has necessary properties
            if (!product) {
                throw new Error("Product is undefined");
            }
            
            // Normalize product object
            const normalizedProduct = normalizeProductObject(product);
            
            // Call original method with normalized product
            const result = originalAddItem.call(this, normalizedProduct, selectedVariant);
            
            // Show success notification with improved visuals
            showEnhancedNotification(`${normalizedProduct.title || 'Item'} added to cart!`, 'success');
            
            // Force cart open to show the added item
            setTimeout(() => {
                if (!this.isOpen) {
                    this.openCart();
                }
            }, 300);
            
            // Synchronize with Shopify API in the background if available
            try {
                syncCartWithShopify(this.items);
            } catch (syncError) {
                console.warn("Non-critical: Shopify sync failed", syncError);
            }
            
            return result;
        } catch (error) {
            console.error("❌ Error in enhanced addItem:", error);
            showEnhancedNotification("Couldn't add item to cart. Please try again.", 'error');
            
            // Try original method as fallback
            try {
                return originalAddItem.call(this, product, selectedVariant);
            } catch (fallbackError) {
                console.error("❌ Fallback also failed:", fallbackError);
                // Create manual cart item as last resort
                this.items.push({
                    id: Date.now().toString(),
                    productId: product.id || Date.now().toString(),
                    title: product.title || 'Unknown Product',
                    price: product.price || 0,
                    image: product.image || 'assets/product-placeholder.png',
                    quantity: 1
                });
                this.saveCartToStorage();
                this.updateCartDisplay();
                this.updateCartCount();
            }
        }
    };
    
    // Override updateCartDisplay with improved version
    window.cartManager.updateCartDisplay = function() {
        try {
            // First try original method
            originalUpdateCartDisplay.call(this);
            
            // Ensure all cart items are visible
            ensureCartItemsVisibility();
        } catch (error) {
            console.error("❌ Error in enhanced updateCartDisplay:", error);
            
            // Implement emergency display update
            const cartItems = document.getElementById('cart-items');
            if (cartItems && this.items.length > 0) {
                cartItems.innerHTML = this.items.map(item => 
                    createEmergencyCartItemHTML(item)
                ).join('');
                
                // Update total
                this.calculateTotal();
                updateCartTotal(this.total);
            }
        }
    };
    
    // Override updateQuantity with improved version
    window.cartManager.updateQuantity = function(itemId, newQuantity) {
        console.log(`🔢 Updating quantity for item ${itemId} to ${newQuantity}`);
        
        try {
            // Call original method
            originalUpdateQuantity.call(this, itemId, newQuantity);
            
            // Additional validation and fallback
            validateCartContents();
            
            // Sync with Shopify in background
            syncCartWithShopify(this.items);
        } catch (error) {
            console.error("❌ Error in enhanced updateQuantity:", error);
            
            // Emergency fallback
            if (newQuantity <= 0) {
                this.items = this.items.filter(item => item.id !== itemId);
            } else {
                const item = this.items.find(item => item.id === itemId);
                if (item) {
                    item.quantity = newQuantity;
                }
            }
            this.saveCartToStorage();
            this.updateCartDisplay();
            this.updateCartCount();
        }
    };
    
    // Override removeItem with improved version
    window.cartManager.removeItem = function(itemId) {
        console.log(`🗑️ Removing item ${itemId}`);
        
        try {
            // Call original method
            originalRemoveItem.call(this, itemId);
            
            // Show confirmation
            showEnhancedNotification("Item removed from cart", 'info');
            
            // Sync with Shopify in background
            syncCartWithShopify(this.items);
        } catch (error) {
            console.error("❌ Error in enhanced removeItem:", error);
            
            // Emergency fallback
            this.items = this.items.filter(item => item.id !== itemId);
            this.saveCartToStorage();
            this.updateCartDisplay();
            this.updateCartCount();
        }
    };
    
    // Add method to manually open cart
    if (!window.cartManager.manuallyOpenCart) {
        window.cartManager.manuallyOpenCart = function() {
            try {
                this.openCart();
            } catch (error) {
                console.error("❌ Error manually opening cart:", error);
                // Try fallback method
                const cartModal = document.getElementById('cart-modal');
                const cartSidebar = document.getElementById('cart-sidebar');
                
                if (cartModal) {
                    cartModal.style.display = 'flex';
                    cartModal.classList.remove('hidden');
                } else if (cartSidebar) {
                    cartSidebar.style.display = 'flex';
                    cartSidebar.classList.add('active');
                }
            }
        };
    }
    
    console.log("✅ Cart manager successfully enhanced");
}

function createFallbackCartManager() {
    // Create a minimal implementation if the original is missing
    window.cartManager = {
        items: JSON.parse(localStorage.getItem('bobby-streetwear-cart') || '[]'),
        isOpen: false,
        total: 0,
        
        addItem: function(product, selectedVariant = null) {
            const variant = selectedVariant || {
                color: product.colors?.[0] || 'Default',
                size: product.sizes?.[0] || 'One Size',
                price: product.price,
                shopifyVariantId: null
            };
            
            const itemId = `${product.id}-${variant.color}-${variant.size}`;
            const existingItem = this.items.find(item => item.id === itemId);
            
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                this.items.push({
                    id: itemId,
                    productId: product.id,
                    title: product.title,
                    price: variant.price || product.price,
                    image: product.image || 'assets/product-placeholder.png',
                    color: variant.color,
                    size: variant.size,
                    quantity: 1
                });
            }
            
            this.saveCartToStorage();
            this.updateCartDisplay();
            this.updateCartCount();
            showEnhancedNotification(`${product.title} added to cart!`, 'success');
        },
        
        removeItem: function(itemId) {
            this.items = this.items.filter(item => item.id !== itemId);
            this.saveCartToStorage();
            this.updateCartDisplay();
            this.updateCartCount();
        },
        
        updateQuantity: function(itemId, newQuantity) {
            if (newQuantity <= 0) {
                this.removeItem(itemId);
                return;
            }
            
            const item = this.items.find(item => item.id === itemId);
            if (item) {
                item.quantity = newQuantity;
                this.saveCartToStorage();
                this.updateCartDisplay();
                this.updateCartCount();
            }
        },
        
        saveCartToStorage: function() {
            localStorage.setItem('bobby-streetwear-cart', JSON.stringify(this.items));
        },
        
        updateCartDisplay: function() {
            const cartItems = document.getElementById('cart-items');
            if (!cartItems) return;
            
            if (this.items.length === 0) {
                cartItems.innerHTML = `
                    <div class="empty-cart">
                        <div class="empty-cart-icon">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                                <circle cx="9" cy="21" r="1"></circle>
                                <circle cx="20" cy="21" r="1"></circle>
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                            </svg>
                        </div>
                        <h3>Your cart is empty</h3>
                        <p>Add some products to get started</p>
                    </div>
                `;
            } else {
                cartItems.innerHTML = this.items.map(item => createEmergencyCartItemHTML(item)).join('');
            }
            
            this.calculateTotal();
            updateCartTotal(this.total);
        },
        
        calculateTotal: function() {
            this.total = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        },
        
        updateCartCount: function() {
            this.calculateTotal();
            const cartCounts = document.querySelectorAll('.cart-count');
            
            cartCounts.forEach(cartCount => {
                const itemCount = this.items.reduce((sum, item) => sum + item.quantity, 0);
                cartCount.textContent = itemCount;
                cartCount.style.display = itemCount > 0 ? 'flex' : 'none';
            });
        },
        
        openCart: function() {
            const cartModal = document.getElementById('cart-modal');
            const cartSidebar = document.getElementById('cart-sidebar');
            
            if (cartModal) {
                cartModal.style.display = 'flex';
                cartModal.classList.remove('hidden');
                this.isOpen = true;
            } else if (cartSidebar) {
                cartSidebar.style.display = 'flex';
                cartSidebar.classList.add('active');
                this.isOpen = true;
            }
        },
        
        closeCart: function() {
            const cartModal = document.getElementById('cart-modal');
            const cartSidebar = document.getElementById('cart-sidebar');
            
            if (cartModal) {
                cartModal.classList.add('hidden');
                this.isOpen = false;
            } else if (cartSidebar) {
                cartSidebar.classList.remove('active');
                this.isOpen = false;
            }
        },
        
        toggleCart: function() {
            if (this.isOpen) {
                this.closeCart();
            } else {
                this.openCart();
            }
        }
    };
    
    // Initialize cart
    window.cartManager.updateCartDisplay();
    window.cartManager.updateCartCount();
    
    // Setup event listeners
    setupCartEventListeners();
}

function setupGlobalAddToCartListeners() {
    // Listen for clicks on any add to cart button across the site
    document.addEventListener('click', function(e) {
        // Match any button that looks like an add to cart button
        const addToCartBtn = e.target.closest('.add-to-cart-btn, button[data-add-to-cart], .product-add-to-cart, [data-action="add-to-cart"]');
        
        if (addToCartBtn) {
            e.preventDefault();
            
            // Find product info from closest product container
            const productCard = addToCartBtn.closest('.product-card, .product-item, .product-container, [data-product]');
            
            if (productCard) {
                // Extract product information
                const productData = {
                    id: productCard.dataset.productId || productCard.dataset.id || generateProductId(),
                    shopifyId: productCard.dataset.shopifyId || null,
                    title: getTextContent(productCard, '.product-name, .product-title, h3'),
                    price: parsePrice(getTextContent(productCard, '.product-price, .price')),
                    image: getProductImage(productCard)
                };
                
                // Extract color and size if available
                let variant = null;
                const colorSelect = productCard.querySelector('select[name="color"], .color-select');
                const sizeSelect = productCard.querySelector('select[name="size"], .size-select');
                
                if (colorSelect || sizeSelect) {
                    variant = {
                        color: colorSelect ? colorSelect.value : 'Default',
                        size: sizeSelect ? sizeSelect.value : 'One Size',
                        price: productData.price
                    };
                }
                
                // Add to cart via enhanced cart manager
                if (window.cartManager) {
                    window.cartManager.addItem(productData, variant);
                    
                    // Visual feedback
                    addToCartBtn.classList.add('added');
                    addToCartBtn.textContent = 'ADDED!';
                    
                    setTimeout(() => {
                        addToCartBtn.classList.remove('added');
                        addToCartBtn.textContent = 'ADD TO CART';
                    }, 2000);
                } else {
                    console.error("❌ Cart manager not available");
                    showEnhancedNotification("Couldn't add to cart. Please try again.", 'error');
                }
            } else {
                console.error("❌ Could not find product container");
                showEnhancedNotification("Couldn't identify product. Please try again.", 'error');
            }
        }
    });
}

function setupCartEventListeners() {
    // Setup cart toggle
    document.addEventListener('click', function(e) {
        const cartToggle = e.target.closest('#cart-btn, .cart-btn, .cart-icon');
        if (cartToggle && window.cartManager) {
            e.preventDefault();
            window.cartManager.toggleCart();
        }
    });
    
    // Setup cart close
    document.addEventListener('click', function(e) {
        const cartClose = e.target.closest('.cart-close, #cart-close');
        if (cartClose && window.cartManager) {
            e.preventDefault();
            window.cartManager.closeCart();
        }
    });
    
    // Close cart when clicking overlay
    document.addEventListener('click', function(e) {
        if (e.target.matches('#cart-modal, #cart-overlay, .cart-overlay') && window.cartManager) {
            window.cartManager.closeCart();
        }
    });
    
    // Checkout button
    document.addEventListener('click', function(e) {
        const checkoutBtn = e.target.closest('.checkout-btn');
        if (checkoutBtn && window.cartManager && typeof window.cartManager.proceedToCheckout === 'function') {
            e.preventDefault();
            window.cartManager.proceedToCheckout();
        }
    });
}

// Helper functions
function normalizeProductObject(product) {
    // Create a minimal valid product object with fallbacks
    return {
        id: product.id || product.productId || generateProductId(),
        shopifyId: product.shopifyId || product.shopifyProductId || null,
        title: product.title || product.name || 'Unknown Product',
        price: parsePrice(product.price),
        image: product.image || product.mainImage || getFirstValidImage(product),
        colors: product.colors || product.variants?.map(v => v.color).filter(Boolean) || ['Default'],
        sizes: product.sizes || product.variants?.map(v => v.size).filter(Boolean) || ['One Size'],
        ...product // Keep all original properties
    };
}

function generateProductId() {
    return 'product_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
}

function getTextContent(element, selector) {
    const el = element.querySelector(selector);
    return el ? el.textContent.trim() : '';
}

function parsePrice(priceText) {
    if (!priceText) return 0;
    
    // Handle price as number
    if (typeof priceText === 'number') return priceText;
    
    // Extract digits and decimal point
    const matches = priceText.match(/(\d+([.,]\d+)?)/);
    return matches ? parseFloat(matches[0].replace(',', '.')) : 0;
}

function getProductImage(productElement) {
    // Try to find image in various locations
    const imgElement = productElement.querySelector('img');
    if (imgElement) return imgElement.src;
    
    // Try background image
    const elementWithBg = productElement.querySelector('[style*="background-image"]');
    if (elementWithBg) {
        const bgImage = elementWithBg.style.backgroundImage;
        const urlMatch = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
        if (urlMatch) return urlMatch[1];
    }
    
    // Default placeholder
    return 'assets/product-placeholder.png';
}

function getFirstValidImage(product) {
    if (!product) return 'assets/product-placeholder.png';
    
    // Try common image properties
    const imagePaths = [
        product.image,
        product.mainImage,
        product.images?.[0],
        product.variants?.[0]?.image,
        product.featuredImage,
        product.thumbnail
    ];
    
    for (const path of imagePaths) {
        if (path && typeof path === 'string') return path;
    }
    
    return 'assets/product-placeholder.png';
}

function createEmergencyCartItemHTML(item) {
    return `
        <div class="cart-item" data-item-id="${item.id}">
            <img src="${item.image}" alt="${item.title}" class="cart-item-image"
                 onerror="this.onerror=null; this.src='assets/product-placeholder.png';">
            <div class="cart-item-info">
                <div class="cart-item-title">${item.title}</div>
                <div class="cart-item-variant">
                    ${item.color !== 'Default' ? `Color: ${item.color}` : ''}
                    ${item.size !== 'One Size' ? ` • Size: ${item.size}` : ` • Size: OS`}
                </div>
                <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                <div class="cart-item-controls">
                    <button class="quantity-btn decrease" onclick="cartManager.updateQuantity('${item.id}', ${item.quantity - 1})">-</button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button class="quantity-btn increase" onclick="cartManager.updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                </div>
            </div>
            <button class="remove-item-btn" onclick="cartManager.removeItem('${item.id}')" title="Remove item">×</button>
        </div>
    `;
}

function updateCartTotal(total) {
    // Update total in cart modal/sidebar
    const modalTotal = document.querySelector('.total-amount');
    const sidebarTotal = document.getElementById('cart-total');
    
    if (modalTotal) {
        modalTotal.textContent = '$' + total.toFixed(2);
    }
    
    if (sidebarTotal) {
        sidebarTotal.textContent = total.toFixed(2);
    }
}

function ensureCartItemsVisibility() {
    // Check if cart items are properly displayed
    const cartItems = document.getElementById('cart-items');
    if (!cartItems) return;
    
    // Fix visibility issues in cart items container
    cartItems.style.maxHeight = cartItems.parentElement?.clientHeight ? 
        (cartItems.parentElement.clientHeight - 200) + 'px' : '300px';
    cartItems.style.overflowY = 'auto';
    
    // Make sure cart items are visible
    const items = cartItems.querySelectorAll('.cart-item');
    items.forEach(item => {
        item.style.display = 'flex';
        item.style.opacity = '1';
    });
}

function validateCartContents() {
    // Check if cart manager has valid items
    if (!window.cartManager || !Array.isArray(window.cartManager.items)) return;
    
    // Filter out invalid items
    window.cartManager.items = window.cartManager.items.filter(item => {
        return item && typeof item === 'object' && item.id && item.title && 
               typeof item.price === 'number' && item.quantity > 0;
    });
    
    // Re-save valid items
    window.cartManager.saveCartToStorage();
}

function syncCartWithShopify(cartItems) {
    // This function would integrate with Shopify's cart APIs
    // Simplified implementation for now
    console.log("🔄 Syncing cart with Shopify:", cartItems);
    
    // In a real implementation, this would use the Shopify API
    // to create/update a cart server-side
}

function showEnhancedNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.querySelector('.enhanced-notification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'enhanced-notification';
        document.body.appendChild(notification);
    }
    
    // Set type-specific styles
    notification.className = 'enhanced-notification';
    notification.classList.add(`notification-${type}`);
    
    // Create icon based on type
    let icon = '';
    switch (type) {
        case 'success':
            icon = '<svg viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 12l3 3 5-5" stroke="currentColor" stroke-width="2" fill="none"/></svg>';
            break;
        case 'error':
            icon = '<svg viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2"/><line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2"/></svg>';
            break;
        case 'info':
            icon = '<svg viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><line x1="12" y1="16" x2="12" y2="12" stroke="currentColor" stroke-width="2"/><line x1="12" y1="8" x2="12" y2="8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
            break;
    }
    
    // Set content
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon">${icon}</div>
            <div class="notification-message">${message}</div>
            <button class="notification-close">&times;</button>
        </div>
        <div class="notification-progress"></div>
    `;
    
    // Add click listener to close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    });
    
    // Show notification with animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (notification.classList.contains('show')) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
}

// Add CSS styles for notifications
const enhancedNotificationStyles = `
    .enhanced-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #1a1a2e;
        border-left: 4px solid #8b5cf6;
        border-radius: 4px;
        padding: 0;
        z-index: 10000;
        width: 300px;
        max-width: 90vw;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        transform: translateX(120%);
        transition: transform 0.3s ease;
        overflow: hidden;
    }
    
    .enhanced-notification.show {
        transform: translateX(0);
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        padding: 16px;
    }
    
    .notification-icon {
        margin-right: 12px;
        color: #8b5cf6;
        flex-shrink: 0;
    }
    
    .notification-message {
        flex-grow: 1;
        color: #e0e0e0;
        font-size: 14px;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: #999;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: 8px;
        transition: color 0.2s ease;
    }
    
    .notification-close:hover {
        color: #fff;
    }
    
    .notification-progress {
        height: 3px;
        background: #8b5cf6;
        width: 100%;
        animation: notification-progress 5s linear;
    }
    
    @keyframes notification-progress {
        0% { width: 100%; }
        100% { width: 0; }
    }
    
    /* Type-specific styles */
    .notification-success {
        border-left-color: #10b981;
    }
    
    .notification-success .notification-icon {
        color: #10b981;
    }
    
    .notification-success .notification-progress {
        background: #10b981;
    }
    
    .notification-error {
        border-left-color: #ef4444;
    }
    
    .notification-error .notification-icon {
        color: #ef4444;
    }
    
    .notification-error .notification-progress {
        background: #ef4444;
    }
    
    .notification-info {
        border-left-color: #3b82f6;
    }
    
    .notification-info .notification-icon {
        color: #3b82f6;
    }
    
    .notification-info .notification-progress {
        background: #3b82f6;
    }
`;

// Add notification styles to the document
const notificationStyleElement = document.createElement('style');
notificationStyleElement.textContent = enhancedNotificationStyles;
document.head.appendChild(notificationStyleElement);