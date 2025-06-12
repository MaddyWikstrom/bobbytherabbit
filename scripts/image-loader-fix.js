// Simple Image Loading - No Fallbacks
// This file has been rewritten to remove all fallback logic

document.addEventListener('DOMContentLoaded', function() {
    // Add basic error handling for images
    addImageErrorHandling();
});

// Helper function to validate image URLs
function isValidImageUrl(url) {
    if (!url || typeof url !== 'string') {
        return false;
    }
    
    // Check for common invalid patterns
    const invalidPatterns = [
        'product.html',
        'products.html',
        '.html?id=',
        'bobbytherabbit.com/products',
        'bobbytherabbit.com/product',
        '/product?',
        '/products?'
    ];
    
    for (const pattern of invalidPatterns) {
        if (url.includes(pattern)) {
            return false;
        }
    }
    
    // Additional check for URLs that look like page URLs
    if (url.includes('.html') && !url.includes('.jpg') && !url.includes('.png') && !url.includes('.webp') && !url.includes('.gif')) {
        return false;
    }
    
    return true;
}

// Basic image error handling without fallbacks
function addImageErrorHandling() {
    // Set default error handler on all images
    document.querySelectorAll('img').forEach(img => {
        // Check if the image URL is valid before setting up error handling
        if (!isValidImageUrl(img.src)) {
            console.warn('Invalid image URL detected, replacing with placeholder:', img.src);
            img.src = '/assets/product-placeholder.png';
        }
        
        if (!img.hasAttribute('onerror')) {
            img.onerror = function() {
                console.log('Image failed to load:', this.src);
                // Just hide the image if it fails to load
                this.style.display = 'none';
            };
        }
    });
    
    // Watch for new images being added to the DOM
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) { // Element node
                        if (node.tagName === 'IMG') {
                            // Validate URL before setting up error handling
                            if (!isValidImageUrl(node.src)) {
                                console.warn('Invalid image URL detected in new element, replacing with placeholder:', node.src);
                                node.src = '/assets/product-placeholder.png';
                            }
                            
                            if (!node.hasAttribute('onerror')) {
                                node.onerror = function() {
                                    console.log('Image failed to load:', this.src);
                                    this.style.display = 'none';
                                };
                            }
                        }
                        
                        node.querySelectorAll('img').forEach(img => {
                            // Validate URL before setting up error handling
                            if (!isValidImageUrl(img.src)) {
                                console.warn('Invalid image URL detected in new child element, replacing with placeholder:', img.src);
                                img.src = '/assets/product-placeholder.png';
                            }
                            
                            if (!img.hasAttribute('onerror')) {
                                img.onerror = function() {
                                    console.log('Image failed to load:', this.src);
                                    this.style.display = 'none';
                                };
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