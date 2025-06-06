// Enhanced Cart Management System
class CartManager {
    constructor() {
        this.items = [];
        this.isOpen = false;
        this.total = 0;
        this.itemCount = 0;
        
        this.loadCartFromStorage();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateCartDisplay();
        this.updateCartCount();
    }

    setupEventListeners() {
        // Cart toggle - try multiple selectors for different pages
        const cartToggles = document.querySelectorAll('#cart-btn, .cart-btn');
        const cartModal = document.getElementById('cart-modal');
        const cartSidebar = document.getElementById('cart-sidebar');
        const cartOverlay = document.getElementById('cart-overlay');
        const cartCloseButtons = document.querySelectorAll('.cart-close');
        
        if (cartToggles.length > 0) {
            cartToggles.forEach(toggle => {
                toggle.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Cart button clicked');
                    this.toggleCart();
                });
                
                // Also add event listeners to all children
                toggle.querySelectorAll('*').forEach(child => {
                    child.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Cart button child clicked');
                        this.toggleCart();
                    });
                });
            });
        } else {
            console.error('No cart toggle button found');
        }

        // Add click listeners to all close buttons
        if (cartCloseButtons.length > 0) {
            cartCloseButtons.forEach(btn => {
                btn.addEventListener('click', () => this.closeCart());
            });
        }
        
        // The cart modal background should also close the cart when clicked
        if (cartModal) {
            cartModal.addEventListener('click', (e) => {
                // Only close if clicking the modal background, not the content
                if (e.target === cartModal) {
                    this.closeCart();
                }
            });
        }
        
        // The cart overlay should also close the cart when clicked
        if (cartOverlay) {
            cartOverlay.addEventListener('click', () => this.closeCart());
        }

        // Checkout button
        const checkoutBtn = document.querySelector('.checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => this.proceedToCheckout());
        }

        // Close cart on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeCart();
            }
        });
    }

    addItem(product, selectedVariant = null) {
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
                shopifyProductId: product.shopifyId || product.shopifyProductId,
                shopifyVariantId: variant.shopifyVariantId || product.shopifyVariantId,
                title: product.title,
                price: variant.price || product.price,
                image: product.mainImage,
                color: variant.color,
                size: variant.size,
                quantity: variant.quantity || 1,
                category: product.category
            });
        }

        this.saveCartToStorage();
        this.updateCartDisplay();
        this.updateCartCount();
        this.showCartAnimation();
        
        // Analytics tracking
        this.trackAddToCart(product, variant);
    }

    removeItem(itemId) {
        this.items = this.items.filter(item => item.id !== itemId);
        this.saveCartToStorage();
        this.updateCartDisplay();
        this.updateCartCount();
        this.showRemoveAnimation();
    }

    updateQuantity(itemId, newQuantity) {
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
    }

    clearCart() {
        this.items = [];
        this.saveCartToStorage();
        this.updateCartDisplay();
        this.updateCartCount();
    }

    toggleCart() {
        console.log('Toggling cart, current state:', this.isOpen);
        if (this.isOpen) {
            this.closeCart();
        } else {
            this.openCart();
        }
    }

    openCart() {
        console.log('Opening cart');
        // Try to find either cart implementation
        const cartModal = document.getElementById('cart-modal');
        const cartSidebar = document.getElementById('cart-sidebar');
        const cartOverlay = document.getElementById('cart-overlay');
        
        if (cartModal) {
            // Index.html modal implementation
            cartModal.style.display = 'flex';
            cartModal.style.zIndex = '10000';
            cartModal.classList.remove('hidden');
            this.isOpen = true;
            document.body.style.overflow = 'hidden';
        } else if (cartSidebar && cartOverlay) {
            // Products.html sidebar implementation
            cartSidebar.style.display = 'flex';
            cartSidebar.style.zIndex = '10000';
            cartOverlay.style.display = 'block';
            cartOverlay.style.zIndex = '9999';
            
            // Add active class (for animation)
            cartSidebar.classList.add('active');
            cartOverlay.classList.add('active');
            
            this.isOpen = true;
            document.body.style.overflow = 'hidden';
            
            // Update state
            this.isOpen = true;
            document.body.style.overflow = 'hidden';
            
            // Focus management for accessibility
            const firstFocusable = cartSidebar.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (firstFocusable) {
                firstFocusable.focus();
            }
            
            // Update display with latest cart items
            this.updateCartDisplay();
        } else {
            console.error('Cart sidebar or overlay not found in the DOM');
        }
    }

    closeCart() {
        console.log('Closing cart');
        // Try to find either cart implementation
        const cartModal = document.getElementById('cart-modal');
        const cartSidebar = document.getElementById('cart-sidebar');
        const cartOverlay = document.getElementById('cart-overlay');
        
        if (cartModal) {
            // Index.html modal implementation
            cartModal.classList.add('hidden');
            this.isOpen = false;
            document.body.style.overflow = '';
            
            // Small delay before removing display to allow for animation
            setTimeout(() => {
                if (!this.isOpen) { // Only if still closed
                    cartModal.style.display = 'none';
                }
            }, 300);
        } else if (cartSidebar && cartOverlay) {
            // Products.html sidebar implementation
            cartSidebar.classList.remove('active');
            cartOverlay.classList.remove('active');
            this.isOpen = false;
            document.body.style.overflow = '';
            
            // Small delay before removing display to allow for animation
            setTimeout(() => {
                if (!this.isOpen) { // Only if still closed
                    cartOverlay.style.display = 'none';
                }
            }, 300);
        } else {
            console.error('Cart sidebar or overlay not found in the DOM');
        }
    }

    updateCartDisplay() {
        const cartItems = document.getElementById('cart-items');
        // Try to find total elements in both implementations
        const modalCartTotal = document.querySelector('.total-amount'); // index.html
        const sidebarCartTotal = document.getElementById('cart-total'); // products.html
        
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
                    <button class="continue-shopping-btn" onclick="cartManager.closeCart()">
                        Continue Shopping
                    </button>
                </div>
            `;
            this.total = 0;
        } else {
            cartItems.innerHTML = this.items.map(item => this.createCartItemHTML(item)).join('');
            this.calculateTotal();
            this.attachCartItemListeners();
        }

        // Update the cart total in whichever element exists
        if (modalCartTotal) {
            modalCartTotal.textContent = '$' + this.total.toFixed(2);
        }
        
        if (sidebarCartTotal) {
            sidebarCartTotal.textContent = this.total.toFixed(2);
        }
    }

    createCartItemHTML(item) {
        // First try to find a valid image for the product
        const tryImageSources = [
            item.image,
            // Try mockup folder if normal path fails
            item.image?.replace(/^(.*\/)?/, 'mockups/'),
            // Try common paths for the product
            `mockups/${item.category?.toLowerCase()}-${item.color?.toLowerCase()}.png`,
            // Generic fallback that's likely to exist in the site
            'assets/featured-hoodie.svg'
        ];
        
        // Filter out any undefined or null paths
        const validImageSources = tryImageSources.filter(src => src);
        
        // Generate multiple fallbacks with onerror handlers
        const imgWithFallbacks = `
            <img src="${validImageSources[0]}"
                 alt="${item.title}"
                 class="cart-item-image"
                 onerror="
                    if (this.src !== '${validImageSources[1]}' && '${validImageSources[1]}') {
                        this.src = '${validImageSources[1]}';
                    } else if (this.src !== '${validImageSources[2]}' && '${validImageSources[2]}') {
                        this.src = '${validImageSources[2]}';
                    } else if (this.src !== '${validImageSources[3]}' && '${validImageSources[3]}') {
                        this.src = '${validImageSources[3]}';
                    } else {
                        this.style.display = 'none';
                        this.nextElementSibling.style.display = 'flex';
                    }
                 "
            >
            <div class="cart-item-placeholder" style="display: none; width: 70px; height: 70px; background: rgba(168, 85, 247, 0.2); border-radius: 8px; justify-content: center; align-items: center; font-size: 24px; color: rgba(168, 85, 247, 0.6);">?</div>
        `;
        
        return `
            <div class="cart-item" data-item-id="${item.id}">
                ${imgWithFallbacks}
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.title}</div>
                    <div class="cart-item-variant">
                        ${item.color !== 'Default' ? `Color: ${item.color}` : ''}
                        ${item.size !== 'One Size' ? ` • Size: ${item.size}` : ''}
                    </div>
                    <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                    <div class="cart-item-controls">
                        <button class="quantity-btn decrease" onclick="cartManager.updateQuantity('${item.id}', ${item.quantity - 1})">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </button>
                        <span class="quantity-display">${item.quantity}</span>
                        <button class="quantity-btn increase" onclick="cartManager.updateQuantity('${item.id}', ${item.quantity + 1})">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </button>
                    </div>
                </div>
                <button class="remove-item-btn" onclick="cartManager.removeItem('${item.id}')" title="Remove item">
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

    attachCartItemListeners() {
        // Add hover effects and animations
        document.querySelectorAll('.cart-item').forEach(item => {
            item.addEventListener('mouseenter', () => {
                item.style.transform = 'translateX(5px)';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.transform = '';
            });
        });

        // Add quantity button animations
        document.querySelectorAll('.quantity-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                btn.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    btn.style.transform = '';
                }, 150);
            });
        });
    }

    calculateTotal() {
        this.total = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        this.itemCount = this.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    updateCartCount() {
        this.calculateTotal();
        // Try to find cart count elements using multiple selectors
        const cartCounts = document.querySelectorAll('#cart-count, .cart-count');
        
        if (cartCounts.length > 0) {
            cartCounts.forEach(cartCount => {
                cartCount.textContent = this.itemCount;
                cartCount.style.display = this.itemCount > 0 ? 'flex' : 'none';
                
                // Add bounce animation
                if (this.itemCount > 0) {
                    cartCount.style.animation = 'bounce 0.5s ease';
                    setTimeout(() => {
                        cartCount.style.animation = '';
                    }, 500);
                }
            });
        } else {
            console.error('No cart count element found');
        }
    }

    showCartAnimation() {
        // Try multiple selectors to find cart buttons
        const cartToggles = document.querySelectorAll('#cart-btn, .cart-btn');
        
        if (cartToggles.length > 0) {
            cartToggles.forEach(toggle => {
                toggle.style.animation = 'cartPulse 0.6s ease';
                setTimeout(() => {
                    toggle.style.animation = '';
                }, 600);
            });
        } else {
            console.error('No cart toggle button found for animation');
        }
    }

    showRemoveAnimation() {
        // Add a subtle shake animation to indicate removal
        const cartModal = document.getElementById('cart-modal');
        if (cartModal) {
            cartModal.style.animation = 'shake 0.3s ease';
            setTimeout(() => {
                cartModal.style.animation = '';
            }, 300);
        }
    }

    proceedToCheckout() {
        if (this.items.length === 0) {
            this.showNotification('Your cart is empty!', 'error');
            return;
        }

        // Show loading state
        const checkoutBtn = document.querySelector('.checkout-btn');
        if (checkoutBtn) {
            const originalText = checkoutBtn.querySelector('span').textContent;
            checkoutBtn.querySelector('span').textContent = 'Processing...';
            checkoutBtn.disabled = true;

            // Simulate checkout process
            setTimeout(() => {
                this.initiateShopifyCheckout();
                checkoutBtn.querySelector('span').textContent = originalText;
                checkoutBtn.disabled = false;
            }, 1000);
        }
    }

    async initiateShopifyCheckout() {
        try {
            // Show loading state
            this.showNotification('Creating checkout...', 'info');
            
            // First, we need to get the actual Shopify variant IDs
            // This requires mapping our local product data to Shopify variants
            const checkoutItems = await this.prepareCheckoutItems();
            
            if (!checkoutItems || checkoutItems.length === 0) {
                this.showNotification('Unable to process checkout. Please try again.', 'error');
                return;
            }

            // Create checkout via Netlify function
            const response = await fetch('/.netlify/functions/create-checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    items: checkoutItems
                })
            });

            if (!response.ok) {
                throw new Error(`Checkout creation failed: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            // Redirect to Shopify checkout
            if (data.checkoutUrl) {
                this.showNotification('Redirecting to checkout...', 'success');
                
                // Clear cart after successful checkout creation
                this.clearCart();
                
                // Redirect to Shopify checkout
                setTimeout(() => {
                    window.location.href = data.checkoutUrl;
                }, 1000);
            } else {
                throw new Error('No checkout URL received');
            }
            
        } catch (error) {
            console.error('Checkout error:', error);
            this.showNotification('Failed to create checkout. Please try again.', 'error');
            // Show the modal as fallback
            this.showCheckoutModal();
        }
    }

    async prepareCheckoutItems() {
        try {
            const checkoutItems = [];
            
            // First try to use stored Shopify variant IDs
            for (const cartItem of this.items) {
                if (cartItem.shopifyVariantId) {
                    checkoutItems.push({
                        variantId: cartItem.shopifyVariantId,
                        quantity: cartItem.quantity
                    });
                }
            }
            
            // If we have all items with variant IDs, return them
            if (checkoutItems.length === this.items.length) {
                return checkoutItems;
            }
            
            // Otherwise, load products to find missing variant IDs
            const response = await fetch('/.netlify/functions/get-products');
            if (!response.ok) {
                throw new Error('Failed to load products');
            }
            
            const products = await response.json();
            
            // Process items that don't have variant IDs
            for (const cartItem of this.items) {
                if (!cartItem.shopifyVariantId) {
                    // Find the product in Shopify data
                    const shopifyProduct = products.find(p => {
                        const node = p.node || p;
                        return node.handle === cartItem.productId ||
                               node.id === cartItem.shopifyProductId ||
                               node.id.includes(cartItem.productId);
                    });
                    
                    if (shopifyProduct) {
                        const product = shopifyProduct.node || shopifyProduct;
                        
                        // Find the matching variant
                        const variant = product.variants.edges.find(v => {
                            const variantNode = v.node;
                            let colorMatch = true;
                            let sizeMatch = true;
                            
                            variantNode.selectedOptions.forEach(option => {
                                if (option.name.toLowerCase() === 'color' && cartItem.color !== 'Default') {
                                    colorMatch = option.value === cartItem.color;
                                }
                                if (option.name.toLowerCase() === 'size' && cartItem.size !== 'One Size') {
                                    sizeMatch = option.value === cartItem.size;
                                }
                            });
                            
                            return colorMatch && sizeMatch;
                        });
                        
                        if (variant) {
                            // Update the cart item with the variant ID for future use
                            cartItem.shopifyVariantId = variant.node.id;
                            this.saveCartToStorage();
                            
                            checkoutItems.push({
                                variantId: variant.node.id,
                                quantity: cartItem.quantity
                            });
                        }
                    }
                }
            }
            
            return checkoutItems;
            
        } catch (error) {
            console.error('Error preparing checkout items:', error);
            return null;
        }
    }

    showCheckoutModal() {
        const modal = document.createElement('div');
        modal.className = 'checkout-modal';
        modal.innerHTML = `
            <div class="checkout-modal-overlay"></div>
            <div class="checkout-modal-content">
                <div class="checkout-modal-header">
                    <h3>Checkout Options</h3>
                    <button class="checkout-modal-close">×</button>
                </div>
                <div class="checkout-modal-body">
                    <div class="checkout-summary">
                        <h4>Order Summary</h4>
                        <div class="checkout-items">
                            ${this.items.map(item => `
                                <div class="checkout-item">
                                    <span>${item.title} (${item.quantity}x)</span>
                                    <span>$${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            `).join('')}
                        </div>
                        <div class="checkout-total">
                            <strong>Total: $${this.total.toFixed(2)}</strong>
                        </div>
                    </div>
                    <div class="checkout-options">
                        <button class="checkout-option-btn shopify-checkout">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M15.8 2.2c-.5-.1-1.1-.1-1.7-.1-3.4 0-5.8 1.6-5.8 4.3 0 1.9 1.4 3.2 3.7 3.2 2.1 0 3.8-1.6 3.8-3.7 0-.8-.2-1.4-.5-1.9l1.5-1.8zm-3.3 6.3c-1.4 0-2.4-.9-2.4-2.2 0-1.6 1.2-2.8 2.9-2.8.4 0 .8.1 1.1.2-.2.4-.3.9-.3 1.4 0 1.8 1.1 3.4 2.7 3.4h.1c-.4 1.4-1.7 2.4-3.3 2.4-.8 0-1.5-.3-2.1-.8l1.3-1.6z"/>
                            </svg>
                            Checkout with Shopify
                        </button>
                        <button class="checkout-option-btn paypal-checkout">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 2.79A.859.859 0 0 1 5.79 2h8.263c.734 0 1.434.155 2.029.428 1.295.595 2.047 1.587 2.047 2.934 0 .653-.086 1.24-.28 1.793-.485 1.372-1.483 2.309-2.91 2.659-.243.06-.499.103-.777.127.734.24 1.299.679 1.621 1.269.347.634.422 1.418.422 2.263 0 .87-.1 1.714-.3 2.448-.48 1.759-1.375 2.86-2.596 3.186-.394.105-.84.157-1.32.157H9.402l-.706 3.273z"/>
                            </svg>
                            PayPal Express
                        </button>
                        <button class="checkout-option-btn apple-pay-checkout">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                            </svg>
                            Apple Pay
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('active'), 10);

        // Setup modal events
        const closeModal = () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        };

        modal.querySelector('.checkout-modal-close').onclick = closeModal;
        modal.querySelector('.checkout-modal-overlay').onclick = closeModal;

        // Setup checkout options
        modal.querySelector('.shopify-checkout').onclick = async () => {
            closeModal();
            await this.initiateShopifyCheckout();
        };

        modal.querySelector('.paypal-checkout').onclick = () => {
            this.showNotification('Redirecting to PayPal...', 'info');
            closeModal();
            // Implement PayPal checkout
        };

        modal.querySelector('.apple-pay-checkout').onclick = () => {
            this.showNotification('Initiating Apple Pay...', 'info');
            closeModal();
            // Implement Apple Pay
        };
    }

    getShopifyVariantId(item) {
        // This would map to actual Shopify variant IDs
        // For now, return a placeholder
        return `${item.productId}-${item.color}-${item.size}`.replace(/\s+/g, '-').toLowerCase();
    }

    saveCartToStorage() {
        try {
            localStorage.setItem('bobby-streetwear-cart', JSON.stringify(this.items));
        } catch (error) {
            console.error('Error saving cart to storage:', error);
        }
    }

    loadCartFromStorage() {
        try {
            const savedCart = localStorage.getItem('bobby-streetwear-cart');
            if (savedCart) {
                this.items = JSON.parse(savedCart);
            }
        } catch (error) {
            console.error('Error loading cart from storage:', error);
            this.items = [];
        }
    }

    trackAddToCart(product, variant) {
        // Analytics tracking
        if (typeof gtag !== 'undefined') {
            gtag('event', 'add_to_cart', {
                currency: 'USD',
                value: variant.price,
                items: [{
                    item_id: product.id,
                    item_name: product.title,
                    category: product.category,
                    quantity: 1,
                    price: variant.price
                }]
            });
        }

        // Facebook Pixel tracking
        if (typeof fbq !== 'undefined') {
            fbq('track', 'AddToCart', {
                content_ids: [product.id],
                content_type: 'product',
                value: variant.price,
                currency: 'USD'
            });
        }
    }

    showNotification(message, type = 'info') {
        // Use the same notification system as products.js
        if (window.productManager && window.productManager.showNotification) {
            window.productManager.showNotification(message, type);
        } else {
            // Fallback notification
            alert(message);
        }
    }

    // Public API methods
    getCartData() {
        return {
            items: this.items,
            total: this.total,
            itemCount: this.itemCount
        };
    }

    getCartSummary() {
        return {
            subtotal: this.total,
            tax: this.total * 0.08, // 8% tax rate
            shipping: this.total > 50 ? 0 : 9.99, // Free shipping over $50
            total: this.total + (this.total * 0.08) + (this.total > 50 ? 0 : 9.99)
        };
    }
}

