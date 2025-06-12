// Mobile Touch Enhancements for Bobby Streetwear
document.addEventListener('DOMContentLoaded', function() {
    initMobileTouchEnhancements();
});

function initMobileTouchEnhancements() {
    // Only apply on mobile devices
    if (!isMobileDevice()) return;
    
    // Initialize all mobile enhancements
    initTouchFeedback();
    initSwipeGestures();
    initMobileScrollOptimizations();
    initMobileFormEnhancements();
    initMobileImageOptimizations();
    initMobilePerformanceOptimizations();
    
    console.log('Mobile touch enhancements initialized');
}

function isMobileDevice() {
    return window.innerWidth <= 768 || 
           /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Touch Feedback System
function initTouchFeedback() {
    const touchElements = document.querySelectorAll(
        'button, .btn, .cart-btn, .cta-btn, .hologram-btn, .filter-btn, ' +
        '.add-to-cart-btn, .checkout-btn, .quantity-btn, .remove-item-btn, ' +
        '.nav-link, .product-card, .arrow, .view-btn, .pagination-btn'
    );
    
    touchElements.forEach(element => {
        // Add touch start feedback
        element.addEventListener('touchstart', function(e) {
            this.classList.add('touch-active');
            
            // Create ripple effect
            createRippleEffect(this, e);
        }, { passive: true });
        
        // Remove touch feedback
        element.addEventListener('touchend', function() {
            setTimeout(() => {
                this.classList.remove('touch-active');
            }, 150);
        }, { passive: true });
        
        element.addEventListener('touchcancel', function() {
            this.classList.remove('touch-active');
        }, { passive: true });
    });
    
    // Add CSS for touch feedback
    addTouchFeedbackStyles();
}

function createRippleEffect(element, event) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.touches[0].clientX - rect.left - size / 2;
    const y = event.touches[0].clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: ripple 0.6s linear;
        left: ${x}px;
        top: ${y}px;
        width: ${size}px;
        height: ${size}px;
        pointer-events: none;
        z-index: 1000;
    `;
    
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    
    setTimeout(() => {
        if (ripple.parentNode) {
            ripple.parentNode.removeChild(ripple);
        }
    }, 600);
}

function addTouchFeedbackStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        .touch-active {
            transform: scale(0.95) !important;
            transition: transform 0.1s ease !important;
        }
        
        @media (max-width: 768px) {
            button, .btn {
                -webkit-tap-highlight-color: transparent;
                touch-action: manipulation;
            }
        }
    `;
    document.head.appendChild(style);
}

// Swipe Gestures
function initSwipeGestures() {
    // Product grid horizontal scrolling
    const productGrids = document.querySelectorAll('.product-grid-scroll, .product-scroll-container');
    
    productGrids.forEach(grid => {
        let startX = 0;
        let scrollLeft = 0;
        let isDown = false;
        
        grid.addEventListener('touchstart', function(e) {
            isDown = true;
            startX = e.touches[0].pageX - grid.offsetLeft;
            scrollLeft = grid.scrollLeft;
        }, { passive: true });
        
        grid.addEventListener('touchmove', function(e) {
            if (!isDown) return;
            e.preventDefault();
            const x = e.touches[0].pageX - grid.offsetLeft;
            const walk = (x - startX) * 2;
            grid.scrollLeft = scrollLeft - walk;
        });
        
        grid.addEventListener('touchend', function() {
            isDown = false;
        }, { passive: true });
    });
    
    // Filter controls horizontal scrolling
    const filterControls = document.querySelectorAll('.filter-controls');
    filterControls.forEach(control => {
        let startX = 0;
        let scrollLeft = 0;
        let isDown = false;
        
        control.addEventListener('touchstart', function(e) {
            isDown = true;
            startX = e.touches[0].pageX - control.offsetLeft;
            scrollLeft = control.scrollLeft;
        }, { passive: true });
        
        control.addEventListener('touchmove', function(e) {
            if (!isDown) return;
            const x = e.touches[0].pageX - control.offsetLeft;
            const walk = (x - startX) * 1.5;
            control.scrollLeft = scrollLeft - walk;
        }, { passive: true });
        
        control.addEventListener('touchend', function() {
            isDown = false;
        }, { passive: true });
    });
}

