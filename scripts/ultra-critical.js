/**
 * Ultra-Critical JavaScript - Loads instantly for immediate interactivity
 * Everything else is deferred to prevent blocking
 */

// Performance monitoring
performance.mark('critical-js-start');

// Ultra-minimal cart system for immediate functionality
window.UltraCart = {
    items: [],
    
    init() {
        try {
            this.items = JSON.parse(localStorage.getItem('bobby-cart') || '[]');
        } catch (e) {
            this.items = [];
        }
        this.updateCount();
    },
    
    updateCount() {
        const countEl = document.getElementById('cart-count');
        if (countEl) {
            const count = this.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
            countEl.textContent = count;
        }
    },
    
    openCart() {
        // Load full cart system only when needed
        if (!window.fullCartSystem) {
            this.loadFullSystem();
        } else {
            window.BobbyCart?.openCart();
        }
    },
    
    loadFullSystem() {
        const script = document.createElement('script');
        script.src = 'scripts/performance-bundle.js';
        script.async = true;
        script.onload = () => {
            window.fullCartSystem = true;
            if (window.BobbyCart) {
                window.BobbyCart.items = this.items;
                window.BobbyCart.openCart();
            }
        };
        document.head.appendChild(script);
    }
};

// Ultra-fast site display
function showMainSite() {
    const loading = document.getElementById('loading');
    const main = document.getElementById('main');
    
    if (loading && main) {
        loading.style.opacity = '0';
        loading.style.transition = 'opacity 0.2s ease';
        
        setTimeout(() => {
            loading.style.display = 'none';
            main.classList.remove('hidden');
            performance.mark('site-visible');
            
            // Start loading enhancements after site is visible
            setTimeout(loadEnhancements, 100);
        }, 200);
    }
}

// Load non-critical enhancements
function loadEnhancements() {
    performance.mark('enhancements-start');
    
    // Load fonts asynchronously
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&display=swap';
    fontLink.rel = 'stylesheet';
    fontLink.media = 'print';
    fontLink.onload = function() { this.media = 'all'; };
    document.head.appendChild(fontLink);
    
    // Load enhanced styles
    const styles = [
        'styles/animations.css',
        'styles/homepage-products.css',
        'styles/mobile-optimizations.css'
    ];
    
    styles.forEach((href, index) => {
        setTimeout(() => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.media = 'print';
            link.onload = function() { this.media = 'all'; };
            document.head.appendChild(link);
        }, index * 100);
    });
    
    // Load products asynchronously
    setTimeout(loadProducts, 200);
    
    performance.mark('enhancements-end');
}

// Minimal product loading
function loadProducts() {
    const productsEl = document.getElementById('products');
    if (!productsEl) return;
    
    // Try to load from Shopify, fallback to static content
    fetch('/netlify/functions/get-products-admin-api')
        .then(response => response.json())
        .then(data => {
            const products = data.products || [];
            if (products.length > 0) {
                renderProducts(products.slice(0, 4));
            } else {
                showFallbackProducts();
            }
        })
        .catch(() => {
            showFallbackProducts();
        });
}

function renderProducts(products) {
    const productsEl = document.getElementById('products');
    productsEl.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-top: 2rem;">
            ${products.map(product => `
                <div style="background: rgba(26,26,46,0.5); border-radius: 10px; padding: 1.5rem; text-align: center; border: 1px solid rgba(0,255,136,0.1);">
                    <h3 style="margin-bottom: 0.5rem; color: #fff;">${product.title}</h3>
                    <p style="color: #00ff88; font-size: 1.2rem; font-weight: 600; margin-bottom: 1rem;">
                        $${product.variants?.[0]?.price || 'N/A'}
                    </p>
                    <button onclick="addToCart('${product.id}')" style="background: #00ff88; border: none; padding: 0.75rem 1.5rem; color: #000; font-weight: 600; border-radius: 5px; cursor: pointer;">
                        Add to Cart
                    </button>
                </div>
            `).join('')}
        </div>
        <div style="text-align: center; margin-top: 2rem;">
            <button onclick="location.href='products.html'" style="background: linear-gradient(45deg, #00ff88, #00cc6a); border: none; padding: 1rem 2rem; color: #000; font-weight: 600; border-radius: 5px; cursor: pointer; font-size: 1rem;">
                VIEW ALL PRODUCTS
            </button>
        </div>
    `;
}

function showFallbackProducts() {
    const productsEl = document.getElementById('products');
    productsEl.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <p style="margin-bottom: 2rem; font-size: 1.1rem;">Discover our exclusive Tech Animal Collection</p>
            <button onclick="location.href='products.html'" style="background: #00ff88; border: none; padding: 1rem 2rem; color: #000; font-weight: 600; border-radius: 5px; cursor: pointer; font-size: 1rem;">
                SHOP NOW
            </button>
        </div>
    `;
}

// Global add to cart function
window.addToCart = function(productId) {
    // Add basic item to cart
    UltraCart.items.push({
        id: productId,
        quantity: 1,
        timestamp: Date.now()
    });
    
    try {
        localStorage.setItem('bobby-cart', JSON.stringify(UltraCart.items));
    } catch (e) {
        console.warn('Could not save to localStorage');
    }
    
    UltraCart.updateCount();
    
    // Show quick notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed; top: 100px; right: 20px; background: #00ff88; color: #000;
        padding: 1rem; border-radius: 5px; z-index: 10000; font-weight: 600;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = 'Added to cart!';
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
};

// Initialize immediately when script loads
UltraCart.init();

// Setup cart button
document.addEventListener('DOMContentLoaded', function() {
    const cartBtn = document.getElementById('cart-btn');
    if (cartBtn) {
        cartBtn.onclick = () => UltraCart.openCart();
    }
});

// Show site immediately
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(showMainSite, 50);
    });
} else {
    setTimeout(showMainSite, 50);
}

performance.mark('critical-js-end');

// Performance logging
window.addEventListener('load', function() {
    setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
            console.log('Ultra Performance Metrics:', {
                'DOM Content Loaded': Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart) + 'ms',
                'Total Load Time': Math.round(navigation.loadEventEnd - navigation.fetchStart) + 'ms',
                'Time to Interactive': Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart) + 'ms'
            });
        }
        
        // Measure custom marks
        try {
            performance.measure('Critical JS Execution', 'critical-js-start', 'critical-js-end');
            performance.measure('Time to Site Visible', 'critical-js-start', 'site-visible');
            
            const measures = performance.getEntriesByType('measure');
            measures.forEach(measure => {
                console.log(`${measure.name}: ${Math.round(measure.duration)}ms`);
            });
        } catch (e) {
            // Ignore if performance API not fully supported
        }
    }, 100);
});