/**
 * Unified Back Button Cart Fix
 * 
 * Fixes cart issues when clicking back on pages for both mobile and desktop.
 * Replaces multiple conflicting cart persistence systems with a single, reliable solution.
 */

(function() {
    console.log('🔧 Unified Back Button Cart Fix Loading');
    
    // Configuration
    const CONFIG = {
        CART_KEY: 'bobby-cart-items',
        NAVIGATION_STATE_KEY: 'bobby-navigation-state',
        PAGE_CART_BACKUP_KEY: 'bobby-page-cart-backup',
        LAST_PAGE_KEY: 'bobby-last-page',
        CHECKOUT_FLAG_KEY: 'bobby-checkout-in-progress'
    };
    
    // Track navigation state
    let isNavigating = false;
    let lastCartState = null;
    let currentPage = window.location.pathname;
    
    // Unified Cart Manager
    const UnifiedCartManager = {
        // Get current cart from any available system
        getCurrentCart: function() {
            let items = [];
            
            // Try BobbyCart first (most reliable)
            if (window.BobbyCart && window.BobbyCart.getItems) {
                items = window.BobbyCart.getItems();
            }
            // Try cartManager
            else if (window.cartManager && window.cartManager.items) {
                items = window.cartManager.items;
            }
            // Try localStorage as fallback
            else {
                try {
                    const stored = localStorage.getItem(CONFIG.CART_KEY);
                    items = stored ? JSON.parse(stored) : [];
                } catch (error) {
                    console.error('Error loading cart from localStorage:', error);
                    items = [];
                }
            }
            
            return Array.isArray(items) ? items : [];
        },
        
        // Save cart to all systems
        saveCart: function(items) {
            try {
                const cartData = JSON.stringify(items);
                
                // Save to localStorage
                localStorage.setItem(CONFIG.CART_KEY, cartData);
                
                // Update BobbyCart if available
                if (window.BobbyCart && typeof window.BobbyCart.clearCart === 'function') {
                    window.BobbyCart.clearCart();
                    items.forEach(item => {
                        if (typeof window.BobbyCart.addItem === 'function') {
                            window.BobbyCart.addItem(item);
                        }
                    });
                }
                
                // Update cartManager if available
                if (window.cartManager) {
                    window.cartManager.items = items;
                    if (typeof window.cartManager.updateCartDisplay === 'function') {
                        window.cartManager.updateCartDisplay();
                    }
                    if (typeof window.cartManager.updateCartCount === 'function') {
                        window.cartManager.updateCartCount();
                    }
                }
                
                // Update cart count displays
                this.updateCartCounts(items);
                
                console.log('💾 Cart saved to all systems:', items.length, 'items');
                return true;
            } catch (error) {
                console.error('Error saving cart:', error);
                return false;
            }
        },
        
        // Update cart count displays
        updateCartCounts: function(items) {
            const count = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
            const cartCounts = document.querySelectorAll('.cart-count');
            
            cartCounts.forEach(element => {
                element.textContent = count.toString();
                element.style.display = count > 0 ? 'flex' : 'none';
            });
        },
        
        // Check if cart contains problematic test data
        hasProblematicData: function(items) {
            if (!Array.isArray(items)) return false;
            
            return items.some(item => {
                const title = (item.title || '').toLowerCase();
                return title.includes('navy') || 
                       title.includes('blazer') || 
                       title.includes('test');
            });
        },
        
        // Clean problematic data from cart
        cleanCart: function(items) {
            if (!Array.isArray(items)) return [];
            
            return items.filter(item => {
                const title = (item.title || '').toLowerCase();
                const isProblematic = title.includes('navy') || 
                                     title.includes('blazer') || 
                                     title.includes('test');
                
                if (isProblematic) {
                    console.log('🧹 Removing problematic item:', item.title);
                }
                
                return !isProblematic;
            });
        }
    };
    
    // Page Navigation Handler
    const NavigationHandler = {
        // Save current page state before navigation
        savePageState: function() {
            try {
                const currentCart = UnifiedCartManager.getCurrentCart();
                const cleanCart = UnifiedCartManager.cleanCart(currentCart);
                
                // Save current page and cart state
                localStorage.setItem(CONFIG.LAST_PAGE_KEY, currentPage);
                localStorage.setItem(CONFIG.PAGE_CART_BACKUP_KEY, JSON.stringify(cleanCart));
                
                // Save navigation state
                const navigationState = {
                    page: currentPage,
                    timestamp: Date.now(),
                    cartItems: cleanCart.length
                };
                localStorage.setItem(CONFIG.NAVIGATION_STATE_KEY, JSON.stringify(navigationState));
                
                console.log('📄 Page state saved:', currentPage, 'with', cleanCart.length, 'items');
                lastCartState = cleanCart;
            } catch (error) {
                console.error('Error saving page state:', error);
            }
        },
        
        // Restore cart state when navigating back
        restoreCartState: function() {
            try {
                const savedState = localStorage.getItem(CONFIG.NAVIGATION_STATE_KEY);
                const savedCart = localStorage.getItem(CONFIG.PAGE_CART_BACKUP_KEY);
                
                if (savedState && savedCart) {
                    const state = JSON.parse(savedState);
                    const cartItems = JSON.parse(savedCart);
                    
                    // Check if this is a recent navigation (within 5 minutes)
                    const timeDiff = Date.now() - state.timestamp;
                    if (timeDiff < 5 * 60 * 1000) {
                        // Clean the cart before restoring
                        const cleanItems = UnifiedCartManager.cleanCart(cartItems);
                        
                        if (cleanItems.length > 0) {
                            console.log('🔄 Restoring cart state from navigation:', cleanItems.length, 'items');
                            UnifiedCartManager.saveCart(cleanItems);
                            return true;
                        }
                    } else {
                        console.log('⏰ Saved cart state too old, not restoring');
                    }
                }
                
                return false;
            } catch (error) {
                console.error('Error restoring cart state:', error);
                return false;
            }
        },
        
        // Handle back button navigation
        handleBackNavigation: function() {
            console.log('🔙 Back button navigation detected');
            
            // Prevent multiple rapid back button handling
            if (isNavigating) {
                console.log('Already handling navigation, skipping');
                return;
            }
            
            isNavigating = true;
            
            setTimeout(() => {
                try {
                    // Check current cart state
                    const currentCart = UnifiedCartManager.getCurrentCart();
                    
                    // If cart is empty or has problematic data, try to restore
                    if (currentCart.length === 0 || UnifiedCartManager.hasProblematicData(currentCart)) {
                        console.log('🔍 Cart needs restoration after back navigation');
                        
                        if (!this.restoreCartState()) {
                            // If no saved state, ensure cart is clean
                            const cleanCart = UnifiedCartManager.cleanCart(currentCart);
                            if (cleanCart.length !== currentCart.length) {
                                UnifiedCartManager.saveCart(cleanCart);
                            }
                        }
                    } else {
                        // Cart looks good, just ensure it's clean
                        const cleanCart = UnifiedCartManager.cleanCart(currentCart);
                        if (cleanCart.length !== currentCart.length) {
                            console.log('🧹 Cleaning cart after back navigation');
                            UnifiedCartManager.saveCart(cleanCart);
                        }
                    }
                } catch (error) {
                    console.error('Error handling back navigation:', error);
                } finally {
                    isNavigating = false;
                }
            }, 100);
        }
    };
    
    // Event Listeners
    
    // Save state before page unload
    window.addEventListener('beforeunload', function() {
        NavigationHandler.savePageState();
    });
    
    // Handle popstate events (back/forward buttons)
    window.addEventListener('popstate', function(event) {
        console.log('🔙 Popstate event detected');
        NavigationHandler.handleBackNavigation();
    });
    
    // Handle page visibility changes (mobile back button, tab switching)
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            // Page is being hidden, save state
            NavigationHandler.savePageState();
        } else {
            // Page is visible again, check if we need to restore cart
            setTimeout(() => {
                const currentCart = UnifiedCartManager.getCurrentCart();
                
                if (currentCart.length === 0 || UnifiedCartManager.hasProblematicData(currentCart)) {
                    console.log('🔍 Page visible again, checking cart state');
                    NavigationHandler.handleBackNavigation();
                }
            }, 200);
        }
    });
    
    // Handle page focus events (additional mobile support)
    window.addEventListener('focus', function() {
        setTimeout(() => {
            const currentCart = UnifiedCartManager.getCurrentCart();
            
            if (currentCart.length === 0 || UnifiedCartManager.hasProblematicData(currentCart)) {
                console.log('🔍 Window focused, checking cart state');
                NavigationHandler.handleBackNavigation();
            }
        }, 200);
    });
    
    // Listen for checkout events to clear navigation state
    document.addEventListener('click', function(event) {
        const target = event.target;
        
        if (target.classList.contains('checkout-btn') || 
            target.closest('.checkout-btn') ||
            target.hasAttribute('data-checkout-action') ||
            (target.tagName === 'BUTTON' && target.textContent.toLowerCase().includes('checkout'))) {
            
            console.log('🛒 Checkout detected - clearing navigation state');
            
            // Clear navigation state since user is going to checkout
            localStorage.removeItem(CONFIG.NAVIGATION_STATE_KEY);
            localStorage.removeItem(CONFIG.PAGE_CART_BACKUP_KEY);
            localStorage.setItem(CONFIG.CHECKOUT_FLAG_KEY, Date.now().toString());
        }
    }, true);
    
    // Initialize on page load
    function initialize() {
        console.log('🚀 Initializing unified back button cart fix');
        
        // Update current page
        currentPage = window.location.pathname;
        
        // Check if we're returning from checkout
        const checkoutFlag = localStorage.getItem(CONFIG.CHECKOUT_FLAG_KEY);
        if (checkoutFlag) {
            const checkoutTime = parseInt(checkoutFlag);
            const timeDiff = Date.now() - checkoutTime;
            
            // If returning from checkout within 30 minutes, clear problematic data
            if (timeDiff < 30 * 60 * 1000) {
                console.log('🔄 Returning from checkout, cleaning cart');
                const currentCart = UnifiedCartManager.getCurrentCart();
                const cleanCart = UnifiedCartManager.cleanCart(currentCart);
                UnifiedCartManager.saveCart(cleanCart);
                
                // Clear checkout flag after a delay
                setTimeout(() => {
                    localStorage.removeItem(CONFIG.CHECKOUT_FLAG_KEY);
                }, 5000);
            }
        } else {
            // Normal page load, check for problematic data
            const currentCart = UnifiedCartManager.getCurrentCart();
            if (UnifiedCartManager.hasProblematicData(currentCart)) {
                console.log('🧹 Cleaning problematic cart data on page load');
                const cleanCart = UnifiedCartManager.cleanCart(currentCart);
                UnifiedCartManager.saveCart(cleanCart);
            }
        }
        
        // Save initial page state
        setTimeout(() => {
            NavigationHandler.savePageState();
        }, 1000);
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    // Expose for debugging
    window.UnifiedCartFix = {
        getCurrentCart: UnifiedCartManager.getCurrentCart,
        saveCart: UnifiedCartManager.saveCart,
        cleanCart: UnifiedCartManager.cleanCart,
        restoreState: NavigationHandler.restoreCartState,
        saveState: NavigationHandler.savePageState
    };
    
    console.log('✅ Unified Back Button Cart Fix Ready');
})();