// Mobile Scroll Optimizations
function initMobileScrollOptimizations() {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Optimize scroll performance
    let ticking = false;
    
    function updateScrollPosition() {
        // Add scroll-based optimizations here
        ticking = false;
    }
    
    window.addEventListener('scroll', function() {
        if (!ticking) {
            requestAnimationFrame(updateScrollPosition);
            ticking = true;
        }
    }, { passive: true });
    
    // Hide/show navigation on scroll (mobile only)
    let lastScrollTop = 0;
    const navbar = document.querySelector('.navbar');
    
    if (navbar && window.innerWidth <= 768) {
        window.addEventListener('scroll', function() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (scrollTop > lastScrollTop && scrollTop > 100) {
                // Scrolling down
                navbar.style.transform = 'translateY(-100%)';
            } else {
                // Scrolling up
                navbar.style.transform = 'translateY(0)';
            }
            
            lastScrollTop = scrollTop;
        }, { passive: true });
        
        // Add transition for smooth hide/show
        navbar.style.transition = 'transform 0.3s ease';
    }
}

// Mobile Form Enhancements
function initMobileFormEnhancements() {
    // Prevent zoom on input focus
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        if (input.style.fontSize !== '16px') {
            input.style.fontSize = '16px';
        }
    });
    
    // Enhanced search input
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('focus', function() {
            this.parentElement.classList.add('search-focused');
        });
        
        searchInput.addEventListener('blur', function() {
            this.parentElement.classList.remove('search-focused');
        });
    }
    
    // Quantity input enhancements
    const quantityBtns = document.querySelectorAll('.quantity-btn');
    quantityBtns.forEach(btn => {
        btn.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.9)';
        }, { passive: true });
        
        btn.addEventListener('touchend', function() {
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 100);
        }, { passive: true });
    });
}

// Mobile Image Optimizations
function initMobileImageOptimizations() {
    // Lazy loading for images
    const images = document.querySelectorAll('img[data-src]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    }
    
    // Optimize product images for mobile
    const productImages = document.querySelectorAll('.product-image, .cart-item-image');
    productImages.forEach(img => {
        img.addEventListener('error', function() {
            this.src = 'assets/product-placeholder.png';
        });
        
        // Add loading animation
        img.addEventListener('load', function() {
            this.style.opacity = '1';
        });
        
        if (!img.complete) {
            img.style.opacity = '0';
            img.style.transition = 'opacity 0.3s ease';
        }
    });
}

// Mobile Performance Optimizations
function initMobilePerformanceOptimizations() {
    // Debounce resize events
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            // Handle resize optimizations
            updateMobileLayout();
        }, 250);
    });
    
    // Optimize animations for mobile
    if (window.innerWidth <= 768) {
        // Reduce animation complexity
        const style = document.createElement('style');
        style.textContent = `
            @media (max-width: 768px) {
                .bg-pattern,
                .glitch-overlay,
                .grid-details {
                    animation-duration: 120s !important;
                }
                
                .particle-field {
                    display: none !important;
                }
                
                * {
                    animation-timing-function: ease !important;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Memory management
    window.addEventListener('beforeunload', function() {
        // Clean up event listeners and timers
        clearTimeout(resizeTimeout);
    });
}

function updateMobileLayout() {
    // Update layout calculations for mobile
    const productGrids = document.querySelectorAll('.product-grid, .products-grid');
    productGrids.forEach(grid => {
        if (window.innerWidth <= 480) {
            grid.style.gridTemplateColumns = '1fr';
        } else if (window.innerWidth <= 768) {
            grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(280px, 1fr))';
        }
    });
}

// Utility Functions
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

function debounce(func, wait, immediate) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        const later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

// Export for use in other scripts
window.MobileTouchEnhancements = {
    init: initMobileTouchEnhancements,
    isMobile: isMobileDevice,
    createRipple: createRippleEffect
};