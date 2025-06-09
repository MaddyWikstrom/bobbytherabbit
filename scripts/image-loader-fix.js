// Enhanced Image Loading with Robust Error Handling
// This handles images that might be returned from the API but not displaying correctly

document.addEventListener('DOMContentLoaded', function() {
    // Add enhanced image error handling
    addEnhancedImageErrorHandling();
    
    // Listen for product detail page initialization to apply specific fixes
    document.addEventListener('productDetailInitialized', function(event) {
        console.log('Product detail initialized, applying specific image fixes');
        fixProductImages();
    });
    
    // Listen for product detail rendering to reapply fixes
    document.addEventListener('productDetailRendered', function() {
        console.log('Product detail rendered, reapplying image fixes');
        fixProductImages();
    });
});

// Enhanced image error handling for all images
function addEnhancedImageErrorHandling() {
    // Set error handler on all images
    document.querySelectorAll('img').forEach(img => {
        if (!img.hasAttribute('data-error-handled')) {
            applyImageErrorHandler(img);
        }
    });
    
    // Watch for new images being added to the DOM
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) { // Element node
                        if (node.tagName === 'IMG' && !node.hasAttribute('data-error-handled')) {
                            applyImageErrorHandler(node);
                        }
                        
                        node.querySelectorAll('img').forEach(img => {
                            if (!img.hasAttribute('data-error-handled')) {
                                applyImageErrorHandler(img);
                            }
                        });
                    }
                });
            }
        });
    });
    
    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Apply enhanced error handler to an image
function applyImageErrorHandler(img) {
    // Mark the image as handled to prevent duplicate handlers
    img.setAttribute('data-error-handled', 'true');
    
    // Store original source for potential recovery
    if (img.src && !img.hasAttribute('data-original-src')) {
        img.setAttribute('data-original-src', img.src);
    }
    
    img.onerror = function() {
        const originalSrc = this.getAttribute('data-original-src') || this.src;
        console.log('Image failed to load:', originalSrc);
        
        // Try to fix the URL
        const fixedUrl = attemptToFixImageUrl(originalSrc);
        
        if (fixedUrl !== originalSrc) {
            console.log('Attempting with fixed URL:', fixedUrl);
            this.src = fixedUrl;
            return; // Let the fixed URL try to load
        }
        
        // If URL fixing didn't provide a different URL, use fallback
        if (this.hasAttribute('data-fallback')) {
            const fallback = this.getAttribute('data-fallback');
            console.log('Using fallback image:', fallback);
            this.src = fallback;
        } else {
            // Use default product placeholder
            this.src = '/assets/product-placeholder.png';
            
            // Ensure the image is visible (don't hide it)
            this.style.display = '';
            
            // Add visual indication that it's a placeholder
            this.style.padding = '5px';
            this.style.backgroundColor = '#ffffff';
            this.style.border = '1px dashed #ccc';
        }
    };
}

// Attempt to fix common issues with image URLs
function attemptToFixImageUrl(url) {
    if (!url) return '/assets/product-placeholder.png';
    
    // Already a placeholder
    if (url.includes('product-placeholder')) return url;
    
    // Handle if URL is malformed or product URL instead of image
    if (url.includes('product.html')) {
        return '/assets/product-placeholder.png';
    }
    
    // Check for protocol-related issues
    if (url.startsWith('//')) {
        return 'https:' + url;
    }
    
    // Fix common Shopify CDN issues
    if (url.includes('cdn.shopify.com')) {
        // Ensure HTTPS
        if (url.startsWith('http:')) {
            url = url.replace('http:', 'https:');
        }
        
        // Fix any double slashes (except for protocol)
        url = url.replace(/([^:])\/\//g, '$1/');
        
        // Add proper extension if missing
        if (!url.match(/\.(jpg|jpeg|png|gif|webp|svg)($|\?)/i)) {
            // Try to detect if URL has parameters
            if (url.includes('?')) {
                url = url.replace('?', '.jpg?');
            } else {
                url += '.jpg';
            }
        }
    }
    
    return url;
}

// Specific fixes for product detail page images
function fixProductImages() {
    // Fix main product image
    const mainProductImage = document.querySelector('#main-product-image img');
    if (mainProductImage) {
        ensureImageBackgroundAndFallback(mainProductImage);
    }
    
    // Fix gallery thumbnails
    document.querySelectorAll('.gallery-item img').forEach(img => {
        ensureImageBackgroundAndFallback(img);
    });
    
    // If we have filtered images in the ProductDetailManager, ensure they're valid
    if (window.productDetailManager && window.productDetailManager.filteredImages) {
        window.productDetailManager.filteredImages = window.productDetailManager.filteredImages.map(url => {
            return attemptToFixImageUrl(url);
        });
    }
    
    // Check if any color-specific images are available
    if (window.productDetailManager && 
        window.productDetailManager.currentProduct && 
        window.productDetailManager.currentProduct.colorImages) {
        
        const colorImages = window.productDetailManager.currentProduct.colorImages;
        
        // Process and fix each color's images
        Object.keys(colorImages).forEach(color => {
            if (Array.isArray(colorImages[color])) {
                colorImages[color] = colorImages[color].map(url => attemptToFixImageUrl(url));
            }
        });
    }
}

// Ensure image has proper background and fallback
function ensureImageBackgroundAndFallback(img) {
    if (!img) return;
    
    // Apply error handling if not already applied
    if (!img.hasAttribute('data-error-handled')) {
        applyImageErrorHandler(img);
    }
    
    // Ensure white background for product images
    img.style.backgroundColor = '#ffffff';
    
    // Set placeholder as fallback
    if (!img.hasAttribute('data-fallback')) {
        img.setAttribute('data-fallback', '/assets/product-placeholder.png');
    }
    
    // Add proper image display styles
    img.style.objectFit = 'contain';
    
    // If src is empty or invalid, try to fix it immediately
    if (!img.src || img.src === window.location.href || img.src === window.location.origin + '/' || img.src === 'null') {
        const originalSrc = img.getAttribute('data-original-src');
        if (originalSrc) {
            const fixedUrl = attemptToFixImageUrl(originalSrc);
            img.src = fixedUrl;
        } else {
            img.src = img.getAttribute('data-fallback') || '/assets/product-placeholder.png';
        }
    }
}