// Initialize cart manager
document.addEventListener('DOMContentLoaded', () => {
    window.cartManager = new CartManager();
});

// Add cart-specific styles
const cartStyles = `
    .empty-cart {
        text-align: center;
        padding: 3rem 1rem;
        color: rgba(255, 255, 255, 0.7);
    }

    .empty-cart-icon {
        margin-bottom: 1rem;
        opacity: 0.5;
    }

    .empty-cart h3 {
        color: #ffffff;
        margin-bottom: 0.5rem;
    }

    .continue-shopping-btn {
        background: linear-gradient(45deg, #a855f7, #3b82f6);
        border: none;
        color: #ffffff;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        margin-top: 1rem;
        transition: all 0.3s ease;
    }

    .continue-shopping-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 30px rgba(168, 85, 247, 0.4);
    }

    .cart-item-variant {
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 0.25rem;
    }

    .checkout-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10000;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
    }

    .checkout-modal.active {
        opacity: 1;
        visibility: visible;
    }

    .checkout-modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(10px);
    }

    .checkout-modal-content {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(26, 26, 46, 0.95);
        border-radius: 20px;
        max-width: 500px;
        width: 90vw;
        max-height: 80vh;
        overflow-y: auto;
        border: 1px solid rgba(168, 85, 247, 0.2);
        backdrop-filter: blur(20px);
    }

    .checkout-modal-header {
        padding: 2rem 2rem 1rem;
        border-bottom: 1px solid rgba(168, 85, 247, 0.2);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .checkout-modal-header h3 {
        color: #ffffff;
        margin: 0;
    }

    .checkout-modal-close {
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.7);
        font-size: 2rem;
        cursor: pointer;
        padding: 0;
        line-height: 1;
    }

    .checkout-modal-close:hover {
        color: #ffffff;
    }

    .checkout-modal-body {
        padding: 2rem;
    }

    .checkout-summary {
        margin-bottom: 2rem;
    }

    .checkout-summary h4 {
        color: #ffffff;
        margin-bottom: 1rem;
    }

    .checkout-items {
        margin-bottom: 1rem;
    }

    .checkout-item {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem 0;
        color: rgba(255, 255, 255, 0.8);
        border-bottom: 1px solid rgba(168, 85, 247, 0.1);
    }

    .checkout-total {
        padding: 1rem 0;
        border-top: 2px solid rgba(168, 85, 247, 0.3);
        color: #ffffff;
        font-size: 1.2rem;
    }

    .checkout-options {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .checkout-option-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        background: rgba(168, 85, 247, 0.1);
        border: 2px solid rgba(168, 85, 247, 0.3);
        color: #ffffff;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .checkout-option-btn:hover {
        background: rgba(168, 85, 247, 0.2);
        border-color: #a855f7;
        transform: translateY(-2px);
    }

    @keyframes bounce {
        0%, 20%, 53%, 80%, 100% { transform: translate3d(0,0,0); }
        40%, 43% { transform: translate3d(0,-8px,0); }
        70% { transform: translate3d(0,-4px,0); }
        90% { transform: translate3d(0,-2px,0); }
    }

    @keyframes cartPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }

    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-2px); }
        75% { transform: translateX(2px); }
    }

    @media (max-width: 768px) {
        .checkout-modal-content {
            width: 95vw;
            max-height: 90vh;
        }

        .checkout-modal-header,
        .checkout-modal-body {
            padding: 1.5rem;
        }
    }
`;

