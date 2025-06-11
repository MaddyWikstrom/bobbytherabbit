// Enhanced Cart Management System - No Fallbacks
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
        // Add global document click handler for all cart buttons across all pages
        document.addEventListener('click', (e) => {
            const cartButton = e.target.closest('#cart-btn, .cart-btn, .cart-icon, [data-cart-toggle], .header-cart-btn, .nav-cart-btn');
            if (cartButton) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Cart button clicked via global handler');
                this.toggleCart();
            }
        });
        
        // Add global listener for the "esc" key to close cart
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeCart();
            }
        });
        
        // Find and add listeners to any close buttons already in the DOM
        const cartCloseButtons = document.querySelectorAll('.cart-close');
        if (cartCloseButtons.length > 0) {
            cartCloseButtons.forEach(btn => {
                btn.addEventListener('click', () => this.closeCart());
            });
        }
        
        // Setup overlay click to close cart
        const cartOverlay = document.getElementById('cart-overlay');
        if (cartOverlay) {
            cartOverlay.addEventListener('click', () => this.closeCart());
        }

        // Add click listeners to all close buttons
        if (cartCloseButtons.length > 0) {
            cartCloseButtons.forEach(btn => {
                btn.addEventListener('click', () => this.closeCart());
            });
        }
        
        // Find cart modal first
        const cartModal = document.getElementById('cart-modal');
        
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
        // Check if product has the required size selection
        if (!selectedVariant && (!product.selectedSize || product.selectedSize === 'One Size') && product.sizes && product.sizes.length > 0) {
            console.error('Size selection is required before adding to cart');
            if (window.productManager) {
                window.productManager.showNotification('Please select a size before adding to cart', 'error');
            }
            return false;
        }
        
        // Use the provided variant or create one from product properties
        const variant = selectedVariant || {
            color: product.selectedColor || product.colors?.[0] || 'Default',
            size: product.selectedSize || product.sizes?.[0] || 'One Size',
            price: product.price,
            shopifyVariantId: null
        };
        
        // If no size is selected for a product with size options, don't add to cart
        if (variant.size === 'One Size' && product.sizes && product.sizes.length > 0) {
            console.error('Size selection is required before adding to cart');
            if (window.productManager) {
                window.productManager.showNotification('Please select a size before adding to cart', 'error');
            }
            return false;
        }

        const itemId = `${product.id}-${variant.color}-${variant.size}`;
        const existingItem = this.items.find(item => item.id === itemId);

        // Determine the best image to use for this product/variant
        let productImage = null;
        
        // If there's a variant with a specific image, use that first
        if (variant.image) {
            productImage = variant.image;
        }
        // If there are color-specific images, use the first one for the selected color
        else if (product.colorImages && product.colorImages[variant.color] && product.colorImages[variant.color].length > 0) {
            productImage = product.colorImages[variant.color][0];
        }
        // Otherwise use the main product image
        else if (product.mainImage) {
            productImage = product.mainImage;
        }
        // Use the first product image if available
        else if (product.images && product.images.length > 0) {
            productImage = product.images[0];
        }
        
        if (existingItem) {
            // Increment quantity when adding the same item again
            existingItem.quantity += (variant.quantity || 1);
            console.log(`Added to existing item in cart, new quantity: ${existingItem.quantity}`);
        } else {
            // Add as new item at the top of the cart for better visibility
            this.items.unshift({
                id: itemId,
                productId: product.id,
                shopifyProductId: product.shopifyId || product.shopifyProductId,
                shopifyVariantId: variant.shopifyVariantId || product.shopifyVariantId,
                title: product.title,
                price: variant.price || product.price,
                image: productImage,
                color: variant.color,
                size: variant.size,
                quantity: variant.quantity || 1,
                category: product.category
            });
            console.log(`Added new item to cart: ${product.title} (${variant.color}/${variant.size})`);
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
        
        // First check if we have the elements
        let cartImplementationFound = false;
        
        if (cartModal) {
            // Index.html modal implementation
            cartModal.style.display = 'flex';
            cartModal.style.zIndex = '10000';
            cartModal.classList.remove('hidden');
            this.isOpen = true;
            document.body.style.overflow = 'hidden';
            cartImplementationFound = true;
        } else if (cartSidebar && cartOverlay) {
            // Products.html sidebar implementation
            cartSidebar.style.display = 'flex';
            cartSidebar.style.zIndex = '10000';
            cartOverlay.style.display = 'block';
            cartOverlay.style.zIndex = '9999';
            
            // Add active class (for animation)
            cartSidebar.classList.add('active');
            cartOverlay.classList.add('active');
            
            // Fix for cart content visibility and styling
            cartSidebar.style.transform = 'translateX(0)';
            cartSidebar.style.opacity = '1';
            cartSidebar.style.visibility = 'visible';
            cartOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            
            this.isOpen = true;
            document.body.style.overflow = 'hidden';
            
            // Focus management for accessibility
            const firstFocusable = cartSidebar.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (firstFocusable) {
                firstFocusable.focus();
            }
            
            // Update display with latest cart items
            this.updateCartDisplay();
            cartImplementationFound = true;
        }
        
        if (!cartImplementationFound) {
            console.error('Cart elements not found in the DOM - attempting to inject cart HTML');
            this.injectCartHTML();
            
            // Try again immediately after injection
            setTimeout(() => {
                this.openCart();
            }, 50);
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
            
            // Reset transform and opacity for proper animation
            cartSidebar.style.transform = 'translateX(100%)';
            cartSidebar.style.opacity = '0';
            
            this.isOpen = false;
            document.body.style.overflow = '';
            
            // Small delay before removing display to allow for animation
            setTimeout(() => {
                if (!this.isOpen) { // Only if still closed
                    cartOverlay.style.display = 'none';
                    cartSidebar.style.visibility = 'hidden';
                }
            }, 300);
        } else {
            console.error('Cart sidebar or overlay not found in the DOM - attempting to inject cart HTML');
            this.injectCartHTML();
        }
    }
    
    // Inject cart HTML if not present in the DOM
    injectCartHTML() {
        console.log('Injecting cart HTML');
        
        // Check if cart already exists
        if (document.getElementById('cart-modal') || document.getElementById('cart-sidebar')) {
            console.log('Cart already exists in DOM');
            return;
        }
        
        // Create cart HTML structure
        const cartHTML = `
            <div id="cart-modal" class="cart-modal hidden">
                <div class="cart-overlay" id="cart-overlay"></div>
                <div class="cart-sidebar" id="cart-sidebar">
                    <div class="cart-header">
                        <h3>Your Cart</h3>
                        <button class="cart-close">×</button>
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
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Append to body
        const cartContainer = document.createElement('div');
        cartContainer.innerHTML = cartHTML;
        document.body.appendChild(cartContainer);
        
        // Add event listeners to newly created elements
        const cartCloseButton = document.querySelector('.cart-close');
        const cartOverlay = document.getElementById('cart-overlay');
        const checkoutButton = document.querySelector('.checkout-btn');
        
        if (cartCloseButton) {
            cartCloseButton.addEventListener('click', () => this.closeCart());
        }
        
        if (cartOverlay) {
            cartOverlay.addEventListener('click', () => this.closeCart());
        }
        
        if (checkoutButton) {
            checkoutButton.addEventListener('click', () => this.proceedToCheckout());
        }
        
        console.log('Cart HTML injected successfully');
    }

    updateCartDisplay() {
        // Try to find cart items container in both implementations
        const cartItems = document.getElementById('cart-items');
        
        // Try to find total elements in both implementations
        const modalCartTotal = document.querySelector('.total-amount'); // index.html
        const sidebarCartTotal = document.getElementById('cart-total'); // products.html
        
        if (!cartItems) {
            console.warn('Cart items container not found in the DOM. The cart may not be initialized on this page.');
            return;
        }

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
        // Simple HTML for cart item with no fallback logic
        const imgElement = item.image 
            ? `<img src="${item.image}" alt="${item.title}" class="cart-item-image" style="display: block; width: 70px; height: 70px; object-fit: cover; border-radius: 8px;" onerror="this.style.display='none'">`
            : `<div class="cart-item-no-image" style="display: flex; width: 70px; height: 70px; background: rgba(168, 85, 247, 0.1); border-radius: 8px; justify-content: center; align-items: center; color: rgba(168, 85, 247, 0.6);">${item.title.charAt(0)}</div>`;
        
        return `
            <div class="cart-item" data-item-id="${item.id}">
                ${imgElement}
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.title}</div>
                    <div class="cart-item-variant">
                        ${item.color !== 'Default' ? `Color: ${item.color}` : ''}
                        ${item.size !== 'One Size' ? ` • Size: ${item.size}` : ` • Size: OS`}
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

            // Process checkout
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
                this.showNotification('This app requires deployment to Netlify to function properly.', 'error');
                return;
            }

            // Use the fixed Cart API version of the checkout function
            const response = await fetch('/.netlify/functions/create-checkout-fixed', {
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
            this.showNotification('Failed to create checkout. This app requires deployment to Netlify.', 'error');
            console.error('⚠️ This app requires deployment to Netlify to function properly.');
        }
    }

    async prepareCheckoutItems() {
        try {
            const checkoutItems = [];
            let needsProductLookup = false;
            
            // First pass: check which items have valid Shopify variant IDs
            for (const cartItem of this.items) {
                // Check if the ID is already in GID format
                const isValidGID = cartItem.shopifyVariantId &&
                                 typeof cartItem.shopifyVariantId === 'string' &&
                                 cartItem.shopifyVariantId.startsWith('gid://shopify/ProductVariant/');
                
                if (isValidGID) {
                    // Already valid, add to checkout items
                    checkoutItems.push({
                        variantId: cartItem.shopifyVariantId,
                        quantity: cartItem.quantity
                    });
                } else {
                    // Needs lookup
                    needsProductLookup = true;
                }
            }
            
            // If all items have valid GID variant IDs, return them
            if (checkoutItems.length === this.items.length) {
                console.log('All items have valid Shopify variant IDs:', checkoutItems);
                return checkoutItems;
            }
            
            // Otherwise, load products to find missing variant IDs
            if (needsProductLookup) {
                console.log('Loading products to find missing variant IDs');
                const response = await fetch('/.netlify/functions/get-products');
                
                if (!response.ok) {
                    throw new Error('Failed to load products');
                }
                
                let products = [];
                const responseData = await response.json();
                
                // Handle both API response formats
                if (responseData.products && Array.isArray(responseData.products)) {
                    products = responseData.products;
                } else if (Array.isArray(responseData)) {
                    products = responseData;
                } else {
                    throw new Error('Invalid product data format');
                }
                
                // Process items that don't have valid variant IDs
                for (const cartItem of this.items) {
                    // Skip items we already processed
                    const existingItem = checkoutItems.find(item => item.variantId === cartItem.shopifyVariantId);
                    if (existingItem) continue;
                    
                    // Find the product in Shopify data
                    const shopifyProduct = products.find(p => {
                        const node = p.node || p;
                        return node.handle === cartItem.productId ||
                               node.id === cartItem.shopifyProductId ||
                               node.id?.includes(cartItem.productId);
                    });
                    
                    if (shopifyProduct) {
                        const product = shopifyProduct.node || shopifyProduct;
                        
                        // Find the matching variant
                        const variants = product.variants?.edges || [];
                        const variant = variants.find(v => {
                            const variantNode = v.node;
                            let colorMatch = true;
                            let sizeMatch = true;
                            
                            // Skip if no selectedOptions
                            if (!variantNode.selectedOptions) return false;
                            
                            variantNode.selectedOptions.forEach(option => {
                                if (option.name.toLowerCase() === 'color' && cartItem.color !== 'Default') {
                                    colorMatch = option.value.toLowerCase() === cartItem.color.toLowerCase();
                                }
                                if (option.name.toLowerCase() === 'size' && cartItem.size !== 'One Size') {
                                    sizeMatch = option.value.toLowerCase() === cartItem.size.toLowerCase();
                                }
                            });
                            
                            return colorMatch && sizeMatch;
                        });
                        
                        if (variant) {
                            // Update the cart item with the variant ID for future use
                            cartItem.shopifyVariantId = variant.node.id;
                            this.saveCartToStorage();
                            
                            // Add to checkout items
                            checkoutItems.push({
                                variantId: variant.node.id,
                                quantity: cartItem.quantity
                            });
                            
                            console.log(`Found variant ID for ${cartItem.title}: ${variant.node.id}`);
                        } else {
                            console.warn(`Couldn't find matching variant for ${cartItem.title} (${cartItem.color}/${cartItem.size})`);
                        }
                    } else {
                        console.warn(`Couldn't find product for ${cartItem.title}`);
                    }
                }
            }
            
            // Log what we're sending to checkout
            console.log('Prepared checkout items:', checkoutItems);
            return checkoutItems.length > 0 ? checkoutItems : null;
            
        } catch (error) {
            console.error('Error preparing checkout items:', error);
            console.error('⚠️ This app requires deployment to Netlify to function properly.');
            return null;
        }
    }

    showNotification(message, type = 'info') {
        // Use the notification system if available
        if (window.productManager && typeof window.productManager.showNotification === 'function') {
            window.productManager.showNotification(message, type);
        } else {
            // Show in console if notification system not available
            console.log(`${type.toUpperCase()}: ${message}`);
            
            // Show deployment message if error
            if (type === 'error') {
                console.error('⚠️ This app requires deployment to Netlify to function properly.');
            }
        }
    }

    getShopifyVariantId(item) {
        // This would map to actual Shopify variant IDs
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

    .cart-item-no-image {
        display: flex;
        width: 70px;
        height: 70px;
        background: rgba(168, 85, 247, 0.1);
        border-radius: 8px;
        justify-content: center;
        align-items: center;
        font-size: 24px;
        color: rgba(168, 85, 247, 0.6);
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