// Inject cart styles
const cartStyleSheet = document.createElement('style');
cartStyleSheet.textContent = cartStyles;
document.head.appendChild(cartStyleSheet);

// Add enhanced cart styles to fix visibility issues
const enhancedCartStyles = `
/* Critical Cart Fixes */
.cart-modal {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    background: rgba(0, 0, 0, 0.7) !important;
    backdrop-filter: blur(5px) !important;
    z-index: 10000 !important;
    display: flex !important;
    justify-content: flex-end !important;
    align-items: center !important;
    opacity: 1 !important;
    transition: opacity 0.3s ease, visibility 0.3s ease !important;
}

.cart-modal.hidden {
    opacity: 0 !important;
    visibility: hidden !important;
    display: none !important;
}

.cart-content {
    position: relative !important;
    width: 380px !important;
    max-width: 90vw !important;
    height: 100vh !important;
    background: rgba(20, 20, 35, 0.95) !important;
    backdrop-filter: blur(10px) !important;
    display: flex !important;
    flex-direction: column !important;
    box-shadow: -5px 0 25px rgba(0, 0, 0, 0.5) !important;
    border-left: 1px solid rgba(120, 119, 198, 0.3) !important;
}

/* Cart Items Styling */
.cart-item {
    display: flex !important;
    padding: 15px !important;
    border-bottom: 1px solid rgba(120, 119, 198, 0.2) !important;
    position: relative !important;
    background: rgba(30, 30, 50, 0.5) !important;
    margin-bottom: 10px !important;
    border-radius: 8px !important;
    transition: all 0.3s ease !important;
}

.cart-item:hover {
    background: rgba(40, 40, 60, 0.7) !important;
}

.cart-item-image {
    width: 70px !important;
    height: 70px !important;
    object-fit: cover !important;
    border-radius: 8px !important;
    margin-right: 15px !important;
    border: 1px solid rgba(120, 119, 198, 0.3) !important;
}

.cart-item-info {
    flex: 1 !important;
}

.cart-item-title {
    font-weight: bold !important;
    color: #fff !important;
    margin-bottom: 5px !important;
}

.cart-item-price {
    color: #a855f7 !important;
    font-weight: bold !important;
    margin-top: 5px !important;
}

.cart-item-controls {
    display: flex !important;
    align-items: center !important;
    margin-top: 10px !important;
}

.quantity-btn {
    width: 24px !important;
    height: 24px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    background: rgba(120, 119, 198, 0.2) !important;
    border: none !important;
    color: white !important;
    border-radius: 4px !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
}

.quantity-btn:hover {
    background: rgba(120, 119, 198, 0.4) !important;
}

.quantity-display {
    margin: 0 10px !important;
    color: white !important;
    min-width: 20px !important;
    text-align: center !important;
}

.remove-item-btn {
    position: absolute !important;
    top: 10px !important;
    right: 10px !important;
    background: none !important;
    border: none !important;
    color: rgba(255, 255, 255, 0.5) !important;
    cursor: pointer !important;
    transition: color 0.2s ease !important;
}

.remove-item-btn:hover {
    color: #ff5555 !important;
}

/* Cart Header & Footer */
.cart-header {
    padding: 20px !important;
    border-bottom: 1px solid rgba(120, 119, 198, 0.3) !important;
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    background: rgba(20, 20, 35, 0.9) !important;
}

.cart-header h3 {
    margin: 0 !important;
    color: #ffffff !important;
    font-size: 1.2rem !important;
}

.cart-close {
    background: none !important;
    border: none !important;
    color: rgba(255, 255, 255, 0.7) !important;
    font-size: 1.5rem !important;
    cursor: pointer !important;
    transition: color 0.2s ease !important;
}

.cart-close:hover {
    color: #ffffff !important;
}

.cart-footer {
    padding: 20px !important;
    border-top: 1px solid rgba(120, 119, 198, 0.3) !important;
    background: rgba(20, 20, 35, 0.9) !important;
}

.cart-total {
    display: flex !important;
    justify-content: space-between !important;
    margin-bottom: 15px !important;
    color: #ffffff !important;
    font-weight: bold !important;
}

.checkout-btn {
    width: 100% !important;
    padding: 12px !important;
    background: linear-gradient(45deg, #a855f7, #3b82f6) !important;
    border: none !important;
    border-radius: 8px !important;
    color: #ffffff !important;
    font-weight: bold !important;
    cursor: pointer !important;
    transition: all 0.3s ease !important;
}

.checkout-btn:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 5px 15px rgba(120, 119, 198, 0.4) !important;
}
`;

const enhancedStyleSheet = document.createElement('style');
enhancedStyleSheet.textContent = enhancedCartStyles;
document.head.appendChild(enhancedStyleSheet);